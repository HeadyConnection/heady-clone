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

const { PSI, cslGate, CSL_THRESHOLDS } = require("@heady/phi-math-foundation");
const { createLogger } = require("@heady/structured-logger");

const logger = createLogger("autocontext:grounding");

/**
 * Grounding source types.
 */
const GROUNDING_SOURCES = {
  KNOWLEDGE_BASE: "knowledge_base",
  API_RESPONSE: "api_response",
  CACHED_FACT: "cached_fact",
  USER_CONTEXT: "user_context",
  SYSTEM_STATE: "system_state",
};

/**
 * Compute grounding score for a memory result.
 * Higher score = more grounded (less hallucination risk).
 *
 * Factors:
 * - Tier (T2 long-term memories are more reliable)
 * - Access count (frequently accessed = more validated)
 * - Metadata richness (more metadata = better provenance)
 * - Similarity to grounding sources
 */
function computeGroundingScore(memoryResult) {
  let score = 0;

  // Tier bonus
  const tierBonus = { T0: 0.3, T1: 0.5, T2: 0.8 };
  score += tierBonus[memoryResult.tier] || 0.3;

  // Access count bonus (log-scaled)
  if (memoryResult.accessCount) {
    score += Math.min(0.3, Math.log1p(memoryResult.accessCount) * 0.05);
  }

  // Metadata richness
  if (memoryResult.metadata) {
    const metaKeys = Object.keys(memoryResult.metadata).length;
    score += Math.min(0.2, metaKeys * 0.03);
  }

  // Similarity to query (already high means grounded in context)
  score += (memoryResult.similarity || 0) * 0.2;

  return Math.min(1.0, score);
}

/**
 * Classify hallucination risk level.
 */
function classifyHallucinationRisk(groundingScore) {
  if (groundingScore >= CSL_THRESHOLDS.GOOD) return "LOW";
  if (groundingScore >= CSL_THRESHOLDS.MINIMUM) return "MODERATE";
  return "HIGH";
}

/**
 * Ground context by validating memories against available sources.
 *
 * @param {Object} memoryResult - Output from Pass 2 (memory retrieval)
 * @param {Object} opts - Options (groundingSources, factChecker, etc.)
 * @returns {Object} Grounding pass result with validated context
 */
function groundContext(memoryResult, opts) {
  opts = opts || {};
  const groundingSources = opts.groundingSources || [];
  const memories = memoryResult.memories || [];

  const groundedMemories = memories.map(function(mem) {
    const groundingScore = computeGroundingScore(mem);
    const hallucinationRisk = classifyHallucinationRisk(groundingScore);

    // Check against grounding sources if available
    let corroborated = false;
    let corroborationSource = null;
    for (const source of groundingSources) {
      if (source.ids && source.ids.includes(mem.id)) {
        corroborated = true;
        corroborationSource = source.type;
        break;
      }
    }

    return Object.assign({}, mem, {
      groundingScore: groundingScore,
      hallucinationRisk: hallucinationRisk,
      corroborated: corroborated,
      corroborationSource: corroborationSource,
    });
  });

  // Sort by grounding score (most grounded first)
  groundedMemories.sort(function(a, b) { return b.groundingScore - a.groundingScore; });

  // Compute aggregate hallucination risk
  const riskCounts = { LOW: 0, MODERATE: 0, HIGH: 0 };
  for (const gm of groundedMemories) {
    riskCounts[gm.hallucinationRisk]++;
  }

  const aggregateRisk = riskCounts.HIGH > groundedMemories.length * PSI ? "HIGH"
    : riskCounts.MODERATE > groundedMemories.length * PSI ? "MODERATE"
    : "LOW";

  const result = {
    groundedMemories: groundedMemories,
    aggregateGroundingScore: groundedMemories.length > 0
      ? groundedMemories.reduce(function(sum, gm) { return sum + gm.groundingScore; }, 0) / groundedMemories.length
      : 0,
    hallucinationRisk: aggregateRisk,
    riskCounts: riskCounts,
    corroboratedCount: groundedMemories.filter(function(gm) { return gm.corroborated; }).length,
    pass: "GROUNDING",
    passIndex: 2,
  };

  logger.debug("Grounding complete", {
    aggregateScore: result.aggregateGroundingScore.toFixed(3),
    risk: result.hallucinationRisk,
    corroborated: result.corroboratedCount,
  });

  return result;
}

module.exports = {
  groundContext,
  computeGroundingScore,
  classifyHallucinationRisk,
  GROUNDING_SOURCES,
};
