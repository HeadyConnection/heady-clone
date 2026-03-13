/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   HEADY SACRED GEOMETRY ENGINE v4.0                             ║
 * ║   Wireframe · Gyroscopic · Cosmic · φ-Driven Animations        ║
 * ║   © 2026 HeadySystems Inc. — Eric Haywood, Founder              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Shared animation engine for all Heady sites.
 * Creates dense wireframe sacred geometry shapes with:
 * - Gyroscopic rotation on multiple axes
 * - Cosmic particle effects behind shapes
 * - Flowing thin wireframe lines
 * - φ-based timing and proportions
 * - Unique shape per site (configured via data attributes)
 */

(function() {
  'use strict';

  const PHI = 1.6180339887;
  const PSI = 0.6180339887;
  const TAU = Math.PI * 2;

  // ── Sacred Geometry Shape Generators ──────────────────────────────

  function generateIcosahedron(radius) {
    const t = PHI;
    const verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
    ].map(v => v.map(c => c * radius / Math.sqrt(1 + t * t)));
    const edges = [
      [0,1],[0,5],[0,7],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],
      [2,3],[2,4],[2,6],[2,10],[2,11],[3,4],[3,6],[3,8],[3,9],
      [4,5],[4,9],[4,11],[5,9],[5,11],[6,7],[6,8],[6,10],
      [7,8],[7,10],[8,9],[10,11]
    ];
    return { vertices: verts, edges };
  }

  function generateDodecahedron(radius) {
    const p = PHI, q = 1/PHI;
    const s = radius * 0.5;
    const verts = [
      [1,1,1],[1,1,-1],[1,-1,1],[1,-1,-1],
      [-1,1,1],[-1,1,-1],[-1,-1,1],[-1,-1,-1],
      [0,q,p],[0,q,-p],[0,-q,p],[0,-q,-p],
      [q,p,0],[q,-p,0],[-q,p,0],[-q,-p,0],
      [p,0,q],[p,0,-q],[-p,0,q],[-p,0,-q]
    ].map(v => v.map(c => c * s));
    const edges = [
      [0,8],[0,12],[0,16],[8,4],[8,10],[4,14],[4,18],
      [12,1],[12,14],[14,5],[1,9],[1,17],[9,5],[9,11],
      [5,19],[16,2],[16,17],[17,3],[2,10],[2,13],[10,6],
      [6,15],[6,18],[18,19],[19,7],[7,11],[7,15],[3,11],
      [3,13],[13,15]
    ];
    return { vertices: verts, edges };
  }

  function generateMerkaba(radius) {
    const h = radius * 0.866;
    const tetra1 = [
      [0, radius, 0], [-h, -radius*0.5, -radius*0.5],
      [h, -radius*0.5, -radius*0.5], [0, -radius*0.5, radius*0.7]
    ];
    const tetra2 = tetra1.map(v => [-v[0], -v[1], -v[2]]);
    const verts = [...tetra1, ...tetra2];
    const edges = [
      [0,1],[0,2],[0,3],[1,2],[1,3],[2,3],
      [4,5],[4,6],[4,7],[5,6],[5,7],[6,7],
      [0,4],[1,5],[2,6],[3,7],[0,5],[0,6],[1,4],[1,7],[2,4],[2,7],[3,5],[3,6]
    ];
    return { vertices: verts, edges };
  }

  function generateFlowerOfLife(radius, rings) {
    rings = rings || 3;
    const verts = [];
    const edges = [];
    const circlePoints = 24;
    let circleIdx = 0;

    function addCircle(cx, cy) {
      const start = verts.length;
      for (let i = 0; i < circlePoints; i++) {
        const a = (i / circlePoints) * TAU;
        verts.push([cx + Math.cos(a) * radius * 0.3, cy + Math.sin(a) * radius * 0.3, 0]);
        if (i > 0) edges.push([start + i - 1, start + i]);
      }
      edges.push([start + circlePoints - 1, start]);
    }

    addCircle(0, 0);
    for (let ring = 1; ring <= rings; ring++) {
      const count = ring * 6;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU;
        const r = ring * radius * 0.52;
        addCircle(Math.cos(a) * r, Math.sin(a) * r);
      }
    }
    return { vertices: verts, edges };
  }

  function generateMetatronsCube(radius) {
    const verts = [];
    const edges = [];
    // 13 circles of Metatron's Cube - center + 6 inner + 6 outer
    const centers = [[0, 0]];
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      centers.push([Math.cos(a) * radius * 0.4, Math.sin(a) * radius * 0.4]);
      centers.push([Math.cos(a) * radius * 0.8, Math.sin(a) * radius * 0.8]);
    }
    // Connect all centers to each other (dense wireframe)
    centers.forEach(c => verts.push([c[0], c[1], 0]));
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        edges.push([i, j]);
      }
    }
    // Add small circles around each center
    centers.forEach(c => {
      const pts = 16;
      const start = verts.length;
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * TAU;
        verts.push([c[0] + Math.cos(a) * radius * 0.12, c[1] + Math.sin(a) * radius * 0.12, 0]);
        if (i > 0) edges.push([start + i - 1, start + i]);
      }
      edges.push([start + pts - 1, start]);
    });
    return { vertices: verts, edges };
  }

  function generateTorusKnot(radius, p, q, segments) {
    p = p || 2; q = q || 3; segments = segments || 200;
    const verts = [];
    const edges = [];
    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * TAU;
      const r = radius * (0.5 + 0.2 * Math.cos(q * t));
      verts.push([
        r * Math.cos(p * t),
        r * Math.sin(p * t),
        radius * 0.3 * Math.sin(q * t)
      ]);
      if (i > 0) edges.push([i - 1, i]);
    }
    edges.push([segments - 1, 0]);
    // Add cross-links for wireframe density
    for (let i = 0; i < segments; i += 5) {
      edges.push([i, (i + segments / 3 | 0) % segments]);
      edges.push([i, (i + 2 * segments / 3 | 0) % segments]);
    }
    return { vertices: verts, edges };
  }

  function generateSriYantra(radius) {
    const verts = [];
    const edges = [];
    // 9 interlocking triangles
    for (let t = 0; t < 9; t++) {
      const angle = t * TAU / 9;
      const r = radius * (0.3 + t * 0.07);
      const flip = t % 2 === 0 ? 1 : -1;
      const p1 = [Math.cos(angle) * r, flip * r * 0.8, 0];
      const p2 = [Math.cos(angle + TAU/3) * r * 0.9, -flip * r * 0.4, 0];
      const p3 = [Math.cos(angle - TAU/3) * r * 0.9, -flip * r * 0.4, 0];
      const start = verts.length;
      verts.push(p1, p2, p3);
      edges.push([start, start+1], [start+1, start+2], [start+2, start]);
    }
    // Connect all triangle tips
    for (let i = 0; i < verts.length; i += 3) {
      for (let j = i + 3; j < verts.length; j += 3) {
        edges.push([i, j]);
      }
    }
    return { vertices: verts, edges };
  }

  const SHAPES = {
    icosahedron: generateIcosahedron,
    dodecahedron: generateDodecahedron,
    merkaba: generateMerkaba,
    flowerOfLife: generateFlowerOfLife,
    metatronsCube: generateMetatronsCube,
    torusKnot: generateTorusKnot,
    sriYantra: generateSriYantra,
  };

  // ── 3D Rotation & Projection ─────────────────────────────────────

  function rotateX(v, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
  }
  function rotateY(v, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c];
  }
  function rotateZ(v, a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [v[0]*c - v[1]*s, v[0]*s + v[1]*c, v[2]];
  }

  function project(v, cx, cy, fov) {
    const z = v[2] + fov;
    const scale = fov / Math.max(z, 0.1);
    return [cx + v[0] * scale, cy + v[1] * scale, z];
  }

  // ── Cosmic Particle System ───────────────────────────────────────

  class CosmicParticles {
    constructor(count, width, height) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 3 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          brightness: Math.random() * 0.5 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * TAU,
        });
      }
      this.width = width;
      this.height = height;
    }

    update(time) {
      for (const p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;
        p.currentBrightness = p.brightness * (0.5 + 0.5 * Math.sin(time * p.twinkleSpeed + p.twinklePhase));
      }
    }

    draw(ctx, accentColor) {
      for (const p of this.particles) {
        const alpha = p.currentBrightness || p.brightness;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fillStyle = `rgba(${accentColor}, ${alpha})`;
        ctx.fill();
      }
    }

    resize(width, height) {
      this.width = width;
      this.height = height;
    }
  }

  // ── Nebula / Cosmic Background ───────────────────────────────────

  function drawNebula(ctx, w, h, time, colors) {
    const grd = ctx.createRadialGradient(
      w * 0.5 + Math.sin(time * 0.0003) * w * 0.1,
      h * 0.5 + Math.cos(time * 0.0004) * h * 0.1,
      0,
      w * 0.5, h * 0.5, Math.max(w, h) * 0.7
    );
    grd.addColorStop(0, colors.nebulaCore || 'rgba(30, 10, 60, 0.03)');
    grd.addColorStop(0.5, colors.nebulaMid || 'rgba(10, 5, 40, 0.02)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Secondary nebula
    const grd2 = ctx.createRadialGradient(
      w * 0.3 + Math.cos(time * 0.0002) * w * 0.15,
      h * 0.7 + Math.sin(time * 0.0003) * h * 0.1,
      0,
      w * 0.3, h * 0.7, Math.max(w, h) * 0.5
    );
    grd2.addColorStop(0, colors.nebula2Core || 'rgba(60, 10, 30, 0.02)');
    grd2.addColorStop(1, 'transparent');
    ctx.fillStyle = grd2;
    ctx.fillRect(0, 0, w, h);
  }

  // ── Main Sacred Geometry Renderer ────────────────────────────────

  class HeadySacredEngine {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.config = Object.assign({
        shape: 'icosahedron',
        radius: 180,
        wireColor: '180, 160, 255',
        accentColor: '255, 200, 100',
        cosmicColor: '200, 180, 255',
        bgColor: '#08060f',
        nebulaCore: 'rgba(30, 10, 60, 0.03)',
        nebulaMid: 'rgba(10, 5, 40, 0.02)',
        nebula2Core: 'rgba(60, 10, 30, 0.02)',
        wireOpacity: 0.35,
        wireWidth: 0.6,
        rotationSpeed: 0.0004,
        gyroAmplitude: 0.3,
        particleCount: 150,
        fov: 500,
        glowIntensity: 15,
      }, config);

      this.time = 0;
      this.running = false;
      this.shape = null;
      this.particles = null;
      this._resize();
      this._initShape();
      this._initParticles();
      window.addEventListener('resize', () => this._resize());
    }

    _resize() {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = this.canvas.offsetWidth * dpr;
      this.canvas.height = this.canvas.offsetHeight * dpr;
      this.ctx.scale(dpr, dpr);
      this.w = this.canvas.offsetWidth;
      this.h = this.canvas.offsetHeight;
      if (this.particles) this.particles.resize(this.w, this.h);
    }

    _initShape() {
      const generator = SHAPES[this.config.shape] || SHAPES.icosahedron;
      this.shape = generator(this.config.radius);
    }

    _initParticles() {
      this.particles = new CosmicParticles(this.config.particleCount, this.w, this.h);
    }

    start() {
      this.running = true;
      this._animate();
    }

    stop() {
      this.running = false;
    }

    _animate() {
      if (!this.running) return;
      this.time++;
      this._draw();
      requestAnimationFrame(() => this._animate());
    }

    _draw() {
      const ctx = this.ctx;
      const w = this.w;
      const h = this.h;
      const t = this.time;
      const cfg = this.config;

      // Clear with slight trail effect
      ctx.fillStyle = cfg.bgColor;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      // Nebula background
      drawNebula(ctx, w, h, t, cfg);

      // Cosmic particles
      this.particles.update(t);
      this.particles.draw(ctx, cfg.cosmicColor);

      // Gyroscopic rotation angles (φ-based speeds for incommensurable ratios)
      const rx = t * cfg.rotationSpeed * PHI + Math.sin(t * 0.001) * cfg.gyroAmplitude;
      const ry = t * cfg.rotationSpeed + Math.cos(t * 0.0013 * PHI) * cfg.gyroAmplitude;
      const rz = t * cfg.rotationSpeed * PSI + Math.sin(t * 0.0007) * cfg.gyroAmplitude * 0.5;

      // Transform vertices
      const cx = w / 2;
      const cy = h / 2;
      const projected = this.shape.vertices.map(v => {
        let p = rotateX(v, rx);
        p = rotateY(p, ry);
        p = rotateZ(p, rz);
        return project(p, cx, cy, cfg.fov);
      });

      // Draw edges with depth-based opacity
      ctx.lineWidth = cfg.wireWidth;
      for (const [i, j] of this.shape.edges) {
        const p1 = projected[i];
        const p2 = projected[j];
        if (!p1 || !p2) continue;

        const avgDepth = (p1[2] + p2[2]) / 2;
        const depthFade = Math.max(0.05, Math.min(1, (cfg.fov - avgDepth + cfg.radius) / (cfg.fov + cfg.radius)));
        const alpha = cfg.wireOpacity * depthFade;

        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.strokeStyle = `rgba(${cfg.wireColor}, ${alpha})`;
        ctx.stroke();
      }

      // Glow effect at center
      const glowGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, cfg.glowIntensity * 8);
      glowGrd.addColorStop(0, `rgba(${cfg.accentColor}, 0.08)`);
      glowGrd.addColorStop(0.5, `rgba(${cfg.accentColor}, 0.03)`);
      glowGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrd;
      ctx.fillRect(0, 0, w, h);

      // Vertex glow dots
      ctx.shadowBlur = cfg.glowIntensity;
      ctx.shadowColor = `rgba(${cfg.accentColor}, 0.6)`;
      for (const p of projected) {
        if (!p) continue;
        const depthFade = Math.max(0.1, Math.min(1, (cfg.fov - p[2] + cfg.radius) / (cfg.fov + cfg.radius)));
        const size = 1.5 * depthFade;
        ctx.beginPath();
        ctx.arc(p[0], p[1], size, 0, TAU);
        ctx.fillStyle = `rgba(${cfg.accentColor}, ${0.4 * depthFade})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }

  // ── Real-Time Data Visualization Components ──────────────────────

  class PhiWaveform {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({ color: '180, 160, 255', waves: 3, speed: 0.02 }, opts);
      this.time = 0;
    }

    draw() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (let wave = 0; wave < this.opts.waves; wave++) {
        const freq = (wave + 1) * PHI;
        const amp = h * 0.3 / (wave + 1);
        const alpha = 0.4 / (wave * 0.5 + 1);
        ctx.beginPath();
        for (let x = 0; x < w; x++) {
          const y = h/2 + Math.sin(x * 0.01 * freq + this.time * (wave + 1)) * amp
            + Math.sin(x * 0.007 * PSI + this.time * PHI) * amp * 0.3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(${this.opts.color}, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      this.time += this.opts.speed;
    }
  }

  class DataPulseRing {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({ color: '255, 200, 100', segments: 21, innerRadius: 0.3, outerRadius: 0.45 }, opts);
      this.data = new Array(this.opts.segments).fill(0);
      this.time = 0;
    }

    setData(values) {
      for (let i = 0; i < this.opts.segments && i < values.length; i++) {
        this.data[i] = values[i];
      }
    }

    draw() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = w/2, cy = h/2;
      const maxR = Math.min(w, h) / 2;

      ctx.clearRect(0, 0, w, h);

      const segAngle = TAU / this.opts.segments;

      for (let i = 0; i < this.opts.segments; i++) {
        const angle = i * segAngle - Math.PI/2;
        const val = this.data[i] || (0.3 + 0.4 * Math.sin(this.time * 0.03 + i * PHI));
        const innerR = maxR * this.opts.innerRadius;
        const outerR = maxR * (this.opts.innerRadius + val * (this.opts.outerRadius - this.opts.innerRadius));

        ctx.beginPath();
        ctx.arc(cx, cy, innerR, angle, angle + segAngle * 0.85);
        ctx.arc(cx, cy, outerR, angle + segAngle * 0.85, angle, true);
        ctx.closePath();
        ctx.fillStyle = `rgba(${this.opts.color}, ${0.15 + val * 0.4})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${this.opts.color}, ${0.3 + val * 0.5})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * this.opts.innerRadius * 0.9, 0, TAU);
      ctx.strokeStyle = `rgba(${this.opts.color}, 0.2)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      this.time++;
    }
  }

  // ── Expose globally ──────────────────────────────────────────────

  window.HeadySacredEngine = HeadySacredEngine;
  window.HeadyPhiWaveform = PhiWaveform;
  window.HeadyDataPulseRing = DataPulseRing;
  window.HeadyShapes = SHAPES;
  window.HEADY_PHI = PHI;
  window.HEADY_PSI = PSI;

})();
