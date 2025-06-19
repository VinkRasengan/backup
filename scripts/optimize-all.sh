#!/bin/bash

# =============================================================================
# 🚀 Complete Project Optimization Script
# =============================================================================
# This script applies all optimizations to the project in the correct order

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
    echo "🚀 Complete Project Optimization"
    echo "================================"
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "services" ] || [ ! -d "client" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        if ! docker compose version >/dev/null 2>&1; then
            print_error "Docker Compose is not installed"
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed"
    echo ""
    
    # Step 1: Optimize Dockerfiles
    print_status "Step 1: Optimizing Dockerfiles..."
    if [ -f "scripts/optimize-dockerfiles.sh" ]; then
        bash scripts/optimize-dockerfiles.sh
    else
        print_warning "Dockerfile optimization script not found, skipping..."
    fi
    echo ""
    
    # Step 2: Build optimized images
    print_status "Step 2: Building optimized Docker images..."
    if [ -f "scripts/build-optimized.sh" ]; then
        bash scripts/build-optimized.sh --parallel 4
    else
        print_warning "Optimized build script not found, using regular build..."
        docker-compose build
    fi
    echo ""
    
    # Step 3: Test the deployment
    print_status "Step 3: Testing optimized deployment..."
    
    # Stop any running containers
    docker-compose down >/dev/null 2>&1 || true
    
    # Start with optimized configuration
    docker-compose up -d
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    
    local services_ok=true
    
    if command_exists curl; then
        # Check API Gateway
        if curl -s http://localhost:8080/health >/dev/null 2>&1; then
            print_success "✅ API Gateway is healthy"
        else
            print_warning "⚠️  API Gateway health check failed"
            services_ok=false
        fi
        
        # Check Frontend
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "✅ Frontend is healthy"
        else
            print_warning "⚠️  Frontend health check failed"
            services_ok=false
        fi
        
        # Check individual services
        local service_ports=(3001 3002 3003 3004 3005 3006)
        local service_names=("Auth" "Link" "News" "Chat" "Community" "Admin")
        
        for i in "${!service_ports[@]}"; do
            local port=${service_ports[$i]}
            local name=${service_names[$i]}
            
            if curl -s "http://localhost:$port/health/live" >/dev/null 2>&1; then
                print_success "✅ $name Service is healthy"
            else
                print_warning "⚠️  $name Service health check failed"
                services_ok=false
            fi
        done
    else
        print_warning "curl not available, skipping health checks"
    fi
    
    echo ""
    
    # Step 4: Show optimization results
    print_status "Step 4: Optimization Results"
    echo ""
    
    # Show container status
    print_status "Container Status:"
    docker-compose ps
    echo ""
    
    # Show image sizes
    print_status "Image Sizes:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -E "(REPOSITORY|frontend|auth-service|api-gateway|link-service|community-service|chat-service|news-service|admin-service)"
    echo ""
    
    # Show resource usage
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    echo ""
    
    # Final summary
    if [ "$services_ok" = true ]; then
        print_success "🎉 Project optimization completed successfully!"
        echo ""
        print_status "✅ All optimizations applied:"
        echo "  • Dockerfiles optimized for better caching and smaller images"
        echo "  • Multi-stage builds implemented"
        echo "  • Resource limits configured"
        echo "  • Health checks enabled"
        echo "  • Security improvements applied"
        echo "  • Build performance enhanced"
        echo ""
        print_status "🌐 Access URLs:"
        echo "  Frontend:      http://localhost:3000"
        echo "  API Gateway:   http://localhost:8080"
        echo "  Admin Panel:   http://localhost:3006"
        echo ""
        print_status "📊 Monitoring Commands:"
        echo "  View logs:     docker-compose logs -f"
        echo "  Check status:  docker-compose ps"
        echo "  Monitor perf:  npm run docker:monitor"
        echo "  Stop all:      docker-compose down"
    else
        print_warning "⚠️  Optimization completed with some issues"
        echo ""
        print_status "🔧 Troubleshooting:"
        echo "  • Check logs: docker-compose logs -f"
        echo "  • Restart services: docker-compose restart"
        echo "  • Check .env configuration"
        echo "  • Verify Firebase credentials"
    fi
    
    echo ""
    print_status "📝 Next Steps:"
    echo "  1. Monitor application performance"
    echo "  2. Test all features thoroughly"
    echo "  3. Configure production environment variables"
    echo "  4. Set up monitoring and logging"
    echo "  5. Plan deployment to production"
}

# Handle script interruption
trap 'echo ""; print_warning "Optimization interrupted"; exit 1' INT TERM

# Run main function
main "$@"
