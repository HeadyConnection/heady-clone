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

let pino;
try { pino = require("pino"); } catch { pino = null; }

function generateCorrelationId() {
  return "hdy_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function createLogger(name, opts) {
  opts = opts || {};
  const level = process.env.LOG_LEVEL || opts.level || "info";

  if (pino) {
    return pino({
      name: "heady:" + name,
      level: level,
      base: { service: name, version: process.env.HEADY_VERSION || "4.0.0" },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: { level: function(label) { return { level: label }; } },
    });
  }

  // Fallback structured console logger
  var levels = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 };
  var minLevel = levels[level] || 30;

  function log(lvl, msg, extra) {
    if ((levels[lvl] || 30) < minLevel) return;
    var entry = Object.assign({
      level: lvl, service: name, msg: msg, ts: new Date().toISOString()
    }, extra || {});
    var method = (lvl === "error" || lvl === "fatal") ? "error" : lvl === "warn" ? "warn" : "log";
    console[method](JSON.stringify(entry));
  }

  return {
    trace: function(msg, extra) { log("trace", msg, extra); },
    debug: function(msg, extra) { log("debug", msg, extra); },
    info:  function(msg, extra) { log("info", msg, extra); },
    warn:  function(msg, extra) { log("warn", msg, extra); },
    error: function(msg, extra) { log("error", msg, extra); },
    fatal: function(msg, extra) { log("fatal", msg, extra); },
    child: function(bindings) { return createLogger(name + ":" + (bindings.component || "child"), opts); },
  };
}

function withCorrelation(fn) {
  var corrId = generateCorrelationId();
  return { correlationId: corrId, result: fn(corrId) };
}

module.exports = { createLogger: createLogger, withCorrelation: withCorrelation, generateCorrelationId: generateCorrelationId };
