#!/bin/bash

# =============================================================================
# ☸️ Kubernetes Deployment Script
# =============================================================================
# This script deploys the Anti-Fraud Platform to Kubernetes
# Works with any Kubernetes cluster (local, cloud, etc.)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="anti-fraud-platform"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-localhost:5000}"

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

# Function to check kubectl
check_kubectl() {
    if command_exists kubectl; then
        KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3)
        print_success "kubectl version $KUBECTL_VERSION is available"
        
        # Check cluster connectivity
        if kubectl cluster-info >/dev/null 2>&1; then
            print_success "Connected to Kubernetes cluster"
            return 0
        else
            print_error "Cannot connect to Kubernetes cluster"
            print_error "Please ensure kubectl is configured and cluster is accessible"
            return 1
        fi
    else
        print_error "kubectl is not installed"
        print_error "Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
        return 1
    fi
}

# Function to check Docker (for building images)
check_docker() {
    if command_exists docker; then
        if docker info >/dev/null 2>&1; then
            print_success "Docker is available for building images"
            return 0
        else
            print_warning "Docker daemon is not running. Images must be pre-built."
            return 1
        fi
    else
        print_warning "Docker is not installed. Images must be pre-built."
        return 1
    fi
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Services to build
    SERVICES=("auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service" "api-gateway")
    
    for service in "${SERVICES[@]}"; do
        print_status "Building $service..."
        if [ -d "services/$service" ]; then
            docker build -t "$service:latest" -f "services/$service/Dockerfile" .
            if [ $? -eq 0 ]; then
                print_success "Built $service:latest"
            else
                print_error "Failed to build $service"
                return 1
            fi
        else
            print_error "Service directory not found: services/$service"
            return 1
        fi
    done
    
    # Build frontend (use client directory as context)
    print_status "Building frontend..."
    if [ -d "client" ]; then
        docker build -t "frontend:latest" -f "client/Dockerfile" client/
        if [ $? -eq 0 ]; then
            print_success "Built frontend:latest"
        else
            print_error "Failed to build frontend"
            return 1
        fi
    else
        print_error "Client directory not found"
        return 1
    fi
    
    print_success "All images built successfully"
}

# Function to create namespace
create_namespace() {
    print_status "Creating namespace: $NAMESPACE"
    
    if kubectl get namespace $NAMESPACE >/dev/null 2>&1; then
        print_warning "Namespace $NAMESPACE already exists"
    else
        kubectl apply -f k8s/namespace.yml
        print_success "Namespace $NAMESPACE created"
    fi
}

# Function to create secrets
create_secrets() {
    print_status "Creating secrets from .env file..."

    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        print_error "Please create .env file with your credentials"
        print_error "You can copy from .env.example if available"
        return 1
    fi

    # Source .env file
    set -a  # Export all variables
    source .env
    set +a  # Stop exporting

    # Validate required secrets
    REQUIRED_VARS=("FIREBASE_PROJECT_ID" "FIREBASE_CLIENT_EMAIL" "FIREBASE_PRIVATE_KEY" "JWT_SECRET")
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set in .env file"
            return 1
        fi
    done

    # Delete existing secret if it exists (to avoid conflicts)
    kubectl delete secret app-secrets -n $NAMESPACE 2>/dev/null || true

    # Create secret with proper error handling
    print_status "Creating Kubernetes secret..."
    kubectl create secret generic app-secrets \
        --from-literal=FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
        --from-literal=FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
        --from-literal=FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL" \
        --from-literal=JWT_SECRET="$JWT_SECRET" \
        --from-literal=GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
        --from-literal=VIRUSTOTAL_API_KEY="${VIRUSTOTAL_API_KEY:-}" \
        --from-literal=SCAMADVISER_API_KEY="${SCAMADVISER_API_KEY:-}" \
        --from-literal=SCREENSHOTLAYER_API_KEY="${SCREENSHOTLAYER_API_KEY:-}" \
        --from-literal=NEWSAPI_API_KEY="${NEWSAPI_API_KEY:-}" \
        --from-literal=NEWSDATA_API_KEY="${NEWSDATA_API_KEY:-}" \
        --from-literal=REACT_APP_FIREBASE_API_KEY="${REACT_APP_FIREBASE_API_KEY:-}" \
        --namespace=$NAMESPACE

    if [ $? -eq 0 ]; then
        print_success "Secrets created successfully"

        # Verify secret was created
        print_status "Verifying secret creation..."
        kubectl get secret app-secrets -n $NAMESPACE -o yaml | grep -E "FIREBASE_PROJECT_ID|JWT_SECRET" >/dev/null
        if [ $? -eq 0 ]; then
            print_success "Secret verification passed"
        else
            print_warning "Secret verification failed - secrets may be empty"
        fi
    else
        print_error "Failed to create secrets"
        return 1
    fi
}

# Function to deploy services
deploy_services() {
    print_status "Deploying services to Kubernetes..."

    # Apply ConfigMap (without secrets - secrets are created separately)
    kubectl apply -f k8s/configmap.yml

    # Apply Redis first (other services depend on it)
    kubectl apply -f k8s/redis.yml

    # Wait for Redis to be ready before deploying other services
    print_status "Waiting for Redis to be ready..."
    kubectl wait --for=condition=available --timeout=120s deployment/redis -n $NAMESPACE || true

    # Apply services in order
    kubectl apply -f k8s/auth-service.yml
    kubectl apply -f k8s/microservices.yml
    kubectl apply -f k8s/api-gateway.yml
    kubectl apply -f k8s/frontend.yml

    print_success "All services deployed"
}

# Function to wait for deployments
wait_for_deployments() {
    print_status "Waiting for deployments to be ready..."

    # Wait for deployments in order of dependency
    CRITICAL_DEPLOYMENTS=("redis" "auth-service")
    OTHER_DEPLOYMENTS=("link-service" "community-service" "chat-service" "news-service" "admin-service" "api-gateway" "frontend")

    # Wait for critical services first
    for deployment in "${CRITICAL_DEPLOYMENTS[@]}"; do
        print_status "Waiting for critical service: $deployment..."
        kubectl wait --for=condition=available --timeout=180s deployment/$deployment -n $NAMESPACE
        if [ $? -eq 0 ]; then
            print_success "$deployment is ready"
        else
            print_error "$deployment failed to start - checking logs..."
            kubectl logs deployment/$deployment -n $NAMESPACE --tail=20 || true
            print_error "Deployment $deployment is not ready. This may cause other services to fail."
        fi
    done

    # Wait for other services
    for deployment in "${OTHER_DEPLOYMENTS[@]}"; do
        print_status "Waiting for $deployment..."
        kubectl wait --for=condition=available --timeout=120s deployment/$deployment -n $NAMESPACE
        if [ $? -eq 0 ]; then
            print_success "$deployment is ready"
        else
            print_warning "$deployment is taking longer than expected"
            # Show pod status for debugging
            kubectl get pods -l app=$deployment -n $NAMESPACE
            print_warning "Check logs with: kubectl logs deployment/$deployment -n $NAMESPACE"
        fi
    done

    print_status "Deployment wait completed. Checking overall status..."
}

# Function to show service status
show_status() {
    echo ""
    print_status "Deployment Status:"
    echo ""
    
    # Show pods
    echo "📦 Pods:"
    kubectl get pods -n $NAMESPACE
    echo ""
    
    # Show services
    echo "🌐 Services:"
    kubectl get services -n $NAMESPACE
    echo ""
    
    # Show ingress if exists
    if kubectl get ingress -n $NAMESPACE >/dev/null 2>&1; then
        echo "🔗 Ingress:"
        kubectl get ingress -n $NAMESPACE
        echo ""
    fi
}

# Function to show access instructions
show_access_info() {
    echo ""
    print_success "🎉 Kubernetes deployment completed!"
    echo ""
    echo "📋 Access Information:"
    echo ""
    
    # Get service IPs
    API_GATEWAY_IP=$(kubectl get service api-gateway -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    FRONTEND_IP=$(kubectl get service frontend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    
    if [ "$API_GATEWAY_IP" != "pending" ] && [ -n "$API_GATEWAY_IP" ]; then
        echo "   API Gateway:   http://$API_GATEWAY_IP:8082"
    else
        echo "   API Gateway:   kubectl port-forward service/api-gateway 8082:8082 -n $NAMESPACE"
    fi
    
    if [ "$FRONTEND_IP" != "pending" ] && [ -n "$FRONTEND_IP" ]; then
        echo "   Frontend:      http://$FRONTEND_IP:3000"
    else
        echo "   Frontend:      kubectl port-forward service/frontend 3000:3000 -n $NAMESPACE"
    fi
    
    echo ""
    echo "📝 Useful Commands:"
    echo "   View pods:     kubectl get pods -n $NAMESPACE"
    echo "   View logs:     kubectl logs -f deployment/[service-name] -n $NAMESPACE"
    echo "   Scale service: kubectl scale deployment [service-name] --replicas=3 -n $NAMESPACE"
    echo "   Delete all:    kubectl delete namespace $NAMESPACE"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   Check events:  kubectl get events -n $NAMESPACE"
    echo "   Describe pod:  kubectl describe pod [pod-name] -n $NAMESPACE"
    echo "   Service logs:  kubectl logs [pod-name] -n $NAMESPACE"
}

# Main deployment function
main() {
    echo "☸️ Anti-Fraud Platform - Kubernetes Deployment"
    echo "==============================================="
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_kubectl; then
        exit 1
    fi
    
    DOCKER_AVAILABLE=false
    if check_docker; then
        DOCKER_AVAILABLE=true
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "services" ] || [ ! -d "client" ] || [ ! -d "k8s" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Build images if Docker is available
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_status "Building Docker images for Kubernetes..."
        build_images
    else
        print_warning "Skipping image build. Ensure images are available in your cluster."
    fi
    
    # Create namespace
    create_namespace
    
    # Create secrets
    create_secrets
    
    # Deploy services
    deploy_services
    
    # Wait for deployments
    wait_for_deployments
    
    # Show status
    show_status
    
    # Show access information
    show_access_info
}

# Run main function
main "$@"
