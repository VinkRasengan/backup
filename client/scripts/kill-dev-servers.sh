#!/bin/bash

echo "========================================"
echo "  Kill All Development Servers"
echo "========================================"
echo

echo "[1/4] Killing React Development Servers on common ports..."

# Kill processes on ports 3000-3010
for port in {3000..3010}; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port: $pid"
        kill -9 $pid 2>/dev/null
    fi
done

echo "[2/4] Killing Node.js processes..."
pkill -f "node" 2>/dev/null
pkill -f "nodejs" 2>/dev/null

echo "[3/4] Killing React Scripts processes..."
pkill -f "react-scripts" 2>/dev/null
pkill -f "webpack-dev-server" 2>/dev/null

echo "[4/4] Killing npm start processes..."
pkill -f "npm start" 2>/dev/null
pkill -f "npm run start" 2>/dev/null

echo
echo "✅ All development servers have been terminated!"
echo
echo "You can now run 'npm start' on port 3000 again."
echo
