#!/bin/bash

# =============================================================================
# 🐳 Docker Deployment Script - Fixed for Current Project Structure
# =============================================================================
# This script deploys the Anti-Fraud Platform using Docker Compose
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

# Function to check Docker
check_docker() {
    if command_exists docker; then
        if docker info >/dev/null 2>&1; then
            DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
            print_success "Docker version $DOCKER_VERSION is running"
            return 0
        else
            print_error "Docker daemon is not running. Please start Docker Desktop."
            return 1
        fi
    else
        print_error "Docker is not installed. Please install Docker Desktop"
        print_error "Download from: https://www.docker.com/products/docker-desktop"
        return 1
    fi
}

# Function to check Docker Compose
check_docker_compose() {
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker Compose version $COMPOSE_VERSION is available"
        return 0
    elif docker compose version >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version | cut -d' ' -f3)
        print_success "Docker Compose (plugin) version $COMPOSE_VERSION is available"
        return 0
    else
        print_error "Docker Compose is not installed"
        return 1
    fi
}

# Function to create .env file if not exists
create_env_file() {
    if [ ! -f ".env" ]; then
        print_status "Creating .env file..."
        cat > .env << 'EOF'
# =============================================================================
# Anti-Fraud Platform - Docker Configuration
# =============================================================================

# Environment
NODE_ENV=production

# Service URLs (Docker Internal Network)
AUTH_SERVICE_URL=http://auth-service:3001
LINK_SERVICE_URL=http://link-service:3002
COMMUNITY_SERVICE_URL=http://community-service:3005
CHAT_SERVICE_URL=http://chat-service:3004
NEWS_SERVICE_URL=http://news-service:3003
ADMIN_SERVICE_URL=http://admin-service:3006

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Firebase Configuration (Required)
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=your-client-email@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=7d

# API Keys
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
        print_success ".env file created"
        print_warning "Please edit .env file with your Firebase credentials"
    else
        print_success ".env file already exists"
    fi
}

# Function to check docker-compose file
check_docker_compose() {
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        print_status "Please ensure docker-compose.yml exists in the project root"
        exit 1
    fi
    print_success "docker-compose.yml found"
}

# Function to cleanup old containers
cleanup_docker() {
    print_status "Cleaning up old containers..."
    
    # Use appropriate docker-compose command
    if command_exists docker-compose; then
        docker-compose down --remove-orphans 2>/dev/null || true
    else
        docker compose down --remove-orphans 2>/dev/null || true
    fi
    
    # Remove unused images
    docker image prune -f >/dev/null 2>&1 || true
    
    print_success "Docker cleanup completed"
}

# Main function
main() {
    echo "🐳 Anti-Fraud Platform - Docker Deployment"
    echo "==========================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_docker; then
        exit 1
    fi
    
    if ! check_docker_compose; then
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "services" ] || [ ! -d "client" ] || [ ! -d "shared" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Required: package.json, services/, client/, shared/ directories"
        exit 1
    fi
    
    # Create environment file
    create_env_file

    # Check docker-compose file
    check_docker_compose
    
    # Clean up old containers
    cleanup_docker
    
    # Build and start services
    print_status "Building and starting Docker containers..."
    print_warning "This may take several minutes on first run..."
    
    if command_exists docker-compose; then
        docker-compose up --build -d
    else
        docker compose up --build -d
    fi
    
    if [ $? -ne 0 ]; then
        print_error "Failed to start Docker containers"
        exit 1
    fi
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 30
    
    # Check service health
    print_status "Checking service health..."
    
    if command_exists curl; then
        if curl -s http://localhost:8080/health >/dev/null 2>&1; then
            print_success "API Gateway is running on http://localhost:8080"
        else
            print_warning "API Gateway health check failed, services may still be starting..."
        fi
        
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Frontend is running on http://localhost:3000"
        else
            print_warning "Frontend health check failed, it may still be starting..."
        fi
    fi
    
    echo ""
    print_success "🎉 Docker deployment completed!"
    echo ""
    echo "📋 Service URLs:"
    echo "   Frontend:      http://localhost:3000"
    echo "   API Gateway:   http://localhost:8080"
    echo "   Auth Service:  http://localhost:3001"
    echo "   Link Service:  http://localhost:3002"
    echo "   News Service:  http://localhost:3003"
    echo "   Chat Service:  http://localhost:3004"
    echo "   Community:     http://localhost:3005"
    echo "   Admin:         http://localhost:3006"
    echo "   Redis:         localhost:6379"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Configure Firebase credentials in .env file"
    echo "   2. Visit http://localhost:3000 to access the application"
    echo "   3. Check service logs: docker-compose logs -f [service-name]"
    echo "   4. Stop services: docker-compose down"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   - View all logs: docker-compose logs -f"
    echo "   - Check containers: docker ps"
    echo "   - Restart service: docker-compose restart [service-name]"
    echo "   - Check service health: curl http://localhost:8080/health"
}

# Run main function
main "$@"
