#!/bin/bash

# =============================================================================
# 🚀 Local Deployment Script - Fixed for Windows Compatibility
# =============================================================================
# This script deploys the Anti-Fraud Platform locally without Docker
# Optimized for Windows (Git Bash), macOS, and Linux

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
        print_error "Download from: https://nodejs.org/"
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

# Function to check if port is available (Windows compatible)
check_port() {
    local port=$1
    local os=$(detect_os)
    
    case $os in
        "windows")
            # Windows approach using netstat
            if netstat -an 2>/dev/null | grep -q ":$port "; then
                return 1
            fi
            ;;
        "macos"|"linux")
            # Unix approach
            if command_exists lsof; then
                if lsof -i :$port >/dev/null 2>&1; then
                    return 1
                fi
            elif command_exists netstat; then
                if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                    return 1
                fi
            fi
            ;;
    esac
    return 0
}

# Function to kill process on port (Windows compatible)
kill_port() {
    local port=$1
    local os=$(detect_os)
    
    print_status "Attempting to free port $port..."
    
    case $os in
        "windows")
            # Windows approach
            local pid=$(netstat -ano 2>/dev/null | grep ":$port " | awk '{print $5}' | head -1)
            if [ -n "$pid" ] && [ "$pid" != "0" ]; then
                taskkill //PID $pid //F 2>/dev/null || true
                print_success "Killed process on port $port"
            else
                print_warning "No process found on port $port"
            fi
            ;;
        "macos"|"linux")
            # Unix approach
            if command_exists lsof; then
                local pid=$(lsof -t -i:$port 2>/dev/null || true)
                if [ -n "$pid" ]; then
                    kill -9 $pid 2>/dev/null || true
                    print_success "Killed process on port $port"
                else
                    print_warning "No process found on port $port"
                fi
            fi
            ;;
    esac
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
COMMUNITY_SERVICE_URL=http://localhost:3005
CHAT_SERVICE_URL=http://localhost:3004
NEWS_SERVICE_URL=http://localhost:3003
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
NEWSDATA_API_KEY=your-newsdata-api-key

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

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Check if package.json has install:all script
    if npm run | grep -q "install:all"; then
        npm run install:all
    else
        # Fallback: install manually
        print_status "Installing root dependencies..."
        npm install
        
        print_status "Installing client dependencies..."
        if [ -d "client" ]; then
            cd client && npm install && cd ..
        fi
        
        print_status "Installing service dependencies..."
        for service_dir in services/*/; do
            if [ -f "$service_dir/package.json" ]; then
                service_name=$(basename "$service_dir")
                print_status "Installing dependencies for $service_name..."
                cd "$service_dir" && npm install && cd ../..
            fi
        done
    fi
    
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        return 1
    fi
    
    print_success "All dependencies installed successfully"
}

# Function to start services
start_services() {
    print_status "Starting all services..."
    
    # Check if package.json has start:full script
    if npm run | grep -q "start:full"; then
        print_status "Using npm run start:full..."
        npm run start:full &
    elif npm run | grep -q "start"; then
        print_status "Using npm run start..."
        npm run start &
    else
        print_error "No start script found in package.json"
        print_error "Please ensure your package.json has a 'start' or 'start:full' script"
        return 1
    fi
    
    # Store the background process PID
    START_PID=$!
    echo $START_PID > .start_pid
    
    print_success "Services started in background (PID: $START_PID)"
    print_warning "Use 'npm run stop' or './scripts/stop-local.sh' to stop all services."
}

# Function to check service health
check_service_health() {
    print_status "Checking service health..."
    sleep 15  # Give services time to start
    
    # Check if curl is available
    if ! command_exists curl; then
        print_warning "curl not found. Cannot check service health automatically."
        print_warning "Please check manually by visiting http://localhost:3000"
        return 0
    fi
    
    # Check API Gateway
    local retries=0
    local max_retries=6
    while [ $retries -lt $max_retries ]; do
        if curl -s http://localhost:8082/health >/dev/null 2>&1; then
            print_success "API Gateway is running on http://localhost:8082"
            break
        else
            retries=$((retries + 1))
            if [ $retries -lt $max_retries ]; then
                print_status "API Gateway not ready yet, waiting... ($retries/$max_retries)"
                sleep 10
            else
                print_warning "API Gateway health check failed after $max_retries attempts"
            fi
        fi
    done
    
    # Check Frontend
    retries=0
    while [ $retries -lt $max_retries ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend is running on http://localhost:3000"
            break
        else
            retries=$((retries + 1))
            if [ $retries -lt $max_retries ]; then
                print_status "Frontend not ready yet, waiting... ($retries/$max_retries)"
                sleep 10
            else
                print_warning "Frontend health check failed after $max_retries attempts"
            fi
        fi
    done
}

# Main deployment function
main() {
    local os=$(detect_os)
    
    echo "🚀 Anti-Fraud Platform - Local Deployment"
    echo "=========================================="
    echo "OS Detected: $os"
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
    if [ ! -f "package.json" ] || [ ! -d "services" ] || [ ! -d "client" ] || [ ! -d "shared" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Required: package.json, services/, client/, shared/ directories"
        exit 1
    fi
    
    # Create .env file
    create_env_file
    
    # Check ports
    print_status "Checking port availability..."
    PORTS=(3000 3001 3002 3003 3004 3005 3006 8082)
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
            sleep 2  # Give time for ports to be freed
        else
            print_error "Cannot proceed with occupied ports. Please free them manually."
            exit 1
        fi
    fi
    
    # Install dependencies
    install_dependencies
    
    # Start services
    start_services
    
    # Check service health
    check_service_health
    
    echo ""
    print_success "🎉 Local deployment completed!"
    echo ""
    echo "📋 Service URLs:"
    echo "   Frontend:      http://localhost:3000"
    echo "   API Gateway:   http://localhost:8082"
    echo "   Auth Service:  http://localhost:3001"
    echo "   Link Service:  http://localhost:3002"
    echo "   News Service:  http://localhost:3003"
    echo "   Chat Service:  http://localhost:3004"
    echo "   Community:     http://localhost:3005"
    echo "   Admin Service: http://localhost:3006"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Configure Firebase credentials in .env file"
    echo "   2. Visit http://localhost:3000 to access the application"
    echo "   3. Check service logs if any issues occur"
    echo "   4. Use 'npm run stop' to stop all services"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - Check logs: npm run logs (if available)"
    echo "   - Restart services: npm run restart (if available)"
    echo "   - Check service health: curl http://localhost:8082/health"
    echo "   - Manual stop: kill \$(cat .start_pid) (if needed)"
}

# Run main function
main "$@"
