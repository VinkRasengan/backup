Write-Host "🚀 RENDER FRONTEND DEPLOY HELPER" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

# Mở Render dashboard
Write-Host "📱 Opening Render Dashboard..." -ForegroundColor Yellow
Start-Process "https://dashboard.render.com/static/new"

Write-Host ""
Write-Host "📋 COPY THESE SETTINGS TO RENDER:" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. BASIC SETTINGS:" -ForegroundColor Yellow
Write-Host "   Name: factcheck-frontend" -ForegroundColor White
Write-Host "   Root Directory: ./client" -ForegroundColor White
Write-Host "   Build Command: npm ci && npm run build" -ForegroundColor White
Write-Host "   Publish Directory: ./build" -ForegroundColor White

Write-Host ""
Write-Host "2. ENVIRONMENT VARIABLES (Click Advanced):" -ForegroundColor Yellow
Write-Host "   NODE_ENV = production" -ForegroundColor White
Write-Host "   REACT_APP_API_URL = https://your-backend-url.onrender.com" -ForegroundColor Red
Write-Host "   REACT_APP_FIREBASE_PROJECT_ID = factcheck-1d6e8" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_API_KEY = AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_AUTH_DOMAIN = factcheck-1d6e8.firebaseapp.com" -ForegroundColor White
Write-Host "   REACT_APP_FIREBASE_STORAGE_BUCKET = factcheck-1d6e8.firebasestorage.app" -ForegroundColor White
Write-Host "   GENERATE_SOURCEMAP = false" -ForegroundColor White

Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Red
Write-Host "   - Replace 'your-backend-url.onrender.com' with your actual backend URL" -ForegroundColor Red
Write-Host "   - Make sure your GitHub repo is connected" -ForegroundColor Red
Write-Host "   - Build will take 2-5 minutes" -ForegroundColor Red

Write-Host ""
Write-Host "✅ Ready to deploy!" -ForegroundColor Green
Write-Host "📄 Check RENDER_DEPLOY_INSTRUCTIONS.md for detailed guide" -ForegroundColor Cyan

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
