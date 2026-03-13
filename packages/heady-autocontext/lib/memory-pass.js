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

const { PHI, PSI, phiFusionWeights } = require("@heady/phi-math-foundation");
const { createLogger } = require("@heady/structured-logger");

const logger = createLogger("autocontext:memory");

const DEFAULT_TOP_K = 13; // Fibonacci 7th term

/**
 * Retrieve relevant memories for context enrichment.
 *
 * @param {Object} intentResult - Output from Pass 1 (intent classification)
 * @param {Object} memory - HeadyMemory instance
 * @param {Object} opts - Options (topK, embedding, etc.)
 * @returns {Object} Memory pass result with retrieved contexts
 */
function retrieveMemories(intentResult, memory, opts) {
  opts = opts || {};
  const topK = opts.topK || DEFAULT_TOP_K;

  // If no memory system or no embedding, return empty
  if (!memory || !opts.queryEmbedding) {
    logger.debug("Memory pass skipped (no memory or embedding)");
    return {
      memories: [],
      memoryCount: 0,
      tiersHit: [],
      pass: "MEMORY",
      passIndex: 1,
    };
  }

  const results = memory.search(opts.queryEmbedding, topK);

  // Classify which tiers contributed
  const tiersHit = [];
  const tierCounts = { T0: 0, T1: 0, T2: 0 };
  for (const r of results) {
    tierCounts[r.tier] = (tierCounts[r.tier] || 0) + 1;
    if (tierCounts[r.tier] === 1) tiersHit.push(r.tier);
  }

  // Apply intent-based re-ranking
  // If intent is DEBUG, boost memories with error/fix metadata
  // If intent is CREATIVE, boost memories with creative/design metadata
  const boostedResults = results.map(function(r) {
    let boost = 1.0;
    if (intentResult.intent === "DEBUG" && r.metadata && r.metadata.topic === "error") {
      boost = PHI;
    }
    if (intentResult.intent === "CREATIVE" && r.metadata && r.metadata.topic === "creative") {
      boost = PHI;
    }
    return Object.assign({}, r, { fusedScore: r.fusedScore * boost });
  });

  boostedResults.sort(function(a, b) { return b.fusedScore - a.fusedScore; });

  const result = {
    memories: boostedResults,
    memoryCount: boostedResults.length,
    tiersHit: tiersHit,
    tierCounts: tierCounts,
    topScore: boostedResults.length > 0 ? boostedResults[0].fusedScore : 0,
    pass: "MEMORY",
    passIndex: 1,
  };

  logger.debug("Memory retrieval complete", {
    memoryCount: result.memoryCount,
    tiersHit: result.tiersHit,
    topScore: result.topScore,
  });

  return result;
}

module.exports = {
  retrieveMemories,
  DEFAULT_TOP_K,
};
