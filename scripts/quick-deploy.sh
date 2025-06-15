#!/bin/bash

# Quick deploy microservices without full rebuild

set -e

echo "🚀 Quick Deploy Anti-Fraud Platform Microservices..."
echo "=================================================="

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << EOF
# Service Configuration
NODE_ENV=development

# Firebase Configuration - REQUIRED: Update with your project details
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# JWT Configuration - REQUIRED: Generate a secure secret key
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_SECRET_KEY_AT_LEAST_32_CHARS

# API Keys - REQUIRED: Get from respective providers
GEMINI_API_KEY=your_gemini_api_key_here
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
SCAMADVISER_API_KEY=your_scamadviser_api_key_here
SCREENSHOTLAYER_API_KEY=your_screenshotlayer_api_key_here
NEWSAPI_API_KEY=your_newsapi_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here

# Service URLs (for development)
AUTH_SERVICE_URL=http://auth-service:3001
LINK_SERVICE_URL=http://link-service:3002
COMMUNITY_SERVICE_URL=http://community-service:3003
CHAT_SERVICE_URL=http://chat-service:3004
NEWS_SERVICE_URL=http://news-service:3005
ADMIN_SERVICE_URL=http://admin-service:3006

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# React App Configuration - REQUIRED: Update with your Firebase settings
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
EOF
    echo "✅ .env template created. Please update all placeholder values before deployment."
fi

# Start services without rebuild
echo ""
echo "🔨 Starting microservices..."
echo "Using existing images (no rebuild)..."

# Start all services
docker-compose -f docker-compose.microservices.yml up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
echo "This usually takes 30-45 seconds..."
sleep 30

# Check service health
echo ""
echo "🔍 Checking service health..."
echo "================================"

services=(
    "http://localhost:8080/health:API Gateway"
    "http://localhost:3001/health:Auth Service"
    "http://localhost:3002/health:Link Service"
    "http://localhost:3003/health:Community Service"
    "http://localhost:3004/health:Chat Service"
    "http://localhost:3005/health:News Service"
    "http://localhost:3006/health:Admin Service"
)

healthy_count=0
total_count=${#services[@]}

for service in "${services[@]}"; do
    IFS=':' read -r url name <<< "$service"
    if curl -s "$url" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
        ((healthy_count++))
    else
        echo "❌ $name is not responding (may still be starting up)"
    fi
done

echo ""
echo "📊 Health Summary: $healthy_count/$total_count services are healthy"

echo ""
echo "🎉 Quick deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "  API Gateway:      http://localhost:8080"
echo "  Frontend:         http://localhost:3000"
echo "  Auth Service:     http://localhost:3001"
echo "  Link Service:     http://localhost:3002"
echo "  Community Service: http://localhost:3003"
echo "  Chat Service:     http://localhost:3004"
echo "  News Service:     http://localhost:3005"
echo "  Admin Service:    http://localhost:3006"
echo ""
echo "📈 Monitoring:"
echo "  Prometheus:       http://localhost:9090"
echo "  Grafana:          http://localhost:3007 (admin/admin)"
echo "  Jaeger:           http://localhost:16686"
echo ""
echo "🔧 Management:"
echo "  View logs:        docker-compose -f docker-compose.microservices.yml logs -f [service-name]"
echo "  Stop services:    docker-compose -f docker-compose.microservices.yml down"
echo "  Restart service:  docker-compose -f docker-compose.microservices.yml restart [service-name]"
echo ""
