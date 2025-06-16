#!/bin/bash

# =============================================================================
# 🚀 Start Local Services - Fixed Order
# Start services in correct order with proper delays
# =============================================================================

set -e

echo "🚀 STARTING LOCAL SERVICES (FIXED)"
echo "================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Load environment
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
    echo "✅ Environment loaded"
else
    echo "❌ .env file not found"
    exit 1
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*services" || true
pkill -f "npm.*dev" || true
sleep 2

# Create logs directory
mkdir -p logs

echo "🔧 Starting services in order..."

# Start backend services first (in background)
echo "📡 Starting backend services..."

# Auth Service (most important first)
cd services/auth-service
nohup npm run dev > ../../logs/auth.log 2>&1 &
AUTH_PID=$!
echo $AUTH_PID > ../../logs/auth.pid
echo "✅ Auth Service started (PID: $AUTH_PID)"
cd ../..

sleep 3

# Other services
SERVICES=("link-service" "community-service" "chat-service" "news-service" "admin-service")

for service in "${SERVICES[@]}"; do
    cd "services/$service"
    nohup npm run dev > "../../logs/$service.log" 2>&1 &
    PID=$!
    echo $PID > "../../logs/$service.pid"
    echo "✅ $service started (PID: $PID)"
    cd ../..
    sleep 2
done

# Wait for backend services to be ready
echo "⏳ Waiting for backend services to be ready..."
sleep 10

# Start API Gateway
echo "🚪 Starting API Gateway..."
cd services/api-gateway
nohup npm run dev > ../../logs/api-gateway.log 2>&1 &
GATEWAY_PID=$!
echo $GATEWAY_PID > ../../logs/api-gateway.pid
echo "✅ API Gateway started (PID: $GATEWAY_PID)"
cd ../..

# Wait for API Gateway
echo "⏳ Waiting for API Gateway to be ready..."
sleep 5

# Test API Gateway
echo "🧪 Testing API Gateway..."
if curl -s --max-time 5 http://localhost:8080/health > /dev/null; then
    echo "✅ API Gateway is responding"
else
    echo "⚠️  API Gateway not responding yet, but continuing..."
fi

# Start Frontend last
echo "🌐 Starting Frontend..."
cd client
nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
echo "✅ Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "🎉 ALL SERVICES STARTED!"
echo "======================="
echo ""
echo "📊 Service URLs:"
echo "  🌐 Frontend:          http://localhost:3000"
echo "  🚪 API Gateway:       http://localhost:8080"
echo "  🔐 Auth Service:      http://localhost:3001"
echo "  🔗 Link Service:      http://localhost:3002"
echo "  👥 Community Service: http://localhost:3003"
echo "  💬 Chat Service:      http://localhost:3004"
echo "  📰 News Service:      http://localhost:3005"
echo "  ⚙️  Admin Service:     http://localhost:3006"
echo ""
echo "📋 Useful Commands:"
echo "  📊 Check status:      ./debug-services.sh"
echo "  📝 View logs:         tail -f logs/<service>.log"
echo "  🛑 Stop all:          ./stop-local.sh"
echo ""
echo "⏳ Services are starting up... Frontend will be ready in ~30 seconds"
