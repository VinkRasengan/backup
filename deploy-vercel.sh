#!/bin/bash

echo "🚀 Deploying FactCheck Backend to Vercel..."

# Navigate to server directory
cd server

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Set environment variables for production
echo "🔧 Setting environment variables..."

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Backend deployment completed!"
echo "🔗 Your API will be available at: https://factcheck-backend.vercel.app"

# Return to root directory
cd ..

echo "📝 Next steps:"
echo "1. Update REACT_APP_API_URL in client/.env.production"
echo "2. Add environment variables to Vercel dashboard:"
echo "   - FIREBASE_PROJECT_ID"
echo "   - FIREBASE_CLIENT_EMAIL" 
echo "   - FIREBASE_PRIVATE_KEY"
echo "   - OPENAI_API_KEY"
echo "   - NODE_ENV=production"
echo "3. Deploy frontend: npm run build && firebase deploy --only hosting"
