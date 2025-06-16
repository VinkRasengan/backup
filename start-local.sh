#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Anti-Fraud Platform - Full Stack${NC}"
echo -e "${YELLOW}======================================${NC}"

# Function to check if port is available
check_port() {
    local port=$1
    if netstat -an | grep ":$port " > /dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔄 Killing process on port $port...${NC}"
    
    # For Windows (Git Bash/WSL)
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        netstat -ano | findstr ":$port " | awk '{print $5}' | xargs -r taskkill //PID //F 2>/dev/null
    else
        # For Linux/Mac
        lsof -ti:$port | xargs -r kill -9 2>/dev/null
    fi
}

# Check and clean ports
echo -e "${CYAN}🔍 Checking ports...${NC}"
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 8080)

for port in "${PORTS[@]}"; do
    if ! check_port $port; then
        kill_port $port
        sleep 2
        if check_port $port; then
            echo -e "${GREEN}✅ Port $port is now available${NC}"
        else
            echo -e "${RED}❌ Failed to free port $port${NC}"
        fi
    fi
done

echo ""
echo -e "${PURPLE}📦 Installing dependencies...${NC}"
npm install

echo ""
echo -e "${BLUE}🔧 Starting all services...${NC}"
echo -e "${YELLOW}This will start:${NC}"
echo -e "  ${CYAN}• Client (React)         - Port 3000${NC}"
echo -e "  ${CYAN}• API Gateway           - Port 8080${NC}"
echo -e "  ${CYAN}• Auth Service          - Port 3001${NC}"
echo -e "  ${CYAN}• Link Service          - Port 3002${NC}"
echo -e "  ${CYAN}• Community Service     - Port 3003${NC}"
echo -e "  ${CYAN}• Chat Service          - Port 3004${NC}"
echo -e "  ${CYAN}• News Service          - Port 3005${NC}"
echo -e "  ${CYAN}• Admin Service         - Port 3006${NC}"
echo -e "  ${CYAN}• CriminalIP Service    - Port 3007${NC}"
echo -e "  ${CYAN}• PhishTank Service     - Port 3008${NC}"

echo ""
echo -e "${GREEN}🎯 Starting in 3 seconds...${NC}"
sleep 3

# Start all services
npm start
