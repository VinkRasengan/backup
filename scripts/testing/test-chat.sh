#!/bin/bash

# =============================================================================
# 🧪 Chat Layout Test Script
# =============================================================================
# This script tests the chat layout to ensure it's working like Messenger

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main test function
main() {
    echo "🧪 Testing Chat Layout - Messenger-like Interface"
    echo "================================================"
    echo ""
    
    print_status "Starting local development server..."
    
    # Check if npm is available
    if ! command_exists npm; then
        print_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "client" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "client/node_modules" ]; then
        print_status "Installing client dependencies..."
        cd client && npm install && cd ..
    fi
    
    # Start the development server
    print_status "Starting React development server..."
    cd client
    
    # Start in background
    npm start &
    CLIENT_PID=$!
    
    # Wait for server to start
    print_status "Waiting for development server to start..."
    sleep 15
    
    # Check if server is running
    if command_exists curl; then
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            print_success "Development server is running on http://localhost:3000"
        else
            print_warning "Development server may still be starting..."
        fi
    fi
    
    echo ""
    print_success "🎉 Chat test environment is ready!"
    echo ""
    echo "📋 Test Instructions:"
    echo "   1. Open http://localhost:3000 in your browser"
    echo "   2. Navigate to the Chat tab (/chat)"
    echo "   3. Verify the following:"
    echo "      ✅ Chat takes full screen height (no black space at bottom)"
    echo "      ✅ Messages area scrolls properly"
    echo "      ✅ Input area is fixed at bottom"
    echo "      ✅ Layout looks like Messenger"
    echo "      ✅ No navigation sidebar visible"
    echo "      ✅ Mobile responsive design works"
    echo ""
    echo "📱 Mobile Testing:"
    echo "   1. Open browser developer tools (F12)"
    echo "   2. Toggle device toolbar (Ctrl+Shift+M)"
    echo "   3. Test on different screen sizes"
    echo "   4. Verify chat fills entire viewport"
    echo ""
    echo "🔧 If you see issues:"
    echo "   - Check browser console for errors"
    echo "   - Verify CSS is loading properly"
    echo "   - Test in different browsers"
    echo ""
    echo "Press Ctrl+C to stop the development server"
    
    # Wait for user to stop
    wait $CLIENT_PID
}

# Cleanup function
cleanup() {
    print_status "Stopping development server..."
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null
    fi
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Run main function
main "$@"
