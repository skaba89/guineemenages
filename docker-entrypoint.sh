#!/bin/sh
set -e

echo "🚀 Starting GuinéaManager..."

# Run Prisma migrations
cd /app/backend
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss

# Seed database if empty
if [ ! -f /app/data/.seeded ]; then
    echo "🌱 Seeding database..."
    npx ts-node prisma/seed.ts
    touch /app/data/.seeded
fi

# Start backend in background
echo "🔧 Starting backend server..."
cd /app/backend
node dist/index.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check if backend is healthy
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:3001"
else
    echo "⚠️ Backend health check failed, but continuing..."
fi

# Start frontend
echo "🌐 Starting frontend server..."
cd /app
node server.js

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
