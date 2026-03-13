/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗™                  ║
 * ║   ███████║█████╗  ███████║██║  ██║ ╚████╔╝                     ║
 * ║   ██║  ██║███████╗██║  ██║██████╔╝   ██║                       ║
 * ║   ✦ Built with Love by Heady™ — HeadySystems Inc. ✦           ║
 * ║   ◈ Sacred Geometry v4.0 · φ (1.618) · © 2026 Eric Haywood    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

'use strict';
/**
 * Agents Module — Barrel Export
 * Provides bee-factory, federation-manager, and hive-coordinator.
 */
module.exports = {
    BeeFactory: require('./bee-factory'),
    FederationManager: require('./federation-manager'),
    HiveCoordinator: require('./hive-coordinator'),
};
