#!/bin/bash

echo "========================================"
echo "  Hadoop & Spark Demo - FactCheck Platform"
echo "========================================"
echo

echo "🚀 Starting Demo Server..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed or not in PATH"
    exit 1
fi

echo "✅ Node.js version:"
node --version

echo "✅ npm version:"
npm --version

echo

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
    echo
fi

# Start the demo server
echo "🎮 Starting Demo Server..."
echo
echo "📊 Presentation will be available at: http://localhost:3000/demo"
echo "🔧 API Base: http://localhost:3000/api"
echo "💚 Health Check: http://localhost:3000/health"
echo
echo "Press Ctrl+C to stop the server"
echo

npm start 