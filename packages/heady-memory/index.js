/**
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * @heady/heady-memory — Unified 3-Tier Vector Memory System.
 *
 * T0 (Working) → T1 (Short-Term) → T2 (Long-Term)
 *
 * Automatic tier promotion:
 *   - T0 eviction → T1 (capsule pushed to short-term)
 *   - T1 consolidation → T2 (high-access entries promoted to permanent)
 *
 * Unified search fans out across all tiers, merges results by
 * φ-weighted score fusion, and returns a single ranked list.
 *
 * Founder: Eric Haywood
 * @module @heady/heady-memory
 */

"use strict";

const { PHI, PSI, phiFusionWeights, cslGate } = require("@heady/phi-math-foundation");
const { createLogger, generateCorrelationId } = require("@heady/structured-logger");
const { T0WorkingMemory, T0_CAPACITY, CAPSULE_DIMENSIONS, cosineSimilarity } = require("./lib/t0-working-memory");
const { T1ShortTermMemory, T1_CAPACITY, T1_TTL_MS, phiDecay } = require("./lib/t1-short-term-memory");
const { T2LongTermMemory, T2_DECAY_HALF_LIFE_MS, longTermPhiDecay } = require("./lib/t2-long-term-memory");

const logger = createLogger("heady-memory");

/**
 * HeadyMemory — Unified 3-tier vector memory.
 *
 * @example
 *   const { HeadyMemory } = require('@heady/heady-memory');
 *   const mem = new HeadyMemory();
 *   mem.store('doc1', embedding768, 'Hello world', { topic: 'greeting' });
 *   const results = mem.search(queryEmbedding);
 */
class HeadyMemory {
  constructor(opts) {
    opts = opts || {};

    this.t0 = new T0WorkingMemory(opts.t0 || {});
    this.t1 = new T1ShortTermMemory(opts.t1 || {});
    this.t2 = new T2LongTermMemory(opts.t2 || {});

    // Wire tier promotions
    this.t0.onEviction(this._onT0Eviction.bind(this));
    this.t1.onConsolidation(this._onT1Consolidation.bind(this));

    // Stats
    this._stats = {
      totalStores: 0,
      totalSearches: 0,
      t0Promotions: 0,
      t1Consolidations: 0,
    };

    logger.info("HeadyMemory initialized", {
      t0Capacity: this.t0.capacity,
      t1Capacity: this.t1.capacity,
    });
  }

  /**
   * Store a memory. Enters T0 (working memory) first.
   * Will be promoted to T1 on eviction, and to T2 on consolidation.
   */
  store(id, embedding, content, metadata) {
    this._stats.totalStores++;
    return this.t0.store(id, embedding, content, metadata);
  }

  /**
   * Store directly into a specific tier (for bulk import, migration, etc.).
   */
  storeAt(tier, id, embedding, content, metadata) {
    this._stats.totalStores++;
    switch (tier) {
      case "T0": return this.t0.store(id, embedding, content, metadata);
      case "T1": return this.t1.store(id, embedding, content, metadata);
      case "T2": return this.t2.store(id, embedding, content, metadata);
      default: throw new Error("Unknown tier: " + tier);
    }
  }

  /**
   * Retrieve by ID. Checks T0 first, then T1, then T2.
   * If found in a lower tier, promotes back to T0 (recall = reactivation).
   */
  get(id) {
    // Check T0
    var capsule = this.t0.get(id);
    if (capsule) return capsule;

    // Check T1
    var entry = this.t1.get(id);
    if (entry) {
      // Recall: promote back to T0
      this.t0.store(id, entry.embedding, entry.content, entry.metadata);
      return entry;
    }

    // Check T2
    var longEntry = this.t2.get(id);
    if (longEntry) {
      // Recall: promote back to T0
      this.t0.store(id, longEntry.embedding, longEntry.content, longEntry.metadata);
      return longEntry;
    }

    return null;
  }

  /**
   * Unified search across all three tiers.
   *
   * Fans out the query to T0, T1, T2 in parallel (in-memory, so synchronous).
   * Merges results using φ-weighted fusion:
   *   - T0 results get weight φ (1.618) — freshest, most relevant
   *   - T1 results get weight 1.0 — recent but decaying
   *   - T2 results get weight ψ (0.618) — permanent but old
   *
   * Deduplicates by ID (keeps highest-scoring tier's result).
   */
  search(queryEmbedding, topK) {
    topK = topK || 13;
    this._stats.totalSearches++;

    const corrId = generateCorrelationId();
    const t0Results = this.t0.search(queryEmbedding, topK);
    const t1Results = this.t1.search(queryEmbedding, topK);
    const t2Results = this.t2.search(queryEmbedding, topK);

    // φ-weighted tier fusion
    const tierWeights = { T0: PHI, T1: 1.0, T2: PSI };
    const merged = new Map(); // id -> best result

    function addResults(results, tierWeight) {
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var fusedScore = (r.decayedScore || r.similarity) * tierWeight;
        var existing = merged.get(r.id);
        if (!existing || fusedScore > existing.fusedScore) {
          merged.set(r.id, {
            id: r.id,
            similarity: r.similarity,
            fusedScore: fusedScore,
            content: r.content,
            metadata: r.metadata,
            tier: r.tier,
            partition: r.partition || null,
          });
        }
      }
    }

    addResults(t0Results, tierWeights.T0);
    addResults(t1Results, tierWeights.T1);
    addResults(t2Results, tierWeights.T2);

    // Sort by fused score
    var results = Array.from(merged.values());
    results.sort(function(a, b) { return b.fusedScore - a.fusedScore; });

    logger.debug("Unified search complete", {
      correlationId: corrId,
      t0Hits: t0Results.length,
      t1Hits: t1Results.length,
      t2Hits: t2Results.length,
      mergedTotal: results.length,
    });

    return results.slice(0, topK);
  }

  /**
   * Remove a memory from all tiers.
   */
  remove(id) {
    var removed = false;
    removed = this.t0.remove(id) || removed;
    removed = this.t1.remove(id) || removed;
    removed = this.t2.remove(id) || removed;
    return removed;
  }

  /**
   * Start background maintenance (T1 GC).
   */
  start() {
    this.t1.startGC();
    logger.info("HeadyMemory background services started");
  }

  /**
   * Stop background maintenance.
   */
  stop() {
    this.t1.stopGC();
    logger.info("HeadyMemory background services stopped");
  }

  /**
   * Full system status.
   */
  status() {
    return {
      t0: this.t0.status(),
      t1: this.t1.status(),
      t2: this.t2.status(),
      stats: Object.assign({}, this._stats),
    };
  }

  // ── Internal tier promotion ──────────────────────────────────────

  /** Called when T0 evicts a capsule → push to T1. */
  _onT0Eviction(capsule) {
    this._stats.t0Promotions++;
    logger.info("T0→T1 promotion", { id: capsule.id });
    this.t1.store(capsule.id, capsule.embedding, capsule.content,
      Object.assign({}, capsule.metadata, { sourceId: capsule.id, promotedFrom: "T0" }));
  }

  /** Called when T1 consolidation threshold hit → push to T2. */
  _onT1Consolidation(entry) {
    this._stats.t1Consolidations++;
    logger.info("T1→T2 consolidation", { id: entry.id, accessCount: entry.accessCount });
    this.t2.store(entry.id, entry.embedding, entry.content,
      Object.assign({}, entry.metadata, { consolidatedFrom: "T1" }));
  }
}

module.exports = {
  HeadyMemory,
  T0WorkingMemory,
  T1ShortTermMemory,
  T2LongTermMemory,
  // Constants
  T0_CAPACITY,
  T1_CAPACITY,
  T1_TTL_MS,
  T2_DECAY_HALF_LIFE_MS,
  CAPSULE_DIMENSIONS,
  // Utilities
  cosineSimilarity,
  phiDecay,
  longTermPhiDecay,
};
