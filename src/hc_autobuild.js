/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗™                  ║
 * ║   ███████║█████╗  ███████║██║  ██║ ╚████╔╝                     ║
 * ║   ██║  ██║███████╗██║  ██║██████╔╝   ██║                       ║
 * ║   ✦ Built with Love by Heady™ — HeadySystems Inc. ✦           ║
 * ║   ◈ Sacred Geometry v4.0 · φ (1.618) · © 2026 Eric Haywood    ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

const logger = require('../logger');
// HEADY_BRAND:BEGIN
// HEADY SYSTEMS :: SACRED GEOMETRY
// FILE: src/hc_autobuild.js
// LAYER: backend/src
// 
//         _   _  _____    _    ____   __   __
//        | | | || ____|  / \  |  _ \ \ \ / /
//        | |_| ||  _|   / _ \ | | | | \ V / 
//        |  _  || |___ / ___ \| |_| |  | |  
//        |_| |_||_____/_/   \_\____/   |_|  
// 
//    Sacred Geometry :: Organic Systems :: Breathing Interfaces
// HEADY_BRAND:END

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

logger.info('\n🔨 Heady AutoBuild - Sacred Geometry Build System with Codemap Optimization\n');

// Worktree base path (Windsurf worktree mode)
const WORKTREE_BASE = 'C:\\Users\\erich\\.windsurf\\worktrees';

  const userProfile = process.env.USERPROFILE || process.env.HOME;
  if (!userProfile) return null;
  return path.join(userProfile, '.windsurf', 'worktrees');
})();

function discoverWorktrees() {
  const roots = [process.cwd()];

  if (WORKTREE_BASE && fs.existsSync(WORKTREE_BASE)) {
    const namespaces = fs.readdirSync(WORKTREE_BASE, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(WORKTREE_BASE, d.name));

  const userProfile = process.env.USERPROFILE || process.env.HOME;
  if (!userProfile) return null;
  return path.join(userProfile, '.windsurf', 'worktrees');
})();

function discoverWorktrees() {
  const roots = [process.cwd()];

  if (WORKTREE_BASE && fs.existsSync(WORKTREE_BASE)) {
    const namespaces = fs.readdirSync(WORKTREE_BASE, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => path.join(WORKTREE_BASE, d.name));

    namespaces.forEach(nsPath => {
      let children = [];
      try {
        children = fs.readdirSync(nsPath, { withFileTypes: true })
          .filter(d => d.isDirectory())
          .map(d => path.join(nsPath, d.name));
      } catch {
        children = [];
      }

      children.forEach(childPath => {
        const base = path.basename(childPath);
        if (base.includes('-') || fs.existsSync(path.join(childPath, '.git'))) {
          roots.push(childPath);
        }
      });
    });
  }
  
  return worktrees;

  return [...new Set(roots.filter(p => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isDirectory();
    } catch {
      return false;
    }
  }))];
}

// Scan for sub-projects with package.json
function findBuildableProjects(baseDir, depth = 2) {
  const projects = [];
  
  function scan(dir, currentDepth) {
    if (currentDepth > depth) return;
    
    const packageJson = path.join(dir, 'package.json');
    if (fs.existsSync(packageJson)) {
      projects.push(dir);
    }
    
    // Scan subdirectories
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach(entry => {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scan(path.join(dir, entry.name), currentDepth + 1);
        }
      });
    } catch (err) {
      // Skip inaccessible directories
// Optimized build order based on dependency analysis from codemap
const repos = [
  'C:\\Users\\erich\\Heady',
  'C:\\Users\\erich\\CascadeProjects\\HeadyMonorepo', 
  'C:\\Users\\erich\\CascadeProjects\\HeadyEcosystem',
];

// Build metrics tracking
const buildMetrics = {
  startTime: Date.now(),
  reposBuilt: 0,
  dependenciesInstalled: 0,
  errors: [],
  optimizations: []
};

function analyzeDependencies(repo) {
// Add sub-projects if they exist
const subProjects = ['backend', 'frontend'];
subProjects.forEach(sub => {
  const subPath = path.join(process.cwd(), sub);
  const fs = require('fs');
  if (fs.existsSync(path.join(subPath, 'package.json'))) {
    repos.push(subPath);
  }
});

repos.forEach(repo => {
  const packageJson = path.join(repo, 'package.json');
  if (!fs.existsSync(packageJson)) return null;
  
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    return {
      name: pkg.name || path.basename(repo),
      dependencies: Object.keys(pkg.dependencies || {}),
      devDependencies: Object.keys(pkg.devDependencies || {}),
      scripts: pkg.scripts || {},
      hasBuildScript: !!(pkg.scripts && (pkg.scripts.build || pkg.scripts.start))
    };
  } catch (error) {
    logger.info(`⚠️  ${repo} - Could not analyze package.json`);
    return null;
  }
}

function generateBuildOrder(repos) {
  const analysis = repos.map(repo => ({
    path: repo,
    info: analyzeDependencies(repo)
  })).filter(r => r.info);
  
  // Prioritize repos with build scripts and fewer dependencies
  return analysis.sort((a, b) => {
    const aScore = a.info.hasBuildScript ? 10 : 0;
    const bScore = b.info.hasBuildScript ? 10 : 0;
    const aDeps = a.info.dependencies.length;
    const bDeps = b.info.dependencies.length;
    
    return (bScore - aScore) || (aDeps - bDeps);
  });
}

function runOptimizedBuild(repo, info) {
  logger.info(`📦 Building: ${repo}`);
  logger.info(`   Name: ${info.name}`);
  logger.info(`   Dependencies: ${info.dependencies.length}`);
  logger.info(`   Dev Dependencies: ${info.devDependencies.length}`);
  logger.info(`   Build Scripts: ${Object.keys(info.scripts).join(', ')}`);
  
  try {
    // Use pnpm for faster, more efficient installs
    execSync('pnpm install', { cwd: repo, stdio: 'inherit' });
    buildMetrics.dependenciesInstalled++;
    buildMetrics.reposBuilt++;
    
    // Run build script if available
    if (info.scripts.build) {
      logger.info(`   🏗️  Running build script...`);
      execSync('pnpm run build', { cwd: repo, stdio: 'inherit' });
      buildMetrics.optimizations.push(`Built ${info.name} with custom script`);
    } else if (info.scripts.start) {
      logger.info(`   🚀 Using start script as build alternative...`);
      buildMetrics.optimizations.push(`Used start script for ${info.name}`);
    }
    
    logger.info(`✅ ${repo} - Complete\n`);
    return true;
  } catch (error) {
    const errorMsg = `${repo} - Build failed: ${error.message}`;
    logger.info(`❌ ${errorMsg}\n`);
    buildMetrics.errors.push(errorMsg);
    return false;
  }
  
  scan(baseDir, 0);
  return projects;
}

// Build a single project
function buildProject(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return { success: false, reason: 'No package.json' };
  }
  
  logger.info(`📦 Building: ${projectPath}`);
  
  try {
    // Read package.json to check for build scripts
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Install dependencies
    // SECURITY: Avoid shell: true. Try frozen-lockfile first, fall back to regular install.
    try {
      execSync('pnpm install --frozen-lockfile', { cwd: projectPath, stdio: 'inherit' });
    } catch (_) {
      execSync('pnpm install', { cwd: projectPath, stdio: 'inherit' });
    }
    
    // Run build if available
    if (pkg.scripts && pkg.scripts.build) {
      logger.info(`  🔧 Running build script...`);
      execSync('pnpm run build', { cwd: projectPath, stdio: 'inherit' });
    }
    }
    
    logger.info(`✅ ${repo} - Complete\n`);
    return true;
  } catch (error) {
    const errorMsg = `${repo} - Build failed: ${error.message}`;
    logger.info(`❌ ${errorMsg}\n`);
    buildMetrics.errors.push(errorMsg);
    return false;
  }
  
  scan(baseDir, 0);
  return projects;
}

// Build a single project
function buildProject(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return { success: false, reason: 'No package.json' };
  }
  
  logger.info(`📦 Building: ${projectPath}`);
  
  try {
    // Read package.json to check for build scripts
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Install dependencies
    // SECURITY: Avoid shell: true. Try frozen-lockfile first, fall back to regular install.
    try {
      execSync('pnpm install --frozen-lockfile', { cwd: projectPath, stdio: 'inherit' });
    } catch (_) {
      execSync('pnpm install', { cwd: projectPath, stdio: 'inherit' });
    }
    
    // Run build if available
    if (pkg.scripts && pkg.scripts.build) {
      logger.info(`  🔧 Running build script...`);
      execSync('pnpm run build', { cwd: projectPath, stdio: 'inherit' });
    }
    
    logger.info(`✅ ${path.basename(projectPath)} - Build complete\n`);
    return { success: true };
  } catch (error) {
    logger.info(`⚠️  ${path.basename(projectPath)} - Build failed: ${error.message}\n`);
    return { success: false, reason: error.message };
  }
}

// Main execution
const worktrees = discoverWorktrees();
logger.info(`🔍 Discovered ${worktrees.length} worktrees:\n`);
worktrees.forEach(wt => logger.info(`   • ${wt}`));
logger.info('');

const allProjects = [];
worktrees.forEach(wt => {
  const projects = findBuildableProjects(wt);
  allProjects.push(...projects);
});

// Deduplicate
const uniqueProjects = [...new Set(allProjects)];
logger.info(`📋 Found ${uniqueProjects.length} buildable projects\n`);

const results = { success: 0, failed: 0 };
uniqueProjects.forEach(project => {
  const result = buildProject(project);
  if (result.success) {
    results.success++;
  } else {
    results.failed++;
  }
});

logger.info('═'.repeat(60));
logger.info('✅ Heady AutoBuild Complete!');
logger.info(`   Success: ${results.success} | Failed: ${results.failed}`);
logger.info('═'.repeat(60) + '\n');
}

function generateBuildReport() {
  const duration = Date.now() - buildMetrics.startTime;
  const report = `
╔════════════════════════════════════════════════════════════════╗
║                    🏗️ HEADO AUTOBUILD REPORT                 ║
╠════════════════════════════════════════════════════════════════╣
║ Duration: ${(duration / 1000).toFixed(2)}s                               ║
║ Repos Built: ${buildMetrics.reposBuilt}/${repos.length}                             ║
║ Dependencies Installed: ${buildMetrics.dependenciesInstalled}                       ║
║ Errors: ${buildMetrics.errors.length}                                      ║
║ Optimizations: ${buildMetrics.optimizations.length}                              ║
╚════════════════════════════════════════════════════════════════╝

${buildMetrics.optimizations.length > 0 ? 
  '🚀 OPTIMIZATIONS APPLIED:\n' + buildMetrics.optimizations.map(opt => `   • ${opt}`).join('\n') + '\n' : 
  ''}${
  buildMetrics.errors.length > 0 ? 
  '⚠️  ERRORS ENCOUNTERED:\n' + buildMetrics.errors.map(err => `   • ${err}`).join('\n') + '\n' : 
  ''
}
📊 Codemap insights: Build order optimized based on dependency analysis
🎯 Next step: Run HeadySync (hc -a hs) to synchronize changes
`;
  
  logger.info(report);
  
  // Save report to logs
  const reportPath = path.join(__dirname, '..', 'logs', 'autobuild-report.json');
  const logDir = path.dirname(reportPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    metrics: buildMetrics,
    duration: duration,
    report: report
  }, null, 2));
  
  logger.info(`📊 Detailed report saved to: ${reportPath}\n`);
}

// Main execution
logger.info('🔍 Analyzing repository dependencies for optimal build order...\n');
const buildOrder = generateBuildOrder(repos);

logger.info('📋 Optimized Build Order:');
buildOrder.forEach((repo, index) => {
  logger.info(`   ${index + 1}. ${repo.info.name} (${repo.path})`);
});
logger.info('');

buildOrder.forEach(({ path: repo, info }) => {
  runOptimizedBuild(repo, info);
});

generateBuildReport();
