#!/bin/bash

# =============================================================================
# 🛑 Stop Docker Services Script
# =============================================================================
# This script stops all Docker containers for the Anti-Fraud Platform

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main function
main() {
    echo "🛑 Stopping Anti-Fraud Platform Docker Services"
    echo "==============================================="
    echo ""
    
    # Check if Docker is available
    if ! command_exists docker; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "services" ] || [ ! -d "client" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    print_status "Stopping Docker containers..."
    
    # Try docker-compose first, then docker compose
    if command_exists docker-compose; then
        if [ -f "docker-compose.yml" ]; then
            docker-compose down --remove-orphans
        elif [ -f "docker-compose.microservices.yml" ]; then
            docker-compose -f docker-compose.microservices.yml down --remove-orphans
        else
            print_warning "No docker-compose.yml file found"
        fi
    elif docker compose version >/dev/null 2>&1; then
        if [ -f "docker-compose.yml" ]; then
            docker compose down --remove-orphans
        elif [ -f "docker-compose.microservices.yml" ]; then
            docker compose -f docker-compose.microservices.yml down --remove-orphans
        else
            print_warning "No docker-compose.yml file found"
        fi
    else
        print_error "Docker Compose is not available"
        
        # Fallback: stop containers manually
        print_status "Attempting to stop containers manually..."
        
        # Get container IDs for our services
        CONTAINERS=$(docker ps -q --filter "name=backup_" 2>/dev/null || true)
        
        if [ -n "$CONTAINERS" ]; then
            echo $CONTAINERS | xargs docker stop
            echo $CONTAINERS | xargs docker rm
            print_success "Stopped containers manually"
        else
            print_warning "No running containers found"
        fi
    fi
    
    # Additional cleanup
    print_status "Performing additional cleanup..."
    
    # Remove any dangling containers
    DANGLING_CONTAINERS=$(docker ps -aq --filter "status=exited" 2>/dev/null || true)
    if [ -n "$DANGLING_CONTAINERS" ]; then
        echo $DANGLING_CONTAINERS | xargs docker rm >/dev/null 2>&1 || true
    fi
    
    # Show remaining containers
    REMAINING=$(docker ps -q 2>/dev/null || true)
    if [ -n "$REMAINING" ]; then
        print_warning "Some containers are still running:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
    
    echo ""
    print_success "🎉 Docker services stopped successfully!"
    echo ""
    print_status "To start services again, run:"
    echo "   ./scripts/deploy-docker.sh"
    echo ""
    print_status "To remove all images and volumes (complete cleanup):"
    echo "   docker system prune -a --volumes"
}

# Run main function
main "$@"
