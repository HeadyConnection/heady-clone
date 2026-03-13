# ╔══════════════════════════════════════════════════════════════════╗
# ║   ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗™                  ║
# ║   ███████║█████╗  ███████║██║  ██║ ╚████╔╝                     ║
# ║   ██║  ██║███████╗██║  ██║██████╔╝   ██║                       ║
# ║   ✦ Built with Love by Heady™ — HeadySystems Inc. ✦           ║
# ║   ◈ Sacred Geometry v4.0 — φ (1.618) Governs All              ║
# ║   ◈ © 2026 HeadySystems Inc. — Eric Haywood, Founder           ║
# ╚══════════════════════════════════════════════════════════════════╝

# HEADY_BRAND:BEGIN
# ╔══════════════════════════════════════════════════════════════════╗
# ║  ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗                     ║
# ║  ██║  ██║██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝                     ║
# ║  ███████║█████╗  ███████║██║  ██║ ╚████╔╝                      ║
# ║  ██╔══██║██╔══╝  ██╔══██║██║  ██║  ╚██╔╝                       ║
# ║  ██║  ██║███████╗██║  ██║██████╔╝   ██║                        ║
# ║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝    ╚═╝                        ║
# ║                                                                  ║
# ║  ∞ SACRED GEOMETRY ∞  Organic Systems · Breathing Interfaces    ║
# ║  FILE: Dockerfile   LAYER: root                                 ║
# ╚══════════════════════════════════════════════════════════════════╝
# HEADY_BRAND:END
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build || true

EXPOSE 3300

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3300/api/health || exit 1

CMD ["node", "heady-manager.js"]
