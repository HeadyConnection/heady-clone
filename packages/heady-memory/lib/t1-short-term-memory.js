/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                                                                  ║
 * ║   ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                    ║
 * ║   ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                    ║
 * ║   ███████║█████╗  ███████║██║  ██║ ╚████╔╝                     ║
 * ║   ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                      ║
 * ║   ██║  ██║███████╗██║  ██║██████╔╝   ██║                       ║
 * ║   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                       ║
 * ║                                                                  ║
 * ║   ✦ Sacred Geometry v4.0 — φ (1.618) Governs All ✦             ║
 * ║                                                                  ║
 * ║   ◈ Built with Love by Heady™ — HeadySystems Inc.              ║
 * ║   ◈ Founder: Eric Haywood                                       ║
 * ║   ◈ 51 Provisional Patents — All Rights Reserved                ║
 * ║                                                                  ║
 * ║         ∞ · φ · ψ · √5 · Fibonacci · Golden Ratio · ∞          ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 * Liquid Node Architecture — Where Intelligence Flows Like Water.
 */

"use strict";

const { PHI, PSI, fib, cslGate, CSL_THRESHOLDS } = require("@heady/phi-math-foundation");
const { createLogger } = require("@heady/structured-logger");

const logger = createLogger("heady-memory:t1");

const T1_CAPACITY = 144233;                // ~fib(?) close to 144K
const T1_TTL_MS = 47 * 60 * 60 * 1000;    // 47 hours in ms (Fibonacci-derived)
const CONSOLIDATION_THRESHOLD = PSI;        // 0.618 — entries above this access rate consolidate to T2
const HNSW_EF_CONSTRUCTION = 200;           // HNSW index build quality
const HNSW_M = 16;                          // HNSW max connections per layer

/**
 * Compute φ-decay relevance for a T1 entry.
 * relevance(t) = baseScore × ψ^(ageMs / TTL)
 */
function phiDecay(baseScore, ageMs) {
  const exponent = ageMs / T1_TTL_MS;
  return baseScore * Math.pow(PSI, exponent);
}

/**
 * Simple cosine similarity (shared with T0 but duplicated for independence).
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * T1 Entry — a vector stored in short-term memory.
 * @typedef {Object} T1Entry
 * @property {string} id
 * @property {Float32Array} embedding
 * @property {string} content
 * @property {Object} metadata
 * @property {number} accessCount
 * @property {number} lastAccess
 * @property {number} createdAt
 * @property {number} ttlMs
 * @property {string} tier - Always "T1"
 * @property {string} sourceId - ID of originating T0 capsule (if promoted)
 */

class T1ShortTermMemory {
  constructor(opts) {
    opts = opts || {};
    this._capacity = opts.capacity || T1_CAPACITY;
    this._ttlMs = opts.ttlMs || T1_TTL_MS;
    this._entries = new Map(); // id -> T1Entry
    this._consolidationCallbacks = [];
    this._gcInterval = null;
    this._gcIntervalMs = opts.gcIntervalMs || (5 * 60 * 1000); // 5 min GC cycle

    logger.info("T1 initialized", {
      capacity: this._capacity,
      ttlHours: this._ttlMs / (60 * 60 * 1000),
    });
  }

  /** Start background GC for TTL-expired entries. */
  startGC() {
    if (this._gcInterval) return;
    this._gcInterval = setInterval(this._gc.bind(this), this._gcIntervalMs);
    if (this._gcInterval.unref) this._gcInterval.unref(); // Don't block process exit
    logger.info("T1 GC started", { intervalMs: this._gcIntervalMs });
  }

  /** Stop background GC. */
  stopGC() {
    if (this._gcInterval) {
      clearInterval(this._gcInterval);
      this._gcInterval = null;
      logger.info("T1 GC stopped");
    }
  }

  /** Register callback for T2 consolidation. */
  onConsolidation(fn) {
    this._consolidationCallbacks.push(fn);
  }

  get size() { return this._entries.size; }
  get capacity() { return this._capacity; }

  /**
   * Store or update an entry in T1.
   * Called when T0 evicts a capsule, or on direct T1 writes.
   */
  store(id, embedding, content, metadata) {
    const now = Date.now();

    if (this._entries.has(id)) {
      const existing = this._entries.get(id);
      existing.embedding = embedding instanceof Float32Array ? embedding : new Float32Array(embedding);
      existing.content = content || existing.content;
      existing.metadata = Object.assign(existing.metadata, metadata || {});
      existing.lastAccess = now;
      existing.accessCount++;
      this._checkConsolidation(existing);
      return existing;
    }

    // Capacity check — evict expired first, then oldest
    if (this._entries.size >= this._capacity) {
      this._gc();
      if (this._entries.size >= this._capacity) {
        this._evictOldest();
      }
    }

    const entry = {
      id: id,
      embedding: embedding instanceof Float32Array ? embedding : new Float32Array(embedding),
      content: content || "",
      metadata: metadata || {},
      accessCount: 1,
      lastAccess: now,
      createdAt: now,
      ttlMs: this._ttlMs,
      tier: "T1",
      sourceId: (metadata && metadata.sourceId) || null,
    };

    this._entries.set(id, entry);
    logger.debug("T1 stored", { id, totalEntries: this._entries.size });
    return entry;
  }

  /**
   * Retrieve entry by ID.
   */
  get(id) {
    const entry = this._entries.get(id);
    if (!entry) return null;
    if (this._isExpired(entry)) {
      this._entries.delete(id);
      return null;
    }
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this._checkConsolidation(entry);
    return entry;
  }

  /**
   * Search T1 by cosine similarity with φ-decay weighting.
   * Returns top-K results above MINIMUM threshold.
   */
  search(queryEmbedding, topK) {
    topK = topK || 13; // Fibonacci 7th term
    const query = queryEmbedding instanceof Float32Array ? queryEmbedding : new Float32Array(queryEmbedding);
    const now = Date.now();
    const results = [];

    for (const [id, entry] of this._entries) {
      if (this._isExpired(entry)) continue;

      const rawSimilarity = cosineSimilarity(query, entry.embedding);
      const ageMs = now - entry.createdAt;
      const decayedScore = phiDecay(rawSimilarity, ageMs);

      if (cslGate(rawSimilarity, "MINIMUM")) {
        results.push({
          id: id,
          similarity: rawSimilarity,
          decayedScore: decayedScore,
          content: entry.content,
          metadata: entry.metadata,
          tier: "T1",
          ageMs: ageMs,
          accessCount: entry.accessCount,
        });
      }
    }

    // Sort by decayed score (recency-adjusted relevance)
    results.sort(function(a, b) { return b.decayedScore - a.decayedScore; });
    return results.slice(0, topK);
  }

  /**
   * Remove an entry.
   */
  remove(id) {
    return this._entries.delete(id);
  }

  /** Clear all entries. */
  clear() {
    this._entries.clear();
    logger.info("T1 cleared");
  }

  /** Get status. */
  status() {
    const now = Date.now();
    let expired = 0;
    for (const entry of this._entries.values()) {
      if (this._isExpired(entry)) expired++;
    }
    return {
      tier: "T1",
      capacity: this._capacity,
      used: this._entries.size,
      utilization: this._entries.size / this._capacity,
      expired: expired,
      ttlHours: this._ttlMs / (60 * 60 * 1000),
      gcRunning: !!this._gcInterval,
    };
  }

  // ── Internal ──────────────────────────────────────────────────────

  _isExpired(entry) {
    return (Date.now() - entry.createdAt) > entry.ttlMs;
  }

  /** Garbage collect expired entries. */
  _gc() {
    const now = Date.now();
    let removed = 0;
    for (const [id, entry] of this._entries) {
      if ((now - entry.createdAt) > entry.ttlMs) {
        this._entries.delete(id);
        removed++;
      }
    }
    if (removed > 0) {
      logger.info("T1 GC sweep", { removed, remaining: this._entries.size });
    }
  }

  /** Evict oldest entry when at capacity. */
  _evictOldest() {
    let oldestId = null;
    let oldestTime = Infinity;
    for (const [id, entry] of this._entries) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestId = id;
      }
    }
    if (oldestId) {
      this._entries.delete(oldestId);
      logger.debug("T1 evicted oldest", { id: oldestId });
    }
  }

  /**
   * Check if entry should be consolidated to T2 (long-term).
   * Consolidation triggers when access frequency exceeds φ⁻¹ threshold.
   */
  _checkConsolidation(entry) {
    const ageMs = Date.now() - entry.createdAt;
    const ageHours = ageMs / (60 * 60 * 1000);
    if (ageHours < 1) return; // Too young to consolidate

    // Access rate = accesses per hour
    const accessRate = entry.accessCount / Math.max(1, ageHours);

    // If access rate exceeds φ⁻¹, consolidate to T2
    if (accessRate >= CONSOLIDATION_THRESHOLD) {
      logger.info("T1 consolidation triggered", {
        id: entry.id,
        accessRate: accessRate,
        threshold: CONSOLIDATION_THRESHOLD,
      });
      for (const cb of this._consolidationCallbacks) {
        try { cb(entry); } catch (e) { logger.error("Consolidation callback error", { error: e.message }); }
      }
    }
  }
}

module.exports = {
  T1ShortTermMemory,
  T1_CAPACITY,
  T1_TTL_MS,
  CONSOLIDATION_THRESHOLD,
  phiDecay,
};
