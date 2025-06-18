#!/bin/bash

# =============================================================================
# Cross-Platform Environment Validation Script
# =============================================================================
# This script validates that the environment is properly set up for 
# cross-platform development and deployment
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        print_success "File exists: $1"
        return 0
    else
        print_error "File missing: $1"
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        print_success "Directory exists: $1"
        return 0
    else
        print_error "Directory missing: $1"
        return 1
    fi
}

print_header "CROSS-PLATFORM ENVIRONMENT VALIDATION"

# Check OS
echo -e "\n${BLUE}Detecting Operating System...${NC}"
OS="Unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "cygwin" ]]; then
    OS="Windows (Cygwin)"
elif [[ "$OSTYPE" == "msys" ]]; then
    OS="Windows (Git Bash)"
elif [[ "$OSTYPE" == "win32" ]]; then
    OS="Windows"
fi

print_success "Operating System: $OS"

# Check essential commands
echo -e "\n${BLUE}Checking Essential Commands...${NC}"
COMMANDS_OK=true

if ! check_command "node"; then
    COMMANDS_OK=false
fi

if ! check_command "npm"; then
    COMMANDS_OK=false
fi

if ! check_command "docker"; then
    COMMANDS_OK=false
fi

if ! check_command "git"; then
    COMMANDS_OK=false
fi

# Check optional but recommended commands
echo -e "\n${BLUE}Checking Optional Commands...${NC}"
check_command "docker-compose" || check_command "docker compose" || print_warning "docker-compose not found"
check_command "kubectl" || print_warning "kubectl not found (needed for Kubernetes deployment)"
check_command "make" || print_warning "make not found (optional for build automation)"

# Check Node.js version
echo -e "\n${BLUE}Checking Node.js Version...${NC}"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 16 ]; then
        print_success "Node.js version: $NODE_VERSION (✓ >= 16)"
    else
        print_error "Node.js version: $NODE_VERSION (✗ < 16 - please upgrade)"
        COMMANDS_OK=false
    fi
fi

# Check Docker version
echo -e "\n${BLUE}Checking Docker Version...${NC}"
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_success "Docker version: $DOCKER_VERSION"
    
    # Check if Docker is running
    if docker info >/dev/null 2>&1; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running"
        COMMANDS_OK=false
    fi
fi

# Check essential files
echo -e "\n${BLUE}Checking Essential Files...${NC}"
FILES_OK=true

if ! check_file "package.json"; then
    FILES_OK=false
fi

if ! check_file "docker-compose.yml"; then
    FILES_OK=false
fi

if ! check_file ".env.template"; then
    FILES_OK=false
fi

check_file ".env" || print_warning ".env file not found - copy from .env.template"

# Check essential directories
echo -e "\n${BLUE}Checking Essential Directories...${NC}"
DIRS_OK=true

if ! check_directory "client"; then
    DIRS_OK=false
fi

if ! check_directory "services"; then
    DIRS_OK=false
fi

if ! check_directory "scripts"; then
    DIRS_OK=false
fi

if ! check_directory "k8s"; then
    DIRS_OK=false
fi

if ! check_directory "monitoring"; then
    DIRS_OK=false
fi

# Check script permissions (Unix-like systems)
if [[ "$OS" != "Windows" ]]; then
    echo -e "\n${BLUE}Checking Script Permissions...${NC}"
    SCRIPT_PERMS_OK=true
    
    for script in scripts/*.sh k8s/*.sh *.sh; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                print_success "Executable: $script"
            else
                print_warning "Not executable: $script (run: chmod +x $script)"
                SCRIPT_PERMS_OK=false
            fi
        fi
    done
fi

# Check cross-platform scripts
echo -e "\n${BLUE}Checking Cross-Platform Scripts...${NC}"
SCRIPTS_OK=true

# Check for essential deployment scripts
for script_name in "deploy-microservices" "build-images" "start-monitoring"; do
    FOUND=false
    for ext in "sh" "ps1" "bat"; do
        if [ -f "scripts/${script_name}.${ext}" ] || [ -f "${script_name}.${ext}" ]; then
            FOUND=true
            break
        fi
    done
    
    if [ "$FOUND" = true ]; then
        print_success "Cross-platform script available: $script_name"
    else
        print_error "Missing cross-platform script: $script_name"
        SCRIPTS_OK=false
    fi
done

# Check Docker Compose files
echo -e "\n${BLUE}Checking Docker Compose Configuration...${NC}"
COMPOSE_OK=true

for compose_file in "docker-compose.yml" "docker-compose.dev.yml" "docker-compose.microservices.yml"; do
    if [ -f "$compose_file" ]; then
        print_success "Docker Compose file: $compose_file"
    else
        print_warning "Docker Compose file missing: $compose_file"
    fi
done

# Check Kubernetes manifests
echo -e "\n${BLUE}Checking Kubernetes Configuration...${NC}"
K8S_OK=true

if [ -d "k8s" ]; then
    K8S_FILES=$(find k8s -name "*.yml" -o -name "*.yaml" | wc -l)
    if [ "$K8S_FILES" -gt 0 ]; then
        print_success "Kubernetes manifests found: $K8S_FILES files"
    else
        print_warning "No Kubernetes manifests found in k8s/"
    fi
else
    print_warning "k8s directory not found"
fi

# Final assessment
echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${BLUE}VALIDATION SUMMARY${NC}"
echo -e "${BLUE}==============================================================================${NC}"

if [ "$COMMANDS_OK" = true ] && [ "$FILES_OK" = true ] && [ "$DIRS_OK" = true ] && [ "$SCRIPTS_OK" = true ]; then
    print_success "Environment is ready for cross-platform development!"
    echo -e "\n${GREEN}Next steps:${NC}"
    echo -e "1. Copy .env.template to .env and configure your settings"
    echo -e "2. Run: npm install"
    echo -e "3. Choose your deployment method:"
    echo -e "   - Docker: ./build-images.sh && docker-compose up"
    echo -e "   - Kubernetes: ./k8s/deploy-all.sh"
    echo -e "   - Local development: npm run dev"
    exit 0
else
    print_error "Environment validation failed!"
    echo -e "\n${RED}Issues found:${NC}"
    [ "$COMMANDS_OK" = false ] && echo -e "- Missing essential commands"
    [ "$FILES_OK" = false ] && echo -e "- Missing essential files"
    [ "$DIRS_OK" = false ] && echo -e "- Missing essential directories"
    [ "$SCRIPTS_OK" = false ] && echo -e "- Missing cross-platform scripts"
    
    echo -e "\n${YELLOW}Please fix the issues above and run this script again.${NC}"
    exit 1
fi
