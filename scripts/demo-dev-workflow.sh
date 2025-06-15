#!/bin/bash

# =============================================================================
# 🔥 Demo Development Workflow - No Rebuild Needed!
# =============================================================================

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

echo -e "${WHITE}🔥 Demo: Development Workflow Without Rebuilding${NC}"
echo -e "${WHITE}=================================================${NC}"
echo ""

echo -e "${CYAN}📋 Available Development Methods:${NC}"
echo ""
echo -e "${GREEN}1. Development Mode (Hot Reload) - RECOMMENDED${NC}"
echo "   ./scripts/dev-deploy.sh dev"
echo "   - Code changes auto-reload"
echo "   - No rebuild needed"
echo "   - Fastest development"
echo ""

echo -e "${GREEN}2. Quick Commands${NC}"
echo "   make dev                    # Start with hot reload"
echo "   make dev-quick              # Start without building"
echo "   make logs-follow            # Follow all logs"
echo "   make restart-service SERVICE=auth-service"
echo ""

echo -e "${GREEN}3. Service-Specific Operations${NC}"
echo "   ./scripts/dev-deploy.sh restart --service auth-service"
echo "   ./scripts/dev-deploy.sh logs --service auth-service --follow"
echo "   docker-compose -f docker-compose.dev.yml restart auth-service"
echo ""

echo -e "${GREEN}4. Debug Commands${NC}"
echo "   ./scripts/dev-deploy.sh health    # Check all services"
echo "   ./scripts/dev-deploy.sh status    # Show resource usage"
echo "   docker stats                      # Real-time stats"
echo ""

echo -e "${YELLOW}⚡ Quick Start Demo:${NC}"
echo ""
echo "# 1. Start development environment"
echo "make dev"
echo ""
echo "# 2. Edit code in services/*/src/ or client/src/"
echo "# 3. See changes automatically reload!"
echo ""
echo "# 4. Debug with logs"
echo "make logs-follow"
echo ""
echo "# 5. Restart specific service if needed"
echo "make restart-service SERVICE=auth-service"
echo ""

echo -e "${BLUE}🎯 When do you need to rebuild?${NC}"
echo -e "${YELLOW}❌ NEVER for:${NC} Code changes, logic updates, UI changes"
echo -e "${YELLOW}✅ ONLY for:${NC} New npm packages, Dockerfile changes"
echo ""

echo -e "${WHITE}🚀 Ready to start? Run:${NC}"
echo -e "${GREEN}make dev${NC}"
echo ""

read -p "Press Enter to continue or Ctrl+C to exit..."

echo ""
echo -e "${CYAN}Starting development mode demo...${NC}"
echo ""

# Check if script exists
if [ ! -f "scripts/dev-deploy.sh" ]; then
    echo -e "${RED}❌ dev-deploy.sh not found${NC}"
    exit 1
fi

# Make executable
chmod +x scripts/dev-deploy.sh

echo -e "${BLUE}ℹ️  Running: ./scripts/dev-deploy.sh dev${NC}"
echo ""

# Run development mode
./scripts/dev-deploy.sh dev
