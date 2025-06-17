#!/bin/bash

# =============================================================================
# 🚀 Quick Deploy Script - Anti-Fraud Platform
# =============================================================================
# One-command deployment for local development

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Deploy - Anti-Fraud Platform${NC}"
echo "====================================="
echo ""

# Check if services are already running
if curl -s http://localhost:8082/health >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Services are already running!${NC}"
    echo ""
    echo "Options:"
    echo "  1. Stop and restart: npm run restart"
    echo "  2. Just stop: npm run kill:all"
    echo "  3. Check status: npm run health"
    echo ""
    exit 0
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm run install:all >/dev/null 2>&1

echo -e "${BLUE}🔧 Starting services...${NC}"
npm run start:safe >/dev/null 2>&1 &

echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
sleep 15

# Check if services started successfully
if curl -s http://localhost:8082/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Services started successfully!${NC}"
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend:    http://localhost:3000"
    echo "   API Gateway: http://localhost:8082"
    echo ""
    echo "🔧 Quick Commands:"
    echo "   Stop all:    npm run kill:all"
    echo "   Restart:     npm run restart"
    echo "   Health:      npm run health"
else
    echo -e "${YELLOW}⚠️  Services may still be starting...${NC}"
    echo "   Check status: npm run health"
    echo "   View logs: npm run logs"
fi

echo ""
echo -e "${GREEN}🎉 Quick deployment completed!${NC}"
