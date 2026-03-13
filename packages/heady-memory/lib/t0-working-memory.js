/**
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * T0 Working Memory — In-memory capsule ring buffer.
 *
 * 21-slot ring buffer (Fibonacci 8th term) for active context.
 * Sub-millisecond access. Capsules contain embedding + metadata + decay score.
 * Eviction by φ-weighted LRU when buffer is full.
 *
 * Founder: Eric Haywood
 * @module @heady/heady-memory/t0
 */

"use strict";

const { PHI, PSI, fib, EVICTION_WEIGHTS, cslGate } = require("@heady/phi-math-foundation");
const { createLogger } = require("@heady/structured-logger");

const logger = createLogger("heady-memory:t0");

const T0_CAPACITY = fib(8); // 21 slots — Fibonacci 8th term
const CAPSULE_DIMENSIONS = 768; // Standard embedding dimension

/**
 * A memory capsule in T0 working memory.
 * @typedef {Object} Capsule
 * @property {string} id - Unique capsule identifier
 * @property {Float32Array} embedding - 768-dim vector
 * @property {Object} metadata - Arbitrary metadata
 * @property {string} content - Text content
 * @property {number} accessCount - Number of accesses
 * @property {number} lastAccess - Timestamp of last access
 * @property {number} createdAt - Timestamp of creation
 * @property {number} decayScore - φ-weighted relevance score
 * @property {string} tier - Always "T0"
 */

/**
 * Compute cosine similarity between two vectors.
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
 * Compute φ-weighted eviction score for a capsule.
 * Lower score = more likely to be evicted.
 *
 * score = recency^φ * frequency^1.0 * (1/size)^ψ * importance^(φ²)
 */
function computeEvictionScore(capsule, now) {
  const age = Math.max(1, now - capsule.lastAccess);
  const recency = 1 / Math.pow(age / 1000, 1 / PHI); // Inverse age, φ-scaled
  const frequency = Math.pow(capsule.accessCount, EVICTION_WEIGHTS.frequency);
  const importance = capsule.metadata.importance || 0.5;

  return (
    Math.pow(recency, EVICTION_WEIGHTS.recency) *
    frequency *
    Math.pow(importance, EVICTION_WEIGHTS.importance)
  );
}

class T0WorkingMemory {
  constructor(opts) {
    opts = opts || {};
    this._capacity = opts.capacity || T0_CAPACITY;
    this._capsules = new Map(); // id -> Capsule
    this._ring = [];            // Ordered ring buffer of capsule IDs
    this._promotionCallbacks = [];
    this._evictionCallbacks = [];
    logger.info("T0 initialized", { capacity: this._capacity });
  }

  /** Register callback for when capsules are evicted (for T1 promotion). */
  onEviction(fn) {
    this._evictionCallbacks.push(fn);
  }

  /** Register callback for when capsules are promoted from T1. */
  onPromotion(fn) {
    this._promotionCallbacks.push(fn);
  }

  /** Get current capsule count. */
  get size() {
    return this._capsules.size;
  }

  /** Get capacity. */
  get capacity() {
    return this._capacity;
  }

  /**
   * Store a capsule in T0 working memory.
   * If full, evicts the lowest-scoring capsule (notifies T1).
   */
  store(id, embedding, content, metadata) {
    const now = Date.now();

    // If already exists, update in place
    if (this._capsules.has(id)) {
      const existing = this._capsules.get(id);
      existing.embedding = embedding instanceof Float32Array ? embedding : new Float32Array(embedding);
      existing.content = content;
      existing.metadata = Object.assign(existing.metadata, metadata || {});
      existing.lastAccess = now;
      existing.accessCount++;
      existing.decayScore = computeEvictionScore(existing, now);
      this._touchRing(id);
      logger.debug("T0 updated", { id });
      return existing;
    }

    // Evict if at capacity
    if (this._capsules.size >= this._capacity) {
      this._evictLowest(now);
    }

    const capsule = {
      id: id,
      embedding: embedding instanceof Float32Array ? embedding : new Float32Array(embedding),
      content: content || "",
      metadata: metadata || {},
      accessCount: 1,
      lastAccess: now,
      createdAt: now,
      decayScore: 1.0,
      tier: "T0",
    };

    this._capsules.set(id, capsule);
    this._ring.push(id);
    logger.debug("T0 stored", { id, ringSize: this._ring.length });
    return capsule;
  }

  /**
   * Retrieve a capsule by ID. Updates access stats.
   */
  get(id) {
    const capsule = this._capsules.get(id);
    if (!capsule) return null;
    const now = Date.now();
    capsule.accessCount++;
    capsule.lastAccess = now;
    capsule.decayScore = computeEvictionScore(capsule, now);
    this._touchRing(id);
    return capsule;
  }

  /**
   * Search T0 by cosine similarity to a query embedding.
   * Returns top-K results above the MINIMUM CSL threshold (φ⁻² = 0.382).
   */
  search(queryEmbedding, topK) {
    topK = topK || 5;
    const query = queryEmbedding instanceof Float32Array ? queryEmbedding : new Float32Array(queryEmbedding);
    const now = Date.now();
    const results = [];

    for (const [id, capsule] of this._capsules) {
      const similarity = cosineSimilarity(query, capsule.embedding);
      if (cslGate(similarity, "MINIMUM")) {
        capsule.decayScore = computeEvictionScore(capsule, now);
        results.push({
          id: id,
          similarity: similarity,
          content: capsule.content,
          metadata: capsule.metadata,
          tier: "T0",
          decayScore: capsule.decayScore,
        });
      }
    }

    results.sort(function(a, b) { return b.similarity - a.similarity; });
    return results.slice(0, topK);
  }

  /**
   * Remove a capsule from T0 without triggering eviction callbacks.
   */
  remove(id) {
    const capsule = this._capsules.get(id);
    if (!capsule) return false;
    this._capsules.delete(id);
    this._ring = this._ring.filter(function(rid) { return rid !== id; });
    logger.debug("T0 removed", { id });
    return true;
  }

  /** Clear all capsules. */
  clear() {
    this._capsules.clear();
    this._ring = [];
    logger.info("T0 cleared");
  }

  /** Get all capsule IDs. */
  keys() {
    return Array.from(this._capsules.keys());
  }

  /** Get snapshot of all capsules for diagnostics. */
  snapshot() {
    const now = Date.now();
    return Array.from(this._capsules.values()).map(function(c) {
      return {
        id: c.id,
        accessCount: c.accessCount,
        ageMs: now - c.createdAt,
        decayScore: computeEvictionScore(c, now),
        contentLength: c.content.length,
        tier: c.tier,
      };
    });
  }

  /** Get status for health endpoints. */
  status() {
    return {
      tier: "T0",
      capacity: this._capacity,
      used: this._capsules.size,
      utilization: this._capsules.size / this._capacity,
      ringLength: this._ring.length,
    };
  }

  // ── Internal ──────────────────────────────────────────────────────

  /** Move capsule to end of ring (most recently used). */
  _touchRing(id) {
    this._ring = this._ring.filter(function(rid) { return rid !== id; });
    this._ring.push(id);
  }

  /** Evict the capsule with the lowest eviction score. */
  _evictLowest(now) {
    let lowestId = null;
    let lowestScore = Infinity;

    for (const [id, capsule] of this._capsules) {
      const score = computeEvictionScore(capsule, now);
      if (score < lowestScore) {
        lowestScore = score;
        lowestId = id;
      }
    }

    if (lowestId) {
      const evicted = this._capsules.get(lowestId);
      this._capsules.delete(lowestId);
      this._ring = this._ring.filter(function(rid) { return rid !== lowestId; });
      logger.info("T0 evicted", { id: lowestId, score: lowestScore });

      // Notify listeners (T1 promotion)
      for (const cb of this._evictionCallbacks) {
        try { cb(evicted); } catch (e) { logger.error("Eviction callback error", { error: e.message }); }
      }
    }
  }
}

module.exports = {
  T0WorkingMemory,
  T0_CAPACITY,
  CAPSULE_DIMENSIONS,
  cosineSimilarity,
  computeEvictionScore,
};
