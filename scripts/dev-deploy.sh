#!/bin/bash

# =============================================================================
# 🚀 Anti-Fraud Platform - Complete Development Deployment Script
# Easy deployment and debugging for all services
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Emojis for better UX
ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
INFO="ℹ️"
GEAR="⚙️"
MONITOR="📊"
LOGS="📋"
STOP="🛑"

# Print functions
print_header() {
    echo -e "\n${WHITE}${ROCKET} $1${NC}"
    echo -e "${WHITE}$(printf '=%.0s' {1..60})${NC}"
}

print_status() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_section() {
    echo -e "\n${CYAN}${GEAR} $1${NC}"
    echo -e "${CYAN}$(printf '-%.0s' {1..40})${NC}"
}

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="docker-compose.microservices.yml"
ENV_FILE=".env"
BUILD_TIMESTAMP=".build_timestamp"

# Service definitions
SERVICES=(
    "api-gateway:8080:API Gateway"
    "auth-service:3001:Authentication Service"
    "link-service:3002:Link Verification Service"
    "community-service:3003:Community Service"
    "chat-service:3004:Chat/AI Service"
    "news-service:3005:News Service"
    "admin-service:3006:Admin Service"
    "frontend:3000:React Frontend"
    "redis:6379:Redis Cache"
    "prometheus:9090:Prometheus Monitoring"
    "grafana:3007:Grafana Dashboard"
    "jaeger:16686:Jaeger Tracing"
)

# Health check endpoints
HEALTH_ENDPOINTS=(
    "http://localhost:8080/health:API Gateway"
    "http://localhost:3001/health:Auth Service"
    "http://localhost:3002/health:Link Service"
    "http://localhost:3003/health:Community Service"
    "http://localhost:3004/health:Chat Service"
    "http://localhost:3005/health:News Service"
    "http://localhost:3006/health:Admin Service"
)

# Function to show usage
show_usage() {
    echo -e "${WHITE}Usage: $0 [COMMAND] [OPTIONS]${NC}"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  start, up, deploy    - Start all services (default)"
    echo "  stop, down          - Stop all services"
    echo "  restart             - Restart all services"
    echo "  rebuild             - Force rebuild and start"
    echo "  logs               - Show logs for all services"
    echo "  status, ps         - Show service status"
    echo "  health             - Check service health"
    echo "  clean              - Clean up containers and images"
    echo "  setup              - Initial setup and environment check"
    echo "  debug              - Debug mode with detailed logging"
    echo "  help               - Show this help message"
    echo ""
    echo -e "${CYAN}Options:${NC}"
    echo "  --service <name>   - Target specific service"
    echo "  --no-build         - Skip building (use existing images)"
    echo "  --force            - Force action without confirmation"
    echo "  --verbose          - Verbose output"
    echo "  --follow           - Follow logs (for logs command)"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  $0 start                    # Start all services"
    echo "  $0 logs --service auth      # Show auth service logs"
    echo "  $0 restart --service api    # Restart API gateway"
    echo "  $0 rebuild --force          # Force rebuild all services"
    echo "  $0 debug                    # Start in debug mode"
}

# Function to check prerequisites
check_prerequisites() {
    print_section "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    print_success "Docker is running"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
    print_success "Docker Compose is available"
    
    # Check available memory
    if command -v free &> /dev/null; then
        available_mem=$(free -m | awk 'NR==2{printf "%.0f", $7}')
        if [ "$available_mem" -lt 4096 ]; then
            print_warning "Available memory is ${available_mem}MB. Recommended: 4GB+"
        else
            print_success "Available memory: ${available_mem}MB"
        fi
    fi
    
    # Check disk space
    available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        print_warning "Available disk space: ${available_space}GB. Recommended: 10GB+"
    else
        print_success "Available disk space: ${available_space}GB"
    fi
}

# Function to create environment file
create_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_section "Creating Environment File"
        print_status "Creating .env template file..."
        
        cat > "$ENV_FILE" << 'EOF'
# =============================================================================
# Anti-Fraud Platform Environment Configuration
# =============================================================================

# Service Configuration
NODE_ENV=development

# Firebase Configuration - REQUIRED: Update with your project details
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# JWT Configuration - REQUIRED: Generate a secure secret key
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_SECRET_KEY_AT_LEAST_32_CHARS

# API Keys - REQUIRED: Get from respective providers
GEMINI_API_KEY=your_gemini_api_key_here
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
SCAMADVISER_API_KEY=your_scamadviser_api_key_here
SCREENSHOTLAYER_API_KEY=your_screenshotlayer_api_key_here
NEWSAPI_API_KEY=your_newsapi_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here

# Service URLs (for development)
AUTH_SERVICE_URL=http://auth-service:3001
LINK_SERVICE_URL=http://link-service:3002
COMMUNITY_SERVICE_URL=http://community-service:3003
CHAT_SERVICE_URL=http://chat-service:3004
NEWS_SERVICE_URL=http://news-service:3005
ADMIN_SERVICE_URL=http://admin-service:3006

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# React App Configuration - REQUIRED: Update with your Firebase settings
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
EOF
        
        print_success ".env template created"
        print_warning "Please update all placeholder values in .env before deployment"
        echo ""
        echo -e "${YELLOW}Required configurations:${NC}"
        echo "  - Firebase project settings"
        echo "  - JWT secret key"
        echo "  - API keys for external services"
        echo ""
        echo -e "${CYAN}See DEPLOYMENT_SETUP.md for detailed instructions${NC}"
        return 1
    fi
    return 0
}

# Function to validate environment
validate_environment() {
    print_section "Validating Environment"
    
    local missing_vars=()
    local placeholder_vars=()
    
    # Required variables
    required_vars=(
        "FIREBASE_PROJECT_ID"
        "FIREBASE_CLIENT_EMAIL"
        "FIREBASE_PRIVATE_KEY"
        "JWT_SECRET"
        "REACT_APP_FIREBASE_API_KEY"
        "REACT_APP_FIREBASE_AUTH_DOMAIN"
        "REACT_APP_FIREBASE_PROJECT_ID"
    )
    
    # Check for missing variables
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    # Check for placeholder values
    placeholder_patterns=(
        "your_.*_here"
        "CHANGE_THIS_TO"
        "YOUR_.*_HERE"
    )
    
    for var in "${required_vars[@]}"; do
        value="${!var}"
        for pattern in "${placeholder_patterns[@]}"; do
            if [[ "$value" =~ $pattern ]]; then
                placeholder_vars+=("$var")
                break
            fi
        done
    done
    
    # Report issues
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    if [ ${#placeholder_vars[@]} -gt 0 ]; then
        print_error "Environment variables still contain placeholder values:"
        for var in "${placeholder_vars[@]}"; do
            echo "  - $var"
        done
        return 1
    fi
    
    print_success "Environment validation passed"
    return 0
}

# Function to check if images exist
check_images_exist() {
    local service_names=("api-gateway" "auth-service" "link-service" "community-service" "chat-service" "news-service" "admin-service" "frontend")
    local missing_images=()

    for service in "${service_names[@]}"; do
        if ! docker image inspect "backup_${service}:latest" > /dev/null 2>&1; then
            missing_images+=("$service")
        fi
    done

    echo "${#missing_images[@]}"
}

# Function to check if rebuild is needed
need_rebuild() {
    local service_dirs=("services/api-gateway" "services/auth-service" "services/link-service" "services/community-service" "services/chat-service" "services/news-service" "services/admin-service" "client")

    for service_dir in "${service_dirs[@]}"; do
        if [ -d "$service_dir" ]; then
            # Check if package.json changed
            if [ "$service_dir/package.json" -nt "$BUILD_TIMESTAMP" ]; then
                echo "$service_dir package.json changed"
                return 0
            fi

            # Check if source files changed
            if find "$service_dir/src" -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs ls -t 2>/dev/null | head -1 | xargs stat -c %Y 2>/dev/null | head -1 | xargs -I {} test {} -gt $(stat -c %Y "$BUILD_TIMESTAMP" 2>/dev/null || echo 0) 2>/dev/null; then
                echo "$service_dir source code changed"
                return 0
            fi

            # Check if Dockerfile changed
            if [ "$service_dir/Dockerfile" -nt "$BUILD_TIMESTAMP" ]; then
                echo "$service_dir Dockerfile changed"
                return 0
            fi
        fi
    done

    return 1
}

# Function to build services
build_services() {
    local force_build=${1:-false}
    local target_service=${2:-""}

    print_section "Building Services"

    if [ "$force_build" = true ]; then
        print_status "Force building all services..."
        if [ -n "$target_service" ]; then
            docker-compose -f "$COMPOSE_FILE" build "$target_service"
        else
            docker-compose -f "$COMPOSE_FILE" build
        fi
        touch "$BUILD_TIMESTAMP"
    else
        missing_count=$(check_images_exist)

        if [ "$missing_count" -gt 0 ]; then
            print_warning "$missing_count images missing. Building services..."
            if [ -n "$target_service" ]; then
                docker-compose -f "$COMPOSE_FILE" build "$target_service"
            else
                docker-compose -f "$COMPOSE_FILE" build
            fi
            touch "$BUILD_TIMESTAMP"
        elif [ ! -f "$BUILD_TIMESTAMP" ] || need_rebuild; then
            print_warning "Changes detected. Rebuilding services..."
            if [ -n "$target_service" ]; then
                docker-compose -f "$COMPOSE_FILE" build "$target_service"
            else
                docker-compose -f "$COMPOSE_FILE" build
            fi
            touch "$BUILD_TIMESTAMP"
        else
            print_success "All images exist and up-to-date. Using existing images..."
        fi
    fi
}

# Function to start services
start_services() {
    local target_service=${1:-""}

    print_section "Starting Services"

    if [ -n "$target_service" ]; then
        print_status "Starting $target_service..."
        docker-compose -f "$COMPOSE_FILE" up -d "$target_service"
    else
        print_status "Starting all services..."
        docker-compose -f "$COMPOSE_FILE" up -d
    fi

    print_success "Services started successfully"
}

# Function to stop services
stop_services() {
    local target_service=${1:-""}

    print_section "Stopping Services"

    if [ -n "$target_service" ]; then
        print_status "Stopping $target_service..."
        docker-compose -f "$COMPOSE_FILE" stop "$target_service"
    else
        print_status "Stopping all services..."
        docker-compose -f "$COMPOSE_FILE" down
    fi

    print_success "Services stopped successfully"
}

# Function to restart services
restart_services() {
    local target_service=${1:-""}

    print_section "Restarting Services"

    if [ -n "$target_service" ]; then
        print_status "Restarting $target_service..."
        docker-compose -f "$COMPOSE_FILE" restart "$target_service"
    else
        print_status "Restarting all services..."
        docker-compose -f "$COMPOSE_FILE" restart
    fi

    print_success "Services restarted successfully"
}

# Function to show service status
show_status() {
    print_section "Service Status"

    echo -e "${WHITE}Container Status:${NC}"
    docker-compose -f "$COMPOSE_FILE" ps

    echo -e "\n${WHITE}Resource Usage:${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# Function to show logs
show_logs() {
    local target_service=${1:-""}
    local follow=${2:-false}

    print_section "Service Logs"

    if [ "$follow" = true ]; then
        if [ -n "$target_service" ]; then
            print_status "Following logs for $target_service (Ctrl+C to exit)..."
            docker-compose -f "$COMPOSE_FILE" logs -f "$target_service"
        else
            print_status "Following logs for all services (Ctrl+C to exit)..."
            docker-compose -f "$COMPOSE_FILE" logs -f
        fi
    else
        if [ -n "$target_service" ]; then
            print_status "Showing recent logs for $target_service..."
            docker-compose -f "$COMPOSE_FILE" logs --tail=50 "$target_service"
        else
            print_status "Showing recent logs for all services..."
            docker-compose -f "$COMPOSE_FILE" logs --tail=20
        fi
    fi
}

# Function to check service health
check_health() {
    print_section "Health Check"

    local healthy_count=0
    local total_count=${#HEALTH_ENDPOINTS[@]}

    echo -e "${WHITE}Checking service endpoints...${NC}"

    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        IFS=':' read -r url name <<< "$endpoint"

        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            print_success "$name is healthy"
            ((healthy_count++))
        else
            print_error "$name is not responding"
        fi
    done

    echo ""
    if [ "$healthy_count" -eq "$total_count" ]; then
        print_success "All services are healthy ($healthy_count/$total_count)"
    else
        print_warning "Health check: $healthy_count/$total_count services are healthy"
    fi

    # Show service URLs
    echo -e "\n${WHITE}Service URLs:${NC}"
    for service in "${SERVICES[@]}"; do
        IFS=':' read -r name port description <<< "$service"
        echo -e "  ${CYAN}$description:${NC} http://localhost:$port"
    done
}

# Function to clean up containers and images
cleanup() {
    local force=${1:-false}

    print_section "Cleanup"

    if [ "$force" = false ]; then
        echo -e "${YELLOW}This will remove all containers, images, and volumes for this project.${NC}"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Cleanup cancelled"
            return 0
        fi
    fi

    print_status "Stopping and removing containers..."
    docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans

    print_status "Removing project images..."
    docker images --format "table {{.Repository}}:{{.Tag}}" | grep "^backup_" | xargs -r docker rmi -f

    print_status "Removing build timestamp..."
    rm -f "$BUILD_TIMESTAMP"

    print_status "Pruning unused Docker resources..."
    docker system prune -f

    print_success "Cleanup completed"
}

# Function for debug mode
debug_mode() {
    print_header "Debug Mode"

    print_section "System Information"
    echo -e "${WHITE}Docker Version:${NC}"
    docker --version
    echo -e "${WHITE}Docker Compose Version:${NC}"
    docker-compose --version
    echo -e "${WHITE}Available Memory:${NC}"
    if command -v free &> /dev/null; then
        free -h
    else
        echo "Memory info not available"
    fi
    echo -e "${WHITE}Disk Usage:${NC}"
    df -h "$PROJECT_ROOT"

    print_section "Environment Variables"
    echo -e "${WHITE}Loaded from .env:${NC}"
    if [ -f "$ENV_FILE" ]; then
        grep -v "^#" "$ENV_FILE" | grep -v "^$" | while read -r line; do
            var_name=$(echo "$line" | cut -d'=' -f1)
            echo "  $var_name=***"
        done
    else
        print_error ".env file not found"
    fi

    print_section "Docker Images"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | grep -E "(REPOSITORY|backup_)"

    print_section "Running Containers"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

    print_section "Network Information"
    docker network ls | grep backup

    print_section "Volume Information"
    docker volume ls | grep backup

    # Start services in debug mode
    print_section "Starting Services in Debug Mode"
    export COMPOSE_HTTP_TIMEOUT=120
    docker-compose -f "$COMPOSE_FILE" up --build
}

# Function to wait for services
wait_for_services() {
    local timeout=${1:-60}
    local interval=5
    local elapsed=0

    print_section "Waiting for Services"
    print_status "Waiting up to ${timeout}s for services to be ready..."

    while [ $elapsed -lt $timeout ]; do
        local ready_count=0
        local total_count=${#HEALTH_ENDPOINTS[@]}

        for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
            IFS=':' read -r url name <<< "$endpoint"
            if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
                ((ready_count++))
            fi
        done

        if [ "$ready_count" -eq "$total_count" ]; then
            print_success "All services are ready! ($ready_count/$total_count)"
            return 0
        fi

        echo -ne "\r${BLUE}${INFO} Services ready: $ready_count/$total_count (${elapsed}s elapsed)${NC}"
        sleep $interval
        elapsed=$((elapsed + interval))
    done

    echo ""
    print_warning "Timeout reached. Some services may still be starting up."
    return 1
}

# Function to show quick commands
show_quick_commands() {
    echo -e "\n${WHITE}${LOGS} Quick Commands:${NC}"
    echo -e "${CYAN}Management:${NC}"
    echo "  docker-compose -f $COMPOSE_FILE logs -f [service]  # Follow logs"
    echo "  docker-compose -f $COMPOSE_FILE restart [service]  # Restart service"
    echo "  docker-compose -f $COMPOSE_FILE exec [service] sh  # Shell into container"
    echo ""
    echo -e "${CYAN}Debugging:${NC}"
    echo "  $0 logs --service auth --follow                    # Follow auth logs"
    echo "  $0 health                                          # Check health"
    echo "  $0 status                                          # Show status"
    echo ""
    echo -e "${CYAN}Development:${NC}"
    echo "  $0 restart --service frontend                      # Restart frontend only"
    echo "  $0 rebuild --force                                 # Force rebuild all"
    echo "  $0 clean --force                                   # Clean everything"
}

# Function to show deployment summary
show_deployment_summary() {
    print_header "Deployment Summary"

    echo -e "${WHITE}${MONITOR} Service URLs:${NC}"
    echo -e "  ${GREEN}Frontend Application:${NC}     http://localhost:3000"
    echo -e "  ${GREEN}API Gateway:${NC}              http://localhost:8080"
    echo -e "  ${GREEN}Admin Panel:${NC}              http://localhost:3006"
    echo ""
    echo -e "${WHITE}${MONITOR} Monitoring & Debugging:${NC}"
    echo -e "  ${CYAN}Prometheus:${NC}                http://localhost:9090"
    echo -e "  ${CYAN}Grafana:${NC}                   http://localhost:3007 (admin/admin)"
    echo -e "  ${CYAN}Jaeger Tracing:${NC}            http://localhost:16686"
    echo ""
    echo -e "${WHITE}${GEAR} Individual Services:${NC}"
    echo -e "  ${BLUE}Auth Service:${NC}              http://localhost:3001"
    echo -e "  ${BLUE}Link Service:${NC}              http://localhost:3002"
    echo -e "  ${BLUE}Community Service:${NC}         http://localhost:3003"
    echo -e "  ${BLUE}Chat Service:${NC}              http://localhost:3004"
    echo -e "  ${BLUE}News Service:${NC}              http://localhost:3005"

    show_quick_commands
}

# Parse command line arguments
COMMAND=""
TARGET_SERVICE=""
FORCE_BUILD=false
NO_BUILD=false
VERBOSE=false
FOLLOW_LOGS=false
FORCE_ACTION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        start|up|deploy)
            COMMAND="start"
            shift
            ;;
        stop|down)
            COMMAND="stop"
            shift
            ;;
        restart)
            COMMAND="restart"
            shift
            ;;
        rebuild)
            COMMAND="rebuild"
            shift
            ;;
        logs)
            COMMAND="logs"
            shift
            ;;
        status|ps)
            COMMAND="status"
            shift
            ;;
        health)
            COMMAND="health"
            shift
            ;;
        clean)
            COMMAND="clean"
            shift
            ;;
        setup)
            COMMAND="setup"
            shift
            ;;
        debug)
            COMMAND="debug"
            shift
            ;;
        help|--help|-h)
            show_usage
            exit 0
            ;;
        --service)
            TARGET_SERVICE="$2"
            shift 2
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        --force)
            FORCE_ACTION=true
            FORCE_BUILD=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --follow)
            FOLLOW_LOGS=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Default command
if [ -z "$COMMAND" ]; then
    COMMAND="start"
fi

# Change to project root
cd "$PROJECT_ROOT"

# Main execution
print_header "Anti-Fraud Platform Development Deployment"
echo -e "${WHITE}Project Root:${NC} $PROJECT_ROOT"
echo -e "${WHITE}Command:${NC} $COMMAND"
if [ -n "$TARGET_SERVICE" ]; then
    echo -e "${WHITE}Target Service:${NC} $TARGET_SERVICE"
fi
echo ""

case $COMMAND in
    setup)
        check_prerequisites
        create_env_file
        if [ $? -eq 1 ]; then
            exit 1
        fi
        print_success "Setup completed successfully"
        ;;

    start)
        check_prerequisites

        # Load environment variables
        if [ -f "$ENV_FILE" ]; then
            set -a
            source "$ENV_FILE"
            set +a
        else
            create_env_file
            if [ $? -eq 1 ]; then
                exit 1
            fi
        fi

        # Validate environment (skip for quick start)
        if [ "$NO_BUILD" = false ]; then
            validate_environment
            if [ $? -eq 1 ]; then
                print_error "Environment validation failed. Run '$0 setup' or check .env file"
                exit 1
            fi
        fi

        # Build services
        if [ "$NO_BUILD" = false ]; then
            build_services "$FORCE_BUILD" "$TARGET_SERVICE"
        fi

        # Start services
        start_services "$TARGET_SERVICE"

        # Wait for services to be ready
        if [ -z "$TARGET_SERVICE" ]; then
            wait_for_services 60
            check_health
            show_deployment_summary
        else
            print_success "$TARGET_SERVICE started successfully"
        fi
        ;;

    stop)
        stop_services "$TARGET_SERVICE"
        ;;

    restart)
        restart_services "$TARGET_SERVICE"
        if [ -n "$TARGET_SERVICE" ]; then
            print_success "$TARGET_SERVICE restarted successfully"
        fi
        ;;

    rebuild)
        check_prerequisites

        # Load environment variables
        if [ -f "$ENV_FILE" ]; then
            set -a
            source "$ENV_FILE"
            set +a
        fi

        build_services true "$TARGET_SERVICE"
        start_services "$TARGET_SERVICE"

        if [ -z "$TARGET_SERVICE" ]; then
            wait_for_services 60
            check_health
            show_deployment_summary
        fi
        ;;

    logs)
        show_logs "$TARGET_SERVICE" "$FOLLOW_LOGS"
        ;;

    status)
        show_status
        ;;

    health)
        check_health
        ;;

    clean)
        cleanup "$FORCE_ACTION"
        ;;

    debug)
        check_prerequisites
        debug_mode
        ;;

    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac

print_success "Operation completed successfully!"
