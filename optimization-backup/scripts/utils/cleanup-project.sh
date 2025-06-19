#!/bin/bash

# =============================================================================
# 🧹 Project Cleanup Script
# =============================================================================
# This script cleans up duplicate files, fixes paths, and standardizes structure

set -e

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to backup important files
backup_files() {
    print_status "Creating backup of important files..."
    
    if [ ! -d "backup_$(date +%Y%m%d_%H%M%S)" ]; then
        mkdir "backup_$(date +%Y%m%d_%H%M%S)"
        
        # Backup shared folders
        if [ -d "shared" ]; then
            cp -r shared "backup_$(date +%Y%m%d_%H%M%S)/shared_root"
        fi
        
        if [ -d "services/shared" ]; then
            cp -r services/shared "backup_$(date +%Y%m%d_%H%M%S)/shared_services"
        fi
        
        print_success "Backup created"
    fi
}

# Function to remove duplicate shared folder
remove_duplicate_shared() {
    print_status "Removing duplicate shared folder..."
    
    if [ -d "services/shared" ]; then
        print_warning "Removing services/shared (duplicate of root shared)"
        rm -rf services/shared
        print_success "Removed services/shared"
    fi
}

# Function to remove node_modules services (they shouldn't be there)
remove_node_modules_services() {
    print_status "Removing services from node_modules..."
    
    SERVICES_IN_NODE_MODULES=("auth-service" "api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service" "criminalip-service" "phishtank-service" "factcheck-frontend")
    
    for service in "${SERVICES_IN_NODE_MODULES[@]}"; do
        if [ -d "node_modules/$service" ]; then
            print_warning "Removing node_modules/$service"
            rm -rf "node_modules/$service"
            print_success "Removed node_modules/$service"
        fi
    done
}

# Function to standardize import paths
standardize_import_paths() {
    print_status "Standardizing import paths..."
    
    # Services should import from ../../shared (relative to src files)
    SERVICES=("auth-service" "api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    
    for service in "${SERVICES[@]}"; do
        if [ -d "services/$service" ]; then
            print_status "Fixing import paths in $service..."
            
            # Find all JS files and fix import paths
            find "services/$service" -name "*.js" -type f | while read -r file; do
                # Fix various wrong import patterns
                if grep -q "require.*shared" "$file"; then
                    print_status "  Fixing $file"
                    
                    # Replace all variations with correct path
                    sed -i 's|require.*['\''"]\.\.\/\.\.\/\.\.\/shared|require("../../shared|g' "$file"
                    sed -i 's|require.*['\''"]\.\.\/\.\.\/shared|require("../../shared|g' "$file"
                    sed -i 's|require.*['\''"]\.\.\/shared|require("../../shared|g' "$file"
                    sed -i 's|require.*['\''"]shared|require("../../shared|g' "$file"
                    
                    print_success "  Fixed $file"
                fi
            done
            
            print_success "Fixed import paths in $service"
        fi
    done
}

# Function to clean up unused scripts
clean_unused_scripts() {
    print_status "Cleaning up unused/duplicate scripts..."
    
    # Remove backup scripts that are no longer needed
    UNUSED_SCRIPTS=(
        "scripts/fix-import-paths.sh"
        "scripts/fix-import-paths-correct.sh"
        "scripts/fix-dockerfiles.sh"
    )
    
    for script in "${UNUSED_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            print_warning "Removing unused script: $script"
            rm -f "$script"
            print_success "Removed $script"
        fi
    done
}

# Function to standardize Dockerfiles
standardize_dockerfiles() {
    print_status "Standardizing Dockerfiles..."
    
    SERVICES=("auth-service" "api-gateway" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    
    for service in "${SERVICES[@]}"; do
        dockerfile_path="services/$service/Dockerfile"
        
        if [ -f "$dockerfile_path" ]; then
            print_status "Standardizing $dockerfile_path..."
            
            # Create standardized Dockerfile
            cat > "$dockerfile_path" << EOF
# Multi-stage build for $service
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy service package files first (for better caching)
COPY services/$service/package*.json ./

# Install dependencies
FROM base AS deps
RUN npm install --only=production && npm cache clean --force

# Development stage
FROM base AS dev
# Copy service package files
COPY services/$service/package*.json ./
RUN npm ci
# Copy shared utilities first
COPY shared/ ./shared/
# Copy service-specific code
COPY services/$service/ ./
USER nodejs
EXPOSE $(get_service_port $service)
CMD ["dumb-init", "npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy shared utilities first
COPY --chown=nodejs:nodejs shared/ ./shared/

# Copy service-specific code
COPY --chown=nodejs:nodejs services/$service/ ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE $(get_service_port $service)

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:$(get_service_port $service)/health/live || exit 1

# Start the application
CMD ["dumb-init", "node", "src/app.js"]
EOF

            # Replace service-specific values
            case $service in
                "auth-service")
                    sed -i 's/$(get_service_port auth-service)/3001/g' "$dockerfile_path"
                    ;;
                "api-gateway")
                    sed -i 's/$(get_service_port api-gateway)/8080/g' "$dockerfile_path"
                    ;;
                "link-service")
                    sed -i 's/$(get_service_port link-service)/3002/g' "$dockerfile_path"
                    ;;
                "community-service")
                    sed -i 's/$(get_service_port community-service)/3005/g' "$dockerfile_path"
                    ;;
                "chat-service")
                    sed -i 's/$(get_service_port chat-service)/3004/g' "$dockerfile_path"
                    ;;
                "news-service")
                    sed -i 's/$(get_service_port news-service)/3003/g' "$dockerfile_path"
                    ;;
                "admin-service")
                    sed -i 's/$(get_service_port admin-service)/3006/g' "$dockerfile_path"
                    ;;
            esac
            
            print_success "Standardized $dockerfile_path"
        fi
    done
}

# Function to remove backup files
remove_backup_files() {
    print_status "Removing backup files..."
    
    find . -name "*.backup" -type f | while read -r backup_file; do
        print_warning "Removing backup file: $backup_file"
        rm -f "$backup_file"
    done
    
    print_success "Removed all backup files"
}

# Main execution
main() {
    echo "🧹 Project Cleanup"
    echo "=================="
    echo ""
    
    backup_files
    echo ""
    
    remove_duplicate_shared
    echo ""
    
    remove_node_modules_services
    echo ""
    
    standardize_import_paths
    echo ""
    
    clean_unused_scripts
    echo ""
    
    standardize_dockerfiles
    echo ""
    
    remove_backup_files
    echo ""
    
    print_success "🎉 Project cleanup completed!"
    echo ""
    echo "Summary of changes:"
    echo "- Removed duplicate shared folder in services/"
    echo "- Removed services from node_modules/"
    echo "- Standardized import paths to use ../../shared"
    echo "- Cleaned up unused scripts"
    echo "- Standardized all Dockerfiles"
    echo "- Removed backup files"
    echo ""
    echo "Next steps:"
    echo "1. Test local development: npm run start:full"
    echo "2. Test Docker build: bash scripts/deploy-docker.sh"
    echo "3. Test Kubernetes: bash scripts/deploy-k8s.sh"
}

# Run main function
main "$@"
