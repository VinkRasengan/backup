# Check All Service Endpoints
# Test if services are running and responding

param(
    [switch]$Detailed = $false
)

function Test-ServiceEndpoint {
    param($Url, $ServiceName)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $ServiceName is responding" -ForegroundColor Green
            if ($Detailed) {
                Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
                Write-Host "   URL: $Url" -ForegroundColor Gray
            }
            return $true
        } else {
            Write-Host "⚠️  $ServiceName responded with status $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ $ServiceName is not responding" -ForegroundColor Red
        if ($Detailed) {
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
            Write-Host "   URL: $Url" -ForegroundColor Gray
        }
        return $false
    }
}

Write-Host "🔍 Checking all service endpoints..." -ForegroundColor Cyan
Write-Host ""

# Monitoring Stack
Write-Host "📊 Monitoring Stack:" -ForegroundColor Yellow
$monitoringServices = @(
    @{Name="Prometheus"; Url="http://localhost:9090"},
    @{Name="Grafana"; Url="http://localhost:3010"},
    @{Name="Alertmanager"; Url="http://localhost:9093"},
    @{Name="Webhook Service"; Url="http://localhost:5001"}
)

$monitoringHealthy = 0
foreach ($service in $monitoringServices) {
    if (Test-ServiceEndpoint $service.Url $service.Name) {
        $monitoringHealthy++
    }
}

Write-Host ""

# Application Services Health Check
Write-Host "🏥 Application Services (Health Check):" -ForegroundColor Yellow
$appServices = @(
    @{Name="API Gateway"; Url="http://localhost:8082/health"},
    @{Name="Auth Service"; Url="http://localhost:3001/health"},
    @{Name="Link Service"; Url="http://localhost:3002/health"},
    @{Name="Community Service"; Url="http://localhost:3003/health"},
    @{Name="Chat Service"; Url="http://localhost:3004/health"},
    @{Name="News Service"; Url="http://localhost:3005/health"},
    @{Name="Admin Service"; Url="http://localhost:3006/health"}
)

$appHealthy = 0
foreach ($service in $appServices) {
    if (Test-ServiceEndpoint $service.Url $service.Name) {
        $appHealthy++
    }
}

Write-Host ""

# Application Services Metrics Check  
Write-Host "📈 Application Services (Metrics Endpoint):" -ForegroundColor Yellow
$metricsServices = @(
    @{Name="API Gateway"; Url="http://localhost:8082/metrics"},
    @{Name="Auth Service"; Url="http://localhost:3001/metrics"},
    @{Name="Link Service"; Url="http://localhost:3002/metrics"},
    @{Name="Community Service"; Url="http://localhost:3003/metrics"},
    @{Name="Chat Service"; Url="http://localhost:3004/metrics"},
    @{Name="News Service"; Url="http://localhost:3005/metrics"},
    @{Name="Admin Service"; Url="http://localhost:3006/metrics"}
)

$metricsHealthy = 0
foreach ($service in $metricsServices) {
    if (Test-ServiceEndpoint $service.Url $service.Name) {
        $metricsHealthy++
    }
}

Write-Host ""

# Frontend Check
Write-Host "🎨 Frontend:" -ForegroundColor Yellow
$frontendHealthy = if (Test-ServiceEndpoint "http://localhost:3000" "Frontend") { 1 } else { 0 }

Write-Host ""

# Summary
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Monitoring Stack: $monitoringHealthy/4 healthy"
Write-Host "   Application Health: $appHealthy/7 healthy"
Write-Host "   Metrics Endpoints: $metricsHealthy/7 healthy"
Write-Host "   Frontend: $frontendHealthy/1 healthy"

$totalServices = 4 + 7 + 7 + 1
$totalHealthy = $monitoringHealthy + $appHealthy + $metricsHealthy + $frontendHealthy

Write-Host ""
if ($totalHealthy -eq $totalServices) {
    Write-Host "🎉 All services are healthy! ($totalHealthy/$totalServices)" -ForegroundColor Green
} elseif ($totalHealthy -gt ($totalServices / 2)) {
    Write-Host "⚠️  Most services are healthy ($totalHealthy/$totalServices)" -ForegroundColor Yellow
} else {
    Write-Host "❌ Many services are down ($totalHealthy/$totalServices)" -ForegroundColor Red
}

Write-Host ""

# Specific troubleshooting
if ($metricsHealthy -eq 0) {
    Write-Host "🔧 Troubleshooting - No metrics endpoints responding:" -ForegroundColor Yellow
    Write-Host "1. Run: .\add-metrics-endpoints.ps1"
    Write-Host "2. Install dependencies: npm run install:all"  
    Write-Host "3. Restart services: npm run restart"
}

if ($monitoringHealthy -lt 4) {
    Write-Host "🔧 Troubleshooting - Monitoring stack issues:" -ForegroundColor Yellow
    Write-Host "1. Check Docker: docker ps"
    Write-Host "2. Restart monitoring: .\start-monitoring.ps1 restart"
    Write-Host "3. Check logs: docker-compose -f docker-compose.monitoring.yml logs"
}

if ($appHealthy -lt 7) {
    Write-Host "🔧 Troubleshooting - Application services down:" -ForegroundColor Yellow
    Write-Host "1. Start services: npm run start"
    Write-Host "2. Check ports: netstat -an | findstr :300"
    Write-Host "3. Check logs in terminal where services are running"
}

Write-Host ""
Write-Host "Quick fixes:" -ForegroundColor Cyan
Write-Host "   Fix metrics: .\add-metrics-endpoints.ps1"
Write-Host "   Fix Prometheus: .\fix-prometheus-discovery.ps1"  
Write-Host "   Start all: npm run start"
Write-Host "   Restart monitoring: .\start-monitoring.ps1 restart"
