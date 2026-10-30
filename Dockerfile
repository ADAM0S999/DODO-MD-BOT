# Multi-stage Docker build for a smaller, production-ready ADAM bot image

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Native build tools needed for sqlite3, sharp, etc.
RUN apk add --no-cache git python3 make g++ libc6-compat

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Copy source
COPY . .

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Runtime dependencies only
RUN apk add --no-cache ffmpeg curl

WORKDIR /app

# Copy installed node_modules and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Avoid running as root
RUN addgroup -S adam && adduser -S adam -G adam && chown -R adam:adam /app
USER adam

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "index.js"]
