# All-in-One Fix Script for Grafana Service Discovery
# This script will fix all issues with Grafana showing services as down

Write-Host "🚀 Fixing Grafana Service Discovery Issues..." -ForegroundColor Green
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "1. Add metrics endpoints to all services"
Write-Host "2. Fix Prometheus configuration"  
Write-Host "3. Install missing dependencies"
Write-Host "4. Restart services"
Write-Host "5. Test all endpoints"
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""

# Step 1: Add metrics endpoints
Write-Host "📈 Step 1: Adding metrics endpoints to all services..." -ForegroundColor Cyan
if (Test-Path "add-metrics-endpoints.ps1") {
    & .\add-metrics-endpoints.ps1
} else {
    Write-Host "❌ add-metrics-endpoints.ps1 not found" -ForegroundColor Red
}

Write-Host ""

# Step 2: Fix Prometheus configuration
Write-Host "🔧 Step 2: Fixing Prometheus configuration..." -ForegroundColor Cyan
if (Test-Path "fix-prometheus-discovery.ps1") {
    & .\fix-prometheus-discovery.ps1
} else {
    Write-Host "❌ fix-prometheus-discovery.ps1 not found" -ForegroundColor Red
}

Write-Host ""

# Step 3: Install dependencies
Write-Host "📦 Step 3: Installing dependencies..." -ForegroundColor Cyan
try {
    npm run install:all
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
}

Write-Host ""

# Step 4: Restart application services
Write-Host "🔄 Step 4: Restarting application services..." -ForegroundColor Cyan
Write-Host "⚠️  You need to manually restart your services:" -ForegroundColor Yellow
Write-Host "   1. Stop current services (Ctrl+C in terminals)"
Write-Host "   2. Run: npm run start"
Write-Host "   3. Wait for all services to start"
Write-Host ""

$waitForServices = Read-Host "Have you restarted all services? (y/n)"
if ($waitForServices -ne 'y' -and $waitForServices -ne 'Y') {
    Write-Host "⚠️  Please restart services and run this script again" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Step 5: Test all endpoints
Write-Host "🔍 Step 5: Testing all endpoints..." -ForegroundColor Cyan
if (Test-Path "check-all-services.ps1") {
    & .\check-all-services.ps1 -Detailed
} else {
    # Manual check
    Write-Host "Testing key endpoints manually..." -ForegroundColor Yellow
    
    $endpoints = @(
        "http://localhost:9090",  # Prometheus
        "http://localhost:3010",  # Grafana  
        "http://localhost:8082/metrics",  # API Gateway
        "http://localhost:3001/metrics",  # Auth Service
        "http://localhost:3002/metrics"   # Link Service
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 5 -UseBasicParsing
            Write-Host "✅ $endpoint is responding" -ForegroundColor Green
        } catch {
            Write-Host "❌ $endpoint is not responding" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Step 6: Final instructions
Write-Host "🎯 Final Steps:" -ForegroundColor Green
Write-Host "1. Open Prometheus: http://localhost:9090/targets"
Write-Host "2. Check if all targets are UP (green)"
Write-Host "3. Open Grafana: http://localhost:3010"
Write-Host "4. Refresh the Microservices Overview dashboard"
Write-Host "5. Services should now show as healthy (green '1')"
Write-Host ""

Write-Host "🔍 If services still show as down:" -ForegroundColor Yellow
Write-Host "1. Check Prometheus targets: http://localhost:9090/targets"
Write-Host "2. Test metrics manually: curl http://localhost:3001/metrics"
Write-Host "3. Check service logs for errors"
Write-Host "4. Ensure all services are running on expected ports"
Write-Host ""

Write-Host "💡 Common issues:" -ForegroundColor Cyan
Write-Host "• Services not running: npm run start"
Write-Host "• Metrics not working: Check /metrics endpoint directly"
Write-Host "• Prometheus can't reach services: Check host.docker.internal"
Write-Host "• Port conflicts: Check with netstat -an | findstr :300"
Write-Host ""

Write-Host "🎉 Fix script completed!" -ForegroundColor Green
Write-Host "Check Grafana dashboard now: http://localhost:3010" -ForegroundColor Cyan
