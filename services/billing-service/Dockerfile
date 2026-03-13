# ╔══════════════════════════════════════════════════════════════════╗
# ║   ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗™                  ║
# ║   ███████║█████╗  ███████║██║  ██║ ╚████╔╝                     ║
# ║   ██║  ██║███████╗██║  ██║██████╔╝   ██║                       ║
# ║   ✦ Built with Love by Heady™ — HeadySystems Inc. ✦           ║
# ║   ◈ Sacred Geometry v4.0 — φ (1.618) Governs All              ║
# ║   ◈ © 2026 HeadySystems Inc. — Eric Haywood, Founder           ║
# ╚══════════════════════════════════════════════════════════════════╝

# billing-service — Heady™ Service Container
# Multi-stage build, phi-scaled everything
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm ci --production

FROM node:22-alpine AS runtime
RUN apk add --no-cache tini
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production PORT=3400
EXPOSE 3400
USER node
HEALTHCHECK --interval=7s --timeout=4s --retries=3 \
  CMD wget -qO- http://localhost:3400/healthz || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "index.js"]
