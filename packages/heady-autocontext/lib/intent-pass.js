/**
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 *
 * Pass 1: Intent Classification — Determines what the user/system wants.
 *
 * Classifies input into intent categories using embedding similarity
 * against known intent prototypes. Extracts entities, urgency, and
 * complexity signals.
 *
 * Founder: Eric Haywood
 * @module @heady/heady-autocontext/intent-pass
 */

"use strict";

const { PSI, cslGate, CSL_THRESHOLDS } = require("@heady/phi-math-foundation");
const { createLogger } = require("@heady/structured-logger");

const logger = createLogger("autocontext:intent");

/**
 * Known intent categories with prototype descriptions.
 * In production these would be embeddings; here we use keyword matching
 * as a fallback when no embedder is available.
 */
const INTENT_CATALOG = {
  QUERY:      { keywords: ["what", "how", "why", "when", "where", "who", "explain", "describe", "tell"], priority: 0.5 },
  COMMAND:    { keywords: ["do", "create", "make", "build", "run", "execute", "deploy", "start", "stop"], priority: 0.8 },
  ANALYSIS:   { keywords: ["analyze", "compare", "evaluate", "assess", "review", "audit", "inspect"], priority: 0.7 },
  CREATIVE:   { keywords: ["write", "compose", "design", "generate", "imagine", "brainstorm", "draft"], priority: 0.6 },
  DEBUG:      { keywords: ["fix", "debug", "error", "broken", "fail", "crash", "issue", "bug", "wrong"], priority: 0.9 },
  NAVIGATION: { keywords: ["go", "navigate", "open", "show", "display", "find", "search", "locate"], priority: 0.4 },
  META:       { keywords: ["help", "status", "config", "settings", "about", "version", "health"], priority: 0.3 },
};

/**
 * Urgency signals — words/patterns that increase priority.
 */
const URGENCY_SIGNALS = {
  CRITICAL: { keywords: ["urgent", "critical", "emergency", "asap", "immediately", "now", "broken"], weight: 1.0 },
  HIGH:     { keywords: ["important", "priority", "soon", "quickly", "fast"], weight: PSI },
  NORMAL:   { keywords: [], weight: PSI * PSI },
};

/**
 * Classify intent from raw text input.
 * Returns intent category, confidence, urgency, and extracted signals.
 */
function classifyIntent(text, opts) {
  opts = opts || {};
  const input = (text || "").toLowerCase().trim();
  const words = input.split(/\s+/);

  // Score each intent category
  const scores = {};
  let bestIntent = "QUERY";
  let bestScore = 0;

  for (const [intent, config] of Object.entries(INTENT_CATALOG)) {
    let score = 0;
    for (const keyword of config.keywords) {
      if (input.includes(keyword)) {
        score += 1;
      }
    }
    // Normalize by keyword count
    scores[intent] = words.length > 0 ? score / Math.max(config.keywords.length, 1) : 0;
    if (scores[intent] > bestScore) {
      bestScore = scores[intent];
      bestIntent = intent;
    }
  }

  // Urgency detection
  let urgency = "NORMAL";
  let urgencyWeight = URGENCY_SIGNALS.NORMAL.weight;
  for (const [level, config] of Object.entries(URGENCY_SIGNALS)) {
    for (const keyword of config.keywords) {
      if (input.includes(keyword)) {
        urgency = level;
        urgencyWeight = config.weight;
        break;
      }
    }
    if (urgency !== "NORMAL") break;
  }

  // Complexity estimation (based on text length and question marks)
  const questionCount = (input.match(/\?/g) || []).length;
  const sentenceCount = Math.max(1, (input.match(/[.!?]+/g) || []).length);
  const complexity = Math.min(1.0, (words.length / 50) + (questionCount * 0.2) + (sentenceCount * 0.1));

  // If using embedder (passed in opts), use embedding-based classification
  let embeddingConfidence = null;
  if (opts.embedder && opts.intentEmbeddings) {
    // This would call the embedder and compare to prototype embeddings
    // For now, placeholder — production would use real embeddings
    embeddingConfidence = bestScore;
  }

  const result = {
    intent: bestIntent,
    confidence: Math.min(1.0, bestScore + 0.1), // Baseline confidence boost
    scores: scores,
    urgency: urgency,
    urgencyWeight: urgencyWeight,
    complexity: complexity,
    wordCount: words.length,
    questionCount: questionCount,
    pass: "INTENT",
    passIndex: 0,
  };

  logger.debug("Intent classified", { intent: result.intent, confidence: result.confidence, urgency: result.urgency });
  return result;
}

module.exports = {
  classifyIntent,
  INTENT_CATALOG,
  URGENCY_SIGNALS,
};
