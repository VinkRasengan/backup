#!/bin/bash

# =============================================================================
# 🛑 Stop Kubernetes Services Script
# =============================================================================
# This script removes all Kubernetes resources for the Anti-Fraud Platform

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="anti-fraud-platform"

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
    echo "🛑 Stopping Anti-Fraud Platform Kubernetes Services"
    echo "==================================================="
    echo ""
    
    # Check if kubectl is available
    if ! command_exists kubectl; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info >/dev/null 2>&1; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Check if namespace exists
    if ! kubectl get namespace $NAMESPACE >/dev/null 2>&1; then
        print_warning "Namespace $NAMESPACE does not exist"
        exit 0
    fi
    
    print_status "Removing all resources from namespace: $NAMESPACE"
    echo ""
    
    # Show current resources
    print_status "Current resources in namespace:"
    kubectl get all -n $NAMESPACE
    echo ""
    
    # Ask for confirmation
    read -p "Are you sure you want to delete all resources in namespace '$NAMESPACE'? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operation cancelled"
        exit 0
    fi
    
    # Delete all resources in namespace
    print_status "Deleting all resources..."
    
    # Delete deployments
    print_status "Deleting deployments..."
    kubectl delete deployments --all -n $NAMESPACE --timeout=60s
    
    # Delete services
    print_status "Deleting services..."
    kubectl delete services --all -n $NAMESPACE --timeout=60s
    
    # Delete configmaps
    print_status "Deleting configmaps..."
    kubectl delete configmaps --all -n $NAMESPACE --timeout=60s
    
    # Delete secrets
    print_status "Deleting secrets..."
    kubectl delete secrets --all -n $NAMESPACE --timeout=60s
    
    # Delete persistent volume claims
    print_status "Deleting persistent volume claims..."
    kubectl delete pvc --all -n $NAMESPACE --timeout=60s
    
    # Delete ingress
    if kubectl get ingress -n $NAMESPACE >/dev/null 2>&1; then
        print_status "Deleting ingress..."
        kubectl delete ingress --all -n $NAMESPACE --timeout=60s
    fi
    
    # Wait for resources to be deleted
    print_status "Waiting for resources to be deleted..."
    sleep 10
    
    # Check remaining resources
    REMAINING=$(kubectl get all -n $NAMESPACE --no-headers 2>/dev/null | wc -l)
    if [ "$REMAINING" -gt 0 ]; then
        print_warning "Some resources are still being deleted:"
        kubectl get all -n $NAMESPACE
        echo ""
        print_status "Waiting for cleanup to complete..."
        sleep 20
    fi
    
    # Delete namespace
    print_status "Deleting namespace: $NAMESPACE"
    kubectl delete namespace $NAMESPACE --timeout=120s
    
    if [ $? -eq 0 ]; then
        print_success "Namespace $NAMESPACE deleted successfully"
    else
        print_warning "Namespace deletion may still be in progress"
    fi
    
    echo ""
    print_success "🎉 Kubernetes resources removed successfully!"
    echo ""
    print_status "To deploy again, run:"
    echo "   ./scripts/deploy-k8s.sh"
    echo ""
    print_status "To check if any resources remain:"
    echo "   kubectl get all --all-namespaces | grep anti-fraud"
}

# Run main function
main "$@"
