# Simple script to add metrics endpoints to services

$services = @(
    "services/link-service",
    "services/community-service", 
    "services/chat-service",
    "services/news-service",
    "services/admin-service"
)

function Add-MetricsToService {
    param($ServicePath, $ServiceName)
    
    $appFile = Join-Path $ServicePath "src/app.js"
    if (-not (Test-Path $appFile)) {
        Write-Host "App file not found: $appFile" -ForegroundColor Yellow
        return
    }
    
    $content = Get-Content $appFile -Raw
    
    # Check if metrics already exist
    if ($content -match "/metrics" -and $content -match "prom-client") {
        Write-Host "$ServiceName already has metrics endpoint" -ForegroundColor Green
        return
    }
    
    Write-Host "Adding metrics to $ServiceName..." -ForegroundColor Cyan
    
    # Add prom-client import
    if (-not ($content -match "prom-client")) {
        $content = $content -replace "(const express = require\('express'\);)", "`$1`nconst promClient = require('prom-client');"
    }
    
    # Add metrics initialization after express app creation
    $metricsInit = @"

// Prometheus metrics setup
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route']
});

"@
    
    # Add metrics initialization after app creation
    if ($content -match "const app = express\(\);") {
        $content = $content -replace "(const app = express\(\);)", "`$1$metricsInit"
    }
    
    # Add metrics middleware before existing middleware
    $metricsMiddleware = @"

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    });
    httpRequestDuration.observe({
      method: req.method,
      route: req.route ? req.route.path : req.path
    }, duration);
  });
  
  next();
});

"@
    
    # Add metrics middleware after body parsing
    if ($content -match "app\.use\(express\.json") {
        $content = $content -replace "(app\.use\(express\.json[^;]+;)", "`$1$metricsMiddleware"
    }
    
    # Add metrics endpoint before existing routes
    $metricsEndpoint = @"

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await promClient.register.metrics();
    res.set('Content-Type', promClient.register.contentType);
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});

"@
    
    # Add metrics endpoint before health check
    if ($content -match "app\.get\('/health'") {
        $content = $content -replace "(app\.get\('/health')", "$metricsEndpoint`$1"
    }
    
    # Write back to file
    Set-Content -Path $appFile -Value $content -Encoding UTF8
    Write-Host "Metrics added to $ServiceName" -ForegroundColor Green
}

Write-Host "Adding Prometheus metrics to microservices..." -ForegroundColor Green
Write-Host ""

foreach ($servicePath in $services) {
    if (Test-Path $servicePath) {
        $serviceName = Split-Path $servicePath -Leaf
        Add-MetricsToService $servicePath $serviceName
        Write-Host ""
    } else {
        Write-Host "Service directory not found: $servicePath" -ForegroundColor Yellow
    }
}

Write-Host "Done! Restart services to apply changes." -ForegroundColor Green
