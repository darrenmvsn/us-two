# syntax=docker/dockerfile:1
#
# Us Two's production image. Build context is the repo root:
#   docker build -f deploy/oracle/Dockerfile .
# deploy.sh builds it on the Oracle VM itself, so it comes out arm64 there;
# every base image here is multi-arch. Ported from DesignLoop's kit.
#
# Targets:
#   runner (default)  the Next.js standalone server, no dev tools
#   tools             full node_modules + Prisma CLI, for `prisma migrate deploy`

ARG NODE_IMAGE=node:22-bookworm-slim

# --- deps: node_modules exactly as package-lock.json pins them ---------------
FROM ${NODE_IMAGE} AS deps
# Prisma's engines link against OpenSSL and detect its version by running
# `openssl`; the slim image ships neither the binary nor the CA bundle.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# `postinstall` runs `prisma generate`, which needs the schema.
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci --no-audit --no-fund

# --- build: `next build` with output: "standalone" (next.config.ts) ----------
FROM deps AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

# --- tools: migrations --------------------------------------------------------
FROM deps AS tools
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --chown=node:node prisma ./prisma
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# --- runner: what serves traffic ---------------------------------------------
FROM ${NODE_IMAGE} AS runner
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
# /api/health answers 200 when Postgres is reachable and 503 when not.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "server.js"]
