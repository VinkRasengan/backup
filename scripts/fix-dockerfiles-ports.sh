#!/bin/bash

# =============================================================================
# 🔧 Fix Dockerfile Ports
# =============================================================================
# This script fixes missing ports in Dockerfiles

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get service port
get_service_port() {
    case $1 in
        "auth-service") echo "3001" ;;
        "api-gateway") echo "8080" ;;
        "link-service") echo "3002" ;;
        "community-service") echo "3005" ;;
        "chat-service") echo "3004" ;;
        "news-service") echo "3003" ;;
        "admin-service") echo "3006" ;;
        *) echo "3000" ;;
    esac
}

# Services to fix
SERVICES=("api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service")

print_status "Fixing Dockerfile ports..."

for service in "${SERVICES[@]}"; do
    dockerfile_path="services/$service/Dockerfile"
    port=$(get_service_port $service)
    
    if [ -f "$dockerfile_path" ]; then
        print_status "Fixing ports in $dockerfile_path (port: $port)..."
        
        # Fix EXPOSE statements
        sed -i "s/^EXPOSE $/EXPOSE $port/g" "$dockerfile_path"
        
        # Fix health check URLs
        sed -i "s|localhost:/health|localhost:$port/health|g" "$dockerfile_path"
        
        print_success "Fixed $dockerfile_path"
    else
        print_error "Dockerfile not found: $dockerfile_path"
    fi
done

print_success "All Dockerfile ports fixed!"
