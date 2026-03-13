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

// ─── Core Constants ─────────────────────────────────────────────────
const PHI = (1 + Math.sqrt(5)) / 2;  // 1.6180339887…
const PSI = PHI - 1;                  // 0.6180339887… = 1/φ

// ─── Fibonacci ──────────────────────────────────────────────────────
const _fibCache = [0, 1];
function fib(n) {
  if (n < 0) return 0;
  if (_fibCache[n] !== undefined) return _fibCache[n];
  for (let i = _fibCache.length; i <= n; i++) {
    _fibCache[i] = _fibCache[i - 1] + _fibCache[i - 2];
  }
  return _fibCache[n];
}

// ─── CSL (Cognitive Similarity Level) Thresholds ────────────────────
//  Based on φ powers: φ⁻², φ⁻¹, φ⁰, φ¹
const CSL_THRESHOLDS = Object.freeze({
  REJECT:    0,                       // 0.000 — below minimum
  MINIMUM:   PSI * PSI,               // 0.382 — φ⁻² task acceptance floor
  GOOD:      PSI,                     // 0.618 — φ⁻¹ quality gate / merge threshold
  EXCELLENT: 1.0,                     // 1.000 — perfect match
  GOLDEN:    PHI,                     // 1.618 — exceeds expectations (bonus weight)
});

// ─── Pressure Levels ────────────────────────────────────────────────
//  Swarm backpressure thresholds for auto-scaling decisions.
const PRESSURE_LEVELS = Object.freeze({
  IDLE:      0,
  LOW:       PSI * PSI,               // 0.382
  MODERATE:  PSI,                     // 0.618
  HIGH:      1.0,
  CRITICAL:  PHI,                     // 1.618
});

// ─── Eviction Weights ───────────────────────────────────────────────
//  For LRU/LFU cache eviction with φ-weighted scoring.
const EVICTION_WEIGHTS = Object.freeze({
  recency:    PHI,       // 1.618 — recent items weighted highest
  frequency:  1.0,       // 1.000 — access count base weight
  size:       PSI,       // 0.618 — smaller items slightly preferred
  importance: PHI * PHI, // 2.618 — importance dominates
});

// ─── classifyPressure ───────────────────────────────────────────────
function classifyPressure(ratio) {
  if (ratio >= PRESSURE_LEVELS.CRITICAL) return "CRITICAL";
  if (ratio >= PRESSURE_LEVELS.HIGH)     return "HIGH";
  if (ratio >= PRESSURE_LEVELS.MODERATE) return "MODERATE";
  if (ratio >= PRESSURE_LEVELS.LOW)      return "LOW";
  return "IDLE";
}

// ─── cslGate ────────────────────────────────────────────────────────
//  Returns true if similarity score passes the named gate.
function cslGate(score, gate = "GOOD") {
  const threshold = CSL_THRESHOLDS[gate] ?? CSL_THRESHOLDS.GOOD;
  return score >= threshold;
}

// ─── cslBlend ───────────────────────────────────────────────────────
//  Blends two values using φ-weighted interpolation.
//  blend(a, b) = a·ψ + b·(1-ψ) = a·0.618 + b·0.382
function cslBlend(a, b) {
  return a * PSI + b * (1 - PSI);
}

// ─── phiBackoff ─────────────────────────────────────────────────────
//  Returns Fibonacci-based backoff delay in ms for attempt n.
//  With jitter to prevent thundering herd.
function phiBackoff(attempt, baseMs = 1000) {
  const fibDelay = fib(Math.min(attempt + 2, 20)) * baseMs;
  const jitter = Math.random() * baseMs * PSI;
  return fibDelay + jitter;
}

// ─── phiFusionWeights ───────────────────────────────────────────────
//  Returns N weights that sum to 1, each scaled by φ powers.
//  First item gets the most weight (φ^(n-1)), last gets least (φ^0).
function phiFusionWeights(n) {
  if (n <= 0) return [];
  if (n === 1) return [1.0];
  const raw = [];
  for (let i = 0; i < n; i++) {
    raw.push(Math.pow(PHI, n - 1 - i));
  }
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map(w => w / sum);
}

// ─── phiResourceWeights ─────────────────────────────────────────────
//  Returns resource allocation weights for N resources.
//  Uses PSI decay: resource[0] gets ψ^0, resource[1] gets ψ^1, etc.
function phiResourceWeights(n) {
  if (n <= 0) return [];
  if (n === 1) return [1.0];
  const raw = [];
  for (let i = 0; i < n; i++) {
    raw.push(Math.pow(PSI, i));
  }
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map(w => w / sum);
}

// ─── Exports ────────────────────────────────────────────────────────
module.exports = {
  PHI,
  PSI,
  fib,
  CSL_THRESHOLDS,
  PRESSURE_LEVELS,
  EVICTION_WEIGHTS,
  classifyPressure,
  cslGate,
  cslBlend,
  phiBackoff,
  phiFusionWeights,
  phiResourceWeights,
};
