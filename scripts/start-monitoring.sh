#!/bin/bash

echo "🔧 Starting Monitoring Stack..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create monitoring network if it doesn't exist
echo "📡 Creating monitoring network..."
docker network create monitoring 2>/dev/null || echo "Network 'monitoring' already exists"

# Create app-network if it doesn't exist
echo "📡 Creating app-network..."
docker network create app-network 2>/dev/null || echo "Network 'app-network' already exists"

# Start webhook service first
echo "🚀 Starting webhook service..."
cd monitoring/webhook-service
npm install
node app.js &
WEBHOOK_PID=$!
cd ../..

# Wait a moment for webhook service to start
sleep 3

# Start monitoring stack
echo "🚀 Starting Prometheus, Grafana, and Alertmanager..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "🔍 Checking service status..."

# Check Prometheus
if curl -s http://localhost:9090/-/healthy > /dev/null; then
    echo "✅ Prometheus is healthy"
else
    echo "❌ Prometheus is not responding"
fi

# Check Grafana
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Grafana is healthy"
else
    echo "❌ Grafana is not responding"
fi

# Check Alertmanager
if curl -s http://localhost:9093/-/healthy > /dev/null; then
    echo "✅ Alertmanager is healthy"
else
    echo "❌ Alertmanager is not responding"
fi

# Check Node Exporter
if curl -s http://localhost:9100/metrics > /dev/null; then
    echo "✅ Node Exporter is healthy"
else
    echo "❌ Node Exporter is not responding"
fi

# Check Webhook Service
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ Webhook Service is healthy"
else
    echo "❌ Webhook Service is not responding"
fi

echo ""
echo "🎉 Monitoring Stack Started Successfully!"
echo ""
echo "📊 Access URLs:"
echo "   Grafana:      http://localhost:3001 (admin/admin123)"
echo "   Prometheus:   http://localhost:9090"
echo "   Alertmanager: http://localhost:9093"
echo "   Node Exporter: http://localhost:9100"
echo "   Webhook Service: http://localhost:5001"
echo ""
echo "📈 Grafana Dashboards:"
echo "   - Microservices Overview: Import from monitoring/grafana/dashboards/"
echo ""
echo "🚨 Alert Endpoints:"
echo "   - View Alerts: http://localhost:5001/alerts"
echo "   - Critical Alerts: http://localhost:5001/alerts/critical"
echo "   - Warning Alerts: http://localhost:5001/alerts/warning"
echo ""
echo "🔧 Next Steps:"
echo "   1. Install monitoring dependencies: ./scripts/install-monitoring.sh"
echo "   2. Start your microservices with metrics enabled"
echo "   3. Import Grafana dashboards"
echo "   4. Configure alert notification channels"

# Save webhook PID for cleanup
echo $WEBHOOK_PID > /tmp/webhook-service.pid
