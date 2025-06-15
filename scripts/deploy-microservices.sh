#!/bin/bash

# =============================================================================
# Anti-Fraud Platform Microservices Deployment Script
# =============================================================================
# 
# SECURITY NOTICE:
# This script contains configuration templates only.
# All sensitive information must be provided via .env file.
# 
# NEVER share this script with production credentials embedded.
# Always use environment variables for sensitive data.
# =============================================================================

echo "🚀 Deploying Anti-Fraud Platform Microservices..."
echo "=================================================="

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

# Check if Docker is running
print_status "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create .env template if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env template file..."
    cat > .env << 'EOF'
# =============================================================================
# CONFIGURATION TEMPLATE - PLEASE UPDATE ALL VALUES BELOW
# =============================================================================

# Service Configuration
NODE_ENV=production

# =============================================================================
# REQUIRED: Firebase Configuration 
# Get these from your Firebase Console > Project Settings > Service Accounts
# =============================================================================
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nREPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----"

# =============================================================================
# REQUIRED: JWT Configuration
# Generate a secure secret key (minimum 32 characters)
# =============================================================================
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_SECRET_KEY_AT_LEAST_32_CHARS

# =============================================================================
# REQUIRED: API Keys - Get from respective providers
# =============================================================================
GEMINI_API_KEY=your_gemini_api_key_here
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
SCAMADVISER_API_KEY=your_scamadviser_api_key_here
SCREENSHOTLAYER_API_KEY=your_screenshotlayer_api_key_here
NEWSAPI_API_KEY=your_newsapi_api_key_here

# =============================================================================
# Service URLs (Auto-configured for Docker - DO NOT CHANGE)
# =============================================================================
AUTH_SERVICE_URL=http://auth-service:3001
LINK_SERVICE_URL=http://link-service:3002
COMMUNITY_SERVICE_URL=http://community-service:3003
CHAT_SERVICE_URL=http://chat-service:3004
NEWS_SERVICE_URL=http://news-service:3005
ADMIN_SERVICE_URL=http://admin-service:3006

# =============================================================================
# CORS Configuration - Update with your frontend URL
# =============================================================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# =============================================================================
# React App Configuration - Update with your Firebase settings
# =============================================================================
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
EOF
    print_success "✅ .env template created"
    print_warning "⚠️  IMPORTANT: Please update all placeholder values in .env file before deployment!"
    print_warning "⚠️  The deployment will not work with default template values."
    echo ""
    read -p "Press Enter to continue after updating .env file..."
else
    print_status ".env file already exists"
fi

# Function to validate environment variables
validate_environment() {
    print_status "Validating environment configuration..."
    
    # Load .env file
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # Required variables
    required_vars=(
        "FIREBASE_PROJECT_ID"
        "FIREBASE_CLIENT_EMAIL" 
        "FIREBASE_PRIVATE_KEY"
        "JWT_SECRET"
        "GEMINI_API_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] || [[ "${!var}" == *"your_"* ]] || [[ "${!var}" == *"CHANGE_THIS"* ]] || [[ "${!var}" == *"REPLACE_WITH"* ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "❌ Missing or invalid required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "   - $var"
        done
        echo ""
        print_error "Please update the .env file with valid configuration values."
        print_error "Refer to the setup documentation for obtaining these values."
        exit 1
    fi
    
    print_success "✅ Environment validation passed"
}

# Validate environment variables
validate_environment

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.microservices.yml down > /dev/null 2>&1

# Build and start all services
print_status "Building and starting microservices..."
print_warning "This may take a few minutes for the first build..."

if docker-compose -f docker-compose.microservices.yml up --build -d; then
    print_success "All services started successfully!"
else
    print_error "Failed to start services. Check the logs for details."
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to initialize..."
sleep 30

# Health check function
check_service_health() {
    local service_name=$1
    local service_url=$2
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$service_url" > /dev/null 2>&1; then
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    return 1
}

# Check service health
print_status "Checking service health..."
echo "================================"

services=(
    "API Gateway:http://localhost:8080/health"
    "Auth Service:http://localhost:3001/health"
    "Link Service:http://localhost:3002/health"
    "Community Service:http://localhost:3003/health"
    "Chat Service:http://localhost:3004/health"
    "News Service:http://localhost:3005/health"
    "Admin Service:http://localhost:3006/health"
)

healthy_count=0
total_services=${#services[@]}

for service in "${services[@]}"; do
    IFS=':' read -r name url <<< "$service"
    if check_service_health "$name" "$url"; then
        print_success "$name is healthy"
        ((healthy_count++))
    else
        print_warning "$name is not responding (may still be starting up)"
    fi
done

echo ""
print_status "Health Summary: $healthy_count/$total_services services are healthy"

# Display service URLs
echo ""
print_success "Deployment completed!"
echo ""
echo "📊 Service URLs:"
echo "  API Gateway:      http://localhost:8080"
echo "  Frontend:         http://localhost:3000"
echo "  Auth Service:     http://localhost:3001"
echo "  Link Service:     http://localhost:3002"
echo "  Community Service: http://localhost:3003"
echo "  Chat Service:     http://localhost:3004"
echo "  News Service:     http://localhost:3005"
echo "  Admin Service:    http://localhost:3006"
echo ""
echo "📈 Monitoring:"
echo "  Prometheus:       http://localhost:9090"
echo "  Grafana:          http://localhost:3007 (admin/admin)"
echo "  Jaeger:           http://localhost:16686"
echo ""
echo "🔧 Management:"
echo "  View logs:        docker-compose -f docker-compose.microservices.yml logs -f [service-name]"
echo "  Stop services:    docker-compose -f docker-compose.microservices.yml down"
echo "  Restart service:  docker-compose -f docker-compose.microservices.yml restart [service-name]"
echo ""

if [ $healthy_count -eq $total_services ]; then
    print_success "🎉 All services are healthy and ready to use!"
else
    print_warning "⚠️  Some services may still be starting up. Wait a few minutes and check again."
    echo "   You can check service status with: curl http://localhost:8080/services/status"
fi