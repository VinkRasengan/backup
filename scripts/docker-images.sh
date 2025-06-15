#!/bin/bash

# =============================================================================
# Docker Images Management Script
# =============================================================================

echo "🐳 Docker Images Management"
echo "==========================="

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

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  list       List all project images"
    echo "  status     Show images status and sizes"
    echo "  clean      Remove unused images"
    echo "  rebuild    Force rebuild all images"
    echo "  remove     Remove all project images"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 list                 # List all images"
    echo "  $0 status               # Show detailed status"
    echo "  $0 clean                # Clean unused images"
    echo "  $0 rebuild              # Force rebuild all"
}

list_images() {
    print_status "Project Docker Images:"
    echo ""
    
    local services=("api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    
    for service in "${services[@]}"; do
        if docker image inspect "backup_${service}:latest" > /dev/null 2>&1; then
            local size=$(docker image inspect "backup_${service}:latest" --format='{{.Size}}' | numfmt --to=iec)
            local created=$(docker image inspect "backup_${service}:latest" --format='{{.Created}}' | cut -d'T' -f1)
            echo -e "${GREEN}✅ backup_${service}:latest${NC} (${size}, created: ${created})"
        else
            echo -e "${RED}❌ backup_${service}:latest${NC} (not found)"
        fi
    done
}

show_status() {
    print_status "Docker Images Status:"
    echo ""
    
    # Show project images
    echo "Project Images:"
    docker images | grep "backup_" | head -10
    echo ""
    
    # Show disk usage
    echo "Docker Disk Usage:"
    docker system df
    echo ""
    
    # Show running containers
    echo "Running Containers:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep backup || echo "No running containers"
}

clean_images() {
    print_warning "This will remove unused Docker images to free up space"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        return
    fi
    
    print_status "Removing unused images..."
    docker image prune -f
    
    print_status "Removing dangling images..."
    docker image prune -a -f --filter "dangling=true"
    
    print_success "Cleanup completed"
}

rebuild_all() {
    print_warning "This will force rebuild all project images"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        return
    fi
    
    print_status "Force rebuilding all images..."
    docker-compose -f docker-compose.microservices.yml build --no-cache
    print_success "All images rebuilt"
}

remove_all() {
    print_error "This will remove ALL project images and containers"
    print_warning "You will need to rebuild everything from scratch"
    read -p "Are you absolutely sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        return
    fi
    
    print_status "Stopping all containers..."
    docker-compose -f docker-compose.microservices.yml down
    
    print_status "Removing project images..."
    docker images | grep "backup_" | awk '{print $3}' | xargs -r docker rmi -f
    
    print_success "All project images removed"
}

# Main script logic
case "$1" in
    "list")
        list_images
        ;;
    "status")
        show_status
        ;;
    "clean")
        clean_images
        ;;
    "rebuild")
        rebuild_all
        ;;
    "remove")
        remove_all
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        echo "No command specified. Use 'help' to see available commands."
        echo ""
        list_images
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use 'help' to see available commands."
        exit 1
        ;;
esac
