#!/bin/bash

# =============================================================================
# 🧪 Test Docker Deployment Script
# =============================================================================
# This script tests Docker deployment when Docker Desktop is ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to wait for Docker
wait_for_docker() {
    print_status "Waiting for Docker Desktop to start..."
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if docker info >/dev/null 2>&1; then
            print_success "Docker is ready!"
            return 0
        else
            retries=$((retries + 1))
            print_status "Docker not ready yet, waiting... ($retries/$max_retries)"
            sleep 5
        fi
    done
    
    print_error "Docker failed to start after $((max_retries * 5)) seconds"
    return 1
}

# Main function
main() {
    echo "🧪 Test Docker Deployment"
    echo "========================="
    echo ""
    
    # Check if Docker is available
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Please install Docker Desktop"
        exit 1
    fi
    
    # Wait for Docker to be ready
    if ! wait_for_docker; then
        print_error "Please start Docker Desktop manually and try again"
        exit 1
    fi
    
    # Test Docker deployment
    print_status "Testing Docker deployment..."
    bash scripts/deploy-docker.sh
    
    if [ $? -eq 0 ]; then
        print_success "🎉 Docker deployment test completed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Visit http://localhost:3000 to access the application"
        echo "   2. Check service logs: docker-compose logs -f"
        echo "   3. Stop services: bash scripts/stop-all.sh"
    else
        print_error "Docker deployment test failed"
        exit 1
    fi
}

# Run main function
main "$@"
