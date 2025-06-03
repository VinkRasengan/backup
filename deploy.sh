#!/bin/bash

# FactCheck Deployment Script
# This script builds and deploys the FactCheck application

set -e  # Exit on any error

echo "🚀 Starting FactCheck deployment..."

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

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

# Check if .env file exists for server
if [ ! -f "server/.env" ]; then
    print_warning "Server .env file not found. Creating from example..."
    cp server/.env.example server/.env
    print_warning "Please update server/.env with your actual configuration"
fi

# Install server dependencies
print_status "Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
print_status "Installing client dependencies..."
cd client
npm install

# Build client for production
print_status "Building client for production..."
npm run build
cd ..

# Install functions dependencies
print_status "Installing functions dependencies..."
cd functions
npm install
cd ..

# Deploy to Firebase
print_status "Deploying to Firebase..."

# Deploy Firestore rules and indexes
print_status "Deploying Firestore rules and indexes..."
firebase deploy --only firestore

# Deploy Functions
print_status "Deploying Cloud Functions..."
firebase deploy --only functions

# Deploy Hosting
print_status "Deploying to Firebase Hosting..."
firebase deploy --only hosting

# Deploy Data Connect (if configured)
if [ -d "dataconnect" ]; then
    print_status "Deploying Data Connect..."
    firebase deploy --only dataconnect
fi

print_success "🎉 Deployment completed successfully!"
print_status "Your app should be available at your Firebase Hosting URL"

# Show deployment info
print_status "Getting deployment info..."
firebase hosting:channel:list

echo ""
print_success "✅ FactCheck has been deployed successfully!"
echo ""
print_status "Next steps:"
echo "1. Update your environment variables in Firebase Functions config"
echo "2. Test all features in the deployed environment"
echo "3. Monitor logs: firebase functions:log"
echo "4. Check hosting: firebase hosting:channel:list"
