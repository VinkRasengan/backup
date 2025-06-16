#!/bin/bash

# =============================================================================
# 🛑 Stop All Local Services
# =============================================================================

echo "🛑 STOPPING ALL LOCAL SERVICES"
echo "=============================="

# Stop by PID files
SERVICES=("auth" "link-service" "community-service" "chat-service" "news-service" "admin-service" "api-gateway" "frontend")

for service in "${SERVICES[@]}"; do
    if [ -f "logs/$service.pid" ]; then
        pid=$(cat "logs/$service.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Stopping $service (PID: $pid)..."
            kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
        fi
        rm -f "logs/$service.pid"
    fi
done

# Kill any remaining Node.js processes on our ports
echo "🧹 Cleaning up remaining processes..."
PORTS=(3000 3001 3002 3003 3004 3005 3006 8080)

for port in "${PORTS[@]}"; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "🛑 Killing process on port $port (PID: $pid)..."
        kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
    fi
done

# General cleanup
pkill -f "node.*services" || true
pkill -f "npm.*dev" || true
pkill -f "npm.*start" || true

echo "✅ All services stopped!"
echo "📝 Logs preserved in logs/ directory"
