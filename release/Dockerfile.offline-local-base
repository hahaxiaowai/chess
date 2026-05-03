FROM ghcr.io/nighttea/chess:latest

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY apps/server/dist ./apps/server/dist
COPY apps/web/dist ./apps/web/dist
COPY packages/game-core/dist ./packages/game-core/dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "const port = process.env.PORT || '3001'; fetch('http://127.0.0.1:' + port + '/healthz').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1));"]

CMD ["node", "apps/server/dist/index.js"]
