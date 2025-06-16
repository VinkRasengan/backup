#!/bin/bash

# =============================================================================
# 🔍 Debug Services Script
# Check what's running and what's not
# =============================================================================

echo "🔍 DEBUGGING SERVICES"
echo "===================="

# Check what's running on each port
echo ""
echo "📊 PORT STATUS:"
echo "---------------"

PORTS=(3000 3001 3002 3003 3004 3005 3006 8080 5000)
for port in "${PORTS[@]}"; do
    if lsof -i:$port &> /dev/null; then
        pid=$(lsof -ti:$port)
        process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        echo "✅ Port $port: OCCUPIED by $process (PID: $pid)"
    else
        echo "❌ Port $port: FREE"
    fi
done

echo ""
echo "🌐 TESTING ENDPOINTS:"
echo "--------------------"

# Test endpoints
ENDPOINTS=(
    "http://localhost:3000:Frontend"
    "http://localhost:8080/health:API Gateway Health"
    "http://localhost:8080/info:API Gateway Info"
    "http://localhost:3001/health:Auth Service"
    "http://localhost:3002/health:Link Service"
    "http://localhost:3003/health:Community Service"
    "http://localhost:3004/health:Chat Service"
    "http://localhost:3005/health:News Service"
    "http://localhost:3006/health:Admin Service"
)

for endpoint in "${ENDPOINTS[@]}"; do
    IFS=':' read -r url name <<< "$endpoint"
    if curl -s --max-time 3 "$url" > /dev/null 2>&1; then
        echo "✅ $name: RESPONDING"
    else
        echo "❌ $name: NOT RESPONDING"
    fi
done

echo ""
echo "📋 PROCESS LIST:"
echo "---------------"
ps aux | grep -E "(node|npm)" | grep -v grep | head -10

echo ""
echo "🔧 ENVIRONMENT CHECK:"
echo "--------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "📝 Key variables:"
    grep -E "(REACT_APP_API_URL|AUTH_SERVICE_URL|PORT)" .env | head -5
else
    echo "❌ .env file missing"
fi

echo ""
echo "💡 RECOMMENDATIONS:"
echo "------------------"
echo "1. Stop all: pkill -f node"
echo "2. Start fresh: npm run dev:full"
echo "3. Check logs: npm run dev:full 2>&1 | tee debug.log"
echo "4. Test API Gateway: curl http://localhost:8080/health"
