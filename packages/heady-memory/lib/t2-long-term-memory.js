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

const { PHI, PSI, cslGate } = require("@heady/phi-math-foundation");
const { createLogger } = require("@heady/structured-logger");

const logger = createLogger("heady-memory:t2");

const T2_DECAY_HALF_LIFE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days half-life

/**
 * Compute long-term φ-decay. Much slower decay than T1.
 * relevance(t) = baseScore × ψ^(ageMs / halfLife)
 */
function longTermPhiDecay(baseScore, ageMs) {
  const exponent = ageMs / T2_DECAY_HALF_LIFE_MS;
  return baseScore * Math.pow(PSI, exponent);
}

/**
 * Cosine similarity.
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

class T2LongTermMemory {
  constructor(opts) {
    opts = opts || {};
    this._partitions = new Map(); // partitionKey -> Map(id -> entry)
    this._defaultPartition = opts.defaultPartition || "general";
    this._decayHalfLifeMs = opts.decayHalfLifeMs || T2_DECAY_HALF_LIFE_MS;

    logger.info("T2 initialized", {
      defaultPartition: this._defaultPartition,
      decayHalfLifeDays: this._decayHalfLifeMs / (24 * 60 * 60 * 1000),
    });
  }

  /**
   * Store an entry in T2, optionally in a specific partition.
   */
  store(id, embedding, content, metadata) {
    const now = Date.now();
    const partition = (metadata && metadata.partition) || this._defaultPartition;

    if (!this._partitions.has(partition)) {
      this._partitions.set(partition, new Map());
      logger.info("T2 partition created", { partition });
    }

    const partMap = this._partitions.get(partition);

    if (partMap.has(id)) {
      const existing = partMap.get(id);
      existing.embedding = embedding instanceof Float32Array ? embedding : new Float32Array(embedding);
      existing.content = content || existing.content;
      existing.metadata = Object.assign(existing.metadata, metadata || {});
      existing.lastAccess = now;
      existing.accessCount++;
      existing.consolidationCount = (existing.consolidationCount || 0) + 1;
      return existing;
    }

    const entry = {
      id: id,
      embedding: embedding instanceof Float32Array ? embedding : new Float32Array(embedding),
      content: content || "",
      metadata: metadata || {},
      accessCount: 1,
      lastAccess: now,
      createdAt: now,
      consolidatedAt: now,
      consolidationCount: 1,
      partition: partition,
      tier: "T2",
    };

    partMap.set(id, entry);
    logger.debug("T2 stored", { id, partition, totalInPartition: partMap.size });
    return entry;
  }

  /**
   * Retrieve by ID, searching across all partitions or a specific one.
   */
  get(id, partition) {
    if (partition) {
      const partMap = this._partitions.get(partition);
      if (!partMap) return null;
      const entry = partMap.get(id);
      if (entry) {
        entry.accessCount++;
        entry.lastAccess = Date.now();
      }
      return entry || null;
    }

    // Search all partitions
    for (const partMap of this._partitions.values()) {
      if (partMap.has(id)) {
        const entry = partMap.get(id);
        entry.accessCount++;
        entry.lastAccess = Date.now();
        return entry;
      }
    }
    return null;
  }

  /**
   * Search T2 by cosine similarity with long-term φ-decay.
   * Can search a specific partition or all partitions.
   */
  search(queryEmbedding, topK, partition) {
    topK = topK || 13;
    const query = queryEmbedding instanceof Float32Array ? queryEmbedding : new Float32Array(queryEmbedding);
    const now = Date.now();
    const results = [];

    const partitionsToSearch = partition
      ? [this._partitions.get(partition)].filter(Boolean)
      : Array.from(this._partitions.values());

    for (const partMap of partitionsToSearch) {
      for (const [id, entry] of partMap) {
        const rawSimilarity = cosineSimilarity(query, entry.embedding);
        const ageMs = now - entry.createdAt;
        const decayedScore = longTermPhiDecay(rawSimilarity, ageMs);

        // Boost by access count (frequently accessed memories are more relevant)
        const accessBoost = 1 + Math.log1p(entry.accessCount) * PSI * 0.1;
        const finalScore = decayedScore * accessBoost;

        if (cslGate(rawSimilarity, "MINIMUM")) {
          results.push({
            id: id,
            similarity: rawSimilarity,
            decayedScore: finalScore,
            content: entry.content,
            metadata: entry.metadata,
            tier: "T2",
            partition: entry.partition,
            ageMs: ageMs,
            accessCount: entry.accessCount,
            consolidationCount: entry.consolidationCount,
          });
        }
      }
    }

    results.sort(function(a, b) { return b.decayedScore - a.decayedScore; });
    return results.slice(0, topK);
  }

  /**
   * Remove an entry.
   */
  remove(id, partition) {
    if (partition) {
      const partMap = this._partitions.get(partition);
      return partMap ? partMap.delete(id) : false;
    }
    for (const partMap of this._partitions.values()) {
      if (partMap.delete(id)) return true;
    }
    return false;
  }

  /** List all partitions with entry counts. */
  listPartitions() {
    const result = {};
    for (const [key, partMap] of this._partitions) {
      result[key] = partMap.size;
    }
    return result;
  }

  /** Clear a specific partition or all. */
  clear(partition) {
    if (partition) {
      const partMap = this._partitions.get(partition);
      if (partMap) partMap.clear();
    } else {
      this._partitions.clear();
    }
    logger.info("T2 cleared", { partition: partition || "all" });
  }

  /** Total entries across all partitions. */
  get totalSize() {
    let total = 0;
    for (const partMap of this._partitions.values()) {
      total += partMap.size;
    }
    return total;
  }

  /** Get status. */
  status() {
    const partitions = this.listPartitions();
    return {
      tier: "T2",
      totalEntries: this.totalSize,
      partitionCount: this._partitions.size,
      partitions: partitions,
      decayHalfLifeDays: this._decayHalfLifeMs / (24 * 60 * 60 * 1000),
    };
  }
}

module.exports = {
  T2LongTermMemory,
  T2_DECAY_HALF_LIFE_MS,
  longTermPhiDecay,
};
