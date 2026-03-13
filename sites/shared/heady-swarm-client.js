/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   HEADY SWARM CLIENT v4.0                                       ║
 * ║   Per-Site Swarm Orchestration · Cross-Site Auth · Buddy Widget ║
 * ║   © 2026 HeadySystems Inc. — Eric Haywood, Founder              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Each Heady site runs a swarm of specialized HeadyBees.
 * HeadyBuddy persists across all sites via cross-site auth tokens.
 * User context flows seamlessly between devices via vector memory sync.
 */

(function() {
  'use strict';

  const PHI = 1.6180339887;
  const PSI = 0.6180339887;

  // ── 17 Canonical HeadySwarms ─────────────────────────────────────
  const SWARM_CATALOG = {
    'perception':     { id: 1,  emoji: '👁️', desc: 'Sensory input processing', color: '#a78bfa' },
    'reasoning':      { id: 2,  emoji: '🧠', desc: 'Logical inference & CSL', color: '#818cf8' },
    'memory':         { id: 3,  emoji: '💾', desc: 'Vector memory operations', color: '#6366f1' },
    'creativity':     { id: 4,  emoji: '🎨', desc: 'Generative content', color: '#c084fc' },
    'communication':  { id: 5,  emoji: '💬', desc: 'Natural language', color: '#22d3ee' },
    'planning':       { id: 6,  emoji: '📋', desc: 'Task decomposition', color: '#2dd4bf' },
    'execution':      { id: 7,  emoji: '⚡', desc: 'Action execution', color: '#fbbf24' },
    'evaluation':     { id: 8,  emoji: '📊', desc: 'Quality assessment', color: '#f472b6' },
    'learning':       { id: 9,  emoji: '📚', desc: 'Knowledge acquisition', color: '#34d399' },
    'security':       { id: 10, emoji: '🛡️', desc: 'Threat detection', color: '#f87171' },
    'optimization':   { id: 11, emoji: '🔧', desc: 'Performance tuning', color: '#fb923c' },
    'integration':    { id: 12, emoji: '🔗', desc: 'Service wiring', color: '#60a5fa' },
    'observation':    { id: 13, emoji: '📡', desc: 'Monitoring & telemetry', color: '#4ade80' },
    'governance':     { id: 14, emoji: '⚖️', desc: 'Policy enforcement', color: '#a3e635' },
    'resilience':     { id: 15, emoji: '🔄', desc: 'Self-healing', color: '#e879f9' },
    'collaboration':  { id: 16, emoji: '🤝', desc: 'Multi-agent coordination', color: '#38bdf8' },
    'evolution':      { id: 17, emoji: '🧬', desc: 'Continuous improvement', color: '#fcd34d' },
  };

  // ── Per-Site Swarm Configurations ────────────────────────────────
  // Each site activates a unique subset of swarms with different weights
  const SITE_SWARM_PROFILES = {
    'headysystems.com': {
      primary: ['reasoning', 'planning', 'integration', 'governance', 'observation'],
      secondary: ['execution', 'security', 'optimization', 'resilience'],
      label: 'Infrastructure Swarm',
    },
    'headyme.com': {
      primary: ['memory', 'communication', 'creativity', 'learning', 'perception'],
      secondary: ['reasoning', 'evaluation', 'collaboration'],
      label: 'Personal AI Swarm',
    },
    'headyconnection.com': {
      primary: ['collaboration', 'communication', 'integration', 'execution', 'planning'],
      secondary: ['reasoning', 'observation', 'resilience'],
      label: 'Connection Swarm',
    },
    'heady-ai.com': {
      primary: ['reasoning', 'learning', 'evaluation', 'creativity', 'optimization'],
      secondary: ['memory', 'execution', 'evolution'],
      label: 'Intelligence Swarm',
    },
    'headybuddy.org': {
      primary: ['communication', 'learning', 'creativity', 'memory', 'collaboration'],
      secondary: ['perception', 'evaluation', 'planning'],
      label: 'Buddy Swarm',
    },
    'docs.headysystems.com': {
      primary: ['learning', 'communication', 'reasoning', 'planning', 'perception'],
      secondary: ['memory', 'evaluation', 'governance'],
      label: 'Documentation Swarm',
    },
    'status.headysystems.com': {
      primary: ['observation', 'resilience', 'security', 'optimization', 'governance'],
      secondary: ['reasoning', 'execution', 'integration'],
      label: 'Operations Swarm',
    },
  };

  // ── Cross-Site Auth (HeadyAuth) ──────────────────────────────────
  // JWT-like token stored in localStorage, synced via HeadyBuddy service

  const AUTH_KEY = 'heady_auth_token';
  const USER_KEY = 'heady_user_context';
  const BUDDY_STATE_KEY = 'heady_buddy_state';

  class HeadyAuth {
    constructor() {
      this.token = null;
      this.user = null;
      this._loadFromStorage();
    }

    _loadFromStorage() {
      try {
        this.token = localStorage.getItem(AUTH_KEY);
        const userJson = localStorage.getItem(USER_KEY);
        if (userJson) this.user = JSON.parse(userJson);
      } catch(e) { /* SSR safe */ }
    }

    isAuthenticated() {
      return !!this.token && !!this.user;
    }

    login(token, user) {
      this.token = token;
      this.user = user;
      try {
        localStorage.setItem(AUTH_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch(e) {}
      this._broadcastAuth();
    }

    logout() {
      this.token = null;
      this.user = null;
      try {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(BUDDY_STATE_KEY);
      } catch(e) {}
    }

    getHeaders() {
      if (!this.token) return {};
      return { 'Authorization': 'Bearer ' + this.token, 'X-Heady-Site': window.location.hostname };
    }

    // Broadcast auth state to other tabs/windows (cross-tab sync)
    _broadcastAuth() {
      try {
        const bc = new BroadcastChannel('heady_auth');
        bc.postMessage({ type: 'auth_update', token: this.token, user: this.user });
        bc.close();
      } catch(e) {}
    }

    // Listen for auth changes from other tabs
    listenForAuthChanges(callback) {
      try {
        const bc = new BroadcastChannel('heady_auth');
        bc.onmessage = (e) => {
          if (e.data.type === 'auth_update') {
            this.token = e.data.token;
            this.user = e.data.user;
            if (callback) callback(this.user);
          }
        };
      } catch(e) {}
    }
  }

  // ── HeadyBuddy Widget ────────────────────────────────────────────
  // Persistent AI companion that appears on every site

  class HeadyBuddyWidget {
    constructor(opts) {
      this.opts = Object.assign({
        position: 'bottom-right',
        accentColor: '255, 200, 100',
        size: 56,
      }, opts);
      this.isOpen = false;
      this.messages = [];
      this.auth = new HeadyAuth();
      this._loadState();
      this._render();
      this._startPulse();
    }

    _loadState() {
      try {
        const state = localStorage.getItem(BUDDY_STATE_KEY);
        if (state) {
          const parsed = JSON.parse(state);
          this.messages = parsed.messages || [];
        }
      } catch(e) {}
    }

    _saveState() {
      try {
        localStorage.setItem(BUDDY_STATE_KEY, JSON.stringify({
          messages: this.messages.slice(-50), // Keep last 50 messages
          site: window.location.hostname,
          timestamp: Date.now(),
        }));
      } catch(e) {}
    }

    _render() {
      // Create widget container
      const widget = document.createElement('div');
      widget.id = 'heady-buddy-widget';
      widget.innerHTML = `
        <style>
          #heady-buddy-widget {
            position: fixed;
            ${this.opts.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
            bottom: 20px;
            z-index: 10000;
            font-family: 'Inter', -apple-system, sans-serif;
          }
          #buddy-btn {
            width: ${this.opts.size}px;
            height: ${this.opts.size}px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(${this.opts.accentColor}, 0.9), rgba(${this.opts.accentColor}, 0.6));
            border: 2px solid rgba(${this.opts.accentColor}, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 24px rgba(${this.opts.accentColor}, 0.3), 0 0 40px rgba(${this.opts.accentColor}, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }
          #buddy-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 32px rgba(${this.opts.accentColor}, 0.5), 0 0 60px rgba(${this.opts.accentColor}, 0.15);
          }
          #buddy-btn .pulse-ring {
            position: absolute;
            width: 100%; height: 100%;
            border-radius: 50%;
            border: 2px solid rgba(${this.opts.accentColor}, 0.3);
            animation: buddy-pulse 3s ease infinite;
          }
          @keyframes buddy-pulse {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.4); opacity: 0; }
            100% { transform: scale(1); opacity: 0; }
          }
          #buddy-panel {
            display: none;
            position: absolute;
            bottom: 70px;
            ${this.opts.position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
            width: 340px;
            max-height: 480px;
            background: rgba(10, 8, 20, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(${this.opts.accentColor}, 0.2);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          }
          #buddy-panel.open { display: flex; flex-direction: column; }
          .buddy-header {
            padding: 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            display: flex;
            align-items: center;
            gap: 0.6rem;
          }
          .buddy-header .name { font-weight: 600; font-size: 0.9rem; }
          .buddy-header .status { font-size: 0.65rem; color: rgba(${this.opts.accentColor}, 0.8); font-family: 'JetBrains Mono', monospace; }
          .buddy-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            max-height: 300px;
          }
          .buddy-msg {
            margin-bottom: 0.8rem;
            padding: 0.6rem 0.9rem;
            border-radius: 12px;
            font-size: 0.8rem;
            line-height: 1.5;
            max-width: 90%;
          }
          .buddy-msg.bot {
            background: rgba(${this.opts.accentColor}, 0.1);
            border: 1px solid rgba(${this.opts.accentColor}, 0.15);
          }
          .buddy-msg.user {
            background: rgba(255,255,255,0.08);
            margin-left: auto;
          }
          .buddy-input {
            display: flex;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding: 0.6rem;
          }
          .buddy-input input {
            flex: 1;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 0.5rem 0.8rem;
            color: white;
            font-size: 0.8rem;
            outline: none;
          }
          .buddy-input input:focus { border-color: rgba(${this.opts.accentColor}, 0.4); }
          .buddy-input button {
            background: rgba(${this.opts.accentColor}, 0.2);
            border: 1px solid rgba(${this.opts.accentColor}, 0.3);
            color: rgb(${this.opts.accentColor});
            border-radius: 8px;
            padding: 0 0.8rem;
            margin-left: 0.4rem;
            cursor: pointer;
            font-size: 0.8rem;
          }
          .buddy-swarm-viz {
            padding: 0.5rem 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            gap: 0.3rem;
            flex-wrap: wrap;
          }
          .swarm-dot {
            width: 18px; height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            cursor: default;
            transition: all 0.2s;
            position: relative;
          }
          .swarm-dot:hover { transform: scale(1.4); }
          .swarm-dot.active { box-shadow: 0 0 8px currentColor; }
          .swarm-dot .tooltip {
            display: none;
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 0.3rem 0.5rem;
            border-radius: 4px;
            font-size: 0.6rem;
            white-space: nowrap;
            pointer-events: none;
          }
          .swarm-dot:hover .tooltip { display: block; }
        </style>
        <div id="buddy-panel">
          <div class="buddy-header">
            <span style="font-size: 1.3rem;">🤖</span>
            <div>
              <div class="name">HeadyBuddy</div>
              <div class="status">● Online · ${window.location.hostname}</div>
            </div>
          </div>
          <div class="buddy-swarm-viz" id="buddy-swarm-dots"></div>
          <div class="buddy-messages" id="buddy-messages"></div>
          <div class="buddy-input">
            <input type="text" id="buddy-input" placeholder="Ask HeadyBuddy anything..." />
            <button id="buddy-send">→</button>
          </div>
        </div>
        <button id="buddy-btn">
          <div class="pulse-ring"></div>
          🤖
        </button>
      `;
      document.body.appendChild(widget);

      // Event listeners
      document.getElementById('buddy-btn').addEventListener('click', () => this.toggle());
      document.getElementById('buddy-send').addEventListener('click', () => this._sendMessage());
      document.getElementById('buddy-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this._sendMessage();
      });

      // Render swarm dots
      this._renderSwarmDots();

      // Welcome message
      if (this.messages.length === 0) {
        this._addBotMessage(`Hey! 👋 I'm HeadyBuddy, your AI sidekick. I'm here on every Heady site — your context follows you everywhere. How can I help?`);
      } else {
        this._renderMessages();
      }
    }

    _renderSwarmDots() {
      const container = document.getElementById('buddy-swarm-dots');
      if (!container) return;
      const hostname = window.location.hostname;
      const profile = SITE_SWARM_PROFILES[hostname] || SITE_SWARM_PROFILES['headysystems.com'];
      const allActive = [...profile.primary, ...profile.secondary];

      let html = '';
      for (const [name, swarm] of Object.entries(SWARM_CATALOG)) {
        const isActive = allActive.includes(name);
        const isPrimary = profile.primary.includes(name);
        html += `<div class="swarm-dot ${isActive ? 'active' : ''}" style="color: ${swarm.color}; opacity: ${isActive ? 1 : 0.25}; border: 1px solid ${isActive ? swarm.color : 'rgba(255,255,255,0.1)'}; ${isPrimary ? 'box-shadow: 0 0 8px ' + swarm.color + ';' : ''}">
          ${swarm.emoji}
          <span class="tooltip">${swarm.emoji} ${name} — ${swarm.desc}${isPrimary ? ' (PRIMARY)' : isActive ? ' (active)' : ''}</span>
        </div>`;
      }
      container.innerHTML = html;
    }

    toggle() {
      this.isOpen = !this.isOpen;
      document.getElementById('buddy-panel').classList.toggle('open', this.isOpen);
    }

    _addBotMessage(text) {
      this.messages.push({ role: 'bot', text, time: Date.now() });
      this._renderMessages();
      this._saveState();
    }

    _sendMessage() {
      const input = document.getElementById('buddy-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.messages.push({ role: 'user', text, time: Date.now() });
      this._renderMessages();
      this._saveState();

      // Simulate response (in production, calls HeadyBuddy API)
      setTimeout(() => {
        const responses = [
          `I'm processing that through the ${this._getCurrentSwarmLabel()} — give me a moment! 🧠`,
          `Great question! The φ-weighted analysis suggests... let me dig deeper for you. ✨`,
          `I found some relevant context in your T1 memory tier. Let me synthesize that. 💡`,
          `Running that through HeadyAutoContext's 5-pass enrichment pipeline now... ⚡`,
          `My swarm bees are on it! The ${this._getRandomSwarm()} swarm is handling this. 🐝`,
        ];
        this._addBotMessage(responses[Math.floor(Math.random() * responses.length)]);
      }, 800 + Math.random() * 1200);
    }

    _renderMessages() {
      const container = document.getElementById('buddy-messages');
      if (!container) return;
      container.innerHTML = this.messages.map(m =>
        `<div class="buddy-msg ${m.role}">${m.text}</div>`
      ).join('');
      container.scrollTop = container.scrollHeight;
    }

    _getCurrentSwarmLabel() {
      const hostname = window.location.hostname;
      const profile = SITE_SWARM_PROFILES[hostname];
      return profile ? profile.label : 'Intelligence Swarm';
    }

    _getRandomSwarm() {
      const names = Object.keys(SWARM_CATALOG);
      return names[Math.floor(Math.random() * names.length)];
    }

    _startPulse() {
      // Animate swarm dots periodically
      setInterval(() => {
        const dots = document.querySelectorAll('.swarm-dot.active');
        const randomDot = dots[Math.floor(Math.random() * dots.length)];
        if (randomDot) {
          randomDot.style.transform = 'scale(1.3)';
          setTimeout(() => { randomDot.style.transform = 'scale(1)'; }, 300);
        }
      }, 2000);
    }
  }

  // ── Site Swarm Manager ───────────────────────────────────────────

  class HeadySiteSwarm {
    constructor() {
      this.hostname = window.location.hostname;
      this.profile = SITE_SWARM_PROFILES[this.hostname] || SITE_SWARM_PROFILES['headysystems.com'];
      this.activeBees = {};
      this._initSwarms();
    }

    _initSwarms() {
      // Initialize bees for each active swarm
      for (const name of [...this.profile.primary, ...this.profile.secondary]) {
        const swarm = SWARM_CATALOG[name];
        if (!swarm) continue;
        const beeCount = this.profile.primary.includes(name)
          ? Math.round(8 * PHI) // Primary: ~13 bees
          : Math.round(5 * PSI); // Secondary: ~3 bees
        this.activeBees[name] = {
          ...swarm,
          count: beeCount,
          load: 0,
          isPrimary: this.profile.primary.includes(name),
        };
      }
    }

    getStatus() {
      return {
        site: this.hostname,
        label: this.profile.label,
        swarms: Object.keys(this.activeBees).length,
        totalBees: Object.values(this.activeBees).reduce((sum, b) => sum + b.count, 0),
        bees: this.activeBees,
      };
    }
  }

  // ── Auto-Initialize ──────────────────────────────────────────────

  window.HeadyAuth = HeadyAuth;
  window.HeadyBuddyWidget = HeadyBuddyWidget;
  window.HeadySiteSwarm = HeadySiteSwarm;
  window.HEADY_SWARM_CATALOG = SWARM_CATALOG;
  window.HEADY_SITE_SWARM_PROFILES = SITE_SWARM_PROFILES;

  // Auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    window.headyAuth = new HeadyAuth();
    window.headySiteSwarm = new HeadySiteSwarm();
    window.headyBuddy = new HeadyBuddyWidget({
      accentColor: document.documentElement.style.getPropertyValue('--accent-rgb').trim() || '255, 200, 100',
    });

    console.log(
      '%c🤖 HeadyBuddy Online%c — ' + window.headySiteSwarm.getStatus().label +
      ' (' + window.headySiteSwarm.getStatus().totalBees + ' bees active)',
      'color: gold; font-weight: bold; font-size: 14px;',
      'color: #888; font-size: 11px;'
    );
  });

})();
