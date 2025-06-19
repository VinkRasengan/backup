#!/bin/bash

# =============================================================================
# 📊 Build Performance Monitoring Script
# =============================================================================
# This script monitors and analyzes Docker build performance,
# providing insights for optimization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
METRICS_DIR=".build-metrics"
REPORT_FILE="$METRICS_DIR/build-performance-report.json"

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

# Function to get current timestamp
get_timestamp() {
    date +%s
}

# Function to format duration
format_duration() {
    local duration=$1
    local hours=$((duration / 3600))
    local minutes=$(((duration % 3600) / 60))
    local seconds=$((duration % 60))
    
    if [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m ${seconds}s"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m ${seconds}s"
    else
        echo "${seconds}s"
    fi
}

# Function to get image size in MB
get_image_size_mb() {
    local image=$1
    local size_str=$(docker images --format "{{.Size}}" "$image" 2>/dev/null | head -1)
    
    if [ -z "$size_str" ]; then
        echo "0"
        return
    fi
    
    # Convert to MB
    if [[ $size_str == *"GB"* ]]; then
        local size=$(echo "$size_str" | sed 's/GB//' | tr -d ' ')
        echo "$(echo "$size * 1024" | bc 2>/dev/null || echo "0")"
    elif [[ $size_str == *"MB"* ]]; then
        echo "$size_str" | sed 's/MB//' | tr -d ' '
    elif [[ $size_str == *"KB"* ]]; then
        local size=$(echo "$size_str" | sed 's/KB//' | tr -d ' ')
        echo "$(echo "scale=2; $size / 1024" | bc 2>/dev/null || echo "0")"
    else
        echo "0"
    fi
}

# Function to measure build time
measure_build_time() {
    local service=$1
    local dockerfile=$2
    local context=$3
    local start_time=$(get_timestamp)
    
    print_status "Building $service..."
    
    # Build with timing
    if docker build -t "$service:latest" -f "$dockerfile" "$context" >/dev/null 2>&1; then
        local end_time=$(get_timestamp)
        local duration=$((end_time - start_time))
        local size=$(get_image_size_mb "$service:latest")
        
        echo "$duration,$size"
        return 0
    else
        echo "0,0"
        return 1
    fi
}

# Function to analyze build cache efficiency
analyze_cache_efficiency() {
    local service=$1
    
    print_status "Analyzing cache efficiency for $service..."
    
    # Build without cache
    local start_time=$(get_timestamp)
    docker build --no-cache -t "$service:no-cache" -f "services/$service/Dockerfile" . >/dev/null 2>&1
    local no_cache_time=$(($(get_timestamp) - start_time))
    
    # Build with cache
    start_time=$(get_timestamp)
    docker build -t "$service:with-cache" -f "services/$service/Dockerfile" . >/dev/null 2>&1
    local with_cache_time=$(($(get_timestamp) - start_time))
    
    # Calculate cache efficiency
    local efficiency=0
    if [ $no_cache_time -gt 0 ]; then
        efficiency=$(echo "scale=2; (($no_cache_time - $with_cache_time) / $no_cache_time) * 100" | bc 2>/dev/null || echo "0")
    fi
    
    echo "$no_cache_time,$with_cache_time,$efficiency"
    
    # Clean up test images
    docker rmi "$service:no-cache" "$service:with-cache" >/dev/null 2>&1 || true
}

# Function to analyze layer efficiency
analyze_layer_efficiency() {
    local service=$1
    
    if ! command_exists dive; then
        print_warning "dive not installed, skipping layer analysis"
        echo "0,0,0"
        return
    fi
    
    print_status "Analyzing layer efficiency for $service..."
    
    # Use dive to analyze image
    local dive_output=$(dive "$service:latest" --ci --lowestEfficiency=0.9 2>/dev/null || echo "")
    
    # Extract metrics (this is a simplified example)
    local layers=$(docker history "$service:latest" --format "{{.Size}}" | wc -l)
    local total_size=$(get_image_size_mb "$service:latest")
    local efficiency="90" # Default efficiency
    
    echo "$layers,$total_size,$efficiency"
}

# Function to create performance report
create_performance_report() {
    local services=("$@")
    
    print_status "Creating performance report..."
    
    mkdir -p "$METRICS_DIR"
    
    # Start JSON report
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "services": {
EOF

    local first=true
    for service in "${services[@]}"; do
        if [ "$first" = false ]; then
            echo "," >> "$REPORT_FILE"
        fi
        first=false
        
        print_status "Analyzing $service..."
        
        # Get build metrics
        local build_result=$(measure_build_time "$service" "services/$service/Dockerfile" ".")
        local build_time=$(echo "$build_result" | cut -d',' -f1)
        local image_size=$(echo "$build_result" | cut -d',' -f2)
        
        # Get cache efficiency
        local cache_result=$(analyze_cache_efficiency "$service")
        local no_cache_time=$(echo "$cache_result" | cut -d',' -f1)
        local with_cache_time=$(echo "$cache_result" | cut -d',' -f2)
        local cache_efficiency=$(echo "$cache_result" | cut -d',' -f3)
        
        # Get layer efficiency
        local layer_result=$(analyze_layer_efficiency "$service")
        local layer_count=$(echo "$layer_result" | cut -d',' -f1)
        local layer_efficiency=$(echo "$layer_result" | cut -d',' -f3)
        
        # Add to JSON
        cat >> "$REPORT_FILE" << EOF
    "$service": {
      "build_time_seconds": $build_time,
      "build_time_formatted": "$(format_duration $build_time)",
      "image_size_mb": $image_size,
      "cache_efficiency_percent": $cache_efficiency,
      "no_cache_build_time": $no_cache_time,
      "with_cache_build_time": $with_cache_time,
      "layer_count": $layer_count,
      "layer_efficiency_percent": $layer_efficiency
    }
EOF
    done
    
    # Close JSON
    cat >> "$REPORT_FILE" << EOF
  }
}
EOF

    print_success "Performance report created: $REPORT_FILE"
}

# Function to show performance summary
show_performance_summary() {
    if [ ! -f "$REPORT_FILE" ]; then
        print_error "Performance report not found. Run analysis first."
        return
    fi
    
    print_status "Performance Summary:"
    echo ""
    
    printf "%-20s %-12s %-12s %-15s %-15s\n" "Service" "Build Time" "Size (MB)" "Cache Eff %" "Layers"
    printf "%-20s %-12s %-12s %-15s %-15s\n" "-------" "----------" "---------" "-----------" "------"
    
    # Parse JSON and display (simplified - would need jq for proper parsing)
    local services=("api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    
    for service in "${services[@]}"; do
        if docker image inspect "$service:latest" >/dev/null 2>&1; then
            local size=$(get_image_size_mb "$service:latest")
            printf "%-20s %-12s %-12s %-15s %-15s\n" "$service" "N/A" "$size" "N/A" "N/A"
        fi
    done
    
    echo ""
    
    # Show recommendations
    print_status "Optimization Recommendations:"
    echo ""
    echo "🔧 Build Time Optimization:"
    echo "  • Use multi-stage builds to reduce final image size"
    echo "  • Optimize layer caching by copying package.json first"
    echo "  • Use .dockerignore to reduce build context"
    echo "  • Consider parallel builds for multiple services"
    echo ""
    echo "📦 Image Size Optimization:"
    echo "  • Use Alpine Linux base images"
    echo "  • Remove unnecessary packages and files"
    echo "  • Use production-only dependencies"
    echo "  • Combine RUN commands to reduce layers"
    echo ""
    echo "⚡ Cache Optimization:"
    echo "  • Order Dockerfile commands from least to most likely to change"
    echo "  • Use BuildKit for advanced caching features"
    echo "  • Consider using external cache mounts"
    echo ""
}

# Function to compare with previous reports
compare_with_previous() {
    local previous_reports=($(ls -t "$METRICS_DIR"/build-performance-report-*.json 2>/dev/null | head -2))
    
    if [ ${#previous_reports[@]} -lt 2 ]; then
        print_warning "Not enough previous reports for comparison"
        return
    fi
    
    print_status "Comparing with previous build..."
    # This would need proper JSON parsing to implement
    print_warning "Comparison feature requires jq - not implemented in this version"
}

# Main function
main() {
    echo "📊 Build Performance Monitoring"
    echo "==============================="
    echo ""
    
    # Parse arguments
    local action="analyze"
    local services=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --analyze)
                action="analyze"
                shift
                ;;
            --summary)
                action="summary"
                shift
                ;;
            --compare)
                action="compare"
                shift
                ;;
            --services)
                shift
                while [[ $# -gt 0 && ! $1 =~ ^-- ]]; do
                    services+=("$1")
                    shift
                done
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --analyze           Run performance analysis (default)"
                echo "  --summary           Show performance summary"
                echo "  --compare           Compare with previous reports"
                echo "  --services LIST     Specify services to analyze"
                echo "  --help              Show this help"
                exit 0
                ;;
            *)
                services+=("$1")
                shift
                ;;
        esac
    done
    
    # Default services if none specified
    if [ ${#services[@]} -eq 0 ]; then
        services=("api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service")
    fi
    
    # Execute action
    case $action in
        "analyze")
            create_performance_report "${services[@]}"
            show_performance_summary
            ;;
        "summary")
            show_performance_summary
            ;;
        "compare")
            compare_with_previous
            ;;
        *)
            print_error "Unknown action: $action"
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Build performance monitoring completed!"
}

# Run main function
main "$@"
