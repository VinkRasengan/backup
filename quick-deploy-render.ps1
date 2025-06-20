# FactCheck - Quick Deploy to Render
# Su dung: .\quick-deploy-render.ps1

Write-Host "🚀 FactCheck Quick Deploy to Render" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Buoc 1: Build client
Write-Host "📦 Building client..." -ForegroundColor Yellow
Set-Location client

try {
    # Clean install dependencies
    npm ci
    if ($LASTEXITCODE -ne 0) {
        throw "❌ Failed to install client dependencies"
    }
    
    # Build production
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "❌ Failed to build client"
    }
    
    Write-Host "✅ Client built successfully!" -ForegroundColor Green
    Write-Host "📁 Build directory created at: client/build" -ForegroundColor Cyan
}
catch {
    Write-Error $_.Exception.Message
    Set-Location ..
    exit 1
}
finally {
    Set-Location ..
}

# Buoc 2: Kiem tra files can thiet
Write-Host "🔍 Checking required files..." -ForegroundColor Yellow

$requiredFiles = @(
    "render-client.yaml",
    "client/build",
    "client/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
        exit 1
    }
}

# Buoc 3: Hien thi huong dan deploy
Write-Host "`n🎯 READY TO DEPLOY!" -ForegroundColor Green -BackgroundColor Black
Write-Host "===================" -ForegroundColor Green -BackgroundColor Black

Write-Host "`nCac buoc tiep theo:" -ForegroundColor Yellow
Write-Host "1. Dang nhap vao https://render.com" -ForegroundColor Cyan
Write-Host "2. Tao Static Site moi" -ForegroundColor Cyan
Write-Host "3. Connect GitHub repository hoac upload project" -ForegroundColor Cyan
Write-Host "4. Su dung cac cau hinh sau:" -ForegroundColor Cyan

Write-Host "`nCAU HINH RENDER:" -ForegroundColor Yellow
Write-Host "Build Command: npm ci && npm run build" -ForegroundColor White
Write-Host "Publish Directory: ./build" -ForegroundColor White
Write-Host "Root Directory: ./client" -ForegroundColor White

Write-Host "`nENVIRONMENT VARIABLES can thiet:" -ForegroundColor Yellow
Write-Host "NODE_ENV = production" -ForegroundColor White
Write-Host "REACT_APP_API_URL = https://your-api-gateway-url.onrender.com" -ForegroundColor White
Write-Host "REACT_APP_FIREBASE_PROJECT_ID = factcheck-1d6e8" -ForegroundColor White
Write-Host "REACT_APP_FIREBASE_API_KEY = [YOUR_ACTUAL_API_KEY]" -ForegroundColor Red
Write-Host "REACT_APP_FIREBASE_AUTH_DOMAIN = factcheck-1d6e8.firebaseapp.com" -ForegroundColor White
Write-Host "REACT_APP_FIREBASE_STORAGE_BUCKET = factcheck-1d6e8.firebasestorage.app" -ForegroundColor White
Write-Host "GENERATE_SOURCEMAP = false" -ForegroundColor White

Write-Host "`nHoac su dung render-client.yaml:" -ForegroundColor Yellow
Write-Host "Trong Render dashboard, ban co the import file render-client.yaml" -ForegroundColor Cyan

Write-Host "`nLUU Y QUAN TRONG:" -ForegroundColor Red
Write-Host "- Can set REACT_APP_FIREBASE_API_KEY thuc trong Render dashboard" -ForegroundColor Red
Write-Host "- Thay doi REACT_APP_API_URL thanh URL backend thuc cua ban" -ForegroundColor Red

Write-Host "`n🎉 Build completed! Ready for deployment!" -ForegroundColor Green
