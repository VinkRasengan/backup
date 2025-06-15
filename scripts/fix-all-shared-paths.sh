#!/bin/bash

echo "🔧 Fixing ALL shared utility paths in microservices..."

# List of services to fix
services=(
    "auth-service"
    "link-service" 
    "community-service"
    "chat-service"
    "news-service"
    "admin-service"
    "api-gateway"
)

# Fix each service
for service in "${services[@]}"; do
    echo "📝 Fixing $service..."
    
    # Find all JS files in the service and replace ALL variations of shared paths
    find "services/$service" -name "*.js" -type f -exec sed -i 's|require('\''../../shared/|require('\''/app/shared/|g' {} \;
    find "services/$service" -name "*.js" -type f -exec sed -i 's|require("../../shared/|require("/app/shared/|g' {} \;
    find "services/$service" -name "*.js" -type f -exec sed -i 's|require('\''../../../shared/|require('\''/app/shared/|g' {} \;
    find "services/$service" -name "*.js" -type f -exec sed -i 's|require("../../../shared/|require("/app/shared/|g' {} \;
    find "services/$service" -name "*.js" -type f -exec sed -i 's|require('\''../../../../shared/|require('\''/app/shared/|g' {} \;
    find "services/$service" -name "*.js" -type f -exec sed -i 's|require("../../../../shared/|require("/app/shared/|g' {} \;
    
    echo "✅ Fixed $service"
done

echo "🎉 All shared utility paths have been fixed!"
echo ""
echo "📋 Summary of changes:"
echo "  - Changed '../../shared/' to '/app/shared/'"
echo "  - Changed '../../../shared/' to '/app/shared/'"
echo "  - Changed '../../../../shared/' to '/app/shared/'"
echo ""
echo "🚀 Ready to rebuild and restart services!"
