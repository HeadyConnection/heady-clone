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
 * Integration tests — cross-module interaction validation
 * Author: Eric Haywood | ESM only
 */
import { strict as assert } from 'assert';
import { PHI, PSI, fibonacci, phiThreshold } from '../shared/phi-math-v2.js';
import { cslGate, cosineSimilarity } from '../shared/csl-engine-v2.js';

async function testServiceToScalingIntegration() {
  const errorMod = await import('../scaling/error-codes.js');
  const err = errorMod.createError('AUTH_1004', { service: 'auth-session-server' });
  assert.ok(err.retryable === true, 'Rate limit error is retryable');
  assert.ok(err.httpStatus === 429, 'Correct HTTP status');

  const dlqMod = await import('../scaling/dead-letter-queue.js');
  const dlqResult = dlqMod.enqueue({
    payload: err,
    error: err.message,
    originalQueue: err.domain,
  });
  assert.ok(dlqResult.id, 'Error routed to DLQ');
  console.log('  ✓ Service → Error → DLQ integration verified');
}

async function testFeatureFlagGatedService() {
  const flagMod = await import('../scaling/feature-flags.js');
  flagMod.createFlag({ key: 'new-search-algo', enabled: true, rolloutPercentage: 50 });

  const evaluation = flagMod.evaluateFlag('new-search-algo', 'user-abc');
  assert.ok(typeof evaluation.enabled === 'boolean', 'Flag evaluation returns boolean');
  console.log('  ✓ Feature flag gated service flow verified');
}

async function testCqrsToSagaFlow() {
  const cqrs = await import('../scaling/cqrs-manager.js');
  const saga = await import('../scaling/saga-coordinator.js');

  cqrs.registerCommandHandler('CREATE_ORDER', (cmd) => [{
    type: 'ORDER_CREATED', aggregateId: cmd.aggregateId, payload: cmd.payload,
  }]);

  saga.defineSaga('order-flow', [
    { name: 'validate', action: () => ({ valid: true }), compensation: () => ({ rolled_back: true }) },
    { name: 'process', action: () => ({ processed: true }), compensation: () => ({ undone: true }) },
  ]);

  const cmdResult = await cqrs.executeCommand({ type: 'CREATE_ORDER', aggregateId: 'order-1', payload: { amount: 100 } });
  assert.ok(cmdResult.success, 'CQRS command succeeded');

  const sagaResult = await saga.startSaga('order-flow', { orderId: 'order-1' });
  assert.ok(sagaResult.state === 'COMPLETED', 'Saga completed');
  console.log('  ✓ CQRS → Saga integration verified');
}

async function testSchemaValidationInPipeline() {
  const contracts = await import('../scaling/api-contracts.js');
  contracts.registerSchema('analytics-event', 1, {
    properties: {
      eventType: { type: 'string' },
      timestamp: { type: 'number' },
      userId: { type: 'string' },
    },
    required: ['eventType', 'timestamp', 'userId'],
  });

  const validResult = contracts.validatePayload('analytics-event', { eventType: 'page_view', timestamp: Date.now(), userId: 'u1' });
  assert.ok(validResult.valid, 'Valid analytics event passes');

  const invalidResult = contracts.validatePayload('analytics-event', { eventType: 'page_view' });
  assert.ok(!invalidResult.valid, 'Invalid event rejected');
  assert.ok(invalidResult.errors.length === 2, 'Two missing required fields');
  console.log('  ✓ Schema validation pipeline verified');
}

function testCslGatingDecisionPaths() {
  const highConfidence = cslGate(1.0, 0.95, phiThreshold(2), PSI * PSI * PSI);
  const lowConfidence = cslGate(1.0, 0.3, phiThreshold(2), PSI * PSI * PSI);
  assert.ok(highConfidence > 0.9, 'High confidence passes gate');
  assert.ok(lowConfidence < 0.1, 'Low confidence blocked by gate');

  const blend = (highConfidence + lowConfidence) / 2;
  assert.ok(blend > 0.4 && blend < 0.6, 'Blended gate in middle range');
  console.log('  ✓ CSL gating decision paths verified');
}

console.log('\n=== Integration Tests ===');
await testServiceToScalingIntegration();
await testFeatureFlagGatedService();
await testCqrsToSagaFlow();
await testSchemaValidationInPipeline();
testCslGatingDecisionPaths();
console.log('\n✅ All integration tests passed.');

export default { testServiceToScalingIntegration, testFeatureFlagGatedService, testCqrsToSagaFlow };
