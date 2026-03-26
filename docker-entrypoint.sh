#!/bin/sh
set -e

echo "🚀 Starting GuinéaManager ERP..."
echo ""

# Create necessary directories
mkdir -p /app/data /app/uploads 2>/dev/null || true

# Environment variables
export DATABASE_URL="file:/app/data/prod.db"
export JWT_SECRET="${JWT_SECRET:-guineamanager-production-jwt-secret-key-2024-secure}"
export NODE_ENV="${NODE_ENV:-production}"

# Start backend on port 3001
echo "🔧 Starting backend API on port 3001..."
cd /app/backend
export PORT=3001

# Always run database migration to ensure tables exist
echo "📦 Ensuring database tables exist..."
npx prisma db push --skip-generate 2>&1 || echo "Warning: db push had issues, continuing..."

# Start backend (it will auto-initialize demo data if needed)
echo "🔧 Starting backend server..."
node dist/index.js &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend is ready!"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "⚠️ Backend health check timeout, continuing anyway..."
  else
    sleep 1
  fi
done

# Start frontend on port 3000
echo "🌐 Starting frontend on port 3000..."
cd /app
export PORT=3000
export BACKEND_URL="http://localhost:3001"
node .next/standalone/server.js

# Wait for all processes
wait
