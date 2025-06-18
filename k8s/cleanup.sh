#!/bin/bash

# Cleanup Anti-Fraud Platform from Kubernetes
# This script removes all deployed resources

set -e

echo "🧹 Cleaning up Anti-Fraud Platform from Kubernetes..."
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"
echo ""

# Function to safely delete resources
safe_delete() {
    local resource=$1
    echo "🗑️  Deleting $resource..."
    if kubectl delete -f $resource --ignore-not-found=true; then
        echo "✅ $resource deleted"
    else
        echo "⚠️  Failed to delete $resource (may not exist)"
    fi
}

# Delete in reverse order of deployment
echo "🗑️  Removing all resources..."
echo ""

# Delete frontend
safe_delete frontend.yml

# Delete microservices
safe_delete microservices.yml
safe_delete api-gateway.yml
safe_delete auth-service.yml

# Delete Redis
safe_delete redis.yml

# Delete monitoring stack
safe_delete grafana.yml
safe_delete prometheus.yml

# Delete ConfigMaps
safe_delete configmap.yml

# Delete namespaces (this will delete everything in them)
echo "🗑️  Deleting namespaces..."
kubectl delete namespace anti-fraud-platform --ignore-not-found=true
kubectl delete namespace monitoring --ignore-not-found=true

echo ""
echo "✅ Cleanup completed!"
echo ""

# Show remaining resources (should be empty)
echo "📋 Remaining resources:"
kubectl get namespaces | grep -E "(anti-fraud-platform|monitoring)" || echo "No anti-fraud-platform or monitoring namespaces found"
