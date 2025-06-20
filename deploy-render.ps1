Write-Host "🚀 RENDER DEPLOYMENT HELPER - UPDATED" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Generate deployment files
Write-Host "📋 Generating Render deployment files..." -ForegroundColor Yellow
node scripts/deploy-render.js

Write-Host ""
Write-Host "🌐 Opening Render Dashboard..." -ForegroundColor Yellow
Start-Process "https://render.com/dashboard"

Write-Host ""
Write-Host "📋 DEPLOYMENT ORDER (Deploy in this sequence):" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. 🔐 Auth Service (Priority: High)" -ForegroundColor Yellow
Write-Host "   Name: factcheck-auth" -ForegroundColor White
Write-Host "   Build: cd services/auth-service && npm install" -ForegroundColor White
Write-Host "   Start: cd services/auth-service && npm start" -ForegroundColor White
Write-Host "   Port: 3001" -ForegroundColor White

Write-Host ""
Write-Host "2. 🔗 Link Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-link" -ForegroundColor White
Write-Host "   Build: cd services/link-service && npm install" -ForegroundColor White
Write-Host "   Start: cd services/link-service && npm start" -ForegroundColor White
Write-Host "   Port: 3002" -ForegroundColor White

Write-Host ""
Write-Host "3. 👥 Community Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-community" -ForegroundColor White
Write-Host "   Build: cd services/community-service && npm install" -ForegroundColor White
Write-Host "   Start: cd services/community-service && npm start" -ForegroundColor White
Write-Host "   Port: 3003" -ForegroundColor White

Write-Host ""
Write-Host "4. 💬 Chat Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-chat" -ForegroundColor White
Write-Host "   Build: cd services/chat-service && npm install" -ForegroundColor White
Write-Host "   Start: cd services/chat-service && npm start" -ForegroundColor White
Write-Host "   Port: 3004" -ForegroundColor White

Write-Host ""
Write-Host "5. 📰 News Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-news" -ForegroundColor White
Write-Host "   Build: cd services/news-service && npm install" -ForegroundColor White
Write-Host "   Start: cd services/news-service && npm start" -ForegroundColor White
Write-Host "   Port: 3005" -ForegroundColor White

Write-Host ""
Write-Host "6. 👨‍💼 Admin Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-admin" -ForegroundColor White
Write-Host "   Build: cd services/admin-service && npm install" -ForegroundColor White
Write-Host "   Start: cd services/admin-service && npm start" -ForegroundColor White
Write-Host "   Port: 3006" -ForegroundColor White

Write-Host ""
Write-Host "7. 🎣 PhishTank Service (NEW)" -ForegroundColor Yellow
Write-Host "   Name: factcheck-phishtank" -ForegroundColor White
Write-Host "   Build: cd services/phishtank-service && npm install" -ForegroundColor White
Write-Host "   Start: cd services/phishtank-service && npm start" -ForegroundColor White
Write-Host "   Port: 3007" -ForegroundColor White

Write-Host ""
Write-Host "8. 🔍 CriminalIP Service (NEW)" -ForegroundColor Yellow
Write-Host "   Name: factcheck-criminalip" -ForegroundColor White
Write-Host "   Build: cd services/criminalip-service && npm install" -ForegroundColor White
Write-Host "   Start: cd services/criminalip-service && npm start" -ForegroundColor White
Write-Host "   Port: 3008" -ForegroundColor White

Write-Host ""
Write-Host "9. 🌐 API Gateway (Deploy AFTER all services)" -ForegroundColor Yellow
Write-Host "   Name: factcheck-api-gateway" -ForegroundColor White
Write-Host "   Build: cd services/api-gateway && npm install" -ForegroundColor White
Write-Host "   Start: cd services/api-gateway && npm start" -ForegroundColor White
Write-Host "   Port: 8080" -ForegroundColor White

Write-Host ""
Write-Host "10. 🎨 Frontend (Deploy LAST)" -ForegroundColor Yellow
Write-Host "    Name: factcheck-frontend" -ForegroundColor White
Write-Host "    Type: Static Site" -ForegroundColor White
Write-Host "    Build: npm install && npm run build" -ForegroundColor White
Write-Host "    Publish: ./build" -ForegroundColor White

Write-Host ""
Write-Host "🔑 ENVIRONMENT VARIABLES:" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Required for ALL services:" -ForegroundColor Yellow
Write-Host "   NODE_ENV = production" -ForegroundColor White
Write-Host "   JWT_SECRET = (auto-generate)" -ForegroundColor White

Write-Host ""
Write-Host "🔥 Firebase services (auth, community, chat, news, admin):" -ForegroundColor Yellow
Write-Host "   FIREBASE_PROJECT_ID = your-project-id" -ForegroundColor White
Write-Host "   FIREBASE_PRIVATE_KEY = your-private-key" -ForegroundColor White
Write-Host "   FIREBASE_CLIENT_EMAIL = your-client-email" -ForegroundColor White

Write-Host ""
Write-Host "🔑 API Keys (add as needed):" -ForegroundColor Yellow
Write-Host "   GEMINI_API_KEY = your-gemini-key" -ForegroundColor White
Write-Host "   VIRUSTOTAL_API_KEY = your-virustotal-key" -ForegroundColor White
Write-Host "   SCAMADVISER_API_KEY = your-scamadviser-key" -ForegroundColor White
Write-Host "   NEWSAPI_API_KEY = your-newsapi-key" -ForegroundColor White
Write-Host "   PHISHTANK_API_KEY = your-phishtank-key" -ForegroundColor White
Write-Host "   CRIMINALIP_API_KEY = your-criminalip-key" -ForegroundColor White

Write-Host ""
Write-Host "🌐 Service URLs (update after each deployment):" -ForegroundColor Yellow
Write-Host "   AUTH_SERVICE_URL = https://factcheck-auth.onrender.com" -ForegroundColor White
Write-Host "   LINK_SERVICE_URL = https://factcheck-link.onrender.com" -ForegroundColor White
Write-Host "   COMMUNITY_SERVICE_URL = https://factcheck-community.onrender.com" -ForegroundColor White
Write-Host "   CHAT_SERVICE_URL = https://factcheck-chat.onrender.com" -ForegroundColor White
Write-Host "   NEWS_SERVICE_URL = https://factcheck-news.onrender.com" -ForegroundColor White
Write-Host "   ADMIN_SERVICE_URL = https://factcheck-admin.onrender.com" -ForegroundColor White
Write-Host "   PHISHTANK_SERVICE_URL = https://factcheck-phishtank.onrender.com" -ForegroundColor White
Write-Host "   CRIMINALIP_SERVICE_URL = https://factcheck-criminalip.onrender.com" -ForegroundColor White

Write-Host ""
Write-Host "📱 Frontend Environment:" -ForegroundColor Yellow
Write-Host "   REACT_APP_API_URL = https://factcheck-api-gateway.onrender.com" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_API_KEY = your-firebase-web-key" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_PROJECT_ID = your-project-id" -ForegroundColor White
Write-Host "   GENERATE_SOURCEMAP = false" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  IMPORTANT NOTES:" -ForegroundColor Red
Write-Host "===================" -ForegroundColor Red
Write-Host "   - Free tier: Services sleep after 15 minutes" -ForegroundColor Red
Write-Host "   - Cold starts: First request takes longer" -ForegroundColor Red
Write-Host "   - Build time: Keep under 20 minutes" -ForegroundColor Red
Write-Host "   - Memory: 512MB RAM limit per service" -ForegroundColor Red
Write-Host "   - Deploy in ORDER: Auth → Services → API Gateway → Frontend" -ForegroundColor Red

Write-Host ""
Write-Host "✅ Ready to deploy!" -ForegroundColor Green
Write-Host "📄 Check RENDER_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host "📁 Check docs/deployment/ for individual service YAML files" -ForegroundColor Cyan

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
