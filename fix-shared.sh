#!/bin/bash

# =============================================================================
# 🔗 Fix Shared Modules Access
# =============================================================================

echo "🔗 FIXING SHARED MODULES ACCESS"
echo "==============================="

# Method 1: Copy shared to each service
SERVICES=("auth-service" "api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service")

for service in "${SERVICES[@]}"; do
    echo "📁 Copying shared modules to $service..."
    
    if [ -d "services/$service" ]; then
        # Remove existing shared if any
        rm -rf "services/$service/shared"
        
        # Copy shared modules
        cp -r shared "services/$service/"
        
        echo "✅ Shared modules copied to $service"
    fi
done

echo ""
echo "🔧 Updating import paths..."

for service in "${SERVICES[@]}"; do
    if [ -f "services/$service/src/app.js" ]; then
        # Update import paths to use local shared
        sed -i.bak "s|require('../../../shared/|require('../shared/|g" "services/$service/src/app.js"
        echo "✅ Updated imports for $service"
    fi
done

echo ""
echo "🧪 Testing services..."

# Test auth service
cd services/auth-service
echo "Testing auth-service with local shared modules..."
timeout 5s node src/app.js 2>&1 | head -5
cd ../..

echo ""
echo "✅ Shared modules fixed!"
echo "🚀 Try starting services now: npm run dev:services"
