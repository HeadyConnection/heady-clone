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
 *
 * HeadySwarm Orchestrator — Multi-swarm coordinator.
 * Routes tasks to the right swarm based on intent, manages swarm lifecycle,
 * integrates with HeadyMemory for context-aware distribution, and provides
 * unified observability across all 17 canonical swarms.
 */

"use strict";

const { EventEmitter } = require("events");
const { PHI, PSI, fib, phiFusionWeights, cslGate, phiBackoff } = require("@heady/phi-math-foundation");
const { createLogger, generateCorrelationId } = require("@heady/structured-logger");

const logger = createLogger("heady-swarm-orchestrator");

// ══════════════════════════════════════════════════════════════════
// 17 Canonical Swarm Definitions
// ══════════════════════════════════════════════════════════════════

const SWARM_CATALOG = {
  INFRASTRUCTURE:  { id: "infra",       emoji: "🏗️",  color: "#FFD700", beeCount: fib(6),  intents: ["COMMAND", "DEBUG"] },
  INTELLIGENCE:    { id: "intel",       emoji: "🧠",  color: "#FF6B35", beeCount: fib(7),  intents: ["ANALYSIS", "QUERY"] },
  PERSONAL_AI:     { id: "personal",    emoji: "💜",  color: "#A855F7", beeCount: fib(5),  intents: ["CREATIVE", "QUERY"] },
  CONNECTION:      { id: "connection",   emoji: "🔗",  color: "#06B6D4", beeCount: fib(5),  intents: ["NAVIGATION", "QUERY"] },
  BUDDY:           { id: "buddy",       emoji: "🤖",  color: "#10B981", beeCount: fib(6),  intents: ["QUERY", "CREATIVE"] },
  DOCUMENTATION:   { id: "docs",        emoji: "📚",  color: "#94A3B8", beeCount: fib(5),  intents: ["QUERY", "ANALYSIS"] },
  OPERATIONS:      { id: "ops",         emoji: "⚡",  color: "#22C55E", beeCount: fib(6),  intents: ["COMMAND", "META"] },
  SECURITY:        { id: "security",    emoji: "🛡️",  color: "#EF4444", beeCount: fib(5),  intents: ["DEBUG", "ANALYSIS"] },
  DEPLOYMENT:      { id: "deploy",      emoji: "🚀",  color: "#3B82F6", beeCount: fib(5),  intents: ["COMMAND"] },
  MONITORING:      { id: "monitor",     emoji: "📊",  color: "#F59E0B", beeCount: fib(5),  intents: ["META", "ANALYSIS"] },
  DATA:            { id: "data",        emoji: "💾",  color: "#8B5CF6", beeCount: fib(6),  intents: ["ANALYSIS", "COMMAND"] },
  TESTING:         { id: "testing",     emoji: "🧪",  color: "#EC4899", beeCount: fib(5),  intents: ["DEBUG", "COMMAND"] },
  CREATIVE:        { id: "creative",    emoji: "🎨",  color: "#F472B6", beeCount: fib(5),  intents: ["CREATIVE"] },
  LEARNING:        { id: "learning",    emoji: "📖",  color: "#14B8A6", beeCount: fib(5),  intents: ["QUERY"] },
  WELLNESS:        { id: "wellness",    emoji: "🌿",  color: "#84CC16", beeCount: fib(4),  intents: ["QUERY", "CREATIVE"] },
  FINANCE:         { id: "finance",     emoji: "💰",  color: "#EAB308", beeCount: fib(5),  intents: ["ANALYSIS", "COMMAND"] },
  GOVERNANCE:      { id: "governance",  emoji: "⚖️",  color: "#64748B", beeCount: fib(4),  intents: ["ANALYSIS", "META"] },
};

const SWARM_COUNT = Object.keys(SWARM_CATALOG).length; // 17

// ══════════════════════════════════════════════════════════════════
// SwarmWorker — Lightweight in-process worker bee
// ══════════════════════════════════════════════════════════════════

class SwarmWorker {
  constructor(id, swarmId) {
    this.id = id;
    this.swarmId = swarmId;
    this.status = "idle"; // idle | working | resting
    this.currentTask = null;
    this.completedCount = 0;
    this.failedCount = 0;
    this.totalDurationMs = 0;
  }

  async execute(task, timeoutMs) {
    if (this.status !== "idle") {
      throw new Error("Worker " + this.id + " is " + this.status + ", not idle");
    }
    this.status = "working";
    this.currentTask = task;
    const start = Date.now();

    try {
      const result = await Promise.race([
        task.fn(),
        new Promise(function(_, reject) {
          setTimeout(function() { reject(new Error("Task timeout")); }, timeoutMs || 30000);
        }),
      ]);
      const dur = Date.now() - start;
      this.completedCount++;
      this.totalDurationMs += dur;
      return { taskId: task.id, result: result, durationMs: dur, error: null, workerId: this.id };
    } catch (err) {
      const dur = Date.now() - start;
      this.failedCount++;
      return { taskId: task.id, result: null, durationMs: dur, error: err.message, workerId: this.id };
    } finally {
      this.currentTask = null;
      this.status = "idle";
    }
  }

  stats() {
    return {
      id: this.id,
      swarmId: this.swarmId,
      status: this.status,
      completed: this.completedCount,
      failed: this.failedCount,
      avgMs: this.completedCount > 0 ? Math.round(this.totalDurationMs / this.completedCount) : 0,
    };
  }
}

// ══════════════════════════════════════════════════════════════════
// ManagedSwarm — A single swarm with its worker pool
// ══════════════════════════════════════════════════════════════════

class ManagedSwarm extends EventEmitter {
  constructor(name, config) {
    super();
    this.name = name;
    this.config = config;
    this.workers = [];
    this.taskQueue = [];
    this.results = [];
    this._totalCompleted = 0;
    this._totalFailed = 0;
    this._active = false;

    for (var i = 0; i < config.beeCount; i++) {
      this.workers.push(new SwarmWorker(name + "-w" + i, name));
    }
  }

  getIdleWorker() {
    for (var i = 0; i < this.workers.length; i++) {
      if (this.workers[i].status === "idle") return this.workers[i];
    }
    return null;
  }

  enqueue(task) {
    this.taskQueue.push(task);
  }

  async drain() {
    this._active = true;
    const self = this;

    while (this.taskQueue.length > 0) {
      const worker = this.getIdleWorker();
      if (!worker) {
        await new Promise(function(r) { setTimeout(r, 10); });
        continue;
      }
      const task = this.taskQueue.shift();
      // Fire and continue draining
      (async function(w, t) {
        const result = await w.execute(t, 30000);
        if (result.error) {
          self._totalFailed++;
        } else {
          self._totalCompleted++;
        }
        self.results.push(result);
        self.emit("task:done", result);
      })(worker, task);
    }

    // Wait for all workers to finish
    var maxWait = 60000;
    var waited = 0;
    while (waited < maxWait) {
      var busy = this.workers.some(function(w) { return w.status === "working"; });
      if (!busy && this.taskQueue.length === 0) break;
      await new Promise(function(r) { setTimeout(r, 20); });
      waited += 20;
    }

    this._active = false;
    return this.results;
  }

  status() {
    var idle = 0, working = 0;
    for (var i = 0; i < this.workers.length; i++) {
      if (this.workers[i].status === "idle") idle++;
      if (this.workers[i].status === "working") working++;
    }
    return {
      name: this.name,
      emoji: this.config.emoji,
      workers: this.workers.length,
      idle: idle,
      working: working,
      queued: this.taskQueue.length,
      completed: this._totalCompleted,
      failed: this._totalFailed,
      active: this._active,
    };
  }
}

// ══════════════════════════════════════════════════════════════════
// HeadySwarmOrchestrator — The Grand Coordinator
// ══════════════════════════════════════════════════════════════════

class HeadySwarmOrchestrator extends EventEmitter {
  constructor(opts) {
    super();
    opts = opts || {};

    this.swarms = {};
    this.memory = opts.memory || null;     // HeadyMemory instance
    this.autocontext = opts.autocontext || null; // HeadyAutoContext instance

    // Build all 17 managed swarms
    for (const [key, config] of Object.entries(SWARM_CATALOG)) {
      this.swarms[key] = new ManagedSwarm(config.id, config);
    }

    // Intent → Swarm routing table (built from SWARM_CATALOG)
    this._intentRoutes = {};
    for (const [key, config] of Object.entries(SWARM_CATALOG)) {
      for (const intent of config.intents) {
        if (!this._intentRoutes[intent]) this._intentRoutes[intent] = [];
        this._intentRoutes[intent].push(key);
      }
    }

    // Stats
    this._stats = {
      totalTasksRouted: 0,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      routeDistribution: {},
      startedAt: Date.now(),
    };

    logger.info("HeadySwarmOrchestrator initialized", {
      swarmCount: SWARM_COUNT,
      intentRoutes: Object.keys(this._intentRoutes).length,
      hasMemory: !!this.memory,
      hasAutocontext: !!this.autocontext,
    });
  }

  /**
   * Route a task to the best swarm based on intent classification.
   *
   * @param {string} intent - Intent category (QUERY, COMMAND, DEBUG, etc.)
   * @param {Object} task - Task object { id, name, fn, metadata }
   * @param {Object} opts - Options { preferredSwarm, fallback }
   */
  route(intent, task, opts) {
    opts = opts || {};
    var targetSwarmKey = null;

    // 1. If preferred swarm is specified and valid, use it
    if (opts.preferredSwarm && this.swarms[opts.preferredSwarm]) {
      targetSwarmKey = opts.preferredSwarm;
    }

    // 2. Intent-based routing
    if (!targetSwarmKey) {
      var candidates = this._intentRoutes[intent] || [];
      if (candidates.length > 0) {
        // Pick the swarm with the lightest load
        var bestKey = candidates[0];
        var bestQueued = this.swarms[candidates[0]].taskQueue.length;
        for (var i = 1; i < candidates.length; i++) {
          var q = this.swarms[candidates[i]].taskQueue.length;
          if (q < bestQueued) {
            bestQueued = q;
            bestKey = candidates[i];
          }
        }
        targetSwarmKey = bestKey;
      }
    }

    // 3. Fallback to OPERATIONS swarm
    if (!targetSwarmKey) {
      targetSwarmKey = "OPERATIONS";
    }

    // Enqueue
    this.swarms[targetSwarmKey].enqueue(task);
    this._stats.totalTasksRouted++;
    this._stats.routeDistribution[targetSwarmKey] = (this._stats.routeDistribution[targetSwarmKey] || 0) + 1;

    logger.debug("Task routed", {
      taskId: task.id,
      intent: intent,
      targetSwarm: targetSwarmKey,
      queueDepth: this.swarms[targetSwarmKey].taskQueue.length,
    });

    return targetSwarmKey;
  }

  /**
   * Smart route using AutoContext pipeline.
   * Classifies intent from natural language, enriches with memory, and routes.
   *
   * @param {string} text - Natural language task description
   * @param {Object} task - Task object { id, name, fn, metadata }
   * @param {Object} opts - Options passed to autocontext
   * @returns {Object} { swarmKey, enrichment }
   */
  smartRoute(text, task, opts) {
    opts = opts || {};
    var enrichment = null;
    var intent = "QUERY"; // default

    if (this.autocontext) {
      enrichment = this.autocontext.quickEnrich(text, opts);
      intent = enrichment.intent || "QUERY";
    }

    var swarmKey = this.route(intent, task, opts);

    return {
      swarmKey: swarmKey,
      intent: intent,
      enrichment: enrichment,
    };
  }

  /**
   * Execute all pending tasks across all swarms concurrently.
   *
   * @returns {Promise<Object>} Aggregate results from all swarms
   */
  async executeAll() {
    const corrId = generateCorrelationId();
    logger.info("Orchestrator executeAll started", { correlationId: corrId });

    const startTime = Date.now();
    const swarmPromises = [];
    const activeSwarmKeys = [];

    for (const [key, swarm] of Object.entries(this.swarms)) {
      if (swarm.taskQueue.length > 0) {
        activeSwarmKeys.push(key);
        swarmPromises.push(
          swarm.drain().then(function(results) {
            return { swarmKey: key, results: results };
          })
        );
      }
    }

    const settled = await Promise.allSettled(swarmPromises);
    const totalDuration = Date.now() - startTime;

    // Aggregate results
    var allResults = [];
    var completed = 0;
    var failed = 0;

    for (var i = 0; i < settled.length; i++) {
      if (settled[i].status === "fulfilled") {
        var sr = settled[i].value;
        allResults = allResults.concat(sr.results);
        for (var j = 0; j < sr.results.length; j++) {
          if (sr.results[j].error) failed++;
          else completed++;
        }
      }
    }

    this._stats.totalTasksCompleted += completed;
    this._stats.totalTasksFailed += failed;

    // Store execution context in memory if available
    if (this.memory) {
      var execId = "orch-exec-" + corrId;
      var embedding = new Array(768).fill(0); // placeholder embedding
      embedding[0] = completed / Math.max(1, completed + failed); // success rate
      embedding[1] = totalDuration / 1000; // duration in seconds
      this.memory.store(execId, embedding, "Orchestrator execution: " + completed + " completed, " + failed + " failed", {
        type: "orchestrator-execution",
        correlationId: corrId,
        completed: completed,
        failed: failed,
        durationMs: totalDuration,
        swarmsUsed: activeSwarmKeys,
      });
    }

    logger.info("Orchestrator executeAll complete", {
      correlationId: corrId,
      swarmsActivated: activeSwarmKeys.length,
      completed: completed,
      failed: failed,
      durationMs: totalDuration,
    });

    return {
      correlationId: corrId,
      swarmsActivated: activeSwarmKeys,
      results: allResults,
      completed: completed,
      failed: failed,
      durationMs: totalDuration,
    };
  }

  /**
   * Get full orchestrator status.
   */
  status() {
    var swarmStatuses = {};
    var totalWorkers = 0;
    var totalIdle = 0;
    var totalWorking = 0;
    var totalQueued = 0;

    for (const [key, swarm] of Object.entries(this.swarms)) {
      var s = swarm.status();
      swarmStatuses[key] = s;
      totalWorkers += s.workers;
      totalIdle += s.idle;
      totalWorking += s.working;
      totalQueued += s.queued;
    }

    return {
      swarmCount: SWARM_COUNT,
      totalWorkers: totalWorkers,
      totalIdle: totalIdle,
      totalWorking: totalWorking,
      totalQueued: totalQueued,
      stats: Object.assign({}, this._stats),
      uptimeMs: Date.now() - this._stats.startedAt,
      swarms: swarmStatuses,
    };
  }

  /**
   * Get swarm by name.
   */
  getSwarm(key) {
    return this.swarms[key] || null;
  }

  /**
   * Wire a HeadyMemory instance (can be set after construction).
   */
  setMemory(memory) {
    this.memory = memory;
    logger.info("Memory wired to orchestrator");
  }

  /**
   * Wire a HeadyAutoContext instance (can be set after construction).
   */
  setAutoContext(autocontext) {
    this.autocontext = autocontext;
    logger.info("AutoContext wired to orchestrator");
  }
}

// ══════════════════════════════════════════════════════════════════
// Factory
// ══════════════════════════════════════════════════════════════════

function createOrchestrator(opts) {
  return new HeadySwarmOrchestrator(opts);
}

// ══════════════════════════════════════════════════════════════════
// Exports
// ══════════════════════════════════════════════════════════════════

module.exports = {
  HeadySwarmOrchestrator,
  ManagedSwarm,
  SwarmWorker,
  SWARM_CATALOG,
  SWARM_COUNT,
  createOrchestrator,
};
