param(
    [Parameter(Mandatory=$true)]
    [string]$ApiGatewayUrl
)

Write-Host "🎯 FactCheck Client - Render Deployment Helper" -ForegroundColor Green
Write-Host "=============================================="

if (-not $ApiGatewayUrl) {
    Write-Host "❌ Error: Please provide your API Gateway URL" -ForegroundColor Red
    Write-Host "Usage: .\deploy-client.ps1 -ApiGatewayUrl https://your-api-gateway-url.onrender.com" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔧 Updating configuration files..." -ForegroundColor Yellow

# Update .env.production
$envContent = @"
REACT_APP_API_URL=$ApiGatewayUrl
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_STORAGE_BUCKET=factcheck-1d6e8.firebasestorage.app
NODE_ENV=production
GENERATE_SOURCEMAP=false
"@

$envContent | Out-File -FilePath "client\.env.production" -Encoding UTF8

# Update _redirects
$redirectsContent = @"
# API calls redirect to API Gateway
/api/* $ApiGatewayUrl/api/:splat 200
/api/* $ApiGatewayUrl/api/:splat 200 CORS=*

# SPA fallback
/* /index.html 200
"@

$redirectsContent | Out-File -FilePath "client\public\_redirects" -Encoding UTF8

# Update render.yaml
$renderYaml = Get-Content "render-client.yaml" -Raw
$renderYaml = $renderYaml -replace "https://factcheck-api-gateway.onrender.com", $ApiGatewayUrl
$renderYaml | Out-File -FilePath "render-client.yaml" -Encoding UTF8

Write-Host "✅ Configuration updated!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to Render Dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Create New → Static Site" -ForegroundColor White
Write-Host "3. Connect your GitHub repository" -ForegroundColor White
Write-Host "4. Set Root Directory: client" -ForegroundColor White
Write-Host "5. Build Command: npm ci && npm run build" -ForegroundColor White
Write-Host "6. Publish Directory: build" -ForegroundColor White
Write-Host "7. Add environment variables from client/.env.production" -ForegroundColor White
Write-Host ""
Write-Host "🌐 API Gateway URL: $ApiGatewayUrl" -ForegroundColor Green
Write-Host "🎯 Ready to deploy!" -ForegroundColor Green
