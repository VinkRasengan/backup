#!/bin/bash

# =============================================================================
# 🔧 Fix Quote Syntax Errors
# =============================================================================
# This script fixes mixed quote syntax in require statements

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Services to fix
SERVICES=("auth-service" "api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service")

print_status "Fixing quote syntax errors..."

for service in "${SERVICES[@]}"; do
    service_path="services/$service"
    
    if [ -d "$service_path" ]; then
        print_status "Fixing quote syntax in $service..."
        
        # Find all JavaScript files and fix quote syntax
        find "$service_path" -name "*.js" -type f | while read -r file; do
            if grep -q 'require(".*'"'"')' "$file" || grep -q "require('.*\")" "$file"; then
                print_status "  Fixing $file"
                
                # Fix mixed quotes: "...') -> '...'
                sed -i 's/require("\([^"]*\)'"'"')/require('"'"'\1'"'"')/g' "$file"
                
                # Fix mixed quotes: '...") -> '...'
                sed -i "s/require('\([^']*\)\")/require('\1')/g" "$file"
                
                print_success "  Fixed $file"
            fi
        done
        
        print_success "Fixed quote syntax in $service"
    else
        print_error "Service directory not found: $service_path"
    fi
done

print_success "All quote syntax errors fixed!"
