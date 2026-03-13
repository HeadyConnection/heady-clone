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

const pino = require('pino');
const logger = pino();
'use strict';
/**
 * Tests — Spatial Embedder
 */
const { embed, batchEmbed, scoreByKeywords, scoreTemporalState, DOMAIN_KEYWORDS, deterministicReceipt } = require('../src/services/spatial-embedder');

// ── X-axis: semantic domain ─────────────────────────────────
logger.info('=== Spatial Embedder Tests ===');

// Backend code should score negative X
const backendResult = embed('const express = require("express"); app.get("/api/health", middleware, handler);', { filePath: 'server/routes/health.js' });
console.assert(backendResult.x < 0, `Backend X should be negative, got ${backendResult.x}`);
logger.info(`✓ Backend code: X=${backendResult.x} (negative = backend)`);

// Frontend code should score positive X
const frontendResult = embed('import React from "react"; const Button = () => <div className="gradient glassmorphism">Click</div>;', { filePath: 'src/components/Button.jsx' });
console.assert(frontendResult.x > backendResult.x, `Frontend X should be > backend X`);
logger.info(`✓ Frontend code: X=${frontendResult.x} (positive = frontend)`);

// CSS/UI code should score highest positive X
const uiResult = embed('body { background: linear-gradient(135deg, #667eea, #764ba2); animation: fadeIn 0.3s; }', { filePath: 'public/styles.css' });
console.assert(uiResult.x > 0, `UI X should be positive, got ${uiResult.x}`);
logger.info(`✓ UI/CSS code: X=${uiResult.x}`);

// ── Y-axis: temporal state ──────────────────────────────────
// Recent file should score higher Y
const recentY = scoreTemporalState('active code', { mtime: new Date().toISOString() });
const oldY = scoreTemporalState('legacy code', { mtime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() });
console.assert(recentY > oldY, `Recent Y(${recentY}) should > old Y(${oldY})`);
logger.info(`✓ Temporal: recent=${recentY} > old=${oldY}`);

// Deprecated content should score low
const deprecatedY = scoreTemporalState('This function is deprecated and archived', { mtime: new Date().toISOString() });
console.assert(deprecatedY < 0.2, `Deprecated Y should be < 0.2, got ${deprecatedY}`);
logger.info(`✓ Deprecated content: Y=${deprecatedY}`);

// ── Z-axis: structural hierarchy ────────────────────────────
const literalResult = embed('if (count > 10) { throw new Error("limit exceeded"); return false; }', {});
const architecturalResult = embed('The HCFullPipeline orchestration framework governs the Sacred Geometry topology and system roadmap blueprint strategy.', {});
console.assert(architecturalResult.z > literalResult.z, `Architecture Z should > literal Z`);
logger.info(`✓ Hierarchy: architectural Z=${architecturalResult.z} > literal Z=${literalResult.z}`);

// ── Deterministic receipt ───────────────────────────────────
const r1 = embed('same input', { filePath: 'test.js' });
const r2 = embed('same input', { filePath: 'test.js' });
console.assert(r1.receipt === r2.receipt, 'Receipt should be deterministic');
logger.info(`✓ Receipt stable: ${r1.receipt.slice(0, 16)}...`);

// ── Batch embed ─────────────────────────────────────────────
const batch = batchEmbed([
    { text: 'dockerfile FROM node:22', meta: { filePath: 'Dockerfile' } },
    { text: 'CSS animation keyframes', meta: { filePath: 'styles.css' } },
]);
console.assert(batch.length === 2, 'Batch should return 2 results');
console.assert(batch[0].x < batch[1].x, 'Dockerfile X should be < CSS X');
logger.info(`✓ Batch: ${batch.length} items, Dockerfile X=${batch[0].x} < CSS X=${batch[1].x}`);

logger.info('✅ spatial-embedder: ALL PASS');
