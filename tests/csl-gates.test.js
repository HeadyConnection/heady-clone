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

import test from 'node:test';
import assert from 'node:assert/strict';
import { cslAND, cslOR, normalize, cslConfidenceGate } from '../packages/platform/src/csl/index.js';
import { PSI } from '../packages/platform/src/phi/index.js';

test('CSL AND returns 1 for aligned vectors', () => {
  const a = normalize([1, 2, 3]);
  const b = normalize([1, 2, 3]);
  assert.equal(Number(cslAND(a, b).toFixed(6)), 1);
});

test('CSL OR preserves dimensionality', () => {
  const out = cslOR([1, 0, 0], [0, 1, 0]);
  assert.equal(out.length, 3);
  assert.ok(out[0] > 0 && out[1] > 0);
});

test('Confidence gate fails below psi', () => {
  const result = cslConfidenceGate([PSI, PSI - 0.1, PSI + 0.1]);
  assert.equal(result.passes, false);
  assert.ok(result.failing.length >= 1);
});
