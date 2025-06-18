#!/bin/bash

# Deploy Anti-Fraud Platform to Kubernetes
# This script deploys the entire microservices stack with monitoring

set -e

echo "🚀 Deploying Anti-Fraud Platform to Kubernetes..."
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    echo "Make sure your cluster is running and kubectl is configured"
    exit 1
fi

echo "✅ Kubernetes cluster is accessible"
echo ""

# Function to wait for deployment to be ready
wait_for_deployment() {
    local namespace=$1
    local deployment=$2
    local timeout=${3:-300}
    
    echo "⏳ Waiting for $deployment in $namespace to be ready..."
    if kubectl wait --for=condition=available --timeout=${timeout}s deployment/$deployment -n $namespace; then
        echo "✅ $deployment is ready"
    else
        echo "❌ $deployment failed to become ready within ${timeout}s"
        return 1
    fi
}

# Function to wait for pods to be ready
wait_for_pods() {
    local namespace=$1
    local label=$2
    local timeout=${3:-300}
    
    echo "⏳ Waiting for pods with label $label in $namespace..."
    if kubectl wait --for=condition=ready --timeout=${timeout}s pod -l $label -n $namespace; then
        echo "✅ Pods are ready"
    else
        echo "❌ Pods failed to become ready within ${timeout}s"
        return 1
    fi
}

# Step 1: Create namespaces
echo "📁 Creating namespaces..."
kubectl apply -f monitoring-namespace.yml
echo ""

# Step 2: Create ConfigMaps and Secrets
echo "⚙️  Creating ConfigMaps..."
kubectl apply -f configmap.yml
echo ""

# Step 3: Deploy Redis (dependency for other services)
echo "🗄️  Deploying Redis..."
kubectl apply -f redis.yml
wait_for_deployment anti-fraud-platform redis
echo ""

# Step 4: Deploy monitoring stack
echo "📊 Deploying monitoring stack..."
kubectl apply -f prometheus.yml
kubectl apply -f grafana.yml

wait_for_deployment monitoring prometheus
wait_for_deployment monitoring grafana
echo ""

# Step 5: Deploy microservices
echo "🔧 Deploying microservices..."
kubectl apply -f auth-service.yml
kubectl apply -f api-gateway.yml
kubectl apply -f microservices.yml

# Wait for auth service first (other services depend on it)
wait_for_deployment anti-fraud-platform auth-service

# Wait for other services
wait_for_deployment anti-fraud-platform api-gateway
wait_for_deployment anti-fraud-platform link-service
wait_for_deployment anti-fraud-platform community-service
wait_for_deployment anti-fraud-platform chat-service
wait_for_deployment anti-fraud-platform news-service
wait_for_deployment anti-fraud-platform admin-service
echo ""

# Step 6: Deploy frontend
echo "🌐 Deploying frontend..."
kubectl apply -f frontend.yml
wait_for_deployment anti-fraud-platform frontend
echo ""

# Step 7: Show deployment status
echo "📋 Deployment Summary:"
echo ""
echo "Namespaces:"
kubectl get namespaces | grep -E "(anti-fraud-platform|monitoring)"
echo ""

echo "Monitoring Stack:"
kubectl get pods -n monitoring
echo ""

echo "Application Services:"
kubectl get pods -n anti-fraud-platform
echo ""

echo "Services:"
kubectl get services -n anti-fraud-platform
kubectl get services -n monitoring
echo ""

# Step 8: Show access information
echo "🌐 Access Information:"
echo ""

# Get NodePort for API Gateway
API_GATEWAY_PORT=$(kubectl get service api-gateway -n anti-fraud-platform -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "N/A")
GRAFANA_PORT=$(kubectl get service grafana -n monitoring -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30300")
PROMETHEUS_PORT=$(kubectl get service prometheus -n monitoring -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30090")

# Get cluster IP (try different methods)
CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' 2>/dev/null)
if [ -z "$CLUSTER_IP" ]; then
    CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null)
fi
if [ -z "$CLUSTER_IP" ]; then
    CLUSTER_IP="localhost"
fi

echo "🔗 Application URLs:"
if [ "$API_GATEWAY_PORT" != "N/A" ]; then
    echo "   API Gateway: http://$CLUSTER_IP:$API_GATEWAY_PORT"
fi
echo "   Grafana: http://$CLUSTER_IP:$GRAFANA_PORT (admin/admin123)"
echo "   Prometheus: http://$CLUSTER_IP:$PROMETHEUS_PORT"
echo ""

echo "🎉 Deployment completed successfully!"
echo ""
echo "💡 Next steps:"
echo "1. Wait a few minutes for all services to fully start"
echo "2. Check Prometheus targets: http://$CLUSTER_IP:$PROMETHEUS_PORT/targets"
echo "3. Import Grafana dashboards for microservices monitoring"
echo "4. Test the application endpoints"
echo ""

echo "🔍 Useful commands:"
echo "   kubectl get pods -n anti-fraud-platform"
echo "   kubectl get pods -n monitoring"
echo "   kubectl logs -f deployment/api-gateway -n anti-fraud-platform"
echo "   kubectl port-forward service/grafana 3000:3000 -n monitoring"
