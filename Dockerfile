# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy prisma schema so relative path "../prisma/schema.prisma" resolves correctly
COPY prisma ./prisma

# Copy backend source
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/src ./backend/src

WORKDIR /workspace/backend

RUN npm ci

# Generate Prisma client (reads ../prisma/schema.prisma → /workspace/prisma/schema.prisma)
RUN npx prisma generate

# Compile TypeScript → dist/
RUN npm run build

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

# Python 3 for direct code execution (no Docker-in-Docker on Railway)
RUN apt-get update && apt-get install -y python3 openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Prisma schema (needed for prisma migrate deploy at startup)
COPY --from=builder /workspace/prisma ./prisma

WORKDIR /workspace/backend

# Compiled JS + deps + package.json
COPY --from=builder /workspace/backend/dist ./dist
COPY --from=builder /workspace/backend/node_modules ./node_modules
COPY --from=builder /workspace/backend/package.json ./package.json

# Python runner script — placed at /workspace/backend/runner.py
# docker.runner.ts resolves __dirname/../../.. which equals this path in prod
COPY backend/docker/runner.py ./runner.py

# Startup script
COPY backend/startup.sh ./startup.sh
RUN chmod +x ./startup.sh

EXPOSE 5000

CMD ["./startup.sh"]
