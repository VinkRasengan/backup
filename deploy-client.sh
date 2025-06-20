#!/bin/bash

echo "🎯 FactCheck Client - Render Deployment Helper"
echo "=============================================="

# Check if API Gateway URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your API Gateway URL"
    echo "Usage: ./deploy-client.sh https://your-api-gateway-url.onrender.com"
    exit 1
fi

API_GATEWAY_URL="$1"

echo "🔧 Updating configuration files..."

# Update .env.production
cat > client/.env.production << EOF
REACT_APP_API_URL=$API_GATEWAY_URL
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=factcheck-1d6e8.firebasestorage.app
NODE_ENV=production
GENERATE_SOURCEMAP=false
EOF

# Update _redirects
cat > client/public/_redirects << EOF
# API calls redirect to API Gateway
/api/* $API_GATEWAY_URL/api/:splat 200
/api/* $API_GATEWAY_URL/api/:splat 200 CORS=*

# SPA fallback
/* /index.html 200
EOF

# Update render.yaml
sed -i "s|https://factcheck-api-gateway.onrender.com|$API_GATEWAY_URL|g" render-client.yaml

echo "✅ Configuration updated!"
echo "📝 Next steps:"
echo "1. Go to Render Dashboard: https://dashboard.render.com"
echo "2. Create New → Static Site"
echo "3. Connect your GitHub repository"
echo "4. Set Root Directory: client"
echo "5. Build Command: npm ci && npm run build"
echo "6. Publish Directory: build"
echo "7. Add environment variables from client/.env.production"
echo ""
echo "🌐 API Gateway URL: $API_GATEWAY_URL"
echo "🎯 Ready to deploy!"
