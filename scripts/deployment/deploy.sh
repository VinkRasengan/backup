#!/bin/bash

# =============================================================================
# 🚀 Universal Deployment Script - Windows Compatible
# =============================================================================
# This script provides a unified interface for all deployment methods
# Works on Windows (Git Bash), macOS, and Linux

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

# Function to show usage
show_usage() {
    echo "🚀 Anti-Fraud Platform - Universal Deployment Script"
    echo "===================================================="
    echo ""
    echo "Usage: $0 [METHOD]"
    echo ""
    echo "Available deployment methods:"
    echo "  local     - Deploy locally without Docker (recommended for development)"
    echo "  docker    - Deploy using Docker Compose (recommended for testing)"
    echo "  k8s       - Deploy to Kubernetes cluster (recommended for production)"
    echo "  stop      - Stop all running services"
    echo "  status    - Check status of all services"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 local      # Start local development environment"
    echo "  $0 docker     # Start Docker containers"
    echo "  $0 k8s        # Deploy to Kubernetes"
    echo "  $0 stop       # Stop all services"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "services" ] || [ ! -d "client" ] || [ ! -d "shared" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Required: package.json, services/, client/, shared/ directories"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to deploy locally
deploy_local() {
    print_status "Starting local deployment..."
    
    if [ -f "scripts/deploy-local-fixed.sh" ]; then
        bash scripts/deploy-local-fixed.sh
    else
        print_error "Local deployment script not found: scripts/deploy-local-fixed.sh"
        exit 1
    fi
}

# Function to deploy with Docker
deploy_docker() {
    print_status "Starting Docker deployment..."
    
    if [ -f "scripts/deploy-docker-fixed.sh" ]; then
        bash scripts/deploy-docker-fixed.sh
    else
        print_error "Docker deployment script not found: scripts/deploy-docker-fixed.sh"
        exit 1
    fi
}

# Function to deploy to Kubernetes
deploy_k8s() {
    print_status "Starting Kubernetes deployment..."
    
    if [ -f "scripts/deploy-k8s.sh" ]; then
        bash scripts/deploy-k8s.sh
    else
        print_error "Kubernetes deployment script not found: scripts/deploy-k8s.sh"
        exit 1
    fi
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    
    if [ -f "scripts/stop-all.sh" ]; then
        bash scripts/stop-all.sh
    else
        print_error "Stop script not found: scripts/stop-all.sh"
        exit 1
    fi
}

# Function to check status
check_status() {
    print_status "Checking service status..."
    echo ""
    
    # Check if curl is available
    if ! command -v curl >/dev/null 2>&1; then
        print_warning "curl not found. Cannot check service health automatically."
        return 0
    fi
    
    # Check services
    SERVICES=(
        "Frontend:3000:/"
        "API Gateway:8082:/health"
        "Auth Service:3001:/health/live"
        "Link Service:3002:/health/live"
        "News Service:3003:/health/live"
        "Chat Service:3004:/health/live"
        "Community:3005:/health/live"
        "Admin Service:3006:/health/live"
    )
    
    echo "🔍 Service Health Check:"
    echo "========================"
    
    for service_info in "${SERVICES[@]}"; do
        IFS=':' read -r name port path <<< "$service_info"
        
        if curl -s "http://localhost:$port$path" >/dev/null 2>&1; then
            echo "✅ $name (http://localhost:$port) - Running"
        else
            echo "❌ $name (http://localhost:$port) - Not responding"
        fi
    done
    
    echo ""
    echo "🐳 Docker Status:"
    echo "================="
    
    if command -v docker >/dev/null 2>&1; then
        if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(auth-service|api-gateway|frontend|redis)" 2>/dev/null; then
            echo "Docker containers are running"
        else
            echo "No Docker containers found"
        fi
    else
        echo "Docker not available"
    fi
    
    echo ""
    echo "☸️ Kubernetes Status:"
    echo "====================="
    
    if command -v kubectl >/dev/null 2>&1; then
        if kubectl get pods -n anti-fraud-platform 2>/dev/null; then
            echo "Kubernetes pods found"
        else
            echo "No Kubernetes deployment found"
        fi
    else
        echo "kubectl not available"
    fi
}

# Main function
main() {
    local method=${1:-help}
    
    case $method in
        "local")
            check_prerequisites
            deploy_local
            ;;
        "docker")
            check_prerequisites
            deploy_docker
            ;;
        "k8s"|"kubernetes")
            check_prerequisites
            deploy_k8s
            ;;
        "stop")
            stop_all
            ;;
        "status")
            check_status
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            print_error "Unknown deployment method: $method"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
