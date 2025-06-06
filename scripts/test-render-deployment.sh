#!/bin/bash

echo "🧪 Testing Render Deployment"
echo "============================"

BACKEND_URL="https://factcheck-backend.onrender.com"
FRONTEND_URL="https://factcheck-frontend.onrender.com"

echo "⏳ Testing backend health check..."
curl -s "$BACKEND_URL/health" | jq '.'

echo ""
echo "⏳ Testing community posts API..."
curl -s "$BACKEND_URL/api/community/posts" | jq '.success, .data.posts | length'

echo ""
echo "⏳ Testing community stats API..."
curl -s "$BACKEND_URL/api/community/stats" | jq '.success, .data.totalPosts'

echo ""
echo "⏳ Testing frontend accessibility..."
curl -s -I "$FRONTEND_URL" | head -1

echo ""
echo "✅ Deployment test complete!"
echo "If all tests pass, the deployment is successful."
