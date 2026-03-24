#!/bin/sh
set -e

echo "🚀 Starting Guineamanager..."

# Create necessary directories with proper permissions
mkdir -p /app/data /app/uploads /app/logs 2>/dev/null || true

# Start backend in background
echo "🔧 Starting backend on port 3001..."
cd /app/backend
node dist/index.js &
BACKEND_PID=$!
sleep 2

# Start frontend
echo "🌐 Starting frontend on port 3000..."
cd /app
node .next/standalone/server.js

# Wait for processes
wait
