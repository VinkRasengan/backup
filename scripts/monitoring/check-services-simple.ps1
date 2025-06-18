# Simple service health check script

function Test-ServiceEndpoint {
    param($Url, $ServiceName)
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $ServiceName is healthy" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $ServiceName returned status $($response.StatusCode)" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $ServiceName is not responding" -ForegroundColor Red
        return $false
    }
}

Write-Host "Checking service endpoints..." -ForegroundColor Cyan
Write-Host ""

# Check monitoring services
Write-Host "Monitoring Stack:" -ForegroundColor Yellow
$monitoringServices = @(
    @{Name="Prometheus"; Url="http://localhost:9090"},
    @{Name="Grafana"; Url="http://localhost:3010"}
)

$monitoringHealthy = 0
foreach ($service in $monitoringServices) {
    if (Test-ServiceEndpoint $service.Url $service.Name) {
        $monitoringHealthy++
    }
}

Write-Host ""

# Check application services
Write-Host "Application Services:" -ForegroundColor Yellow
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

# Check metrics endpoints
Write-Host "Metrics Endpoints:" -ForegroundColor Yellow
$metricsServices = @(
    @{Name="API Gateway Metrics"; Url="http://localhost:8082/metrics"},
    @{Name="Auth Service Metrics"; Url="http://localhost:3001/metrics"},
    @{Name="Link Service Metrics"; Url="http://localhost:3002/metrics"},
    @{Name="Community Service Metrics"; Url="http://localhost:3003/metrics"},
    @{Name="Chat Service Metrics"; Url="http://localhost:3004/metrics"},
    @{Name="News Service Metrics"; Url="http://localhost:3005/metrics"},
    @{Name="Admin Service Metrics"; Url="http://localhost:3006/metrics"}
)

$metricsHealthy = 0
foreach ($service in $metricsServices) {
    if (Test-ServiceEndpoint $service.Url $service.Name) {
        $metricsHealthy++
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "Monitoring: $monitoringHealthy/2 healthy"
Write-Host "Applications: $appHealthy/7 healthy"
Write-Host "Metrics: $metricsHealthy/7 healthy"

if ($metricsHealthy -eq 0) {
    Write-Host ""
    Write-Host "No metrics endpoints responding. Run: .\add-metrics-endpoints.ps1" -ForegroundColor Yellow
}
