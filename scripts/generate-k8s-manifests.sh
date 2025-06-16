#!/bin/bash

# =============================================================================
# 🚀 Kubernetes Manifests Generator for Anti-Fraud Platform
# Automatically generates K8s manifests for all microservices
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Emojis
ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
INFO="ℹ️"
GEAR="⚙️"

# Print functions
print_header() {
    echo -e "\n${WHITE}${ROCKET} $1${NC}"
    echo -e "${WHITE}============================================================${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
K8S_DIR="$PROJECT_ROOT/k8s"
MANIFESTS_DIR="$K8S_DIR/manifests"
TEMPLATE_FILE="$K8S_DIR/service-template.yml"

# Service definitions
declare -A SERVICES=(
    ["api-gateway"]="8080"
    ["auth-service"]="3001"
    ["link-service"]="3002"
    ["community-service"]="3003"
    ["chat-service"]="3004"
    ["news-service"]="3005"
    ["admin-service"]="3006"
    ["frontend"]="3000"
)

# Docker registry (modify this to your registry)
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io/your-org/anti-fraud-platform}"

# Create manifests directory
mkdir -p "$MANIFESTS_DIR"

# Function to generate service manifest
generate_service_manifest() {
    local service_name=$1
    local port=$2
    local output_file="$MANIFESTS_DIR/${service_name}.yml"
    
    print_info "Generating manifest for $service_name (port: $port)"
    
    # Create manifest from template
    sed -e "s/{{SERVICE_NAME}}/$service_name/g" \
        -e "s/{{PORT}}/$port/g" \
        -e "s|{{DOCKER_REGISTRY}}|$DOCKER_REGISTRY|g" \
        "$TEMPLATE_FILE" > "$output_file"
    
    print_success "Generated: $output_file"
}

# Function to generate ConfigMap
generate_configmap() {
    local config_file="$MANIFESTS_DIR/configmap.yml"
    
    print_info "Generating ConfigMap"
    
    cat > "$config_file" << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: anti-fraud-platform
data:
  NODE_ENV: "production"
  REDIS_URL: "redis://redis:6379"
  AUTH_SERVICE_URL: "http://auth-service:3001"
  LINK_SERVICE_URL: "http://link-service:3002"
  COMMUNITY_SERVICE_URL: "http://community-service:3003"
  CHAT_SERVICE_URL: "http://chat-service:3004"
  NEWS_SERVICE_URL: "http://news-service:3005"
  ADMIN_SERVICE_URL: "http://admin-service:3006"
  API_GATEWAY_URL: "http://api-gateway:8080"
EOF
    
    print_success "Generated: $config_file"
}

# Function to generate Secret template
generate_secret_template() {
    local secret_file="$MANIFESTS_DIR/secret-template.yml"
    
    print_info "Generating Secret template"
    
    cat > "$secret_file" << 'EOF'
# Secret Template - Replace with your actual values
# DO NOT commit actual secrets to version control
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: anti-fraud-platform
type: Opaque
stringData:
  JWT_SECRET: "your-jwt-secret-key-here"
  FIREBASE_PROJECT_ID: "your-firebase-project-id"
  FIREBASE_CLIENT_EMAIL: "your-firebase-client-email"
  FIREBASE_PRIVATE_KEY: |
    -----BEGIN PRIVATE KEY-----
    Your Firebase Private Key Here
    -----END PRIVATE KEY-----
  GEMINI_API_KEY: "your-gemini-api-key"
  VIRUSTOTAL_API_KEY: "your-virustotal-api-key"
  SCAMADVISER_API_KEY: "your-scamadviser-api-key"
  NEWSAPI_KEY: "your-newsapi-key"
  SCREENSHOTLAYER_API_KEY: "your-screenshotlayer-api-key"
EOF
    
    print_success "Generated: $secret_file"
    print_info "Please update the secret values before deploying!"
}

# Function to generate Ingress
generate_ingress() {
    local ingress_file="$MANIFESTS_DIR/ingress.yml"
    
    print_info "Generating Ingress"
    
    cat > "$ingress_file" << 'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: anti-fraud-platform-ingress
  namespace: anti-fraud-platform
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "Content-Type, Authorization"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - anti-fraud-platform.com
    - api.anti-fraud-platform.com
    secretName: anti-fraud-platform-tls
  rules:
  - host: anti-fraud-platform.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
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
    
    print_success "Generated: $ingress_file"
}

# Function to generate HorizontalPodAutoscaler
generate_hpa() {
    local service_name=$1
    local hpa_file="$MANIFESTS_DIR/${service_name}-hpa.yml"
    
    cat > "$hpa_file" << EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${service_name}-hpa
  namespace: anti-fraud-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${service_name}
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF
}

# Function to generate deployment script
generate_deploy_script() {
    local deploy_script="$K8S_DIR/deploy.sh"
    
    print_info "Generating deployment script"
    
    cat > "$deploy_script" << 'EOF'
#!/bin/bash

# =============================================================================
# 🚀 Anti-Fraud Platform - Kubernetes Deployment Script
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying Anti-Fraud Platform to Kubernetes${NC}"

# Create namespace
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl apply -f namespace.yml

# Deploy Redis first  
echo -e "${YELLOW}Deploying Redis...${NC}"
kubectl apply -f redis.yml

# Deploy ConfigMap
echo -e "${YELLOW}Deploying ConfigMap...${NC}"
kubectl apply -f manifests/configmap.yml

# Deploy Secret (make sure to update values first!)
echo -e "${YELLOW}Deploying Secret...${NC}"
read -p "Have you updated the secret values in manifests/secret-template.yml? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl apply -f manifests/secret-template.yml
else
    echo -e "${RED}Please update the secret values first!${NC}"
    exit 1
fi

# Deploy all services
echo -e "${YELLOW}Deploying services...${NC}"
kubectl apply -f manifests/api-gateway.yml
kubectl apply -f manifests/auth-service.yml
kubectl apply -f manifests/link-service.yml
kubectl apply -f manifests/community-service.yml
kubectl apply -f manifests/chat-service.yml
kubectl apply -f manifests/news-service.yml
kubectl apply -f manifests/admin-service.yml
kubectl apply -f manifests/frontend.yml

# Deploy HPA
echo -e "${YELLOW}Deploying Horizontal Pod Autoscalers...${NC}"
kubectl apply -f manifests/*-hpa.yml

# Deploy Ingress
echo -e "${YELLOW}Deploying Ingress...${NC}"
kubectl apply -f manifests/ingress.yml

echo -e "${GREEN}✅ Deployment completed!${NC}"

# Wait for pods to be ready
echo -e "${YELLOW}Waiting for pods to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=api-gateway -n anti-fraud-platform --timeout=300s
kubectl wait --for=condition=ready pod -l app=auth-service -n anti-fraud-platform --timeout=300s

# Show status
echo -e "${GREEN}📊 Deployment Status:${NC}"
kubectl get pods -n anti-fraud-platform
kubectl get services -n anti-fraud-platform
kubectl get ingress -n anti-fraud-platform

echo -e "${GREEN}🎉 Anti-Fraud Platform deployed successfully!${NC}"
echo -e "${YELLOW}Access your application at:${NC}"
echo -e "  Frontend: https://anti-fraud-platform.com"
echo -e "  API: https://api.anti-fraud-platform.com"
EOF
    
    chmod +x "$deploy_script"
    print_success "Generated: $deploy_script"
}

# Main function
main() {
    print_header "Generating Kubernetes Manifests for Anti-Fraud Platform"
    
    # Check if template file exists
    if [[ ! -f "$TEMPLATE_FILE" ]]; then
        print_error "Template file not found: $TEMPLATE_FILE"
        exit 1
    fi
    
    # Generate manifests for each service
    for service in "${!SERVICES[@]}"; do
        generate_service_manifest "$service" "${SERVICES[$service]}"
        generate_hpa "$service"
    done
    
    # Generate other manifests
    generate_configmap
    generate_secret_template
    generate_ingress
    generate_deploy_script
    
    print_header "Summary"
    print_success "Generated manifests for ${#SERVICES[@]} services"
    print_info "Manifests directory: $MANIFESTS_DIR"
    print_info "Deployment script: $K8S_DIR/deploy.sh"
    
    echo -e "\n${CYAN}${GEAR} Next steps:${NC}"
    echo "1. Update secret values in: $MANIFESTS_DIR/secret-template.yml"
    echo "2. Update Docker registry: $DOCKER_REGISTRY"
    echo "3. Build and push Docker images"
    echo "4. Run deployment: $K8S_DIR/deploy.sh"
    
    echo -e "\n${YELLOW}${WARNING} Important:${NC}"
    echo "- Update the Docker registry in the generated manifests"
    echo "- Update secret values before deploying"
    echo "- Ensure your Kubernetes cluster is ready"
    echo "- Install nginx-ingress controller if using Ingress"
}

# Run main function
main "$@"

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
