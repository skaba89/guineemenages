# GuinéaManager ERP - Production Dockerfile
# Optimized for deployment

FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl curl sqlite

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# ===== COPY ENTRYPOINT =====
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh && \
    chown nextjs:nodejs /docker-entrypoint.sh

# ===== COPY PACKAGE FILES =====
COPY package.json ./
COPY backend/package.json ./backend/

# ===== INSTALL DEPENDENCIES =====
WORKDIR /app
RUN npm install --legacy-peer-deps --no-audit --no-fund

WORKDIR /app/backend
RUN npm install --legacy-peer-deps --no-audit --no-fund

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
ENV DATABASE_URL="file:/app/data/prod.db"
RUN npx prisma generate && \
    npx tsc --skipLibCheck 2>&1 || true

# ===== BUILD FRONTEND =====
WORKDIR /app
ENV NEXT_PUBLIC_API_URL=/api
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN npm run build

# ===== SETUP PERMISSIONS =====
RUN mkdir -p /app/data /app/uploads && \
    chown -R nextjs:nodejs /app

# ===== SWITCH USER =====
USER nextjs

# ===== ENVIRONMENT =====
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api
ENV BACKEND_URL="http://localhost:3001"
ENV DATABASE_URL="file:/app/data/prod.db"
ENV JWT_SECRET="guineamanager-production-jwt-secret-key-2024-secure-change-me"
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
