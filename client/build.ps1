# PowerShell build script for Render deployment

Write-Host "🚀 Building FactCheck Frontend for Render..." -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build the application
Write-Host "🔨 Building React application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# List build contents for debugging
Write-Host "📁 Build directory contents:" -ForegroundColor Cyan
Get-ChildItem -Path "build" -Recurse | Select-Object Name, Length, LastWriteTime

Write-Host "🌐 Ready for deployment on Render!" -ForegroundColor Green
