#!/bin/bash

echo "🛑 Stopping Monitoring Stack..."

# Stop Docker containers
echo "🐳 Stopping Docker containers..."
docker-compose -f docker-compose.monitoring.yml down

# Stop webhook service
if [ -f /tmp/webhook-service.pid ]; then
    WEBHOOK_PID=$(cat /tmp/webhook-service.pid)
    if ps -p $WEBHOOK_PID > /dev/null; then
        echo "🛑 Stopping webhook service (PID: $WEBHOOK_PID)..."
        kill $WEBHOOK_PID
        rm /tmp/webhook-service.pid
    else
        echo "ℹ️  Webhook service not running"
        rm /tmp/webhook-service.pid
    fi
else
    echo "ℹ️  No webhook service PID file found"
fi

# Clean up any remaining webhook processes
pkill -f "node.*webhook-service" 2>/dev/null || true

echo "✅ Monitoring Stack stopped successfully!"
