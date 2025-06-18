#!/bin/bash

# =============================================================================
# 🔧 Fix Shared Paths for Docker Container Structure
# =============================================================================
# This script fixes shared paths to work correctly in Docker containers

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

print_status "Fixing shared paths for Docker container structure..."

for service in "${SERVICES[@]}"; do
    service_path="services/$service"
    
    if [ -d "$service_path" ]; then
        print_status "Fixing shared paths in $service..."
        
        # Find all JavaScript files and fix shared paths
        find "$service_path" -name "*.js" -type f | while read -r file; do
            if grep -q "require.*shared" "$file"; then
                print_status "  Fixing $file"
                
                # Determine correct path based on file location
                # Count directory depth from service root
                relative_path=$(realpath --relative-to="$service_path" "$file")
                depth=$(echo "$relative_path" | tr '/' '\n' | wc -l)
                depth=$((depth - 1)) # Subtract 1 for the file itself
                
                if [ $depth -eq 1 ]; then
                    # File is in src/ directory, use ../shared
                    sed -i 's|require(['"'"'"]\.\.\/\.\.\/shared|require('"'"'../shared|g' "$file"
                    sed -i 's|require(['"'"'"]\.\.\/shared|require('"'"'../shared|g' "$file"
                elif [ $depth -eq 2 ]; then
                    # File is in src/subdir/ directory, use ../../shared
                    sed -i 's|require(['"'"'"]\.\.\/\.\.\/\.\.\/shared|require('"'"'../../shared|g' "$file"
                    sed -i 's|require(['"'"'"]\.\.\/\.\.\/shared|require('"'"'../../shared|g' "$file"
                    sed -i 's|require(['"'"'"]\.\.\/shared|require('"'"'../../shared|g' "$file"
                elif [ $depth -eq 3 ]; then
                    # File is in src/subdir/subdir/ directory, use ../../../shared
                    sed -i 's|require(['"'"'"]\.\.\/\.\.\/\.\.\/\.\.\/shared|require('"'"'../../../shared|g' "$file"
                    sed -i 's|require(['"'"'"]\.\.\/\.\.\/\.\.\/shared|require('"'"'../../../shared|g' "$file"
                    sed -i 's|require(['"'"'"]\.\.\/\.\.\/shared|require('"'"'../../../shared|g' "$file"
                    sed -i 's|require(['"'"'"]\.\.\/shared|require('"'"'../../../shared|g' "$file"
                fi
                
                print_success "  Fixed $file (depth: $depth)"
            fi
        done
        
        print_success "Fixed shared paths in $service"
    else
        print_error "Service directory not found: $service_path"
    fi
done

print_success "All shared paths fixed for Docker container structure!"

# Summary
echo ""
echo "📋 Path Structure Summary:"
echo "=========================="
echo "In Docker container:"
echo "  /app/shared/          <- Shared utilities"
echo "  /app/src/app.js       <- Main app (uses ../shared)"
echo "  /app/src/routes/*.js  <- Route files (use ../../shared)"
echo "  /app/src/services/*.js <- Service files (use ../../shared)"
echo ""
