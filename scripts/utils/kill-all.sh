#!/bin/bash

echo "========================================"
echo "🛑 Kill All Services - Anti-Fraud Platform"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to kill process on port
kill_port() {
    local port=$1
    local service_name=$2
    
    if command -v lsof >/dev/null 2>&1; then
        local pid=$(lsof -t -i:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            print_success "Killed $service_name (port $port)"
            return 0
        fi
    fi
    
    echo "⚪ $service_name (port $port) - not running"
    return 1
}

# All ports and their services
declare -A SERVICES=(
    # Core Services
    [3000]="Frontend"
    [3001]="Auth Service"
    [3002]="Link Service"
    [3003]="Community Service"
    [3004]="Chat Service"
    [3005]="News Service"
    [3006]="Admin Service"
    [3007]="CriminalIP Service"
    [3008]="PhishTank Service"
    [8082]="API Gateway"
    
    # Monitoring Services
    [3010]="Grafana"
    [5001]="Webhook Service"
    [6379]="Redis"
    [8081]="cAdvisor"
    [9090]="Prometheus"
    [9093]="Alertmanager"
    [9100]="Node Exporter"
    [9121]="Redis Exporter"
    
    # Development ports
    [3009]="Dev Server"
    [3011]="Dev Server"
    [3012]="Dev Server"
    [8080]="Legacy API Gateway"
    [8000]="Dev Server"
    [8001]="Dev Server"
)

echo "[1/5] Killing processes on specific ports..."
killed_count=0

for port in "${!SERVICES[@]}"; do
    if kill_port $port "${SERVICES[$port]}"; then
        ((killed_count++))
    fi
done

echo ""
echo "📊 Killed $killed_count services by port"

echo ""
echo "[2/5] Killing Node.js processes..."
if pkill -f node >/dev/null 2>&1; then
    print_success "Killed Node.js processes"
else
    print_info "No Node.js processes found"
fi

echo ""
echo "[3/5] Killing npm processes..."
if pkill -f npm >/dev/null 2>&1; then
    print_success "Killed npm processes"
else
    print_info "No npm processes found"
fi

echo ""
echo "[4/5] Stopping Docker containers..."

# Stop monitoring stack
if docker-compose -f docker-compose.monitoring.yml down >/dev/null 2>&1; then
    print_success "Stopped monitoring containers"
else
    print_info "No monitoring containers running"
fi

# Stop microservices stack
if docker-compose -f docker-compose.microservices.yml down >/dev/null 2>&1; then
    print_success "Stopped microservices containers"
else
    print_info "No microservices containers running"
fi

# Stop dev stack
if docker-compose -f docker-compose.dev.yml down >/dev/null 2>&1; then
    print_success "Stopped dev containers"
else
    print_info "No dev containers running"
fi

echo ""
echo "[5/5] Final cleanup..."

# Wait for processes to die
sleep 2

# Final aggressive cleanup
pkill -9 -f "node.*factcheck" >/dev/null 2>&1 || true
pkill -9 -f "npm.*start" >/dev/null 2>&1 || true
pkill -f concurrently >/dev/null 2>&1 || true
pkill -f "webhook-service" >/dev/null 2>&1 || true

print_success "Final cleanup completed"

echo ""
echo "🎉 All Services Killed Successfully!"
echo "===================================="
echo ""
echo "📊 Summary:"
echo "   - Killed $killed_count services by port"
echo "   - Stopped all Node.js processes"
echo "   - Stopped all npm processes"
echo "   - Stopped all Docker containers"
echo "   - Cleaned up webhook services"
echo ""
echo "🚀 To start services again:"
echo "   npm run start:full"
echo "   npm run start:safe"
echo "   npm run monitoring:start"
echo ""
