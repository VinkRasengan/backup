#!/bin/bash

# FactCheck Development Setup Script
# This script sets up the development environment

set -e  # Exit on any error

echo "🛠️  Setting up FactCheck development environment..."

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

# Check Node.js version
print_status "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check if Firebase CLI is installed
print_status "Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

print_success "Firebase CLI version: $(firebase --version)"

# Setup environment files
print_status "Setting up environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    print_status "Creating server .env file..."
    cp server/.env.example server/.env
    print_warning "Please update server/.env with your Firebase and email configuration"
else
    print_success "Server .env file already exists"
fi

# Install dependencies
print_status "Installing dependencies..."

# Server dependencies
print_status "Installing server dependencies..."
cd server
npm install
print_success "Server dependencies installed"
cd ..

# Client dependencies
print_status "Installing client dependencies..."
cd client
npm install
print_success "Client dependencies installed"
cd ..

# Functions dependencies
print_status "Installing functions dependencies..."
cd functions
npm install
print_success "Functions dependencies installed"
cd ..

# Root dependencies (if any)
if [ -f "package.json" ]; then
    print_status "Installing root dependencies..."
    npm install
fi

# Firebase setup
print_status "Setting up Firebase..."

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    print_warning "Not logged in to Firebase. Please run 'firebase login' after setup"
else
    print_success "Already logged in to Firebase"
fi

# Initialize Firebase emulators
print_status "Setting up Firebase emulators..."
if [ ! -f "firebase.json" ]; then
    print_error "firebase.json not found. Please ensure Firebase is properly configured."
    exit 1
fi

print_success "Firebase configuration found"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp

print_success "✅ Development environment setup completed!"
echo ""
print_status "🚀 To start development:"
echo ""
echo "1. Update your environment variables:"
echo "   - Edit server/.env with your Firebase credentials"
echo "   - Add your email service configuration"
echo ""
echo "2. Start the development servers:"
echo "   - Backend: cd server && npm run dev"
echo "   - Frontend: cd client && npm start"
echo "   - Firebase Emulators: firebase emulators:start"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - Firebase Emulator UI: http://localhost:4000"
echo ""
print_status "📚 For more information, check the README.md file"
