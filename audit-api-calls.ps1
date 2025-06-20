# 🔍 COMPREHENSIVE API CALL DETECTOR - PowerShell Version
# Script này sẽ tìm TẤT CẢ API calls trong project

Write-Host "🚀 Starting comprehensive API call detection..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Yellow

# Create output directory
if (!(Test-Path "audit-results")) {
    New-Item -ItemType Directory -Path "audit-results" | Out-Null
}

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Function to check if directory exists
function Test-Directory {
    param([string]$path)
    if (!(Test-Path $path)) {
        Write-Host "❌ Directory $path not found" -ForegroundColor Red
        return $false
    }
    return $true
}

# 1. CLIENT-SIDE API CALLS
Write-Host "🔍 1. SCANNING CLIENT-SIDE API CALLS..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Yellow

if (Test-Directory "client\src") {
    Write-Host "📋 Direct API object calls:" -ForegroundColor Cyan
    Select-String -Path "client\src\*" -Pattern "api\." -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse | Select-Object -First 20
    Write-Host ""
    
    Write-Host "📋 Fetch calls:" -ForegroundColor Cyan
    Select-String -Path "client\src\*" -Pattern "fetch\(" -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse | Select-Object -First 20
    Write-Host ""
    
    Write-Host "📋 Axios calls:" -ForegroundColor Cyan
    Select-String -Path "client\src\*" -Pattern "axios\." -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse | Select-Object -First 10
    Write-Host ""
    
    Write-Host "📋 HTTP method calls (.get, .post, etc.):" -ForegroundColor Cyan
    Select-String -Path "client\src\*" -Pattern "\.get|\.post|\.put|\.delete|\.patch" -Include "*.js", "*.jsx" -Recurse | Where-Object { $_.Line -notmatch "getElementById|getAttribute" } | Select-Object -First 20
    Write-Host ""
    
    Write-Host "📋 URL patterns with /api/:" -ForegroundColor Cyan
    Select-String -Path "client\src\*" -Pattern "/api/" -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse | Select-Object -First 20
    Write-Host ""
    
    Write-Host "📋 Base URL configurations:" -ForegroundColor Cyan
    Select-String -Path "client\src\*" -Pattern "baseURL|BASE_URL|API_BASE" -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse
    Write-Host ""
    
    Write-Host "📋 Localhost references:" -ForegroundColor Cyan
    Select-String -Path "client\src\*" -Pattern "localhost:" -Include "*.js", "*.jsx", "*.ts", "*.tsx" -Recurse
    Write-Host ""
} else {
    Write-Host "❌ Client directory not found, trying alternative paths..." -ForegroundColor Red
    $altDirs = @("frontend", "web", "app", "src")
    foreach ($dir in $altDirs) {
        if (Test-Path $dir) {
            Write-Host "✅ Found alternative client directory: $dir" -ForegroundColor Green
            Select-String -Path "$dir\*" -Pattern "api\.|fetch\(|/api/" -Include "*.js", "*.jsx" -Recurse | Select-Object -First 10
            break
        }
    }
}

Write-Host ""
Write-Host "🔍 2. SCANNING SERVER-SIDE ROUTES..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Yellow

if (Test-Directory "services") {
    Write-Host "📋 Express router definitions:" -ForegroundColor Cyan
    Select-String -Path "services\*" -Pattern "router\." -Include "*.js", "*.ts" -Recurse | Select-Object -First 20
    Write-Host ""
    
    Write-Host "📋 App route definitions:" -ForegroundColor Cyan
    Select-String -Path "services\*" -Pattern "app\." -Include "*.js", "*.ts" -Recurse | Where-Object { $_.Line -match "\.get|\.post|\.put|\.delete|\.patch|\.use" } | Select-Object -First 20
    Write-Host ""
    
    Write-Host "📋 Route path patterns:" -ForegroundColor Cyan
    Select-String -Path "services\*" -Pattern "'/|""/" -Include "*.js", "*.ts" -Recurse | Where-Object { $_.Line -match "get|post|put|delete|patch|use" } | Select-Object -First 20
    Write-Host ""
    
    Write-Host "📋 Proxy configurations:" -ForegroundColor Cyan
    Select-String -Path "services\*" -Pattern "proxy|pathRewrite|target.*http" -Include "*.js", "*.ts" -Recurse
    Write-Host ""
} else {
    Write-Host "❌ Services directory not found, trying alternatives..." -ForegroundColor Red
    $altDirs = @("server", "backend", "api", "src")
    foreach ($dir in $altDirs) {
        if (Test-Path $dir) {
            Write-Host "✅ Found alternative server directory: $dir" -ForegroundColor Green
            Select-String -Path "$dir\*" -Pattern "router\.|app\." -Include "*.js" -Recurse | Where-Object { $_.Line -match "get|post|put|delete" } | Select-Object -First 10
            break
        }
    }
}

Write-Host ""
Write-Host "🔍 3. SCANNING CONFIGURATION FILES..." -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Yellow

Write-Host "📋 Environment files:" -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Name ".env*" | Select-Object -First 10
Get-ChildItem -Path . -Recurse -Name "*env*" | Select-Object -First 10
Write-Host ""

Write-Host "📋 Docker configurations:" -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Name "docker-compose*.yml"
Get-ChildItem -Path . -Recurse -Name "Dockerfile*"
Write-Host ""

Write-Host "📋 Package.json files:" -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Name "package.json" | Select-Object -First 10
Write-Host ""

Write-Host ""
Write-Host "🔍 4. CROSS-REFERENCE ANALYSIS..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Yellow

# Extract API calls to files
Write-Host "📋 Extracting all client API calls..." -ForegroundColor Cyan
$clientCalls = @()
if (Test-Path "client\src") {
    $clientCalls += Select-String -Path "client\src\*" -Pattern "api\." -Include "*.js", "*.jsx" -Recurse 2>$null
    $clientCalls += Select-String -Path "client\src\*" -Pattern "fetch\(" -Include "*.js", "*.jsx" -Recurse 2>$null
    $clientCalls += Select-String -Path "client\src\*" -Pattern "/api/" -Include "*.js", "*.jsx" -Recurse 2>$null
}
$clientCalls | Out-File "audit-results\client-api-calls.txt" -Encoding UTF8

Write-Host "📋 Extracting all server routes..." -ForegroundColor Cyan
$serverRoutes = @()
if (Test-Path "services") {
    $serverRoutes += Select-String -Path "services\*" -Pattern "router\." -Include "*.js" -Recurse 2>$null
    $serverRoutes += Select-String -Path "services\*" -Pattern "app\." -Include "*.js" -Recurse 2>$null | Where-Object { $_.Line -match "get|post|put|delete|patch|use" }
}
$serverRoutes | Out-File "audit-results\server-routes.txt" -Encoding UTF8

Write-Host ""
Write-Host "📊 SUMMARY STATISTICS:" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Yellow

if (Test-Path "audit-results\client-api-calls.txt") {
    $clientCallCount = (Get-Content "audit-results\client-api-calls.txt").Count
    Write-Host "📈 Total client API calls found: $clientCallCount" -ForegroundColor Cyan
} else {
    Write-Host "📈 Total client API calls found: 0" -ForegroundColor Cyan
}

if (Test-Path "audit-results\server-routes.txt") {
    $serverRouteCount = (Get-Content "audit-results\server-routes.txt").Count
    Write-Host "📈 Total server routes found: $serverRouteCount" -ForegroundColor Cyan
} else {
    Write-Host "📈 Total server routes found: 0" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎯 POTENTIAL MISMATCHES TO INVESTIGATE:" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Yellow

if ((Test-Path "audit-results\client-api-calls.txt") -and (Test-Path "audit-results\server-routes.txt")) {
    Write-Host "📋 Looking for common mismatch patterns..." -ForegroundColor Cyan
    
    Write-Host "🔍 UPDATE/DELETE patterns:" -ForegroundColor Magenta
    Select-String -Path "audit-results\client-api-calls.txt" -Pattern "update|delete" | Select-Object -First 5
    
    Write-Host "🔍 Comments endpoints:" -ForegroundColor Magenta
    Select-String -Path "audit-results\client-api-calls.txt" -Pattern "comment" | Select-Object -First 5
    
    Write-Host "🔍 Votes endpoints:" -ForegroundColor Magenta
    Select-String -Path "audit-results\client-api-calls.txt" -Pattern "vote" | Select-Object -First 5
} else {
    Write-Host "❌ Cannot perform cross-reference analysis - missing data files" -ForegroundColor Red
}

Write-Host ""
Write-Host "📁 Results saved to: audit-results\" -ForegroundColor Green
Write-Host "✅ Audit complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow
Write-Host "1. Review audit-results\client-api-calls.txt"
Write-Host "2. Review audit-results\server-routes.txt"
Write-Host "3. Cross-check for URL mismatches"
Write-Host "4. Verify all endpoints are properly routed"
Write-Host "5. Test critical API flows"
