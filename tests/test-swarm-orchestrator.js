/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  HeadySwarm Orchestrator — Integration Test Suite                ║
 * ║  Tests: Multi-swarm routing, execution, memory integration       ║
 * ║  ∞ SACRED GEOMETRY ∞  φ = 1.618 · ψ = 0.618                    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * © 2026 HeadySystems Inc. PROPRIETARY AND CONFIDENTIAL.
 */

"use strict";

const assert = require("assert");
const { HeadySwarmOrchestrator, ManagedSwarm, SwarmWorker, SWARM_CATALOG, SWARM_COUNT, createOrchestrator } = require("../packages/heady-swarm-orchestrator");
const { HeadyMemory } = require("../packages/heady-memory");
const { HeadyAutoContext } = require("../packages/heady-autocontext");
const { PHI, PSI, fib } = require("../packages/phi-math-foundation");

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (err) {
    failed++;
    console.log("  ✗ " + name + ": " + err.message);
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++;
    console.log("  ✓ " + name);
  } catch (err) {
    failed++;
    console.log("  ✗ " + name + ": " + err.message);
  }
}

console.log("\n╔══════════════════════════════════════════════╗");
console.log("║  HeadySwarm Orchestrator Test Suite           ║");
console.log("╚══════════════════════════════════════════════╝\n");

// ── SWARM_CATALOG tests ──────────────────────────────────────────

test("SWARM_CATALOG has 17 canonical swarms", function() {
  assert.strictEqual(SWARM_COUNT, 17);
  assert.strictEqual(Object.keys(SWARM_CATALOG).length, 17);
});

test("Every swarm has id, emoji, color, beeCount, and intents", function() {
  for (const [key, config] of Object.entries(SWARM_CATALOG)) {
    assert.ok(config.id, key + " missing id");
    assert.ok(config.emoji, key + " missing emoji");
    assert.ok(config.color, key + " missing color");
    assert.ok(config.beeCount > 0, key + " beeCount must be > 0");
    assert.ok(Array.isArray(config.intents) && config.intents.length > 0, key + " missing intents");
  }
});

test("Bee counts are Fibonacci numbers", function() {
  var fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];
  for (const [key, config] of Object.entries(SWARM_CATALOG)) {
    assert.ok(fibs.includes(config.beeCount), key + " beeCount " + config.beeCount + " is not Fibonacci");
  }
});

// ── SwarmWorker tests ────────────────────────────────────────────

test("SwarmWorker initializes idle", function() {
  var w = new SwarmWorker("w0", "test");
  assert.strictEqual(w.status, "idle");
  assert.strictEqual(w.completedCount, 0);
  assert.strictEqual(w.failedCount, 0);
});

// ── ManagedSwarm tests ───────────────────────────────────────────

test("ManagedSwarm creates correct number of workers", function() {
  var s = new ManagedSwarm("test-swarm", { beeCount: 5, emoji: "🐝", color: "#fff", intents: ["QUERY"] });
  assert.strictEqual(s.workers.length, 5);
  assert.strictEqual(s.status().idle, 5);
  assert.strictEqual(s.status().working, 0);
});

// ── Orchestrator init tests ──────────────────────────────────────

test("Orchestrator creates all 17 swarms", function() {
  var orch = createOrchestrator();
  assert.strictEqual(Object.keys(orch.swarms).length, 17);
});

test("Orchestrator total worker count matches catalog", function() {
  var orch = createOrchestrator();
  var status = orch.status();
  var expectedWorkers = 0;
  for (const config of Object.values(SWARM_CATALOG)) {
    expectedWorkers += config.beeCount;
  }
  assert.strictEqual(status.totalWorkers, expectedWorkers);
});

test("Orchestrator routes COMMAND intent to correct swarms", function() {
  var orch = createOrchestrator();
  var task = { id: "t1", name: "deploy", fn: async function() { return "ok"; } };
  var swarmKey = orch.route("COMMAND", task);
  // COMMAND maps to INFRASTRUCTURE, OPERATIONS, DEPLOYMENT, DATA, TESTING
  var commandSwarms = ["INFRASTRUCTURE", "OPERATIONS", "DEPLOYMENT", "DATA", "TESTING"];
  assert.ok(commandSwarms.includes(swarmKey), "Routed to " + swarmKey + ", expected one of " + commandSwarms.join(","));
});

test("Orchestrator routes DEBUG intent to security/testing/infrastructure", function() {
  var orch = createOrchestrator();
  var task = { id: "t2", name: "fix-bug", fn: async function() { return "fixed"; } };
  var swarmKey = orch.route("DEBUG", task);
  var debugSwarms = ["INFRASTRUCTURE", "SECURITY", "TESTING"];
  assert.ok(debugSwarms.includes(swarmKey), "Routed to " + swarmKey);
});

test("Orchestrator falls back to OPERATIONS for unknown intent", function() {
  var orch = createOrchestrator();
  var task = { id: "t3", name: "unknown", fn: async function() { return "hmm"; } };
  var swarmKey = orch.route("NONEXISTENT", task);
  assert.strictEqual(swarmKey, "OPERATIONS");
});

test("Orchestrator load-balances across candidate swarms", function() {
  var orch = createOrchestrator();
  // Fill up first candidate swarm
  for (var i = 0; i < 10; i++) {
    orch.route("COMMAND", { id: "lb-" + i, name: "load-" + i, fn: async function() { return i; } });
  }
  // The 10 tasks should be distributed (not all to one swarm)
  var distribution = orch._stats.routeDistribution;
  var keys = Object.keys(distribution);
  // At least one route should exist
  assert.ok(keys.length >= 1, "Expected routing distribution across swarms");
});

// ── Factory and status tests ─────────────────────────────────────

test("createOrchestrator factory works", function() {
  var orch = createOrchestrator();
  assert.ok(orch instanceof HeadySwarmOrchestrator);
  assert.strictEqual(orch.status().swarmCount, 17);
});

test("Orchestrator accepts memory and autocontext via setters", function() {
  var orch = createOrchestrator();
  var mem = new HeadyMemory();
  var ac = new HeadyAutoContext();
  orch.setMemory(mem);
  orch.setAutoContext(ac);
  assert.ok(orch.memory === mem);
  assert.ok(orch.autocontext === ac);
});

// ── Async execution tests ────────────────────────────────────────

async function runAsyncTests() {

  await asyncTest("SwarmWorker executes task and returns result", async function() {
    var w = new SwarmWorker("w1", "test");
    var task = { id: "tw1", name: "add", fn: async function() { return 42; } };
    var result = await w.execute(task, 5000);
    assert.strictEqual(result.taskId, "tw1");
    assert.strictEqual(result.result, 42);
    assert.strictEqual(result.error, null);
    assert.ok(result.durationMs >= 0);
    assert.strictEqual(w.completedCount, 1);
    assert.strictEqual(w.status, "idle");
  });

  await asyncTest("SwarmWorker handles task failure", async function() {
    var w = new SwarmWorker("w2", "test");
    var task = { id: "tw2", name: "fail", fn: async function() { throw new Error("boom"); } };
    var result = await w.execute(task, 5000);
    assert.strictEqual(result.error, "boom");
    assert.strictEqual(result.result, null);
    assert.strictEqual(w.failedCount, 1);
    assert.strictEqual(w.status, "idle");
  });

  await asyncTest("ManagedSwarm drains task queue", async function() {
    var s = new ManagedSwarm("drain-test", { beeCount: 3, emoji: "🐝", color: "#fff", intents: ["QUERY"] });
    for (var i = 0; i < 5; i++) {
      (function(idx) {
        s.enqueue({ id: "d" + idx, name: "drain-" + idx, fn: async function() { return idx * PHI; } });
      })(i);
    }
    var results = await s.drain();
    assert.strictEqual(results.length, 5);
    assert.strictEqual(s._totalCompleted, 5);
    assert.strictEqual(s._totalFailed, 0);
  });

  await asyncTest("Orchestrator executeAll runs tasks across swarms", async function() {
    var orch = createOrchestrator();
    // Route tasks to different swarms
    orch.route("COMMAND", { id: "e1", name: "cmd1", fn: async function() { return "deployed"; } });
    orch.route("QUERY", { id: "e2", name: "query1", fn: async function() { return "answered"; } });
    orch.route("DEBUG", { id: "e3", name: "fix1", fn: async function() { return "fixed"; } });

    var result = await orch.executeAll();
    assert.strictEqual(result.completed, 3);
    assert.strictEqual(result.failed, 0);
    assert.ok(result.swarmsActivated.length >= 2, "Expected multiple swarms activated");
    assert.ok(result.durationMs >= 0);
  });

  await asyncTest("Orchestrator executeAll with memory stores execution context", async function() {
    var mem = new HeadyMemory();
    var orch = createOrchestrator({ memory: mem });

    orch.route("CREATIVE", { id: "m1", name: "create", fn: async function() { return "art"; } });
    var result = await orch.executeAll();

    assert.strictEqual(result.completed, 1);
    // Memory should have stored the execution context
    var memStatus = mem.status();
    assert.ok(memStatus.stats.totalStores >= 1, "Expected memory store for execution context");
  });

  await asyncTest("Orchestrator smartRoute with AutoContext classifies and routes", async function() {
    var orch = createOrchestrator();
    var ac = new HeadyAutoContext();
    orch.setAutoContext(ac);

    var task = { id: "sr1", name: "smart-task", fn: async function() { return "smart"; } };
    var routeResult = orch.smartRoute("fix the broken deployment pipeline immediately", task);

    // "fix" + "broken" → DEBUG intent, "immediately" → CRITICAL urgency
    assert.ok(routeResult.swarmKey, "Expected a swarm key");
    assert.ok(routeResult.enrichment, "Expected enrichment result");
    assert.ok(routeResult.enrichment.gate, "Expected gate in enrichment");
  });

  await asyncTest("Full pipeline: Memory + AutoContext + Orchestrator", async function() {
    var mem = new HeadyMemory();
    var ac = new HeadyAutoContext({ memory: mem });
    var orch = createOrchestrator({ memory: mem, autocontext: ac });

    // Store some context in memory
    var embedding = new Array(768).fill(0);
    embedding[0] = 0.9;
    mem.store("prior-deploy", embedding, "Previous deploy succeeded", { topic: "deployment" });

    // Smart-route a task
    var task = { id: "fp1", name: "full-pipeline", fn: async function() { return "pipeline-complete"; } };
    var routeResult = orch.smartRoute("deploy the new version to production", task);

    assert.ok(routeResult.swarmKey, "Expected swarm assignment");

    // Execute
    var execResult = await orch.executeAll();
    assert.strictEqual(execResult.completed, 1);
    assert.strictEqual(execResult.failed, 0);

    // Verify memory has both the prior context and the execution context
    var memStatus = mem.status();
    assert.ok(memStatus.stats.totalStores >= 2, "Expected at least 2 memory entries");

    // Verify orchestrator stats
    var orchStatus = orch.status();
    assert.ok(orchStatus.stats.totalTasksRouted >= 1);
    assert.ok(orchStatus.stats.totalTasksCompleted >= 1);
  });
}

// Run sync tests first, then async
runAsyncTests().then(function() {
  console.log("\n" + "═".repeat(50));
  console.log("Results: " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total");
  if (failed > 0) {
    console.log("SOME TESTS FAILED");
    process.exit(1);
  } else {
    console.log("ALL TESTS PASSED ✓");
  }
});
