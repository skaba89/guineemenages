# Guineamanager Production Dockerfile
# Simplified build without complex multi-stage setup

FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ===== COPY ENTRYPOINT FIRST =====
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh && \
    chown nextjs:nodejs /docker-entrypoint.sh

# ===== COPY PACKAGE FILES =====
COPY package.json ./
COPY backend/package.json ./backend/

# ===== CLEAN INSTALL (no cache) =====
WORKDIR /app
RUN rm -rf node_modules package-lock.json && \
    npm install --legacy-peer-deps --no-audit --no-fund

WORKDIR /app/backend
RUN rm -rf node_modules package-lock.json && \
    npm install --legacy-peer-deps --no-audit --no-fund

# ===== COPY SOURCE CODE =====
WORKDIR /app
COPY next.config.ts tsconfig.json tailwind.config.ts postcss.config.mjs components.json ./
COPY src ./src
COPY public ./public
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma
COPY backend/tsconfig.json ./backend/

# ===== BUILD BACKEND =====
WORKDIR /app/backend
RUN rm -rf dist && \
    npx prisma generate && \
    npx tsc --noEmitOnError false || true

# ===== BUILD FRONTEND =====
WORKDIR /app
ENV NEXT_PUBLIC_API_URL=/api
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN npm run build

# ===== SETUP PERMISSIONS =====
RUN mkdir -p /app/data /app/uploads && \
    chown -R nextjs:nodejs /app/data /app/uploads /app/backend/dist

# ===== SWITCH USER =====
USER nextjs

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
