#!/bin/bash

# =============================================================================
# 🚀 Local Deployment Script (No Docker)
# =============================================================================
# This script deploys the Anti-Fraud Platform locally without Docker
# Works on Windows (Git Bash), macOS, and Linux

set -e  # Exit on any error

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

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 16 ]; then
            print_success "Node.js version $NODE_VERSION is compatible"
            return 0
        else
            print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 16 or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher"
        return 1
    fi
}

# Function to check npm version
check_npm_version() {
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm version $NPM_VERSION is available"
        return 0
    else
        print_error "npm is not installed. Please install npm"
        return 1
    fi
}

# Function to check if port is available
check_port() {
    local port=$1
    if command_exists netstat; then
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            return 1
        fi
    elif command_exists lsof; then
        if lsof -i :$port >/dev/null 2>&1; then
            return 1
        fi
    fi
    return 0
}

# Function to kill process on port
kill_port() {
    local port=$1
    print_status "Attempting to free port $port..."
    
    if command_exists lsof; then
        local pid=$(lsof -t -i:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            print_success "Killed process on port $port"
        fi
    elif command_exists netstat && command_exists taskkill; then
        # Windows approach
        local pid=$(netstat -ano | findstr ":$port " | awk '{print $5}' | head -1)
        if [ -n "$pid" ]; then
            taskkill //PID $pid //F 2>/dev/null || true
            print_success "Killed process on port $port"
        fi
    fi
}

# Function to create .env file if it doesn't exist
create_env_file() {
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from template..."
        cat > .env << 'EOF'
# =============================================================================
# Anti-Fraud Platform - Local Development Configuration
# =============================================================================

# Environment
NODE_ENV=development

# Service URLs (Local Development)
AUTH_SERVICE_URL=http://localhost:3001
LINK_SERVICE_URL=http://localhost:3002
COMMUNITY_SERVICE_URL=http://localhost:3003
CHAT_SERVICE_URL=http://localhost:3004
NEWS_SERVICE_URL=http://localhost:3005
ADMIN_SERVICE_URL=http://localhost:3006

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=your-client-email@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=7d

# API Keys (Optional - will use mock data if not provided)
GEMINI_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
VIRUSTOTAL_API_KEY=your-virustotal-api-key
SCAMADVISER_API_KEY=your-scamadviser-api-key
SCREENSHOTLAYER_API_KEY=your-screenshotlayer-api-key
NEWSAPI_API_KEY=your-newsapi-api-key

# React App Configuration
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8

# Database Configuration
USE_FIREBASE_EMULATOR=false

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Logging
LOG_LEVEL=info
EOF
        print_success ".env file created. Please edit it with your configuration."
        print_warning "You need to configure Firebase credentials in .env file before starting services."
    else
        print_success ".env file already exists"
    fi
}

# Main deployment function
main() {
    echo "🚀 Anti-Fraud Platform - Local Deployment"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_node_version; then
        exit 1
    fi
    
    if ! check_npm_version; then
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "services" ] || [ ! -d "client" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Create .env file
    create_env_file
    
    # Check ports
    print_status "Checking port availability..."
    PORTS=(3000 3001 3002 3003 3004 3005 3006 8080)
    OCCUPIED_PORTS=()
    
    for port in "${PORTS[@]}"; do
        if ! check_port $port; then
            OCCUPIED_PORTS+=($port)
        fi
    done
    
    if [ ${#OCCUPIED_PORTS[@]} -gt 0 ]; then
        print_warning "The following ports are occupied: ${OCCUPIED_PORTS[*]}"
        echo ""
        read -p "Do you want to kill processes on these ports? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for port in "${OCCUPIED_PORTS[@]}"; do
                kill_port $port
            done
        else
            print_error "Cannot proceed with occupied ports. Please free them manually."
            exit 1
        fi
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm run install:all
    
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    print_success "All dependencies installed successfully"
    
    # Start services
    print_status "Starting all services..."
    print_warning "This will start all services in the background."
    print_warning "Use 'npm run stop' or './scripts/stop-local.sh' to stop all services."
    echo ""
    
    # Start services in background
    npm run start &
    
    # Wait a moment for services to start
    sleep 5
    
    # Check if services are running
    print_status "Checking service health..."
    sleep 10  # Give services more time to start
    
    # Try to check API Gateway health
    if command_exists curl; then
        if curl -s http://localhost:8080/health >/dev/null 2>&1; then
            print_success "API Gateway is running on http://localhost:8080"
        else
            print_warning "API Gateway health check failed, but services may still be starting..."
        fi
        
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend is running on http://localhost:3000"
        else
            print_warning "Frontend health check failed, but it may still be starting..."
        fi
    fi
    
    echo ""
    print_success "🎉 Local deployment completed!"
    echo ""
    echo "📋 Service URLs:"
    echo "   Frontend:      http://localhost:3000"
    echo "   API Gateway:   http://localhost:8080"
    echo "   Auth Service:  http://localhost:3001"
    echo "   Link Service:  http://localhost:3002"
    echo "   Community:     http://localhost:3003"
    echo "   Chat Service:  http://localhost:3004"
    echo "   News Service:  http://localhost:3005"
    echo "   Admin Service: http://localhost:3006"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Configure Firebase credentials in .env file"
    echo "   2. Visit http://localhost:3000 to access the application"
    echo "   3. Check service logs if any issues occur"
    echo "   4. Use './scripts/stop-local.sh' to stop all services"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Check logs: npm run logs"
    echo "   - Restart services: npm run restart"
    echo "   - Check service health: curl http://localhost:8080/services/status"
}

# Run main function
main "$@"
