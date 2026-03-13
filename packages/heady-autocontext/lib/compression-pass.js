/**
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * Pass 4: Compression — Compresses enriched context to fit token budget.
 *
 * Takes grounded memories and compresses them into a context window
 * that respects the target model's token limit. Uses φ-weighted
 * priority to decide what to keep vs. summarize vs. drop.
 *
 * Founder: Eric Haywood
 * @module @heady/heady-autocontext/compression-pass
 */

"use strict";

const { PHI, PSI, phiFusionWeights, fib } = require("@heady/phi-math-foundation");
const { createLogger } = require("@heady/structured-logger");

const logger = createLogger("autocontext:compression");

/**
 * Default token budgets by model tier.
 * Actual limits come from config; these are safe defaults.
 */
const TOKEN_BUDGETS = {
  SMALL:  4096,    // ~fib(?) close to 4K
  MEDIUM: 16384,   // 16K
  LARGE:  32768,   // 32K
  XL:     131072,  // 128K
};

/**
 * Rough token estimation: ~4 chars per token for English text.
 */
function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}

/**
 * Compress context to fit within token budget.
 *
 * Strategy:
 * 1. Rank entries by combined score (fused + grounding)
 * 2. Allocate tokens using φ-weighted distribution
 *    - Top entries get φ× more tokens than lower ones
 * 3. Truncate content for entries that exceed their allocation
 * 4. Drop entries that fall below the MINIMUM CSL threshold
 *
 * @param {Object} groundingResult - Output from Pass 3
 * @param {Object} opts - Options (tokenBudget, model, etc.)
 * @returns {Object} Compression pass result with fitted context
 */
function compressContext(groundingResult, opts) {
  opts = opts || {};
  const tokenBudget = opts.tokenBudget || TOKEN_BUDGETS.LARGE;
  const memories = groundingResult.groundedMemories || [];

  if (memories.length === 0) {
    return {
      compressedContext: [],
      totalTokens: 0,
      tokenBudget: tokenBudget,
      utilization: 0,
      dropped: 0,
      truncated: 0,
      pass: "COMPRESSION",
      passIndex: 3,
    };
  }

  // Compute combined priority score for each memory
  const scored = memories.map(function(mem, idx) {
    const combinedScore = (mem.fusedScore || 0) * PHI + (mem.groundingScore || 0);
    return { mem: mem, index: idx, combinedScore: combinedScore };
  });

  scored.sort(function(a, b) { return b.combinedScore - a.combinedScore; });

  // Allocate tokens using φ-weighted distribution
  const weights = phiFusionWeights(scored.length);
  const allocations = weights.map(function(w) { return Math.floor(w * tokenBudget); });

  // Ensure minimum allocation per entry
  const minTokens = 50;
  for (let i = 0; i < allocations.length; i++) {
    allocations[i] = Math.max(minTokens, allocations[i]);
  }

  // Build compressed context
  const compressed = [];
  let totalTokens = 0;
  let dropped = 0;
  let truncated = 0;

  for (let i = 0; i < scored.length; i++) {
    const item = scored[i];
    const allocation = allocations[i];
    const contentTokens = estimateTokens(item.mem.content);

    // Drop if we've exceeded budget
    if (totalTokens + minTokens > tokenBudget) {
      dropped++;
      continue;
    }

    let content = item.mem.content;
    let wasTruncated = false;

    // Truncate if content exceeds allocation
    if (contentTokens > allocation) {
      const charLimit = allocation * 4; // ~4 chars/token
      content = content.substring(0, charLimit) + "...";
      wasTruncated = true;
      truncated++;
    }

    const entryTokens = estimateTokens(content);
    totalTokens += entryTokens;

    compressed.push({
      id: item.mem.id,
      content: content,
      tier: item.mem.tier,
      combinedScore: item.combinedScore,
      groundingScore: item.mem.groundingScore,
      hallucinationRisk: item.mem.hallucinationRisk,
      tokens: entryTokens,
      allocation: allocation,
      truncated: wasTruncated,
      rank: i,
    });
  }

  const result = {
    compressedContext: compressed,
    totalTokens: totalTokens,
    tokenBudget: tokenBudget,
    utilization: totalTokens / tokenBudget,
    entryCount: compressed.length,
    dropped: dropped,
    truncated: truncated,
    pass: "COMPRESSION",
    passIndex: 3,
  };

  logger.debug("Compression complete", {
    entries: result.entryCount,
    tokens: result.totalTokens,
    budget: result.tokenBudget,
    utilization: (result.utilization * 100).toFixed(1) + "%",
    dropped: result.dropped,
    truncated: result.truncated,
  });

  return result;
}

module.exports = {
  compressContext,
  estimateTokens,
  TOKEN_BUDGETS,
};
