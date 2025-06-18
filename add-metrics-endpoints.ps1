# Script to add Prometheus metrics to all microservices
# This will add /metrics endpoint to each service

param(
    [switch]$CheckOnly = $false
)

$services = @(
    "services/auth-service",
    "services/api-gateway", 
    "services/link-service",
    "services/community-service",
    "services/chat-service",
    "services/news-service",
    "services/admin-service",
    "services/criminalip-service",
    "services/phishtank-service"
)

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Check-MetricsEndpoint {
    param($ServicePath)
    
    $appFile = Join-Path $ServicePath "src/app.js"
    if (Test-Path $appFile) {
        $content = Get-Content $appFile -Raw
        if ($content -match "/metrics" -and $content -match "prom-client") {
            return $true
        }
    }
    return $false
}

function Add-MetricsToService {
    param($ServicePath, $ServiceName)
    
    $appFile = Join-Path $ServicePath "src/app.js"
    if (-not (Test-Path $appFile)) {
        Write-Warning "App file not found: $appFile"
        return
    }
    
    $content = Get-Content $appFile -Raw
    
    # Check if metrics already exist
    if ($content -match "/metrics" -and $content -match "prom-client") {
        Write-Success "$ServiceName already has metrics endpoint"
        return
    }
    
    # Add prom-client import at the top
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

// Middleware to collect metrics
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
    
    # Add metrics initialization after app creation
    if ($content -match "const app = express\(\);") {
        $content = $content -replace "(const app = express\(\);)", "`$1$metricsInit"
    }
    
    # Add metrics endpoint before app.listen
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: '$ServiceName',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

"@
    
    # Add metrics endpoint before app.listen
    if ($content -match "app\.listen\(") {
        $content = $content -replace "(app\.listen\()", "$metricsEndpoint`$1"
    }
    
    # Write updated content back to file
    $content | Out-File -FilePath $appFile -Encoding UTF8
    Write-Success "Added metrics endpoint to $ServiceName"
}

function Update-PackageJson {
    param($ServicePath)
    
    $packageFile = Join-Path $ServicePath "package.json"
    if (Test-Path $packageFile) {
        $packageContent = Get-Content $packageFile -Raw | ConvertFrom-Json
        
        # Check if prom-client is already in dependencies
        if (-not $packageContent.dependencies.'prom-client') {
            $packageContent.dependencies | Add-Member -MemberType NoteProperty -Name 'prom-client' -Value '^15.1.0'
            $packageContent | ConvertTo-Json -Depth 10 | Out-File -FilePath $packageFile -Encoding UTF8
            Write-Success "Added prom-client to package.json in $ServicePath"
        }
    }
}

if ($CheckOnly) {
    Write-Host "🔍 Checking metrics endpoints in all services..." -ForegroundColor Cyan
    
    foreach ($servicePath in $services) {
        if (Test-Path $servicePath) {
            $serviceName = Split-Path $servicePath -Leaf
            $hasMetrics = Check-MetricsEndpoint $servicePath
            
            if ($hasMetrics) {
                Write-Success "$serviceName has metrics endpoint"
            } else {
                Write-Warning "$serviceName missing metrics endpoint"
            }
        } else {
            Write-Warning "Service directory not found: $servicePath"
        }
    }
} else {
    Write-Host "🔧 Adding Prometheus metrics to all microservices..." -ForegroundColor Green
    
    foreach ($servicePath in $services) {
        if (Test-Path $servicePath) {
            $serviceName = Split-Path $servicePath -Leaf
            Write-Host "Processing $serviceName..." -ForegroundColor Cyan
            
            # Update package.json
            Update-PackageJson $servicePath
            
            # Add metrics to service
            Add-MetricsToService $servicePath $serviceName
            
            Write-Host ""
        } else {
            Write-Warning "Service directory not found: $servicePath"
        }
    }
    
    Write-Host "🎉 Metrics endpoints added to all services!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Install dependencies: npm run install:all"
    Write-Host "2. Restart all services: npm run restart"
    Write-Host "3. Check Prometheus targets: http://localhost:9090/targets"
    Write-Host "4. Refresh Grafana dashboard"
    Write-Host ""
}
