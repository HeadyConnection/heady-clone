/**
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * Pass 5: Confidence Scoring — Final quality gate on enriched context.
 *
 * Computes an overall confidence score for the enriched context.
 * Uses CSL gates to determine if context quality is sufficient
 * for the intended action, or if fallback strategies are needed.
 *
 * Founder: Eric Haywood
 * @module @heady/heady-autocontext/confidence-pass
 */

"use strict";

const { PHI, PSI, cslGate, cslBlend, CSL_THRESHOLDS } = require("@heady/phi-math-foundation");
const { createLogger } = require("@heady/structured-logger");

const logger = createLogger("autocontext:confidence");

/**
 * Confidence factors and their φ-weighted contributions.
 */
const CONFIDENCE_WEIGHTS = {
  memoryRelevance: PHI,          // 1.618 — how relevant retrieved memories are
  groundingStrength: 1.0,        // 1.000 — how well-grounded the context is
  compressionQuality: PSI,       // 0.618 — how much context survived compression
  intentClarity: PSI * PSI,     // 0.382 — how clear the intent classification was
};

/**
 * Compute overall confidence score from all passes.
 *
 * @param {Object} intentResult - Pass 1 output
 * @param {Object} memoryResult - Pass 2 output
 * @param {Object} groundingResult - Pass 3 output
 * @param {Object} compressionResult - Pass 4 output
 * @returns {Object} Confidence pass result
 */
function computeConfidence(intentResult, memoryResult, groundingResult, compressionResult) {
  // Factor 1: Memory relevance (top memory score)
  const memoryRelevance = memoryResult.topScore
    ? Math.min(1.0, memoryResult.topScore / PHI)  // Normalize against PHI ceiling
    : 0;

  // Factor 2: Grounding strength
  const groundingStrength = groundingResult.aggregateGroundingScore || 0;

  // Factor 3: Compression quality (how much survived)
  const compressionQuality = compressionResult.entryCount > 0
    ? (compressionResult.entryCount / (compressionResult.entryCount + compressionResult.dropped))
    : 0;

  // Factor 4: Intent clarity
  const intentClarity = intentResult.confidence || 0;

  // Weighted combination
  const totalWeight = CONFIDENCE_WEIGHTS.memoryRelevance
    + CONFIDENCE_WEIGHTS.groundingStrength
    + CONFIDENCE_WEIGHTS.compressionQuality
    + CONFIDENCE_WEIGHTS.intentClarity;

  const weightedScore = (
    memoryRelevance * CONFIDENCE_WEIGHTS.memoryRelevance +
    groundingStrength * CONFIDENCE_WEIGHTS.groundingStrength +
    compressionQuality * CONFIDENCE_WEIGHTS.compressionQuality +
    intentClarity * CONFIDENCE_WEIGHTS.intentClarity
  ) / totalWeight;

  // Determine action gate
  let gate = "REJECT";
  let recommendation = "insufficient_context";

  if (cslGate(weightedScore, "GOOD")) {
    gate = "GOOD";
    recommendation = "proceed";
  } else if (cslGate(weightedScore, "MINIMUM")) {
    gate = "MINIMUM";
    recommendation = "proceed_with_caution";
  } else {
    gate = "REJECT";
    recommendation = "request_more_context";
  }

  // Hallucination risk override
  if (groundingResult.hallucinationRisk === "HIGH" && gate !== "REJECT") {
    recommendation = "proceed_with_verification";
  }

  const result = {
    overallConfidence: weightedScore,
    gate: gate,
    recommendation: recommendation,
    factors: {
      memoryRelevance: memoryRelevance,
      groundingStrength: groundingStrength,
      compressionQuality: compressionQuality,
      intentClarity: intentClarity,
    },
    weights: CONFIDENCE_WEIGHTS,
    hallucinationRisk: groundingResult.hallucinationRisk,
    pass: "CONFIDENCE",
    passIndex: 4,
  };

  logger.info("Confidence computed", {
    confidence: weightedScore.toFixed(4),
    gate: gate,
    recommendation: recommendation,
    risk: groundingResult.hallucinationRisk,
  });

  return result;
}

/**
 * Quick confidence check — returns boolean pass/fail.
 */
function isConfident(confidenceResult, minGate) {
  minGate = minGate || "MINIMUM";
  return cslGate(confidenceResult.overallConfidence, minGate);
}

module.exports = {
  computeConfidence,
  isConfident,
  CONFIDENCE_WEIGHTS,
};
