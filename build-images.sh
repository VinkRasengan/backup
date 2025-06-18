#!/bin/bash

# Build Docker images for all microservices
# This script builds all Docker images needed for Kubernetes deployment

set -e

echo "🐳 Building Docker images for Anti-Fraud Platform..."
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    exit 1
fi

echo "✅ Docker is available and running"
echo ""

# Function to build service image
build_service() {
    local service_name=$1
    local service_path=$2

    echo "🔨 Building $service_name..."

    if [ ! -d "$service_path" ]; then
        echo "❌ Service directory not found: $service_path"
        return 1
    fi

    # Check if Dockerfile exists
    if [ ! -f "$service_path/Dockerfile" ]; then
        echo "⚠️  No Dockerfile found for $service_name, skipping..."
        return 0
    fi

    # Build the image from root directory with service-specific Dockerfile
    if docker build -f "$service_path/Dockerfile" -t "$service_name:latest" .; then
        echo "✅ $service_name image built successfully"
    else
        echo "❌ Failed to build $service_name image"
        return 1
    fi

    echo ""
}

# Build all microservices
echo "🔧 Building microservice images..."
echo ""

build_service "auth-service" "services/auth-service"
build_service "api-gateway" "services/api-gateway"
build_service "link-service" "services/link-service"
build_service "community-service" "services/community-service"
build_service "chat-service" "services/chat-service"
build_service "news-service" "services/news-service"
build_service "admin-service" "services/admin-service"

# Build frontend (special case - build from client directory)
echo "🌐 Building frontend image..."
if [ ! -d "client" ]; then
    echo "❌ Client directory not found: client"
    exit 1
fi

if [ ! -f "client/Dockerfile" ]; then
    echo "⚠️  No Dockerfile found for frontend, skipping..."
else
    # Build frontend from client directory (not root)
    if docker build -f client/Dockerfile -t frontend:latest client/; then
        echo "✅ frontend image built successfully"
    else
        echo "❌ Failed to build frontend image"
        exit 1
    fi
fi

echo "📋 Built images:"
docker images | grep -E "(auth-service|api-gateway|link-service|community-service|chat-service|news-service|admin-service|frontend)" | head -20

echo ""
echo "🎉 All images built successfully!"
echo ""
echo "💡 Next steps:"
echo "1. Test images locally: docker run -p 3001:3001 auth-service:latest"
echo "2. Push to registry (if using remote cluster): docker push <registry>/auth-service:latest"
echo "3. Deploy to Kubernetes: cd k8s && ./deploy-all.sh"
echo ""

# Optional: Show image sizes
echo "📊 Image sizes:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "(auth-service|api-gateway|link-service|community-service|chat-service|news-service|admin-service|frontend|REPOSITORY)"
