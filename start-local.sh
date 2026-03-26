#!/bin/bash
# GuinéaManager ERP - Local Development Startup Script
# This script starts both backend and frontend for local testing

set -e

echo "🚀 Starting GuinéaManager ERP..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Environment variables
export DATABASE_URL="file:./data/dev.db"
export JWT_SECRET="guineamanager-dev-secret-key-2024"
export NODE_ENV="development"
export BACKEND_URL="http://localhost:3001"

# Create data directory if it doesn't exist
mkdir -p data

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "⏹️ Shutting down..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}🔧 Starting backend API on port 3001...${NC}"
cd backend

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    echo "📦 Generating Prisma client..."
    npx prisma generate
fi

# Initialize database if needed
if [ ! -f "../data/dev.db" ]; then
    echo "📦 Initializing database..."
    npx prisma db push --skip-generate
fi

# Start backend server
export PORT=3001
node dist/index.js &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..15}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 15 ]; then
        echo -e "${RED}⚠️ Backend health check timeout${NC}"
    else
        sleep 1
    fi
done

# Start frontend
cd ..
echo -e "${BLUE}🌐 Starting frontend on port 3000...${NC}"
export PORT=3000
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ GuinéaManager ERP is running!${NC}"
echo ""
echo -e "📱 Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "🔧 Backend:  ${BLUE}http://localhost:3001${NC}"
echo -e "📚 API Docs: ${BLUE}http://localhost:3001/api/docs${NC}"
echo ""
echo -e "🔑 Demo credentials:"
echo -e "   Email: demo@guineamanager.com"
echo -e "   Password: demo123"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Press Ctrl+C to stop the servers"

# Wait for processes
wait
