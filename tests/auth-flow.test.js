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
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('auth relay keeps nonce, allowlist, and postMessage flow without localStorage', () => {
  const relay = fs.readFileSync(path.join(root, 'apps', 'sites', 'auth-headysystems', 'relay.html'), 'utf8');
  assert.match(relay, /ALLOWED_ORIGINS/);
  assert.match(relay, /postMessage/);
  assert.match(relay, /nonce/);
  assert.doesNotMatch(relay, /localStorage/);
});

test('platform auth module exposes JWT and service auth layers', () => {
  const auth = fs.readFileSync(path.join(root, 'packages', 'platform', 'src', 'auth', 'index.js'), 'utf8');
  assert.match(auth, /class JwtValidator/);
  assert.match(auth, /serviceAuthMiddleware/);
  assert.match(auth, /ReceiptSigner/);
});
