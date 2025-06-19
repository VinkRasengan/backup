#!/bin/bash

# =============================================================================
# 🛑 Stop All Services Script - Windows Compatible
# =============================================================================
# This script stops all running services across different deployment methods

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "linux"
    fi
}

# Function to kill process on port (Windows compatible)
kill_port() {
    local port=$1
    local os=$(detect_os)
    
    case $os in
        "windows")
            local pid=$(netstat -ano 2>/dev/null | grep ":$port " | awk '{print $5}' | head -1)
            if [ -n "$pid" ] && [ "$pid" != "0" ]; then
                taskkill //PID $pid //F 2>/dev/null || true
                print_success "Killed process on port $port"
            fi
            ;;
        "macos"|"linux")
            if command_exists lsof; then
                local pid=$(lsof -t -i:$port 2>/dev/null || true)
                if [ -n "$pid" ]; then
                    kill -9 $pid 2>/dev/null || true
                    print_success "Killed process on port $port"
                fi
            fi
            ;;
    esac
}

# Function to stop Docker containers
stop_docker() {
    print_status "Stopping Docker containers..."
    
    if command_exists docker-compose; then
        if [ -f "docker-compose.yml" ]; then
            docker-compose down --remove-orphans 2>/dev/null || true
            print_success "Docker Compose containers stopped"
        fi
    elif command_exists docker && docker compose version >/dev/null 2>&1; then
        if [ -f "docker-compose.yml" ]; then
            docker compose down --remove-orphans 2>/dev/null || true
            print_success "Docker Compose containers stopped"
        fi
    fi
    
    # Stop individual containers if they exist
    CONTAINERS=("auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service" "api-gateway" "frontend" "redis")
    for container in "${CONTAINERS[@]}"; do
        if docker ps -q -f name=$container >/dev/null 2>&1; then
            docker stop $container >/dev/null 2>&1 || true
            docker rm $container >/dev/null 2>&1 || true
        fi
    done
}

# Function to stop Kubernetes deployments
stop_kubernetes() {
    print_status "Stopping Kubernetes deployments..."
    
    if command_exists kubectl; then
        # Check if namespace exists
        if kubectl get namespace anti-fraud-platform >/dev/null 2>&1; then
            print_warning "Found Kubernetes deployment. Do you want to delete it? (y/N)"
            read -p "This will delete all pods, services, and data: " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kubectl delete namespace anti-fraud-platform
                print_success "Kubernetes deployment deleted"
            else
                print_status "Kubernetes deployment left running"
            fi
        fi
    fi
}

# Function to stop local processes
stop_local() {
    print_status "Stopping local processes..."
    
    # Stop using npm script if available
    if [ -f "package.json" ] && npm run | grep -q "stop"; then
        npm run stop 2>/dev/null || true
        print_success "Stopped using npm run stop"
    fi
    
    # Kill processes on known ports
    PORTS=(3000 3001 3002 3003 3004 3005 3006 8082)
    for port in "${PORTS[@]}"; do
        kill_port $port
    done
    
    # Kill process from PID file if exists
    if [ -f ".start_pid" ]; then
        local pid=$(cat .start_pid)
        if [ -n "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            rm -f .start_pid
            print_success "Killed background process (PID: $pid)"
        fi
    fi
    
    # Kill Node.js processes related to the project
    local os=$(detect_os)
    case $os in
        "windows")
            # Windows approach - kill node processes running our services
            tasklist //FI "IMAGENAME eq node.exe" 2>/dev/null | grep node.exe | while read line; do
                local pid=$(echo $line | awk '{print $2}')
                if [ -n "$pid" ]; then
                    taskkill //PID $pid //F 2>/dev/null || true
                fi
            done
            ;;
        "macos"|"linux")
            # Unix approach - more selective killing
            pkill -f "node.*services" 2>/dev/null || true
            pkill -f "npm.*start" 2>/dev/null || true
            ;;
    esac
}

# Main function
main() {
    local os=$(detect_os)
    
    echo "🛑 Stop All Services"
    echo "==================="
    echo "OS Detected: $os"
    echo ""
    
    print_status "Stopping all Anti-Fraud Platform services..."
    
    # Stop Docker containers
    stop_docker
    
    # Stop Kubernetes deployments
    stop_kubernetes
    
    # Stop local processes
    stop_local
    
    # Clean up temporary files
    print_status "Cleaning up temporary files..."
    rm -f .start_pid 2>/dev/null || true
    
    echo ""
    print_success "🎉 All services stopped!"
    echo ""
    echo "📋 What was stopped:"
    echo "   ✓ Docker containers and compose services"
    echo "   ✓ Kubernetes deployments (if confirmed)"
    echo "   ✓ Local Node.js processes on ports 3000-3006, 8080"
    echo "   ✓ Background npm processes"
    echo ""
    echo "📝 To restart:"
    echo "   Local:      ./scripts/deploy-local-fixed.sh"
    echo "   Docker:     ./scripts/deploy-docker-fixed.sh"
    echo "   Kubernetes: ./scripts/deploy-k8s.sh"
}

# Run main function
main "$@"
