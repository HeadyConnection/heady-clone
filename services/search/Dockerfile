# ╔══════════════════════════════════════════════════════════════════╗
# ║   ██╗  ██╗███████╗ █████╗ ██████╗ ██╗   ██╗™                  ║
# ║   ███████║█████╗  ███████║██║  ██║ ╚████╔╝                     ║
# ║   ██║  ██║███████╗██║  ██║██████╔╝   ██║                       ║
# ║   ✦ Built with Love by Heady™ — HeadySystems Inc. ✦           ║
# ║   ◈ Sacred Geometry v4.0 — φ (1.618) Governs All              ║
# ║   ◈ © 2026 HeadySystems Inc. — Eric Haywood, Founder           ║
# ╚══════════════════════════════════════════════════════════════════╝

FROM node:20-slim
WORKDIR /app
COPY shared/ ./shared/
COPY services/search/package*.json ./services/search/
RUN cd services/search && npm ci --production
COPY services/search/ ./services/search/
COPY src/ ./src/
ENV NODE_ENV=production SERVICE_NAME=search SERVICE_PORT=3364
RUN groupadd -r heady && useradd -r -g heady heady && chown -R heady:heady /app
USER heady
EXPOSE 3364
CMD ["node", "services/search/index.js"]
