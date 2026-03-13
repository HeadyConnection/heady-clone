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

/**
 * Tests for @heady/phi-math-foundation
 */
"use strict";

const assert = require("assert");
const {
  PHI, PSI, fib, CSL_THRESHOLDS, PRESSURE_LEVELS, EVICTION_WEIGHTS,
  classifyPressure, cslGate, cslBlend, phiBackoff, phiFusionWeights, phiResourceWeights,
} = require("../packages/phi-math-foundation");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name + ": " + e.message); }
}

console.log("@heady/phi-math-foundation");

test("PHI ≈ 1.618", () => {
  assert(Math.abs(PHI - 1.6180339887) < 0.0001);
});

test("PSI ≈ 0.618", () => {
  assert(Math.abs(PSI - 0.6180339887) < 0.0001);
});

test("PHI × PSI ≈ 1", () => {
  assert(Math.abs(PHI * PSI - 1) < 0.0001);
});

test("fib(0)=0, fib(1)=1, fib(8)=21", () => {
  assert.strictEqual(fib(0), 0);
  assert.strictEqual(fib(1), 1);
  assert.strictEqual(fib(8), 21);
  assert.strictEqual(fib(10), 55);
});

test("fib(-1) returns 0", () => {
  assert.strictEqual(fib(-1), 0);
});

test("CSL_THRESHOLDS are φ-derived", () => {
  assert.strictEqual(CSL_THRESHOLDS.REJECT, 0);
  assert(Math.abs(CSL_THRESHOLDS.MINIMUM - PSI * PSI) < 0.0001);
  assert(Math.abs(CSL_THRESHOLDS.GOOD - PSI) < 0.0001);
  assert.strictEqual(CSL_THRESHOLDS.EXCELLENT, 1.0);
  assert(Math.abs(CSL_THRESHOLDS.GOLDEN - PHI) < 0.0001);
});

test("classifyPressure returns correct levels", () => {
  assert.strictEqual(classifyPressure(0), "IDLE");
  assert.strictEqual(classifyPressure(0.4), "LOW");
  assert.strictEqual(classifyPressure(0.7), "MODERATE");
  assert.strictEqual(classifyPressure(1.0), "HIGH");
  assert.strictEqual(classifyPressure(2.0), "CRITICAL");
});

test("cslGate returns boolean", () => {
  assert.strictEqual(cslGate(0.7, "GOOD"), true);
  assert.strictEqual(cslGate(0.3, "GOOD"), false);
  assert.strictEqual(cslGate(0.5, "MINIMUM"), true);
  assert.strictEqual(cslGate(0.1, "MINIMUM"), false);
});

test("cslBlend uses ψ weighting", () => {
  const result = cslBlend(1.0, 0.0);
  assert(Math.abs(result - PSI) < 0.0001);
});

test("phiBackoff returns increasing delays", () => {
  const d1 = phiBackoff(0, 100);
  const d2 = phiBackoff(3, 100);
  const d3 = phiBackoff(6, 100);
  assert(d2 > d1);
  assert(d3 > d2);
});

test("phiFusionWeights sum to 1", () => {
  for (let n = 1; n <= 5; n++) {
    const weights = phiFusionWeights(n);
    assert.strictEqual(weights.length, n);
    const sum = weights.reduce((a, b) => a + b, 0);
    assert(Math.abs(sum - 1.0) < 0.0001, "n=" + n + " sum=" + sum);
  }
});

test("phiFusionWeights first > last", () => {
  const w = phiFusionWeights(4);
  assert(w[0] > w[3]);
});

test("phiResourceWeights sum to 1", () => {
  for (let n = 1; n <= 5; n++) {
    const weights = phiResourceWeights(n);
    const sum = weights.reduce((a, b) => a + b, 0);
    assert(Math.abs(sum - 1.0) < 0.0001);
  }
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
