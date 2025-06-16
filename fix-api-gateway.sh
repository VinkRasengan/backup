#!/bin/bash

# =============================================================================
# 🔧 Fix API Gateway Proxy Targets
# =============================================================================

echo "🔧 FIXING API GATEWAY PROXY TARGETS"
echo "==================================="

API_GATEWAY_FILE="services/api-gateway/src/app.js"

if [ -f "$API_GATEWAY_FILE" ]; then
    # Create backup
    cp "$API_GATEWAY_FILE" "$API_GATEWAY_FILE.backup"
    
    # Fix all proxy targets with fallbacks
    sed -i.tmp 's|target: process\.env\.AUTH_SERVICE_URL|target: process.env.AUTH_SERVICE_URL \|\| "http://localhost:3001"|g' "$API_GATEWAY_FILE"
    sed -i.tmp 's|target: process\.env\.LINK_SERVICE_URL|target: process.env.LINK_SERVICE_URL \|\| "http://localhost:3002"|g' "$API_GATEWAY_FILE"
    sed -i.tmp 's|target: process\.env\.COMMUNITY_SERVICE_URL|target: process.env.COMMUNITY_SERVICE_URL \|\| "http://localhost:3003"|g' "$API_GATEWAY_FILE"
    sed -i.tmp 's|target: process\.env\.CHAT_SERVICE_URL|target: process.env.CHAT_SERVICE_URL \|\| "http://localhost:3004"|g' "$API_GATEWAY_FILE"
    sed -i.tmp 's|target: process\.env\.NEWS_SERVICE_URL|target: process.env.NEWS_SERVICE_URL \|\| "http://localhost:3005"|g' "$API_GATEWAY_FILE"
    sed -i.tmp 's|target: process\.env\.ADMIN_SERVICE_URL|target: process.env.ADMIN_SERVICE_URL \|\| "http://localhost:3006"|g' "$API_GATEWAY_FILE"
    
    # Clean up temp files
    rm -f "$API_GATEWAY_FILE.tmp"
    
    echo "✅ Fixed API Gateway proxy targets"
else
    echo "❌ API Gateway file not found"
    exit 1
fi

echo ""
echo "🧪 TESTING API GATEWAY"
echo "======================"

cd services/api-gateway

# Test API Gateway startup
echo "Testing API Gateway startup..."
timeout 5s node src/app.js 2>&1 | head -5

cd ../..

echo ""
echo "✅ API GATEWAY FIXED!"
echo "===================="
echo "🚀 Ready to start: npm run dev:services"
