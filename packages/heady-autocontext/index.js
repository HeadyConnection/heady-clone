/**
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * @heady/heady-autocontext — 5-Pass Context Enrichment Pipeline.
 *
 * Universal intelligence middleware that transforms raw input into
 * enriched, grounded, compressed, confidence-scored context.
 *
 * Pipeline: Intent → Memory → Grounding → Compression → Confidence
 *
 * Every request to any Heady AI node passes through AutoContext first.
 * It is the "prefrontal cortex" of the system — ensuring every action
 * is informed, grounded, and quality-gated.
 *
 * Founder: Eric Haywood
 * @module @heady/heady-autocontext
 */

"use strict";

const { createLogger, withCorrelation, generateCorrelationId } = require("@heady/structured-logger");
const { classifyIntent, INTENT_CATALOG, URGENCY_SIGNALS } = require("./lib/intent-pass");
const { retrieveMemories, DEFAULT_TOP_K } = require("./lib/memory-pass");
const { groundContext, GROUNDING_SOURCES, computeGroundingScore } = require("./lib/grounding-pass");
const { compressContext, estimateTokens, TOKEN_BUDGETS } = require("./lib/compression-pass");
const { computeConfidence, isConfident, CONFIDENCE_WEIGHTS } = require("./lib/confidence-pass");

const logger = createLogger("autocontext");

/**
 * HeadyAutoContext — The 5-pass enrichment pipeline.
 *
 * @example
 *   const { HeadyAutoContext } = require('@heady/heady-autocontext');
 *   const { HeadyMemory } = require('@heady/heady-memory');
 *
 *   const memory = new HeadyMemory();
 *   const ctx = new HeadyAutoContext({ memory });
 *
 *   const result = ctx.enrich('How do I deploy to Render?', {
 *     queryEmbedding: embedding768,
 *   });
 *
 *   console.log(result.confidence.gate); // "GOOD"
 *   console.log(result.context);         // Compressed, enriched context
 */
class HeadyAutoContext {
  constructor(opts) {
    opts = opts || {};
    this._memory = opts.memory || null;
    this._tokenBudget = opts.tokenBudget || TOKEN_BUDGETS.LARGE;
    this._groundingSources = opts.groundingSources || [];
    this._stats = {
      totalEnrichments: 0,
      avgConfidence: 0,
      gateDistribution: { GOOD: 0, MINIMUM: 0, REJECT: 0 },
    };

    logger.info("HeadyAutoContext initialized", {
      hasMemory: !!this._memory,
      tokenBudget: this._tokenBudget,
      groundingSources: this._groundingSources.length,
    });
  }

  /**
   * Run the full 5-pass enrichment pipeline.
   *
   * @param {string} input - Raw text input
   * @param {Object} opts - Pipeline options
   * @param {Float32Array} opts.queryEmbedding - Embedding for memory search
   * @param {number} opts.tokenBudget - Override token budget
   * @param {number} opts.topK - Override memory retrieval count
   * @returns {Object} Enriched context with all pass results
   */
  enrich(input, opts) {
    opts = opts || {};
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    this._stats.totalEnrichments++;

    logger.info("Enrichment started", { correlationId, inputLength: (input || "").length });

    // Pass 1: Intent Classification
    const intentResult = classifyIntent(input);

    // Pass 2: Memory Retrieval
    const memoryResult = retrieveMemories(intentResult, this._memory, {
      queryEmbedding: opts.queryEmbedding,
      topK: opts.topK || DEFAULT_TOP_K,
    });

    // Pass 3: Grounding
    const groundingResult = groundContext(memoryResult, {
      groundingSources: this._groundingSources,
    });

    // Pass 4: Compression
    const compressionResult = compressContext(groundingResult, {
      tokenBudget: opts.tokenBudget || this._tokenBudget,
    });

    // Pass 5: Confidence Scoring
    const confidenceResult = computeConfidence(
      intentResult, memoryResult, groundingResult, compressionResult
    );

    // Update running stats
    this._updateStats(confidenceResult);

    const elapsed = Date.now() - startTime;

    const result = {
      correlationId: correlationId,
      input: input,
      intent: intentResult,
      memory: memoryResult,
      grounding: groundingResult,
      compression: compressionResult,
      confidence: confidenceResult,
      // Convenience accessors
      context: compressionResult.compressedContext,
      gate: confidenceResult.gate,
      recommendation: confidenceResult.recommendation,
      elapsedMs: elapsed,
    };

    logger.info("Enrichment complete", {
      correlationId: correlationId,
      intent: intentResult.intent,
      memoryHits: memoryResult.memoryCount,
      gate: confidenceResult.gate,
      confidence: confidenceResult.overallConfidence.toFixed(4),
      elapsedMs: elapsed,
    });

    return result;
  }

  /**
   * Quick enrichment — returns just the confidence gate and context.
   * Use when you don't need full pipeline diagnostics.
   */
  quickEnrich(input, opts) {
    const full = this.enrich(input, opts);
    return {
      gate: full.gate,
      recommendation: full.recommendation,
      confidence: full.confidence.overallConfidence,
      context: full.context,
      intent: full.intent.intent,
      correlationId: full.correlationId,
    };
  }

  /**
   * Set the memory system (for late binding).
   */
  setMemory(memory) {
    this._memory = memory;
    logger.info("Memory system attached");
  }

  /**
   * Add a grounding source.
   */
  addGroundingSource(source) {
    this._groundingSources.push(source);
  }

  /**
   * Get pipeline stats.
   */
  status() {
    return {
      service: "heady-autocontext",
      totalEnrichments: this._stats.totalEnrichments,
      avgConfidence: this._stats.avgConfidence,
      gateDistribution: Object.assign({}, this._stats.gateDistribution),
      hasMemory: !!this._memory,
      tokenBudget: this._tokenBudget,
      groundingSources: this._groundingSources.length,
    };
  }

  // ── Internal ──────────────────────────────────────────────────────

  _updateStats(confidenceResult) {
    const n = this._stats.totalEnrichments;
    const prevAvg = this._stats.avgConfidence;
    // Running average
    this._stats.avgConfidence = prevAvg + (confidenceResult.overallConfidence - prevAvg) / n;
    this._stats.gateDistribution[confidenceResult.gate] =
      (this._stats.gateDistribution[confidenceResult.gate] || 0) + 1;
  }
}

module.exports = {
  HeadyAutoContext,
  // Re-export all pass functions for direct use
  classifyIntent,
  retrieveMemories,
  groundContext,
  compressContext,
  computeConfidence,
  isConfident,
  estimateTokens,
  // Constants
  INTENT_CATALOG,
  URGENCY_SIGNALS,
  GROUNDING_SOURCES,
  TOKEN_BUDGETS,
  CONFIDENCE_WEIGHTS,
  DEFAULT_TOP_K,
};
