#!/bin/bash

# Generate Kubernetes manifests for all microservices

set -e

# Define services and their ports
declare -A services=(
    ["api-gateway"]="8080"
    ["auth-service"]="3001"
    ["link-service"]="3002"
    ["community-service"]="3003"
    ["chat-service"]="3004"
    ["news-service"]="3005"
    ["admin-service"]="3006"
)

# Create k8s directory if it doesn't exist
mkdir -p k8s/services

echo "Generating Kubernetes manifests for microservices..."

# Generate manifests for each service
for service in "${!services[@]}"; do
    port=${services[$service]}
    echo "Generating manifest for $service (port: $port)"
    
    # Copy template and replace placeholders
    sed "s/{{SERVICE_NAME}}/$service/g; s/{{PORT}}/$port/g" k8s/service-template.yml > "k8s/services/$service.yml"
    
    echo "Generated k8s/services/$service.yml"
done

echo "All Kubernetes manifests generated successfully!"

# Generate API Gateway specific configuration
echo "Generating API Gateway ingress..."

cat > k8s/ingress.yml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-gateway-ingress
  namespace: anti-fraud-platform
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.anti-fraud-platform.com
    secretName: api-gateway-tls
  rules:
  - host: api.anti-fraud-platform.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8080
EOF

echo "Generated k8s/ingress.yml"

# Generate deployment script
cat > scripts/deploy-k8s.sh << 'EOF'
#!/bin/bash

# Deploy all microservices to Kubernetes

set -e

echo "Deploying Anti-Fraud Platform to Kubernetes..."

# Apply namespace
kubectl apply -f k8s/namespace.yml

# Apply ConfigMap and Secrets
kubectl apply -f k8s/configmap.yml

# Apply Redis
kubectl apply -f k8s/redis.yml

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/redis -n anti-fraud-platform

# Apply all services
for file in k8s/services/*.yml; do
    echo "Applying $file"
    kubectl apply -f "$file"
done

# Apply ingress
kubectl apply -f k8s/ingress.yml

# Wait for all deployments to be ready
echo "Waiting for all deployments to be ready..."
kubectl wait --for=condition=available --timeout=600s deployment --all -n anti-fraud-platform

echo "Deployment completed successfully!"

# Show status
echo "Current status:"
kubectl get pods -n anti-fraud-platform
kubectl get services -n anti-fraud-platform
kubectl get ingress -n anti-fraud-platform
EOF

chmod +x scripts/deploy-k8s.sh
echo "Generated scripts/deploy-k8s.sh"

echo "Kubernetes setup completed!"
echo ""
echo "To deploy to Kubernetes:"
echo "1. Update secrets in k8s/configmap.yml"
echo "2. Run: ./scripts/deploy-k8s.sh"
