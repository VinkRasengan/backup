#!/bin/bash

echo "🔧 Fixing shared utility paths in all microservices..."

# List of services to fix
services=(
    "api-gateway"
    "link-service" 
    "community-service"
    "chat-service"
    "news-service"
    "admin-service"
)

# Fix each service
for service in "${services[@]}"; do
    echo "📝 Fixing $service..."
    
    # Find all JS files in the service and replace the paths
    find "services/$service" -name "*.js" -type f -exec sed -i 's|require('\''../../shared/|require('\''/app/shared/|g' {} \;
    find "services/$service" -name "*.js" -type f -exec sed -i 's|require("../../shared/|require("/app/shared/|g' {} \;
    
    echo "✅ Fixed $service"
done

echo "🎉 All shared utility paths have been fixed!"
echo ""
echo "📋 Summary of changes:"
echo "  - Changed '../../shared/utils/logger' to '/app/shared/utils/logger'"
echo "  - Changed '../../shared/utils/health-check' to '/app/shared/utils/health-check'"
echo "  - Changed '../../shared/middleware/auth' to '/app/shared/middleware/auth'"
echo ""
echo "🚀 Ready to rebuild and restart services!"
