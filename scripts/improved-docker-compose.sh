#!/bin/bash

# Improved Docker Compose detection and command setup
setup_docker_compose() {
    if docker compose version >/dev/null 2>&1; then
        # New Docker Compose plugin (preferred)
        COMPOSE_CMD="docker compose"
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
        print_success "Docker Compose (plugin) version $COMPOSE_VERSION is available"
        return 0
    elif command_exists docker-compose; then
        # Legacy standalone docker-compose
        COMPOSE_CMD="docker-compose"
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        print_success "Docker Compose (standalone) version $COMPOSE_VERSION is available"
        return 0
    else
        print_error "Docker Compose is not installed"
        print_error "Please install Docker Desktop which includes Docker Compose"
        return 1
    fi
}

# Usage in deployment
deploy_with_compose() {
    print_status "Starting Docker Compose deployment..."
    $COMPOSE_CMD up --build -d
    
    if [ $? -ne 0 ]; then
        print_error "Failed to start Docker containers"
        print_error "Attempting cleanup and retry..."
        $COMPOSE_CMD down --remove-orphans 2>/dev/null || true
        $COMPOSE_CMD up --build -d
    fi
}
