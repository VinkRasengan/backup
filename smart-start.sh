#!/bin/bash

# =============================================================================
# 🧠 Smart Start - Wait for API Gateway before starting Frontend
# =============================================================================

set -e

echo "🧠 SMART START - WAITING FOR API GATEWAY"
echo "========================================"

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local timeout=${3:-60}
    local count=0
    
    echo "⏳ Waiting for $name to be ready..."
    
    while [ $count -lt $timeout ]; do
        if curl -s --max-time 3 "$url" > /dev/null 2>&1; then
            echo "✅ $name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        count=$((count + 2))
    done
    
    echo ""
    echo "❌ $name failed to start within ${timeout}s"
    return 1
}

# Stop existing processes
echo "🧹 Stopping existing processes..."
pkill -f "node.*services" || true
pkill -f "npm.*dev" || true
pkill -f "npm.*start" || true
sleep 3

# Load environment
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
    echo "✅ Environment loaded"
fi

# Create logs directory
mkdir -p logs

echo ""
echo "🚀 Starting backend services..."

# Start backend services in background
npm run dev:services > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "📡 Backend services starting (PID: $BACKEND_PID)..."

# Wait for API Gateway specifically
echo ""
wait_for_service "http://localhost:8080/health" "API Gateway" 60

# Test API Gateway endpoints
echo ""
echo "🧪 Testing API Gateway endpoints..."
if curl -s --max-time 5 "http://localhost:8080/info" > /dev/null; then
    echo "✅ API Gateway /info endpoint working"
else
    echo "⚠️  API Gateway /info endpoint not responding"
fi

# Now start frontend
echo ""
echo "🌐 Starting Frontend (API Gateway is ready)..."
cd client
npm start &
FRONTEND_PID=$!
echo "✅ Frontend starting (PID: $FRONTEND_PID)..."
cd ..

echo ""
echo "🎉 ALL SERVICES STARTED SUCCESSFULLY!"
echo "===================================="
echo ""
echo "📊 Service URLs:"
echo "  🌐 Frontend:    http://localhost:3000"
echo "  🚪 API Gateway: http://localhost:8080"
echo "  🔍 Gateway Info: http://localhost:8080/info"
echo "  ❤️  Health Check: http://localhost:8080/health"
echo ""
echo "📝 Logs:"
echo "  📡 Backend:     tail -f logs/backend.log"
echo "  🌐 Frontend:    Check terminal output above"
echo ""
echo "🛑 To stop: pkill -f node"

# Keep script running to show logs
echo ""
echo "📋 Showing backend logs (Ctrl+C to exit):"
echo "=========================================="
tail -f logs/backend.log
