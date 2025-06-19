#!/bin/bash

# =============================================================================
# 🛑 Stop Local Services Script
# =============================================================================
# This script stops all locally running services

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

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    
    if command_exists lsof; then
        local pid=$(lsof -t -i:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            print_success "Stopped $service_name (port $port)"
            return 0
        fi
    elif command_exists netstat && command_exists taskkill; then
        # Windows approach
        local pid=$(netstat -ano | findstr ":$port " | awk '{print $5}' | head -1)
        if [ -n "$pid" ]; then
            taskkill //PID $pid //F 2>/dev/null || true
            print_success "Stopped $service_name (port $port)"
            return 0
        fi
    fi
    
    print_warning "$service_name (port $port) was not running"
    return 1
}

# Function to kill Node.js processes
kill_node_processes() {
    print_status "Stopping all Node.js processes..."
    
    if command_exists pkill; then
        pkill -f "node.*src/app.js" 2>/dev/null || true
        pkill -f "npm.*start" 2>/dev/null || true
        pkill -f "concurrently" 2>/dev/null || true
    elif command_exists taskkill; then
        # Windows approach
        taskkill //F //IM node.exe 2>/dev/null || true
        taskkill //F //IM npm.cmd 2>/dev/null || true
    fi
}

# Main function
main() {
    echo "🛑 Stopping Anti-Fraud Platform Services"
    echo "========================================"
    echo ""
    
    # Kill Node.js processes first
    kill_node_processes
    
    # Wait a moment
    sleep 2
    
    # Kill processes on specific ports
    print_status "Stopping services on specific ports..."
    
    # Define services and their ports
    declare -A SERVICES=(
        [3000]="Frontend"
        [3001]="Auth Service"
        [3002]="Link Service"
        [3003]="Community Service"
        [3004]="Chat Service"
        [3005]="News Service"
        [3006]="Admin Service"
        [8082]="API Gateway"
    )
    
    # Stop each service
    for port in "${!SERVICES[@]}"; do
        kill_port $port "${SERVICES[$port]}"
    done
    
    # Additional cleanup
    print_status "Performing additional cleanup..."
    
    # Kill any remaining npm processes
    if command_exists pkill; then
        pkill -f "npm" 2>/dev/null || true
    fi
    
    # Wait a moment for processes to terminate
    sleep 2
    
    echo ""
    print_success "🎉 All services stopped successfully!"
    echo ""
    print_status "To start services again, run:"
    echo "   ./scripts/deploy-local.sh"
    echo "   or"
    echo "   npm start"
}

# Run main function
main "$@"
