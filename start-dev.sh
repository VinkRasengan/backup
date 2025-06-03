#!/bin/bash

# FactCheck Development Start Script
# This script starts all development services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to cleanup background processes
cleanup() {
    print_status "Stopping all services..."
    jobs -p | xargs -r kill
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

print_status "🚀 Starting FactCheck development environment..."

# Check if .env exists
if [ ! -f "server/.env" ]; then
    print_error "Server .env file not found. Please run setup.sh first."
    exit 1
fi

# Start Firebase Emulators
print_status "Starting Firebase Emulators..."
firebase emulators:start --only auth,firestore,functions,hosting &
FIREBASE_PID=$!

# Wait a bit for emulators to start
sleep 5

# Start Backend Server
print_status "Starting Backend Server..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait a bit for server to start
sleep 3

# Start Frontend
print_status "Starting Frontend..."
cd client
npm start &
CLIENT_PID=$!
cd ..

print_success "✅ All services started!"
echo ""
print_status "🌐 Access URLs:"
echo "   Frontend:           http://localhost:3000"
echo "   Backend API:        http://localhost:5000"
echo "   Firebase Emulator:  http://localhost:4000"
echo "   Firestore:          http://localhost:8080"
echo "   Auth:               http://localhost:9099"
echo ""
print_status "📊 Health Checks:"
echo "   Backend Health:     http://localhost:5000/health"
echo "   Functions Health:   http://localhost:5001/factcheck-project/us-central1/healthCheck"
echo ""
print_warning "Press Ctrl+C to stop all services"

# Wait for all background processes
wait
