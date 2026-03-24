# Guineamanager Production Dockerfile
# With automatic database initialization

FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat openssl curl sqlite

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
# Ensure clean build - remove any existing dist
RUN rm -rf dist tsconfig.tsbuildinfo 2>/dev/null || true
# Set DATABASE_URL for prisma generate (will be overridden at runtime)
ENV DATABASE_URL="file:/app/data/prod.db"
RUN npx prisma generate
# Force TypeScript recompilation
RUN npx tsc --skipLibCheck 2>&1 || true

# ===== BUILD FRONTEND =====
WORKDIR /app
ENV NEXT_PUBLIC_API_URL=/api
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN npm run build

# ===== CREATE INIT SCRIPT =====
WORKDIR /app/backend
RUN cat > init-db.js << 'INITEOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL || 'file:/app/data/prod.db';
  console.log('📊 Connecting to database:', dbUrl);

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } }
  });

  try {
    console.log('🔧 Initializing database...');

    // Test connection
    await prisma.$connect();
    console.log('  ✓ Database connected');

    // Create plans
    const plans = [
      { id: 'petite', nom: 'PETITE', prixMensuel: 0, maxEmployes: 5, maxUtilisateurs: 2 },
      { id: 'moyenne', nom: 'MOYENNE', prixMensuel: 5000000, maxEmployes: 25, maxUtilisateurs: 5 },
      { id: 'grande', nom: 'GRANDE', prixMensuel: 15000000, maxEmployes: 100, maxUtilisateurs: 15 },
      { id: 'enterprise', nom: 'ENTERPRISE', prixMensuel: 50000000, maxEmployes: -1, maxUtilisateurs: -1 }
    ];

    for (const plan of plans) {
      await prisma.planAbonnement.upsert({
        where: { id: plan.id },
        update: plan,
        create: plan
      });
    }
    console.log('  ✓ Plans created');

    // Create demo company
    const company = await prisma.company.upsert({
      where: { id: 'demo-company-001' },
      update: {},
      create: {
        id: 'demo-company-001',
        nom: 'Entreprise Demo SARL',
        email: 'demo@guineamanager.com',
        telephone: '+224 624 00 00 00',
        adresse: 'Conakry, Guinée',
        ville: 'Conakry',
        pays: 'Guinée',
        codePays: 'GN',
        devise: 'GNF',
        symboleDevise: 'GNF',
        planId: 'moyenne'
      }
    });
    console.log('  ✓ Demo company created');

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);
    await prisma.user.upsert({
      where: { email: 'demo@guineamanager.com' },
      update: {},
      create: {
        id: 'demo-user-001',
        email: 'demo@guineamanager.com',
        password: hashedPassword,
        nom: 'Demo',
        prenom: 'Admin',
        role: 'ADMIN',
        companyId: company.id,
        emailVerifie: true
      }
    });
    console.log('  ✓ Demo user created');

    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ DATABASE READY!');
    console.log('🔑 Login: demo@guineamanager.com / demo123');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Database init error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
INITEOF

# ===== SETUP PERMISSIONS =====
RUN mkdir -p /app/data /app/uploads && \
    chown -R nextjs:nodejs /app

# ===== SWITCH USER =====
USER nextjs

# Environment variables with defaults
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api
ENV BACKEND_URL="http://localhost:3001"
ENV DATABASE_URL="file:/app/data/prod.db"
ENV JWT_SECRET="guineamanager-production-jwt-secret-key-2024-secure"
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
