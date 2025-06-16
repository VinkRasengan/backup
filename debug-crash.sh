#!/bin/bash

# =============================================================================
# 🔍 Debug Service Crashes
# =============================================================================

echo "🔍 DEBUGGING SERVICE CRASHES"
echo "============================"

# Test each service individually
SERVICES=("auth-service" "api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service")

for service in "${SERVICES[@]}"; do
    echo ""
    echo "🧪 Testing $service..."
    echo "---------------------"
    
    if [ -d "services/$service" ]; then
        cd "services/$service"
        
        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            echo "❌ node_modules missing for $service"
            echo "💡 Run: cd services/$service && npm install"
        else
            echo "✅ node_modules exists"
        fi
        
        # Check if main file exists
        if [ -f "src/app.js" ]; then
            echo "✅ src/app.js exists"
        else
            echo "❌ src/app.js missing"
        fi
        
        # Try to run the service and capture error
        echo "🚀 Testing startup..."
        timeout 5s node src/app.js 2>&1 | head -10 || echo "❌ Service failed to start"
        
        cd ../..
    else
        echo "❌ Service directory not found"
    fi
done

echo ""
echo "🔍 CHECKING SHARED MODULES"
echo "========================="

# Check shared modules
if [ -d "shared" ]; then
    echo "✅ shared directory exists"
    
    if [ -f "shared/utils/logger.js" ]; then
        echo "✅ shared/utils/logger.js exists"
    else
        echo "❌ shared/utils/logger.js missing"
    fi
    
    if [ -f "shared/utils/health-check.js" ]; then
        echo "✅ shared/utils/health-check.js exists"
    else
        echo "❌ shared/utils/health-check.js missing"
    fi
else
    echo "❌ shared directory missing"
fi

echo ""
echo "🔍 ENVIRONMENT CHECK"
echo "==================="

if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "📝 Key variables:"
    grep -E "(FIREBASE_PROJECT_ID|JWT_SECRET|NODE_ENV)" .env || echo "⚠️  Some variables missing"
else
    echo "❌ .env file missing"
fi

echo ""
echo "💡 COMMON FIXES:"
echo "==============="
echo "1. Install dependencies: npm run install:all"
echo "2. Check .env file: cp .env.example .env"
echo "3. Test single service: cd services/auth-service && npm run dev"
echo "4. Check logs: tail -f logs/*.log"
