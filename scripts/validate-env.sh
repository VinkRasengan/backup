#!/bin/bash

# =============================================================================
# 🔍 Environment Validation Script
# Validates all required environment variables and configurations
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Emojis
ROCKET="🚀"
CHECK="✅"
WARNING="⚠️"
ERROR="❌"
INFO="ℹ️"

# Print functions
print_header() {
    echo -e "\n${WHITE}${ROCKET} $1${NC}"
    echo -e "${WHITE}============================================================${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${ERROR} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}${WARNING} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${INFO} $1${NC}"
}

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

# Track validation results
ERRORS=0
WARNINGS=0

# Function to check if variable exists and is not empty
check_required_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [[ -z "$var_value" ]]; then
        print_error "Missing required variable: $var_name"
        ((ERRORS++))
        return 1
    else
        print_success "$var_name is set"
        return 0
    fi
}

# Function to check optional variable
check_optional_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [[ -z "$var_value" ]]; then
        print_warning "Optional variable not set: $var_name"
        ((WARNINGS++))
        return 1
    else
        print_success "$var_name is set"
        return 0
    fi
}

# Function to validate Firebase configuration
validate_firebase() {
    print_info "Validating Firebase configuration..."
    
    local valid=true
    
    check_required_var "FIREBASE_PROJECT_ID" || valid=false
    check_required_var "FIREBASE_CLIENT_EMAIL" || valid=false
    check_required_var "FIREBASE_PRIVATE_KEY" || valid=false
    
    # Validate Firebase project ID format
    if [[ -n "$FIREBASE_PROJECT_ID" ]]; then
        if [[ ! "$FIREBASE_PROJECT_ID" =~ ^[a-z][a-z0-9-]{5,29}$ ]]; then
            print_error "FIREBASE_PROJECT_ID format is invalid"
            ((ERRORS++))
            valid=false
        fi
    fi
    
    # Validate Firebase client email format
    if [[ -n "$FIREBASE_CLIENT_EMAIL" ]]; then
        if [[ ! "$FIREBASE_CLIENT_EMAIL" =~ @.*\.iam\.gserviceaccount\.com$ ]]; then
            print_error "FIREBASE_CLIENT_EMAIL format is invalid"
            ((ERRORS++))
            valid=false
        fi
    fi
    
    # Validate Firebase private key format
    if [[ -n "$FIREBASE_PRIVATE_KEY" ]]; then
        if [[ ! "$FIREBASE_PRIVATE_KEY" =~ "BEGIN PRIVATE KEY" ]]; then
            print_error "FIREBASE_PRIVATE_KEY format is invalid"
            ((ERRORS++))
            valid=false
        fi
    fi
    
    if $valid; then
        print_success "Firebase configuration is valid"
    fi
}

# Function to validate JWT configuration
validate_jwt() {
    print_info "Validating JWT configuration..."
    
    if check_required_var "JWT_SECRET"; then
        if [[ ${#JWT_SECRET} -lt 32 ]]; then
            print_error "JWT_SECRET should be at least 32 characters long (current: ${#JWT_SECRET})"
            ((ERRORS++))
        else
            print_success "JWT_SECRET length is adequate (${#JWT_SECRET} characters)"
        fi
    fi
}

# Function to validate API keys
validate_api_keys() {
    print_info "Validating API keys..."
    
    # Required API keys
    check_optional_var "GEMINI_API_KEY"
    
    # Optional API keys
    check_optional_var "VIRUSTOTAL_API_KEY"
    check_optional_var "SCAMADVISER_API_KEY"
    check_optional_var "NEWSAPI_KEY"
    check_optional_var "NEWSDATA_API_KEY"
    check_optional_var "SCREENSHOTLAYER_ACCESS_KEY"
}

# Function to validate service URLs
validate_service_urls() {
    print_info "Validating service URLs..."
    
    local redis_url="${REDIS_URL:-redis://localhost:6379}"
    print_info "Redis URL: $redis_url"
    
    # Check if Redis is accessible (if running locally)
    if [[ "$redis_url" == *"localhost"* ]] || [[ "$redis_url" == *"127.0.0.1"* ]]; then
        if command -v redis-cli &> /dev/null; then
            if redis-cli -u "$redis_url" ping &> /dev/null; then
                print_success "Redis is accessible"
            else
                print_warning "Redis is not accessible (may not be running)"
                ((WARNINGS++))
            fi
        else
            print_warning "redis-cli not found, cannot test Redis connection"
            ((WARNINGS++))
        fi
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    print_info "Testing API endpoints (optional)..."
    
    # Test Gemini API if key is provided
    if [[ -n "$GEMINI_API_KEY" ]]; then
        print_info "Testing Gemini API..."
        local gemini_response=$(curl -s -X POST \
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}" \
            -H "Content-Type: application/json" \
            -d '{"contents":[{"parts":[{"text":"test"}]}]}' 2>/dev/null || echo "error")
        
        if [[ "$gemini_response" != "error" ]] && [[ ! "$gemini_response" =~ "error" ]]; then
            print_success "Gemini API is accessible"
        else
            print_warning "Gemini API test failed - check your API key"
            ((WARNINGS++))
        fi
    fi
    
    # Test VirusTotal API if key is provided
    if [[ -n "$VIRUSTOTAL_API_KEY" ]]; then
        print_info "Testing VirusTotal API..."
        local vt_response=$(curl -s -X GET \
            "https://www.virustotal.com/vtapi/v2/url/report?apikey=${VIRUSTOTAL_API_KEY}&resource=http://www.google.com" 2>/dev/null || echo "error")
        
        if [[ "$vt_response" != "error" ]] && [[ ! "$vt_response" =~ "error" ]]; then
            print_success "VirusTotal API is accessible"
        else
            print_warning "VirusTotal API test failed - check your API key"
            ((WARNINGS++))
        fi
    fi
}

# Function to check system requirements
check_system_requirements() {
    print_info "Checking system requirements..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)
        
        if [[ $major_version -ge 18 ]]; then
            print_success "Node.js version: $node_version (✓)"
        else
            print_error "Node.js version $node_version is too old. Required: 18+"
            ((ERRORS++))
        fi
    else
        print_error "Node.js is not installed"
        ((ERRORS++))
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_success "npm version: $npm_version"
    else
        print_error "npm is not installed"
        ((ERRORS++))
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null; then
            local docker_version=$(docker --version | cut -d' ' -f3 | sed 's/,//')
            print_success "Docker version: $docker_version (running)"
        else
            print_warning "Docker is installed but not running"
            ((WARNINGS++))
        fi
    else
        print_warning "Docker is not installed (optional for local development)"
        ((WARNINGS++))
    fi
    
    # Check available memory
    if command -v free &> /dev/null; then
        local memory_gb=$(free -g | awk '/^Mem:/{print $2}')
        if [[ $memory_gb -ge 8 ]]; then
            print_success "Available memory: ${memory_gb}GB (✓)"
        else
            print_warning "Available memory: ${memory_gb}GB (recommended: 8GB+)"
            ((WARNINGS++))
        fi
    fi
}

# Function to check file permissions
check_file_permissions() {
    print_info "Checking file permissions..."
    
    # Check if scripts are executable
    local scripts_dir="$PROJECT_ROOT/scripts"
    if [[ -d "$scripts_dir" ]]; then
        local script_files=("dev-deploy.sh" "generate-k8s-manifests.sh")
        
        for script in "${script_files[@]}"; do
            local script_path="$scripts_dir/$script"
            if [[ -f "$script_path" ]]; then
                if [[ -x "$script_path" ]]; then
                    print_success "$script is executable"
                else
                    print_warning "$script is not executable (fixing...)"
                    chmod +x "$script_path"
                    print_success "$script is now executable"
                fi
            fi
        done
    fi
}

# Main validation function
main() {
    print_header "Anti-Fraud Platform - Environment Validation"
    
    # Check if .env file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        print_error ".env file not found at: $ENV_FILE"
        print_info "Please copy .env.template to .env and configure it"
        exit 1
    fi
    
    print_success ".env file found"
    
    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a
    
    print_success "Environment variables loaded"
    
    # Run all validations
    check_system_requirements
    validate_firebase
    validate_jwt
    validate_api_keys
    validate_service_urls
    check_file_permissions
    
    # Optional API tests (only if curl is available)
    if command -v curl &> /dev/null; then
        test_api_endpoints
    else
        print_warning "curl not found, skipping API endpoint tests"
        ((WARNINGS++))
    fi
    
    # Summary
    print_header "Validation Summary"
    
    if [[ $ERRORS -eq 0 ]]; then
        print_success "✨ All required configurations are valid!"
        
        if [[ $WARNINGS -eq 0 ]]; then
            print_success "🎉 Perfect! No warnings either."
        else
            print_warning "⚠️  $WARNINGS warning(s) found (see above)"
            print_info "Warnings are optional configurations that may improve functionality"
        fi
        
        echo -e "\n${GREEN}🚀 You're ready to deploy the Anti-Fraud Platform!${NC}"
        echo -e "\n${CYAN}Next steps:${NC}"
        echo "  Local development:  ./scripts/dev-deploy.sh dev"
        echo "  Docker deployment:  ./scripts/dev-deploy.sh start"
        echo "  Kubernetes:         ./scripts/generate-k8s-manifests.sh && ./k8s/deploy.sh"
        
    else
        print_error "❌ $ERRORS error(s) found that must be fixed"
        
        if [[ $WARNINGS -gt 0 ]]; then
            print_warning "⚠️  $WARNINGS warning(s) found"
        fi
        
        echo -e "\n${RED}Please fix the errors above before deploying.${NC}"
        echo -e "\n${CYAN}Quick fixes:${NC}"
        echo "  - Update .env file with missing required variables"
        echo "  - Check API keys and credentials"
        echo "  - Ensure system requirements are met"
        
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [--help] [--no-api-tests]"
        echo ""
        echo "Validates Anti-Fraud Platform environment configuration"
        echo ""
        echo "Options:"
        echo "  --help          Show this help message"
        echo "  --no-api-tests  Skip API endpoint testing"
        exit 0
        ;;
    --no-api-tests)
        # Skip API tests
        test_api_endpoints() { :; }
        ;;
esac

# Run main function
main "$@"
