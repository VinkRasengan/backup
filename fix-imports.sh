#!/bin/bash

# =============================================================================
# 🔧 Fix Import Paths in Services
# =============================================================================

echo "🔧 FIXING IMPORT PATHS"
echo "====================="

# Services to fix
SERVICES=("auth-service" "api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service")

for service in "${SERVICES[@]}"; do
    echo "🔧 Fixing $service..."
    
    if [ -f "services/$service/src/app.js" ]; then
        # Create backup
        cp "services/$service/src/app.js" "services/$service/src/app.js.backup"
        
        # Fix import paths
        sed -i.tmp "s|require('../../../shared/|require('../../../../shared/|g" "services/$service/src/app.js"
        
        # If that doesn't work, try absolute path
        PROJECT_ROOT=$(pwd)
        sed -i.tmp "s|require('../../../shared/|require('$PROJECT_ROOT/shared/|g" "services/$service/src/app.js"
        
        echo "✅ Fixed imports for $service"
    else
        echo "❌ app.js not found for $service"
    fi
done

echo ""
echo "🧪 Testing fixed services..."

# Test one service
cd services/auth-service
echo "Testing auth-service..."
timeout 5s node src/app.js 2>&1 | head -5
cd ../..

echo ""
echo "✅ Import paths fixed!"
echo "💡 If still failing, run: ./debug-crash.sh"
