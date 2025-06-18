#!/bin/bash

echo "🔧 Installing monitoring dependencies for all services..."

# Services to update
SERVICES=(
  "services/auth-service"
  "services/link-service"
  "services/news-service"
  "services/chat-service"
  "services/community-service"
  "services/admin-service"
  "services/criminalip-service"
  "services/phishtank-service"
)

# Install prom-client for each service
for service in "${SERVICES[@]}"; do
  if [ -d "$service" ]; then
    echo "📦 Installing prom-client in $service..."
    cd "$service"
    npm install prom-client@^15.1.0
    cd - > /dev/null
  else
    echo "⚠️  Directory $service not found, skipping..."
  fi
done

# Install shared monitoring dependencies
echo "📦 Installing shared monitoring dependencies..."
npm install prom-client@^15.1.0

echo "✅ Monitoring dependencies installed successfully!"
echo ""
echo "Next steps:"
echo "1. Update each service to include metrics endpoints"
echo "2. Start monitoring stack with: docker-compose -f docker-compose.monitoring.yml up -d"
echo "3. Access Grafana at http://localhost:3001 (admin/admin123)"
echo "4. Access Prometheus at http://localhost:9090"
echo "5. Access Alertmanager at http://localhost:9093"
