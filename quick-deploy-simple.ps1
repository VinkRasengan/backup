# FactCheck - Quick Deploy to Render

Write-Host "FactCheck Quick Deploy to Render" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Build client
Write-Host "Building client..." -ForegroundColor Yellow
Set-Location client

npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install client dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build client" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..
Write-Host "Client built successfully!" -ForegroundColor Green

# Check required files
Write-Host "Checking required files..." -ForegroundColor Yellow

if (Test-Path "render-client.yaml") {
    Write-Host "render-client.yaml exists" -ForegroundColor Green
} else {
    Write-Host "render-client.yaml missing" -ForegroundColor Red
}

if (Test-Path "client/build") {
    Write-Host "client/build directory exists" -ForegroundColor Green
} else {
    Write-Host "client/build directory missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "READY TO DEPLOY!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""
Write-Host "Steps to deploy on Render:" -ForegroundColor Yellow
Write-Host "1. Go to https://render.com" -ForegroundColor Cyan
Write-Host "2. Create new Static Site" -ForegroundColor Cyan
Write-Host "3. Connect your GitHub repository" -ForegroundColor Cyan
Write-Host "4. Use these settings:" -ForegroundColor Cyan
Write-Host ""
Write-Host "RENDER CONFIGURATION:" -ForegroundColor Yellow
Write-Host "Build Command: npm ci; npm run build" -ForegroundColor White
Write-Host "Publish Directory: ./build" -ForegroundColor White
Write-Host "Root Directory: ./client" -ForegroundColor White
Write-Host ""
Write-Host "ENVIRONMENT VARIABLES:" -ForegroundColor Yellow
Write-Host "NODE_ENV = production" -ForegroundColor White
Write-Host "REACT_APP_FIREBASE_API_KEY = [YOUR_ACTUAL_API_KEY]" -ForegroundColor Red
Write-Host "GENERATE_SOURCEMAP = false" -ForegroundColor White
Write-Host ""
Write-Host "Build completed! Ready for deployment!" -ForegroundColor Green
