# =============================================================================
# 🚀 Anti-Fraud Platform - Development Makefile
# Easy deployment and debugging for all services
# =============================================================================

# Configuration
COMPOSE_FILE := docker-compose.microservices.yml
ENV_FILE := .env
SCRIPT_DIR := scripts

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
CYAN := \033[0;36m
WHITE := \033[1;37m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

# Phony targets
.PHONY: help setup start stop restart rebuild logs status health clean debug
.PHONY: start-service stop-service restart-service logs-service
.PHONY: build test deploy production

# Help target
help: ## Show this help message
	@echo ""
	@echo "$(WHITE)🚀 Anti-Fraud Platform - Development Commands$(NC)"
	@echo "$(WHITE)=============================================$(NC)"
	@echo ""
	@echo "$(CYAN)Core Commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(setup|start|stop|restart|rebuild)"
	@echo ""
	@echo "$(CYAN)Management Commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(logs|status|health|clean)"
	@echo ""
	@echo "$(CYAN)Service-Specific Commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "service"
	@echo ""
	@echo "$(CYAN)Development Commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "(debug|test|build)"
	@echo ""
	@echo "$(CYAN)Examples:$(NC)"
	@echo "  make start                    # Start all services"
	@echo "  make logs SERVICE=auth        # Show auth service logs"
	@echo "  make restart-service SERVICE=api-gateway"
	@echo "  make rebuild                  # Force rebuild all services"
	@echo "  make health                   # Check service health"
	@echo ""

# Check if script exists and is executable
check-script:
	@if [ ! -f "$(SCRIPT_DIR)/dev-deploy.sh" ]; then \
		echo "$(RED)❌ Deployment script not found: $(SCRIPT_DIR)/dev-deploy.sh$(NC)"; \
		exit 1; \
	fi
	@if [ ! -x "$(SCRIPT_DIR)/dev-deploy.sh" ]; then \
		echo "$(YELLOW)⚠️  Making deployment script executable...$(NC)"; \
		chmod +x "$(SCRIPT_DIR)/dev-deploy.sh"; \
	fi

# Core Commands
setup: check-script ## Initial setup and environment check
	@echo "$(BLUE)ℹ️  Setting up development environment...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh setup

start: check-script ## Start all services
	@echo "$(BLUE)ℹ️  Starting all services...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh start

dev: check-script ## Start in development mode with hot reload (recommended)
	@echo "$(BLUE)ℹ️  Starting development mode with hot reload...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh dev

stop: check-script ## Stop all services
	@echo "$(BLUE)ℹ️  Stopping all services...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh stop

restart: check-script ## Restart all services
	@echo "$(BLUE)ℹ️  Restarting all services...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh restart

rebuild: check-script ## Force rebuild and start all services
	@echo "$(BLUE)ℹ️  Rebuilding all services...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh rebuild --force

# Management Commands
logs: check-script ## Show logs for all services (use SERVICE=name for specific service)
	@if [ -n "$(SERVICE)" ]; then \
		echo "$(BLUE)ℹ️  Showing logs for $(SERVICE)...$(NC)"; \
		$(SCRIPT_DIR)/dev-deploy.sh logs --service $(SERVICE); \
	else \
		echo "$(BLUE)ℹ️  Showing logs for all services...$(NC)"; \
		$(SCRIPT_DIR)/dev-deploy.sh logs; \
	fi

logs-follow: check-script ## Follow logs for all services (use SERVICE=name for specific service)
	@if [ -n "$(SERVICE)" ]; then \
		echo "$(BLUE)ℹ️  Following logs for $(SERVICE)...$(NC)"; \
		$(SCRIPT_DIR)/dev-deploy.sh logs --service $(SERVICE) --follow; \
	else \
		echo "$(BLUE)ℹ️  Following logs for all services...$(NC)"; \
		$(SCRIPT_DIR)/dev-deploy.sh logs --follow; \
	fi

status: check-script ## Show service status and resource usage
	@echo "$(BLUE)ℹ️  Checking service status...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh status

health: check-script ## Check service health endpoints
	@echo "$(BLUE)ℹ️  Checking service health...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh health

clean: check-script ## Clean up containers, images, and volumes
	@echo "$(YELLOW)⚠️  Cleaning up Docker resources...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh clean

clean-force: check-script ## Force clean up without confirmation
	@echo "$(YELLOW)⚠️  Force cleaning up Docker resources...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh clean --force

# Service-Specific Commands
start-service: check-script ## Start specific service (use SERVICE=name)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)❌ Please specify SERVICE=name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)ℹ️  Starting $(SERVICE)...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh start --service $(SERVICE)

stop-service: check-script ## Stop specific service (use SERVICE=name)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)❌ Please specify SERVICE=name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)ℹ️  Stopping $(SERVICE)...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh stop --service $(SERVICE)

restart-service: check-script ## Restart specific service (use SERVICE=name)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)❌ Please specify SERVICE=name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)ℹ️  Restarting $(SERVICE)...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh restart --service $(SERVICE)

logs-service: check-script ## Show logs for specific service (use SERVICE=name)
	@if [ -z "$(SERVICE)" ]; then \
		echo "$(RED)❌ Please specify SERVICE=name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)ℹ️  Showing logs for $(SERVICE)...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh logs --service $(SERVICE)

# Development Commands
debug: check-script ## Start in debug mode with detailed logging
	@echo "$(BLUE)ℹ️  Starting debug mode...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh debug

build: check-script ## Build all services without starting
	@echo "$(BLUE)ℹ️  Building all services...$(NC)"
	@docker-compose -f $(COMPOSE_FILE) build

test: ## Run tests for all services
	@echo "$(BLUE)ℹ️  Running tests...$(NC)"
	@echo "$(YELLOW)⚠️  Test implementation needed$(NC)"

# Docker Commands (direct)
docker-ps: ## Show Docker container status
	@docker-compose -f $(COMPOSE_FILE) ps

docker-images: ## Show Docker images
	@docker images | grep -E "(REPOSITORY|backup_)"

docker-networks: ## Show Docker networks
	@docker network ls | grep backup

docker-volumes: ## Show Docker volumes
	@docker volume ls | grep backup

docker-stats: ## Show Docker resource usage
	@docker stats --no-stream

# Environment Commands
env-check: ## Check environment file
	@if [ -f "$(ENV_FILE)" ]; then \
		echo "$(GREEN)✅ Environment file exists$(NC)"; \
		echo "$(BLUE)ℹ️  Environment variables:$(NC)"; \
		grep -v "^#" $(ENV_FILE) | grep -v "^$$" | cut -d'=' -f1 | sed 's/^/  /'; \
	else \
		echo "$(RED)❌ Environment file not found$(NC)"; \
		echo "$(YELLOW)⚠️  Run 'make setup' to create it$(NC)"; \
	fi

env-create: ## Create environment file template
	@$(SCRIPT_DIR)/dev-deploy.sh setup

# Quick shortcuts
up: start ## Alias for start
down: stop ## Alias for stop
ps: status ## Alias for status

# URLs and Information
urls: ## Show service URLs
	@echo ""
	@echo "$(WHITE)📊 Service URLs:$(NC)"
	@echo "  $(GREEN)Frontend Application:$(NC)     http://localhost:3000"
	@echo "  $(GREEN)API Gateway:$(NC)              http://localhost:8080"
	@echo "  $(GREEN)Admin Panel:$(NC)              http://localhost:3006"
	@echo ""
	@echo "$(WHITE)📊 Monitoring:$(NC)"
	@echo "  $(CYAN)Prometheus:$(NC)                http://localhost:9090"
	@echo "  $(CYAN)Grafana:$(NC)                   http://localhost:3007 (admin/admin)"
	@echo "  $(CYAN)Jaeger Tracing:$(NC)            http://localhost:16686"
	@echo ""
	@echo "$(WHITE)🔧 Individual Services:$(NC)"
	@echo "  $(BLUE)Auth Service:$(NC)              http://localhost:3001"
	@echo "  $(BLUE)Link Service:$(NC)              http://localhost:3002"
	@echo "  $(BLUE)Community Service:$(NC)         http://localhost:3003"
	@echo "  $(BLUE)Chat Service:$(NC)              http://localhost:3004"
	@echo "  $(BLUE)News Service:$(NC)              http://localhost:3005"
	@echo ""

info: ## Show project information
	@echo ""
	@echo "$(WHITE)🚀 Anti-Fraud Platform Development Environment$(NC)"
	@echo "$(WHITE)=============================================$(NC)"
	@echo "$(WHITE)Project Root:$(NC) $(shell pwd)"
	@echo "$(WHITE)Compose File:$(NC) $(COMPOSE_FILE)"
	@echo "$(WHITE)Environment:$(NC) $(ENV_FILE)"
	@echo ""
	@echo "$(CYAN)Available Services:$(NC)"
	@echo "  - api-gateway (API Gateway)"
	@echo "  - auth-service (Authentication)"
	@echo "  - link-service (Link Verification)"
	@echo "  - community-service (Community Features)"
	@echo "  - chat-service (Chat/AI Features)"
	@echo "  - news-service (News/Content)"
	@echo "  - admin-service (Admin Panel)"
	@echo "  - frontend (React Frontend)"
	@echo "  - redis (Cache)"
	@echo "  - prometheus (Monitoring)"
	@echo "  - grafana (Dashboard)"
	@echo "  - jaeger (Tracing)"
	@echo ""

# Development workflow shortcuts
dev-full: setup dev health urls ## Complete development setup (setup + dev + health + urls)

quick: ## Quick start without building (uses existing images)
	@echo "$(BLUE)ℹ️  Quick starting with existing images...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh start --no-build

dev-quick: ## Quick start development mode without building
	@echo "$(BLUE)ℹ️  Quick starting development mode with existing images...$(NC)"
	@$(SCRIPT_DIR)/dev-deploy.sh dev --no-build

fresh: clean-force rebuild health ## Fresh start (clean + rebuild + health)

# Monitoring shortcuts
monitor: ## Open monitoring dashboards
	@echo "$(BLUE)ℹ️  Opening monitoring dashboards...$(NC)"
	@echo "$(CYAN)Opening Grafana...$(NC)"
	@if command -v xdg-open > /dev/null; then \
		xdg-open http://localhost:3007; \
	elif command -v open > /dev/null; then \
		open http://localhost:3007; \
	else \
		echo "$(YELLOW)⚠️  Please open http://localhost:3007 manually$(NC)"; \
	fi

# Backup and restore (placeholder for future implementation)
backup: ## Backup development data
	@echo "$(YELLOW)⚠️  Backup functionality not implemented yet$(NC)"

restore: ## Restore development data
	@echo "$(YELLOW)⚠️  Restore functionality not implemented yet$(NC)"
