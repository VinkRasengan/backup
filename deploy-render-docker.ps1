Write-Host "🐳 RENDER DOCKER DEPLOYMENT HELPER" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Opening Render Dashboard..." -ForegroundColor Yellow
Start-Process "https://render.com/dashboard"

Write-Host ""
Write-Host "📋 DOCKER DEPLOYMENT ORDER:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. 🔐 Auth Service (Deploy đầu tiên)" -ForegroundColor Yellow
Write-Host "   Name: factcheck-auth-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/auth-service" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "2. 🔗 Link Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-link-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/link-service" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "3. 👥 Community Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-community-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/community-service" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "4. 💬 Chat Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-chat-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/chat-service" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "5. 📰 News Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-news-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/news-service" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "6. 👨‍💼 Admin Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-admin-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/admin-service" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "7. 🎣 PhishTank Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-phishtank-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/phishtank-service" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "8. 🔍 CriminalIP Service" -ForegroundColor Yellow
Write-Host "   Name: factcheck-criminalip-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/criminalip-service" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "9. 🌐 API Gateway (Deploy sau khi có tất cả services)" -ForegroundColor Yellow
Write-Host "   Name: factcheck-api-gateway-docker" -ForegroundColor White
Write-Host "   Environment: Docker" -ForegroundColor White
Write-Host "   Root Directory: services/api-gateway" -ForegroundColor White
Write-Host "   Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "   Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "10. 🎨 Frontend (Deploy cuối cùng)" -ForegroundColor Yellow
Write-Host "    Name: factcheck-frontend-docker" -ForegroundColor White
Write-Host "    Environment: Docker" -ForegroundColor White
Write-Host "    Root Directory: client" -ForegroundColor White
Write-Host "    Dockerfile Path: ./Dockerfile" -ForegroundColor White
Write-Host "    Docker Context: ." -ForegroundColor White

Write-Host ""
Write-Host "🔑 ENVIRONMENT VARIABLES (Docker):" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Base Environment (tất cả services):" -ForegroundColor Yellow
Write-Host "   PORT = 10000" -ForegroundColor White
Write-Host "   NODE_ENV = production" -ForegroundColor White
Write-Host "   JWT_SECRET = (auto-generate hoặc dùng từ .env)" -ForegroundColor White

Write-Host ""
Write-Host "🔥 Firebase Services (auth, community, chat, news, admin):" -ForegroundColor Yellow
Write-Host "   FIREBASE_PROJECT_ID = factcheck-1d6e8" -ForegroundColor White
Write-Host "   FIREBASE_PRIVATE_KEY = (copy từ .env file)" -ForegroundColor White
Write-Host "   FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@factcheck-1d6e8.iam.gserviceaccount.com" -ForegroundColor White

Write-Host ""
Write-Host "🔑 API Keys:" -ForegroundColor Yellow
Write-Host "   GEMINI_API_KEY = AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE" -ForegroundColor White
Write-Host "   VIRUSTOTAL_API_KEY = your-virustotal-key" -ForegroundColor White
Write-Host "   SCAMADVISER_API_KEY = your-scamadviser-key" -ForegroundColor White
Write-Host "   NEWSAPI_API_KEY = your-newsapi-key" -ForegroundColor White
Write-Host "   PHISHTANK_API_KEY = your-phishtank-key" -ForegroundColor White
Write-Host "   CRIMINALIP_API_KEY = your-criminalip-key" -ForegroundColor White
Write-Host "   IPQUALITYSCORE_API_KEY = WfHFgAIrlGZiZb2T8T1cVDoD0nR7BEeq" -ForegroundColor White

Write-Host ""
Write-Host "🌐 Service URLs (update sau khi deploy từng service):" -ForegroundColor Yellow
Write-Host "   AUTH_SERVICE_URL = https://factcheck-auth-docker.onrender.com" -ForegroundColor White
Write-Host "   LINK_SERVICE_URL = https://factcheck-link-docker.onrender.com" -ForegroundColor White
Write-Host "   COMMUNITY_SERVICE_URL = https://factcheck-community-docker.onrender.com" -ForegroundColor White
Write-Host "   CHAT_SERVICE_URL = https://factcheck-chat-docker.onrender.com" -ForegroundColor White
Write-Host "   NEWS_SERVICE_URL = https://factcheck-news-docker.onrender.com" -ForegroundColor White
Write-Host "   ADMIN_SERVICE_URL = https://factcheck-admin-docker.onrender.com" -ForegroundColor White
Write-Host "   PHISHTANK_SERVICE_URL = https://factcheck-phishtank-docker.onrender.com" -ForegroundColor White
Write-Host "   CRIMINALIP_SERVICE_URL = https://factcheck-criminalip-docker.onrender.com" -ForegroundColor White

Write-Host ""
Write-Host "📱 Frontend Environment (Docker):" -ForegroundColor Yellow
Write-Host "   REACT_APP_API_URL = https://factcheck-api-gateway-docker.onrender.com" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_API_KEY = AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_AUTH_DOMAIN = factcheck-1d6e8.firebaseapp.com" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_PROJECT_ID = factcheck-1d6e8" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_STORAGE_BUCKET = factcheck-1d6e8.appspot.com" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_MESSAGING_SENDER_ID = your-sender-id" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_APP_ID = your-app-id" -ForegroundColor White
Write-Host "   GENERATE_SOURCEMAP = false" -ForegroundColor White

Write-Host ""
Write-Host "🐳 DOCKER DEPLOYMENT ADVANTAGES:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "   ✅ Consistent environment (giống hệt local)" -ForegroundColor Green
Write-Host "   ✅ Faster builds với Docker layer caching" -ForegroundColor Green
Write-Host "   ✅ Better isolation và security" -ForegroundColor Green
Write-Host "   ✅ Production-ready containers" -ForegroundColor Green
Write-Host "   ✅ Multi-stage builds đã optimize" -ForegroundColor Green

Write-Host ""
Write-Host "⚠️  DOCKER DEPLOYMENT NOTES:" -ForegroundColor Red
Write-Host "============================" -ForegroundColor Red
Write-Host "   - Build time: Chậm hơn Node.js (5-10 phút/service)" -ForegroundColor Red
Write-Host "   - Memory usage: Cao hơn (~100MB/container)" -ForegroundColor Red
Write-Host "   - Debugging: Khó hơn (cần docker logs)" -ForegroundColor Red
Write-Host "   - Dockerfile path: Phải chính xác" -ForegroundColor Red
Write-Host "   - Docker context: Dùng '.' (root project)" -ForegroundColor Red

Write-Host ""
Write-Host "🔧 DEPLOYMENT STEPS:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "   1. Deploy Auth Service đầu tiên" -ForegroundColor White
Write-Host "   2. Test health: https://factcheck-auth-docker.onrender.com/health" -ForegroundColor White
Write-Host "   3. Deploy các services khác song song" -ForegroundColor White
Write-Host "   4. Update service URLs trong API Gateway" -ForegroundColor White
Write-Host "   5. Deploy API Gateway" -ForegroundColor White
Write-Host "   6. Deploy Frontend cuối cùng" -ForegroundColor White

Write-Host ""
Write-Host "✅ DOCKER DEPLOYMENT READY!" -ForegroundColor Green
Write-Host "📄 Check docs/deployment/RENDER_DOCKER_GUIDE.md for details" -ForegroundColor Cyan
Write-Host "📄 Check docs/deployment/RENDER_ENV_GUIDE.md for environment setup" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎯 FINAL DOCKER URLS:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "   Frontend: https://factcheck-frontend-docker.onrender.com" -ForegroundColor White
Write-Host "   API Gateway: https://factcheck-api-gateway-docker.onrender.com" -ForegroundColor White
Write-Host "   Health Check: https://factcheck-api-gateway-docker.onrender.com/health" -ForegroundColor White

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
