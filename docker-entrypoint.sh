#!/bin/sh
set -e

echo "🚀 Starting Guineamanager ERP..."
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

# Run database migration if needed (creates tables)
if [ ! -f /app/data/prod.db ]; then
  echo "📦 Creating database tables..."
  npx prisma db push --skip-generate 2>&1 || true
fi

# Start backend (it will auto-initialize demo data if needed)
node dist/index.js &
BACKEND_PID=$!
sleep 3

# Verify backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
  echo "✅ Backend started successfully"
else
  echo "⚠️ Backend may have issues, check logs"
fi

# Start frontend on port 3000
echo "🌐 Starting frontend on port 3000..."
cd /app
export PORT=3000
export BACKEND_URL="http://localhost:3001"
node .next/standalone/server.js

# Wait for all processes
wait
