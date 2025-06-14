#!/bin/bash

echo "===================================="
echo "FactCheck - Kill All Processes and Restart"
echo "===================================="
echo

echo "Step 1: Killing existing processes..."
echo

# Function to kill processes by port
kill_port() {
    local port=$1
    echo "Killing processes on port $port..."
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "Found PIDs: $pids"
        kill -9 $pids 2>/dev/null
        echo "Killed processes on port $port"
    else
        echo "No processes found on port $port"
    fi
}

# Kill processes by port
kill_port 3000  # React
kill_port 5000  # Express
kill_port 9099  # Firebase Functions

# Kill processes by name
echo "Killing Node.js processes..."
pkill -f "node" 2>/dev/null || true
pkill -f "npm" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# Kill any remaining React/Node processes
echo "Killing remaining React/Node processes..."
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "webpack" 2>/dev/null || true

echo
echo "Waiting 3 seconds for processes to terminate..."
sleep 3

echo
echo "Step 2: Starting fresh processes..."
echo

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "Starting Backend Server..."
cd "$SCRIPT_DIR/server"
gnome-terminal --title="FactCheck Backend" -- bash -c "echo 'Starting server...'; npm run dev; exec bash" 2>/dev/null || \
xterm -title "FactCheck Backend" -e "bash -c 'echo Starting server...; npm run dev; exec bash'" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$SCRIPT_DIR/server"' && echo Starting server... && npm run dev"' 2>/dev/null || \
(echo "Starting backend in background..." && npm run dev &)

echo "Waiting 5 seconds for server to start..."
sleep 5

echo "Starting Frontend..."
cd "$SCRIPT_DIR/client"
gnome-terminal --title="FactCheck Frontend" -- bash -c "echo 'Starting React app...'; npm start; exec bash" 2>/dev/null || \
xterm -title "FactCheck Frontend" -e "bash -c 'echo Starting React app...; npm start; exec bash'" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '"$SCRIPT_DIR/client"' && echo Starting React app... && npm start"' 2>/dev/null || \
(echo "Starting frontend in background..." && npm start &)

echo
echo "===================================="
echo "Restart Complete!"
echo "===================================="
echo
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo
echo "Both servers should be running."
echo "Check the terminal windows for any error messages."
echo
