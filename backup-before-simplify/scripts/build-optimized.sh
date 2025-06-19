#!/bin/bash

# =============================================================================
# 🚀 Optimized Build Script for Anti-Fraud Platform
# =============================================================================
# This script provides optimized building for Docker images with caching,
# parallel builds, and size optimization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BUILD_CACHE_DIR=".docker-cache"
PARALLEL_BUILDS=4
OPTIMIZE_IMAGES=true
PUSH_TO_REGISTRY=false
REGISTRY_URL=""

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get image size
get_image_size() {
    local image=$1
    docker images --format "table {{.Size}}" "$image" | tail -n 1
}

# Function to build with cache
build_with_cache() {
    local service=$1
    local dockerfile=$2
    local context=$3
    local cache_from=""

    # Check if cache image exists
    if docker image inspect "${service}:cache" >/dev/null 2>&1; then
        cache_from="--cache-from ${service}:cache"
    fi

    print_status "Building $service with cache optimization..."

    # Build with BuildKit for better caching
    DOCKER_BUILDKIT=1 docker build \
        --target production \
        $cache_from \
        --tag "${service}:latest" \
        --tag "${service}:cache" \
        --file "$dockerfile" \
        "$context"

    local size=$(get_image_size "${service}:latest")
    print_success "$service built successfully (Size: $size)"
}

# Function to optimize image
optimize_image() {
    local service=$1

    if [ "$OPTIMIZE_IMAGES" = true ]; then
        print_status "Optimizing $service image..."

        # Use dive to analyze and optimize if available
        if command_exists dive; then
            dive "${service}:latest" --ci
        fi

        # Remove intermediate layers
        docker image prune -f >/dev/null 2>&1 || true
    fi
}

# Function to build services in parallel
build_services_parallel() {
    local services=("$@")
    local pids=()

    print_status "Building ${#services[@]} services in parallel (max $PARALLEL_BUILDS concurrent)..."

    for service in "${services[@]}"; do
        # Wait if we've reached max parallel builds
        while [ ${#pids[@]} -ge $PARALLEL_BUILDS ]; do
            for i in "${!pids[@]}"; do
                if ! kill -0 "${pids[$i]}" 2>/dev/null; then
                    unset "pids[$i]"
                fi
            done
            pids=("${pids[@]}") # Re-index array
            sleep 1
        done

        # Start build in background
        (
            case $service in
                "frontend")
                    # Use optimized Dockerfile for frontend
                    if [ -f "client/Dockerfile.optimized" ]; then
                        build_with_cache "frontend" "client/Dockerfile.optimized" "client"
                    else
                        build_with_cache "frontend" "client/Dockerfile" "client"
                    fi
                    ;;
                "api-gateway")
                    build_with_cache "api-gateway" "services/api-gateway/Dockerfile" "."
                    ;;
                "auth-service")
                    build_with_cache "auth-service" "services/auth-service/Dockerfile" "."
                    ;;
                "link-service")
                    build_with_cache "link-service" "services/link-service/Dockerfile" "."
                    ;;
                "community-service")
                    build_with_cache "community-service" "services/community-service/Dockerfile" "."
                    ;;
                "chat-service")
                    build_with_cache "chat-service" "services/chat-service/Dockerfile" "."
                    ;;
                "news-service")
                    build_with_cache "news-service" "services/news-service/Dockerfile" "."
                    ;;
                "admin-service")
                    build_with_cache "admin-service" "services/admin-service/Dockerfile" "."
                    ;;
                *)
                    print_error "Unknown service: $service"
                    exit 1
                    ;;
            esac

            optimize_image "$service"
        ) &

        pids+=($!)
        print_status "Started build for $service (PID: $!)"
    done

    # Wait for all builds to complete
    for pid in "${pids[@]}"; do
        wait "$pid"
    done

    print_success "All parallel builds completed!"
}

# Function to setup build cache
setup_build_cache() {
    print_status "Setting up build cache..."

    # Create cache directory
    mkdir -p "$BUILD_CACHE_DIR"

    # Enable Docker BuildKit
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1

    print_success "Build cache configured"
}

# Function to clean build cache
clean_build_cache() {
    print_status "Cleaning build cache..."

    # Remove cache images
    docker images --filter "reference=*:cache" -q | xargs -r docker rmi -f

    # Clean build cache
    docker builder prune -f

    # Remove cache directory
    rm -rf "$BUILD_CACHE_DIR"

    print_success "Build cache cleaned"
}

# Function to show build summary
show_build_summary() {
    print_status "Build Summary:"
    echo ""

    local services=("frontend" "api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service")

    printf "%-20s %-15s %-10s\n" "Service" "Size" "Status"
    printf "%-20s %-15s %-10s\n" "-------" "----" "------"

    for service in "${services[@]}"; do
        if docker image inspect "${service}:latest" >/dev/null 2>&1; then
            local size=$(get_image_size "${service}:latest")
            printf "%-20s %-15s %-10s\n" "$service" "$size" "✅ Built"
        else
            printf "%-20s %-15s %-10s\n" "$service" "N/A" "❌ Failed"
        fi
    done

    echo ""

    # Show total disk usage
    local total_size=$(docker images --format "table {{.Size}}" | grep -E "(MB|GB)" | sed 's/MB//' | sed 's/GB/*1024/' | bc 2>/dev/null | awk '{sum+=$1} END {print sum "MB"}' || echo "N/A")
    print_status "Total images size: $total_size"
}

# Main function
main() {
    echo "🚀 Optimized Build Script for Anti-Fraud Platform"
    echo "================================================="
    echo ""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --parallel)
                PARALLEL_BUILDS="$2"
                shift 2
                ;;
            --no-optimize)
                OPTIMIZE_IMAGES=false
                shift
                ;;
            --push)
                PUSH_TO_REGISTRY=true
                REGISTRY_URL="$2"
                shift 2
                ;;
            --clean-cache)
                clean_build_cache
                exit 0
                ;;
            --help)
                echo "Usage: $0 [OPTIONS] [SERVICES...]"
                echo ""
                echo "Options:"
                echo "  --parallel N        Number of parallel builds (default: 4)"
                echo "  --no-optimize       Skip image optimization"
                echo "  --push REGISTRY     Push images to registry"
                echo "  --clean-cache       Clean build cache and exit"
                echo "  --help              Show this help"
                echo ""
                echo "Services:"
                echo "  frontend, api-gateway, auth-service, link-service,"
                echo "  community-service, chat-service, news-service, admin-service"
                echo "  (default: all services)"
                exit 0
                ;;
            *)
                SERVICES+=("$1")
                shift
                ;;
        esac
    done

    # Default to all services if none specified
    if [ ${#SERVICES[@]} -eq 0 ]; then
        SERVICES=("frontend" "api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    fi

    # Check prerequisites
    if ! command_exists docker; then
        print_error "Docker is not installed"
        exit 1
    fi

    # Setup build environment
    setup_build_cache

    # Start build process
    local start_time=$(date +%s)

    print_status "Building services: ${SERVICES[*]}"
    print_status "Parallel builds: $PARALLEL_BUILDS"
    print_status "Image optimization: $OPTIMIZE_IMAGES"

    # Build services
    build_services_parallel "${SERVICES[@]}"

    # Show summary
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    print_success "🎉 Build completed in ${duration}s!"
    show_build_summary

    # Push to registry if requested
    if [ "$PUSH_TO_REGISTRY" = true ] && [ -n "$REGISTRY_URL" ]; then
        print_status "Pushing images to registry: $REGISTRY_URL"
        for service in "${SERVICES[@]}"; do
            docker tag "${service}:latest" "${REGISTRY_URL}/${service}:latest"
            docker push "${REGISTRY_URL}/${service}:latest"
        done
        print_success "Images pushed to registry"
    fi
}

# Run main function
main "$@"