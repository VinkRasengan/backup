#!/bin/bash
# Build script for Render deployment

echo "🚀 Building FactCheck Frontend for Render..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --silent

# Build the application
echo "🔨 Building React application..."
npm run build

echo "✅ Build completed successfully!"

# List build contents for debugging
echo "📁 Build directory contents:"
ls -la build/

echo "🌐 Ready for deployment on Render!"
