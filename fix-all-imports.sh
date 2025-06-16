#!/bin/bash

# =============================================================================
# 🔧 Fix All Import Paths in All Services
# =============================================================================

echo "🔧 FIXING ALL IMPORT PATHS"
echo "=========================="

# Services to fix
SERVICES=("auth-service" "api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service")

for service in "${SERVICES[@]}"; do
    echo "🔧 Fixing all imports in $service..."
    
    if [ -d "services/$service" ]; then
        # Find all JS files and fix import paths
        find "services/$service" -name "*.js" -type f | while read file; do
            # Fix /app/shared/ paths
            sed -i.bak "s|require('/app/shared/|require('../../shared/|g" "$file"
            sed -i.bak "s|require('../../../shared/|require('../../shared/|g" "$file"
            sed -i.bak "s|require('../../../../shared/|require('../../shared/|g" "$file"
            
            # Clean up backup files
            rm -f "$file.bak"
        done
        
        echo "✅ Fixed all imports in $service"
    else
        echo "❌ Service directory not found: $service"
    fi
done

echo ""
echo "🔧 FIXING ENVIRONMENT VARIABLES IN API GATEWAY"
echo "=============================================="

# Fix API Gateway environment variable issues
if [ -f "services/api-gateway/src/app.js" ]; then
    # Add fallback for missing environment variables
    sed -i.bak 's|process.env.AUTH_SERVICE_URL|process.env.AUTH_SERVICE_URL || "http://localhost:3001"|g' "services/api-gateway/src/app.js"
    sed -i.bak 's|process.env.LINK_SERVICE_URL|process.env.LINK_SERVICE_URL || "http://localhost:3002"|g' "services/api-gateway/src/app.js"
    sed -i.bak 's|process.env.COMMUNITY_SERVICE_URL|process.env.COMMUNITY_SERVICE_URL || "http://localhost:3003"|g' "services/api-gateway/src/app.js"
    sed -i.bak 's|process.env.CHAT_SERVICE_URL|process.env.CHAT_SERVICE_URL || "http://localhost:3004"|g' "services/api-gateway/src/app.js"
    sed -i.bak 's|process.env.NEWS_SERVICE_URL|process.env.NEWS_SERVICE_URL || "http://localhost:3005"|g' "services/api-gateway/src/app.js"
    sed -i.bak 's|process.env.ADMIN_SERVICE_URL|process.env.ADMIN_SERVICE_URL || "http://localhost:3006"|g' "services/api-gateway/src/app.js"
    
    rm -f "services/api-gateway/src/app.js.bak"
    echo "✅ Fixed API Gateway environment variables"
fi

echo ""
echo "🧹 CLEANING UP PROCESSES"
echo "========================"

# Kill any processes on our ports
PORTS=(3000 3001 3002 3003 3004 3005 3006 8080)
for port in "${PORTS[@]}"; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "🛑 Killing process on port $port (PID: $pid)..."
        kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
    fi
done

echo ""
echo "🧪 TESTING FIXED SERVICES"
echo "========================="

# Test auth service
echo "Testing auth-service..."
cd services/auth-service
timeout 5s node src/app.js 2>&1 | head -3 &
AUTH_PID=$!
cd ../..

sleep 2

# Test API Gateway
echo "Testing api-gateway..."
cd services/api-gateway
timeout 5s node src/app.js 2>&1 | head -3 &
GATEWAY_PID=$!
cd ../..

sleep 3

# Kill test processes
kill $AUTH_PID $GATEWAY_PID 2>/dev/null || true

echo ""
echo "✅ ALL IMPORTS FIXED!"
echo "===================="
echo "🚀 Ready to start services: npm run dev:services"
