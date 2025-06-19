#!/bin/bash

# =============================================================================
# 🔧 Dockerfile Optimization Script
# =============================================================================
# This script optimizes existing Dockerfiles for better build performance,
# smaller image sizes, and improved security

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to backup original Dockerfile
backup_dockerfile() {
    local dockerfile=$1
    local backup="${dockerfile}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "$dockerfile" ]; then
        cp "$dockerfile" "$backup"
        print_status "Backed up $dockerfile to $backup"
    fi
}

# Function to optimize Node.js service Dockerfile
optimize_nodejs_dockerfile() {
    local service_dir=$1
    local dockerfile="$service_dir/Dockerfile"
    
    if [ ! -f "$dockerfile" ]; then
        print_warning "Dockerfile not found in $service_dir"
        return
    fi
    
    backup_dockerfile "$dockerfile"
    
    print_status "Optimizing $dockerfile..."
    
    # Create optimized Dockerfile
    cat > "$dockerfile" << 'EOF'
# Optimized Multi-stage build for Node.js microservice
FROM node:18-alpine AS base

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files for better caching
COPY package*.json ./

# Dependencies stage - production only
FROM base AS deps
RUN npm ci --only=production --silent && \
    npm cache clean --force && \
    rm -rf ~/.npm

# Build dependencies stage
FROM base AS build-deps
RUN npm ci --silent

# Build stage
FROM build-deps AS build
COPY . .
RUN npm run build 2>/dev/null || echo "No build script found" && \
    rm -rf node_modules

# Production stage
FROM base AS production

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy shared utilities first
COPY --chown=nodejs:nodejs ../../shared/ ./shared/

# Copy service-specific code
COPY --chown=nodejs:nodejs . .

# Copy built assets if they exist
RUN mkdir -p ./dist
COPY --from=build --chown=nodejs:nodejs /app/dist/ ./dist/ || true

# Remove unnecessary files
RUN rm -rf ./tests/ ./docs/ ./*.md ./.git* && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port (will be overridden by service-specific port)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["dumb-init", "node", "src/app.js"]
EOF

    print_success "Optimized $dockerfile"
}

# Function to optimize React Dockerfile
optimize_react_dockerfile() {
    local dockerfile="client/Dockerfile"
    
    if [ ! -f "$dockerfile" ]; then
        print_warning "React Dockerfile not found"
        return
    fi
    
    backup_dockerfile "$dockerfile"
    
    print_status "Optimizing React Dockerfile..."
    
    # Use the already created optimized version
    cp "client/Dockerfile.optimized" "$dockerfile"
    
    print_success "Optimized React Dockerfile"
}

# Function to create .dockerignore files
create_dockerignore() {
    local dir=$1
    local dockerignore="$dir/.dockerignore"
    
    print_status "Creating .dockerignore for $dir..."
    
    cat > "$dockerignore" << 'EOF'
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage
.nyc_output
*.lcov

# Production build
build
dist

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode
.idea
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Git
.git
.gitignore
.gitattributes

# Documentation
README.md
CHANGELOG.md
LICENSE
docs/
*.md

# CI/CD
.github
.gitlab-ci.yml
.travis.yml
Jenkinsfile

# Docker
Dockerfile*
docker-compose*
.dockerignore

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test
EOF

    print_success "Created .dockerignore for $dir"
}

# Function to analyze Dockerfile efficiency
analyze_dockerfile() {
    local dockerfile=$1
    local service_name=$(basename $(dirname "$dockerfile"))
    
    print_status "Analyzing $dockerfile..."
    
    # Check for common optimization opportunities
    local issues=0
    
    # Check for COPY . . early in the file
    if grep -n "COPY \. \." "$dockerfile" | head -5 | grep -q "COPY"; then
        print_warning "$service_name: COPY . . found early in Dockerfile (affects caching)"
        ((issues++))
    fi
    
    # Check for missing .dockerignore
    local dir=$(dirname "$dockerfile")
    if [ ! -f "$dir/.dockerignore" ]; then
        print_warning "$service_name: Missing .dockerignore file"
        ((issues++))
    fi
    
    # Check for non-alpine base images
    if grep -q "FROM node:" "$dockerfile" && ! grep -q "alpine" "$dockerfile"; then
        print_warning "$service_name: Consider using alpine-based images for smaller size"
        ((issues++))
    fi
    
    # Check for missing health checks
    if ! grep -q "HEALTHCHECK" "$dockerfile"; then
        print_warning "$service_name: Missing health check"
        ((issues++))
    fi
    
    # Check for running as root
    if ! grep -q "USER" "$dockerfile"; then
        print_warning "$service_name: Running as root user (security risk)"
        ((issues++))
    fi
    
    if [ $issues -eq 0 ]; then
        print_success "$service_name: Dockerfile looks well optimized"
    else
        print_warning "$service_name: Found $issues optimization opportunities"
    fi
    
    return $issues
}

# Function to show optimization summary
show_optimization_summary() {
    print_status "Optimization Summary:"
    echo ""
    
    # Show image sizes before and after (if available)
    local services=("frontend" "api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    
    printf "%-20s %-15s %-15s %-10s\n" "Service" "Before" "After" "Savings"
    printf "%-20s %-15s %-15s %-10s\n" "-------" "------" "-----" "-------"
    
    for service in "${services[@]}"; do
        # This would need actual before/after measurements
        printf "%-20s %-15s %-15s %-10s\n" "$service" "N/A" "N/A" "N/A"
    done
    
    echo ""
    print_status "Optimization recommendations applied:"
    echo "  ✅ Multi-stage builds for smaller final images"
    echo "  ✅ Alpine Linux base images for security and size"
    echo "  ✅ Non-root user for security"
    echo "  ✅ Proper layer caching with package.json first"
    echo "  ✅ Health checks for better orchestration"
    echo "  ✅ .dockerignore files to reduce build context"
    echo "  ✅ Security updates and minimal packages"
    echo "  ✅ Build cache optimization"
}

# Main function
main() {
    echo "🔧 Dockerfile Optimization Script"
    echo "================================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "services" ] || [ ! -d "client" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    local total_issues=0
    
    # Analyze current Dockerfiles
    print_status "Analyzing current Dockerfiles..."
    
    # Analyze React frontend
    if [ -f "client/Dockerfile" ]; then
        analyze_dockerfile "client/Dockerfile"
        total_issues=$((total_issues + $?))
    fi
    
    # Analyze services
    for service_dir in services/*/; do
        if [ -f "$service_dir/Dockerfile" ]; then
            analyze_dockerfile "$service_dir/Dockerfile"
            total_issues=$((total_issues + $?))
        fi
    done
    
    echo ""
    print_status "Found $total_issues total optimization opportunities"
    echo ""
    
    # Ask for confirmation
    read -p "Do you want to apply optimizations? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Optimization cancelled"
        exit 0
    fi
    
    # Apply optimizations
    print_status "Applying optimizations..."
    
    # Optimize React Dockerfile
    optimize_react_dockerfile
    
    # Optimize service Dockerfiles
    for service_dir in services/*/; do
        if [ -d "$service_dir" ]; then
            optimize_nodejs_dockerfile "$service_dir"
        fi
    done
    
    # Create .dockerignore files
    create_dockerignore "."
    create_dockerignore "client"
    
    for service_dir in services/*/; do
        if [ -d "$service_dir" ]; then
            create_dockerignore "$service_dir"
        fi
    done
    
    # Show summary
    echo ""
    show_optimization_summary
    
    echo ""
    print_success "🎉 Dockerfile optimization completed!"
    echo ""
    print_status "Next steps:"
    echo "  1. Test the optimized builds: ./scripts/build-optimized.sh"
    echo "  2. Compare image sizes: docker images"
    echo "  3. Test deployment: docker-compose -f docker-compose.optimized.yml up"
    echo "  4. Restore from backups if needed: *.backup.*"
}

# Run main function
main "$@"
