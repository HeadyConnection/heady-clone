/**
 * Tests for @heady/heady-autocontext (5-pass enrichment)
 */
"use strict";

const assert = require("assert");
const { HeadyAutoContext, classifyIntent, estimateTokens, TOKEN_BUDGETS } = require("../packages/heady-autocontext");
const { HeadyMemory } = require("../packages/heady-memory");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name + ": " + e.message); }
}

console.log("@heady/heady-autocontext");

// Pass 1: Intent
test("classifyIntent detects COMMAND", () => {
  const r = classifyIntent("create a new deployment");
  assert.strictEqual(r.intent, "COMMAND");
});

test("classifyIntent detects DEBUG", () => {
  const r = classifyIntent("fix the broken endpoint error");
  assert.strictEqual(r.intent, "DEBUG");
});

test("classifyIntent detects QUERY", () => {
  const r = classifyIntent("explain how the golden ratio works and why it matters");
  assert.strictEqual(r.intent, "QUERY");
});

test("classifyIntent detects CREATIVE", () => {
  const r = classifyIntent("write a poem about coding");
  assert.strictEqual(r.intent, "CREATIVE");
});

test("classifyIntent detects urgency", () => {
  const r = classifyIntent("urgent fix the crash now");
  assert.strictEqual(r.urgency, "CRITICAL");
});

test("classifyIntent measures complexity", () => {
  const short = classifyIntent("hi");
  const long = classifyIntent("explain the full architecture of the heady system including all services and how they communicate with each other?");
  assert(long.complexity > short.complexity);
});

// Token estimation
test("estimateTokens gives reasonable count", () => {
  const t = estimateTokens("hello world");
  assert(t > 0 && t < 10);
});

// Full pipeline
test("HeadyAutoContext initializes", () => {
  const ctx = new HeadyAutoContext();
  assert(ctx.status());
});

test("enrich() runs all 5 passes", () => {
  const ctx = new HeadyAutoContext();
  const r = ctx.enrich("deploy the system");
  assert(r.intent);
  assert(r.memory);
  assert(r.grounding);
  assert(r.compression);
  assert(r.confidence);
  assert(r.correlationId);
  assert(typeof r.elapsedMs === "number");
});

test("enrich() with memory wired", () => {
  const mem = new HeadyMemory();
  const ctx = new HeadyAutoContext({ memory: mem });
  const r = ctx.enrich("find something");
  assert.strictEqual(r.intent.intent, "NAVIGATION");
  assert(r.confidence);
});

test("quickEnrich() returns simplified result", () => {
  const ctx = new HeadyAutoContext();
  const r = ctx.quickEnrich("what time is it?");
  assert(r.gate);
  assert(r.recommendation);
  assert(typeof r.confidence === "number");
  assert(r.intent);
  assert(r.correlationId);
});

test("status() tracks enrichment stats", () => {
  const ctx = new HeadyAutoContext();
  ctx.enrich("test 1");
  ctx.enrich("test 2");
  const s = ctx.status();
  assert.strictEqual(s.totalEnrichments, 2);
  assert(typeof s.avgConfidence === "number");
});

test("setMemory() late-binds memory", () => {
  const ctx = new HeadyAutoContext();
  assert(!ctx.status().hasMemory);
  ctx.setMemory(new HeadyMemory());
  assert(ctx.status().hasMemory);
});

test("TOKEN_BUDGETS are reasonable", () => {
  assert(TOKEN_BUDGETS.SMALL > 0);
  assert(TOKEN_BUDGETS.XL > TOKEN_BUDGETS.LARGE);
  assert(TOKEN_BUDGETS.LARGE > TOKEN_BUDGETS.MEDIUM);
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
