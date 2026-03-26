#!/bin/sh
set -e

echo "🚀 Starting Guineamanager..."

# Create necessary directories
mkdir -p /app/data /app/uploads 2>/dev/null || true

# Set environment variables
export DATABASE_URL="file:/app/data/prod.db"
export JWT_SECRET="guineamanager-production-jwt-secret-key-2024-secure"

cd /app/backend

# Initialize database if needed
if [ ! -f /app/data/prod.db ]; then
  echo "📦 First run - creating database..."
  echo "   DATABASE_URL=$DATABASE_URL"

  # Create tables with Prisma - explicitly pass the url
  npx prisma db push --skip-generate 2>&1 || {
    echo "⚠️ Prisma db push had issues, checking database..."
  }

  # Check if database was created in wrong location
  if [ ! -f /app/data/prod.db ]; then
    echo "   Checking for database in alternative locations..."
    if [ -f ./dev.db ]; then
      mv ./dev.db /app/data/prod.db
      echo "   ✓ Moved dev.db to /app/data/prod.db"
    elif [ -f ./prisma/dev.db ]; then
      mv ./prisma/dev.db /app/data/prod.db
      echo "   ✓ Moved prisma/dev.db to /app/data/prod.db"
    fi
  fi

  # Run init script to create demo user
  if [ -f /app/data/prod.db ]; then
    echo "🌱 Creating demo user and initial data..."
    node init-db.js 2>&1 || echo "Note: Init completed or encountered an issue"
  else
    echo "❌ Database creation failed. Creating empty database..."
    touch /app/data/prod.db
    npx prisma db push --skip-generate 2>&1 || true
    node init-db.js 2>&1 || true
  fi
fi

# Start backend on port 3001
echo "🔧 Starting backend on port 3001..."
export PORT=3001
node dist/index.js &
BACKEND_PID=$!
sleep 3

# Start frontend on port 3000
echo "🌐 Starting frontend on port 3000..."
cd /app
export PORT=3000
node .next/standalone/server.js

# Wait for processes
wait
