#!/bin/bash

# Build all Docker images for the FactCheck Platform
# Usage: ./scripts/docker-build-all.sh [environment]
# Environments: development, production, render

set -e

ENVIRONMENT=${1:-production}
REGISTRY=${2:-"factcheck"}

echo "🐳 Building all Docker images for environment: $ENVIRONMENT"
echo "Registry: $REGISTRY"

# Services to build
SERVICES=(
    "api-gateway"
    "auth-service"
    "link-service"
    "community-service"
    "chat-service"
    "news-service"
    "admin-service"
    "phishtank-service"
    "criminalip-service"
)

# Build each service
for service in "${SERVICES[@]}"; do
    echo ""
    echo "🔨 Building $service..."
    
    if [ -f "services/$service/docker-build.sh" ]; then
        # Use service-specific build script if available
        cd "services/$service"
        ./docker-build.sh $ENVIRONMENT "$REGISTRY/$service"
        cd ../..
    else
        # Use generic build
        cd "services/$service"
        
        # Set default port based on service
        case $service in
            "api-gateway")
                DEFAULT_PORT=8080
                ;;
            "auth-service")
                DEFAULT_PORT=3001
                ;;
            "link-service")
                DEFAULT_PORT=3002
                ;;
            "community-service")
                DEFAULT_PORT=3003
                ;;
            "chat-service")
                DEFAULT_PORT=3004
                ;;
            "news-service")
                DEFAULT_PORT=3005
                ;;
            "admin-service")
                DEFAULT_PORT=3006
                ;;
            *)
                DEFAULT_PORT=3000
                ;;
        esac
        
        # Build with appropriate settings for Render
        if [ "$ENVIRONMENT" = "render" ]; then
            DEFAULT_PORT=10000
        fi
        
        docker build \
            --build-arg NODE_ENV=$ENVIRONMENT \
            --build-arg BUILD_CONTEXT=$ENVIRONMENT \
            --build-arg DEFAULT_PORT=$DEFAULT_PORT \
            -t "$REGISTRY/$service:$ENVIRONMENT" \
            .
        
        cd ../..
    fi
    
    echo "✅ Built $REGISTRY/$service:$ENVIRONMENT"
done

# Build client
echo ""
echo "🔨 Building client..."
cd client

docker build \
    --build-arg NODE_ENV=$ENVIRONMENT \
    -t "$REGISTRY/client:$ENVIRONMENT" \
    .

cd ..

echo "✅ Built $REGISTRY/client:$ENVIRONMENT"

echo ""
echo "🎉 All Docker images built successfully!"
echo ""
echo "📋 Built images:"
for service in "${SERVICES[@]}"; do
    echo "  - $REGISTRY/$service:$ENVIRONMENT"
done
echo "  - $REGISTRY/client:$ENVIRONMENT"

echo ""
echo "🚀 To run with docker-compose:"
echo "  docker-compose up -d"
