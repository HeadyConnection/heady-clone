/**
 * Tests for @heady/heady-memory (3-tier vector memory)
 */
"use strict";

const assert = require("assert");
const { HeadyMemory, T0WorkingMemory, cosineSimilarity, T0_CAPACITY } = require("../packages/heady-memory");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name + ": " + e.message); }
}

function randEmb(dim) {
  const arr = new Float32Array(dim || 768);
  for (let i = 0; i < arr.length; i++) arr[i] = Math.random() - 0.5;
  return arr;
}

function similarEmb(base, noise) {
  noise = noise || 0.05;
  const arr = new Float32Array(base.length);
  for (let i = 0; i < base.length; i++) arr[i] = base[i] + (Math.random() - 0.5) * noise;
  return arr;
}

console.log("@heady/heady-memory");

test("T0 capacity is Fibonacci 21", () => {
  assert.strictEqual(T0_CAPACITY, 21);
});

test("cosineSimilarity of identical vectors = 1", () => {
  const v = randEmb(10);
  assert(Math.abs(cosineSimilarity(v, v) - 1.0) < 0.0001);
});

test("cosineSimilarity of orthogonal vectors ≈ 0", () => {
  const a = new Float32Array([1, 0, 0]);
  const b = new Float32Array([0, 1, 0]);
  assert(Math.abs(cosineSimilarity(a, b)) < 0.0001);
});

test("HeadyMemory initializes with 3 tiers", () => {
  const mem = new HeadyMemory();
  const s = mem.status();
  assert.strictEqual(s.t0.tier, "T0");
  assert.strictEqual(s.t1.tier, "T1");
  assert.strictEqual(s.t2.tier, "T2");
});

test("store() adds to T0", () => {
  const mem = new HeadyMemory();
  mem.store("x1", randEmb(), "test content", {});
  assert.strictEqual(mem.t0.size, 1);
});

test("get() retrieves from T0", () => {
  const mem = new HeadyMemory();
  mem.store("x1", randEmb(), "hello", { topic: "test" });
  const r = mem.get("x1");
  assert(r);
  assert.strictEqual(r.content, "hello");
});

test("T0 eviction promotes to T1 when full", () => {
  const mem = new HeadyMemory();
  for (let i = 0; i < 25; i++) {
    mem.store("e" + i, randEmb(), "entry " + i, {});
  }
  assert.strictEqual(mem.t0.size, 21);
  assert(mem.t1.size > 0, "T1 should have promoted entries");
  assert(mem.status().stats.t0Promotions > 0);
});

test("get() recalls from T1 back to T0", () => {
  const mem = new HeadyMemory();
  // Fill T0 to force eviction of early entries
  for (let i = 0; i < 25; i++) {
    mem.store("r" + i, randEmb(), "entry " + i, {});
  }
  // r0 should be in T1 now (evicted from T0)
  assert(mem.t1.get("r0"), "r0 should be in T1");
  // Recall it
  const recalled = mem.get("r0");
  assert(recalled, "r0 should be recallable");
});

test("search() returns ranked results", () => {
  const mem = new HeadyMemory();
  const target = randEmb();
  mem.store("target", target, "target entry", {});
  mem.store("noise1", randEmb(), "noise 1", {});
  mem.store("noise2", randEmb(), "noise 2", {});

  const results = mem.search(similarEmb(target, 0.05), 5);
  assert(results.length >= 1, "Should find at least 1 result");
  assert.strictEqual(results[0].id, "target");
});

test("remove() clears from all tiers", () => {
  const mem = new HeadyMemory();
  mem.store("del1", randEmb(), "to delete", {});
  assert(mem.get("del1"));
  mem.remove("del1");
  assert(!mem.get("del1"));
});

test("storeAt() puts directly into specified tier", () => {
  const mem = new HeadyMemory();
  mem.storeAt("T2", "direct", randEmb(), "direct to T2", { partition: "test" });
  assert.strictEqual(mem.t2.totalSize, 1);
  const s = mem.t2.status();
  assert(s.partitions.test === 1);
});

test("T2 partitions work correctly", () => {
  const mem = new HeadyMemory();
  mem.storeAt("T2", "p1", randEmb(), "content A", { partition: "alpha" });
  mem.storeAt("T2", "p2", randEmb(), "content B", { partition: "beta" });
  const parts = mem.t2.listPartitions();
  assert.strictEqual(parts.alpha, 1);
  assert.strictEqual(parts.beta, 1);
});

test("status() returns comprehensive state", () => {
  const mem = new HeadyMemory();
  mem.store("s1", randEmb(), "test", {});
  const s = mem.status();
  assert(s.t0);
  assert(s.t1);
  assert(s.t2);
  assert(s.stats);
  assert.strictEqual(s.stats.totalStores, 1);
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed > 0 ? 1 : 0);
