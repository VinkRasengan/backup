#!/bin/bash

# Deployment Checklist Script
# Kiểm tra tất cả các thành phần cần thiết trước khi triển khai

set -e

echo "🔍 DEPLOYMENT CHECKLIST - Anti-Fraud Platform"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 is installed${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
}

# Function to check service health
check_service_health() {
    local service=$1
    local url=$2
    
    if curl -f -s $url > /dev/null; then
        echo -e "${GREEN}✅ $service is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $service is not responding${NC}"
        return 1
    fi
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 not found${NC}"
        return 1
    fi
}

# Function to check directory exists
check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1 exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 not found${NC}"
        return 1
    fi
}

echo ""
echo "📋 1. PREREQUISITES CHECK"
echo "------------------------"

# Check required tools
echo "Checking required tools..."
check_command "docker" || exit 1
check_command "docker-compose" || exit 1
check_command "kubectl" || exit 1
check_command "node" || exit 1
check_command "npm" || exit 1

echo ""
echo "📋 2. PROJECT STRUCTURE CHECK"
echo "----------------------------"

# Check project structure
echo "Checking project structure..."
check_directory "services" || exit 1
check_directory "client" || exit 1
check_directory "k8s" || exit 1
check_directory "monitoring" || exit 1
check_directory "shared-contracts" || exit 1

# Check key configuration files
echo "Checking configuration files..."
check_file "docker-compose.bigdata.yml" || exit 1
check_file "k8s/api-gateway.yml" || exit 1
check_file "monitoring/prometheus/prometheus.yml" || exit 1

echo ""
echo "📋 3. SERVICES CHECK"
echo "-------------------"

# Check all services exist
services=(
    "api-gateway"
    "auth-service"
    "link-service"
    "community-service"
    "chat-service"
    "news-service"
    "admin-service"
    "criminalip-service"
    "phishtank-service"
    "analytics-service"
    "etl-service"
    "spark-service"
    "event-bus-service"
)

for service in "${services[@]}"; do
    if [ -d "services/$service" ]; then
        echo -e "${GREEN}✅ $service exists${NC}"
        
        # Check for Dockerfile
        if [ -f "services/$service/Dockerfile" ]; then
            echo -e "${GREEN}  ✅ Dockerfile exists${NC}"
        else
            echo -e "${YELLOW}  ⚠️  Dockerfile missing${NC}"
        fi
        
        # Check for package.json
        if [ -f "services/$service/package.json" ]; then
            echo -e "${GREEN}  ✅ package.json exists${NC}"
        else
            echo -e "${YELLOW}  ⚠️  package.json missing${NC}"
        fi
        
    else
        echo -e "${RED}❌ $service missing${NC}"
    fi
done

echo ""
echo "📋 4. ENVIRONMENT CHECK"
echo "----------------------"

# Check environment variables
echo "Checking environment variables..."
if [ -n "$NODE_ENV" ]; then
    echo -e "${GREEN}✅ NODE_ENV is set to: $NODE_ENV${NC}"
else
    echo -e "${YELLOW}⚠️  NODE_ENV not set${NC}"
fi

# Check Docker network
if docker network ls | grep -q "factcheck-network"; then
    echo -e "${GREEN}✅ factcheck-network exists${NC}"
else
    echo -e "${YELLOW}⚠️  factcheck-network not found${NC}"
fi

# Check Kubernetes context
if kubectl config current-context &> /dev/null; then
    echo -e "${GREEN}✅ Kubernetes context is set${NC}"
    echo "  Current context: $(kubectl config current-context)"
else
    echo -e "${RED}❌ Kubernetes context not set${NC}"
fi

echo ""
echo "📋 5. DEPENDENCIES CHECK"
echo "-----------------------"

# Check if dependencies are installed
echo "Checking service dependencies..."

# Check if all services have node_modules
for service in "${services[@]}"; do
    if [ -d "services/$service" ] && [ -f "services/$service/package.json" ]; then
        if [ -d "services/$service/node_modules" ]; then
            echo -e "${GREEN}✅ $service dependencies installed${NC}"
        else
            echo -e "${YELLOW}⚠️  $service dependencies not installed${NC}"
        fi
    fi
done

echo ""
echo "📋 6. BUILD CHECK"
echo "----------------"

# Check if Docker images exist
echo "Checking Docker images..."
for service in "${services[@]}"; do
    if docker images | grep -q "$service"; then
        echo -e "${GREEN}✅ $service image exists${NC}"
    else
        echo -e "${YELLOW}⚠️  $service image not found${NC}"
    fi
done

echo ""
echo "📋 7. CONFIGURATION CHECK"
echo "------------------------"

# Check Kubernetes configurations
echo "Checking Kubernetes configurations..."
k8s_files=(
    "k8s/api-gateway.yml"
    "k8s/auth-service.yml"
    "k8s/link-service.yml"
    "k8s/community-service.yml"
    "k8s/chat-service.yml"
    "k8s/news-service.yml"
    "k8s/admin-service.yml"
)

for file in "${k8s_files[@]}"; do
    check_file "$file"
done

# Check monitoring configurations
echo "Checking monitoring configurations..."
monitoring_files=(
    "monitoring/prometheus/prometheus.yml"
    "monitoring/grafana/provisioning/datasources/prometheus.yml"
    "monitoring/alertmanager/alertmanager.yml"
)

for file in "${monitoring_files[@]}"; do
    check_file "$file"
done

echo ""
echo "📋 8. SECURITY CHECK"
echo "-------------------"

# Check for secrets and sensitive files
echo "Checking security configurations..."

# Check if .env files exist
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
else
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
fi

# Check if secrets are configured
if kubectl get secrets &> /dev/null; then
    echo -e "${GREEN}✅ Kubernetes secrets accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Kubernetes secrets not accessible${NC}"
fi

echo ""
echo "📋 9. NETWORK CHECK"
echo "------------------"

# Check network connectivity
echo "Checking network connectivity..."

# Check if localhost ports are available
ports=("3000" "8080" "6379" "9090" "3010")
for port in "${ports[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${YELLOW}⚠️  Port $port is in use${NC}"
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
    fi
done

echo ""
echo "📋 10. FINAL VALIDATION"
echo "----------------------"

# Run final validation tests
echo "Running final validation..."

# Test Docker daemon
if docker info &> /dev/null; then
    echo -e "${GREEN}✅ Docker daemon is running${NC}"
else
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    exit 1
fi

# Test Kubernetes cluster
if kubectl cluster-info &> /dev/null; then
    echo -e "${GREEN}✅ Kubernetes cluster is accessible${NC}"
else
    echo -e "${RED}❌ Kubernetes cluster is not accessible${NC}"
    exit 1
fi

# Test Node.js and npm
if node --version &> /dev/null && npm --version &> /dev/null; then
    echo -e "${GREEN}✅ Node.js and npm are working${NC}"
else
    echo -e "${RED}❌ Node.js or npm is not working${NC}"
    exit 1
fi

echo ""
echo "🎉 DEPLOYMENT CHECKLIST COMPLETED!"
echo "=================================="

echo ""
echo "📝 NEXT STEPS:"
echo "1. Run: ./scripts/build-all-services.sh"
echo "2. Run: ./scripts/deploy-dev.sh"
echo "3. Run: ./scripts/setup-monitoring.sh"
echo "4. Run: ./scripts/health-check.sh"

echo ""
echo "📚 DOCUMENTATION:"
echo "- Deployment Guide: docs/deployment-view-diagram.md"
echo "- Monitoring Setup: monitoring/README.md"
echo "- Service Documentation: docs/"

echo ""
echo "🚨 IMPORTANT NOTES:"
echo "- Ensure all environment variables are set"
echo "- Check firewall settings for required ports"
echo "- Verify SSL certificates for production"
echo "- Test backup and recovery procedures"

exit 0
