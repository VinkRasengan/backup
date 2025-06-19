#!/bin/bash

# =============================================================================
# 🔍 Kubernetes Cluster Health Check Script
# =============================================================================
# This script checks and helps setup Kubernetes for deployment

# Don't exit on error - we want to continue checking all components

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

# Check Docker
check_docker() {
    print_status "Checking Docker..."
    
    if command_exists docker; then
        if docker info >/dev/null 2>&1; then
            print_success "Docker is running"
            DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
            print_status "Docker version: $DOCKER_VERSION"
            return 0
        else
            print_error "Docker is installed but not running"
            print_error "Please start Docker Desktop"
            return 1
        fi
    else
        print_error "Docker is not installed"
        print_error "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
        return 1
    fi
}

# Check kubectl
check_kubectl() {
    print_status "Checking kubectl..."
    
    if command_exists kubectl; then
        KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3 || echo "unknown")
        print_success "kubectl is installed (version: $KUBECTL_VERSION)"
        return 0
    else
        print_error "kubectl is not installed"
        print_error "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
        return 1
    fi
}

# Check Kubernetes cluster
check_k8s_cluster() {
    print_status "Checking Kubernetes cluster..."
    
    # Check current context
    CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || echo "none")
    print_status "Current context: $CURRENT_CONTEXT"
    
    # Try to connect to cluster
    if kubectl cluster-info >/dev/null 2>&1; then
        print_success "Kubernetes cluster is accessible"
        
        # Get cluster info
        CLUSTER_INFO=$(kubectl cluster-info 2>/dev/null | head -1)
        print_status "$CLUSTER_INFO"
        
        # Check nodes
        NODE_COUNT=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
        print_status "Cluster has $NODE_COUNT node(s)"
        
        return 0
    else
        print_error "Cannot connect to Kubernetes cluster"
        
        if [ "$CURRENT_CONTEXT" = "docker-desktop" ]; then
            print_error "Docker Desktop Kubernetes is not enabled or not running"
            print_error ""
            print_error "To enable Kubernetes in Docker Desktop:"
            print_error "1. Open Docker Desktop"
            print_error "2. Go to Settings (gear icon)"
            print_error "3. Click on 'Kubernetes' tab"
            print_error "4. Check 'Enable Kubernetes'"
            print_error "5. Click 'Apply & Restart'"
            print_error "6. Wait for Kubernetes to start (green indicator)"
        else
            print_error "Please configure kubectl to connect to a Kubernetes cluster"
        fi
        
        return 1
    fi
}

# Check if namespace exists
check_namespace() {
    local namespace="anti-fraud-platform"
    print_status "Checking namespace: $namespace"
    
    if kubectl get namespace $namespace >/dev/null 2>&1; then
        print_success "Namespace $namespace exists"
        
        # Check if there are existing deployments
        DEPLOYMENT_COUNT=$(kubectl get deployments -n $namespace --no-headers 2>/dev/null | wc -l)
        if [ $DEPLOYMENT_COUNT -gt 0 ]; then
            print_warning "Found $DEPLOYMENT_COUNT existing deployment(s) in namespace"
            print_status "Existing deployments:"
            kubectl get deployments -n $namespace --no-headers | awk '{print "  - " $1 " (" $2 "/" $3 " ready)"}'
        fi
        
        return 0
    else
        print_status "Namespace $namespace does not exist (will be created during deployment)"
        return 0
    fi
}

# Check required images
check_images() {
    print_status "Checking Docker images..."
    
    REQUIRED_IMAGES=("auth-service:latest" "link-service:latest" "community-service:latest" "chat-service:latest" "news-service:latest" "admin-service:latest" "api-gateway:latest" "frontend:latest")
    MISSING_IMAGES=()
    
    for image in "${REQUIRED_IMAGES[@]}"; do
        if docker image inspect $image >/dev/null 2>&1; then
            print_success "Image found: $image"
        else
            print_warning "Image missing: $image"
            MISSING_IMAGES+=($image)
        fi
    done
    
    if [ ${#MISSING_IMAGES[@]} -gt 0 ]; then
        print_warning "Missing ${#MISSING_IMAGES[@]} Docker images"
        print_status "These will be built during deployment if Docker is available"
        return 1
    else
        print_success "All required Docker images are available"
        return 0
    fi
}

# Check .env file
check_env_file() {
    print_status "Checking .env file..."
    
    if [ -f ".env" ]; then
        print_success ".env file exists"
        
        # Check for required variables
        REQUIRED_VARS=("FIREBASE_PROJECT_ID" "FIREBASE_CLIENT_EMAIL" "FIREBASE_PRIVATE_KEY" "JWT_SECRET")
        MISSING_VARS=()
        
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "^$var=" .env && [ -n "$(grep "^$var=" .env | cut -d'=' -f2-)" ]; then
                print_success "✓ $var is set"
            else
                print_error "✗ $var is missing or empty"
                MISSING_VARS+=($var)
            fi
        done
        
        if [ ${#MISSING_VARS[@]} -gt 0 ]; then
            print_error "Missing ${#MISSING_VARS[@]} required environment variables"
            print_error "Please update your .env file with the missing variables"
            return 1
        else
            print_success "All required environment variables are set"
            return 0
        fi
    else
        print_error ".env file not found"
        print_error "Please create .env file with your configuration"
        return 1
    fi
}

# Main function
main() {
    echo "🔍 Kubernetes Deployment Health Check"
    echo "====================================="
    echo ""
    
    CHECKS_PASSED=0
    TOTAL_CHECKS=6
    
    # Run all checks
    if check_docker; then
        ((CHECKS_PASSED++))
    fi
    echo ""
    
    if check_kubectl; then
        ((CHECKS_PASSED++))
    fi
    echo ""
    
    if check_k8s_cluster; then
        ((CHECKS_PASSED++))
    fi
    echo ""
    
    if check_namespace; then
        ((CHECKS_PASSED++))
    fi
    echo ""
    
    if check_images; then
        ((CHECKS_PASSED++))
    fi
    echo ""
    
    if check_env_file; then
        ((CHECKS_PASSED++))
    fi
    echo ""
    
    # Summary
    echo "📊 Health Check Summary"
    echo "======================"
    echo "Checks passed: $CHECKS_PASSED/$TOTAL_CHECKS"
    echo ""
    
    if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
        print_success "🎉 All checks passed! Ready for Kubernetes deployment"
        echo ""
        echo "Run: bash scripts/deploy-k8s.sh"
    elif [ $CHECKS_PASSED -ge 4 ]; then
        print_warning "⚠️  Most checks passed. Deployment may work but some issues detected"
        echo ""
        echo "You can try: bash scripts/deploy-k8s.sh"
    else
        print_error "❌ Multiple issues detected. Please fix the errors above before deploying"
        echo ""
        echo "Common fixes:"
        echo "- Start Docker Desktop"
        echo "- Enable Kubernetes in Docker Desktop settings"
        echo "- Create/update .env file with your credentials"
    fi
}

# Run main function
main "$@"
