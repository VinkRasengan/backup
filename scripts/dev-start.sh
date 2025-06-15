#!/bin/bash

# =============================================================================
# Smart Development Start Script
# Only rebuilds when necessary, otherwise uses existing images
# =============================================================================

echo "🚀 Smart Development Start..."
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if images exist
check_images_exist() {
    local services=("api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    local missing_images=()
    
    for service in "${services[@]}"; do
        if ! docker image inspect "backup_${service}:latest" > /dev/null 2>&1; then
            missing_images+=("$service")
        fi
    done
    
    echo "${#missing_images[@]}"
}

# Function to check if rebuild is needed
need_rebuild() {
    # Check if any service source code changed since last build
    local services=("api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    
    for service in "${services[@]}"; do
        if [ -d "services/$service" ]; then
            # Check if package.json changed
            if [ "services/$service/package.json" -nt ".build_timestamp" ]; then
                echo "$service package.json changed"
                return 0
            fi
            
            # Check if source files changed
            if find "services/$service/src" -name "*.js" -newer ".build_timestamp" 2>/dev/null | grep -q .; then
                echo "$service source code changed"
                return 0
            fi
            
            # Check if Dockerfile changed
            if [ "services/$service/Dockerfile" -nt ".build_timestamp" ]; then
                echo "$service Dockerfile changed"
                return 0
            fi
        fi
    done
    
    return 1
}

# Check if Docker is running
print_status "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if images exist
missing_count=$(check_images_exist)

if [ "$missing_count" -gt 0 ]; then
    print_warning "$missing_count images missing. Building all services..."
    docker-compose -f docker-compose.microservices.yml build
    touch .build_timestamp
elif [ ! -f ".build_timestamp" ] || need_rebuild; then
    print_warning "Changes detected. Rebuilding affected services..."
    docker-compose -f docker-compose.microservices.yml build
    touch .build_timestamp
else
    print_success "All images exist and up-to-date. Using existing images..."
fi

# Start services from existing images
print_status "Starting services from images..."
docker-compose -f docker-compose.microservices.yml up -d

print_success "🎉 Development environment started!"
echo ""
echo "📋 Quick Commands:"
echo "   Force rebuild:    docker-compose -f docker-compose.microservices.yml build"
echo "   View logs:        docker-compose -f docker-compose.microservices.yml logs -f"
echo "   Stop services:    docker-compose -f docker-compose.microservices.yml down"
echo ""
echo "🌐 URLs:"
echo "   Frontend:         http://localhost:3000"
echo "   API Gateway:      http://localhost:8080"
