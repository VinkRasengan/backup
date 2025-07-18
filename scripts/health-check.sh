#!/bin/bash

# Enhanced Health Check Script
# Checks all microservices health endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICES=(
  "api-gateway:8080"
  "auth-service:3001"
  "link-service:3002"
  "community-service:3003"
  "chat-service:3004"
  "news-service:3005"
  "admin-service:3006"
)

TIMEOUT=30
RETRY_INTERVAL=5

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

check_service() {
    local service=$1
    local host=$(echo $service | cut -d: -f1)
    local port=$(echo $service | cut -d: -f2)
    local url="http://${host}:${port}/health"
    
    log "Checking ${host}:${port}..."
    
    for i in $(seq 1 $TIMEOUT); do
        if curl -f -s "${url}" > /dev/null 2>&1; then
            log "✅ ${host} is healthy"
            return 0
        fi
        
        if [ $i -lt $TIMEOUT ]; then
            warning "${host} not ready, retrying in ${RETRY_INTERVAL}s... (${i}/${TIMEOUT})"
            sleep $RETRY_INTERVAL
        fi
    done
    
    error "${host} failed health check after ${TIMEOUT} attempts"
    return 1
}

# Check all services
main() {
    log "Starting health checks..."
    
    local failed_services=()
    
    for service in "${SERVICES[@]}"; do
        if ! check_service "$service"; then
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log "🎉 All services are healthy!"
        exit 0
    else
        error "❌ The following services failed health checks:"
        for service in "${failed_services[@]}"; do
            error "  - $service"
        done
        exit 1
    fi
}

main "$@"