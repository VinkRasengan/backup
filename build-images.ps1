# Build Docker images for all microservices
# This script builds all Docker images needed for Kubernetes deployment

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

function Build-ServiceImage {
    param(
        [string]$ServiceName,
        [string]$ServicePath
    )
    
    Write-Host "🔨 Building $ServiceName..." -ForegroundColor Cyan
    
    if (-not (Test-Path $ServicePath)) {
        Write-Error "Service directory not found: $ServicePath"
        return $false
    }
    
    # Check if Dockerfile exists
    $dockerfilePath = Join-Path $ServicePath "Dockerfile"
    if (-not (Test-Path $dockerfilePath)) {
        Write-Warning "No Dockerfile found for $ServiceName, skipping..."
        return $true
    }
    
    # Build the image from root directory with service-specific Dockerfile
    try {
        docker build -f "$ServicePath/Dockerfile" -t "$ServiceName`:latest" .
        Write-Success "$ServiceName image built successfully"
        Write-Host ""
        return $true
    } catch {
        Write-Error "Failed to build $ServiceName image"
        Write-Host $_.Exception.Message
        return $false
    }
}

Write-Host "🐳 Building Docker images for Anti-Fraud Platform..." -ForegroundColor Green
Write-Host ""

# Check if Docker is available
try {
    docker --version | Out-Null
    Write-Success "Docker is available"
} catch {
    Write-Error "Docker is not installed or not in PATH"
    exit 1
}

# Check if Docker daemon is running
try {
    docker info | Out-Null
    Write-Success "Docker daemon is running"
} catch {
    Write-Error "Docker daemon is not running"
    exit 1
}

Write-Host ""

# Build all microservices
Write-Host "🔧 Building microservice images..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="auth-service"; Path="services/auth-service"},
    @{Name="api-gateway"; Path="services/api-gateway"},
    @{Name="link-service"; Path="services/link-service"},
    @{Name="community-service"; Path="services/community-service"},
    @{Name="chat-service"; Path="services/chat-service"},
    @{Name="news-service"; Path="services/news-service"},
    @{Name="admin-service"; Path="services/admin-service"}
)

$buildErrors = 0

foreach ($service in $services) {
    if (-not (Build-ServiceImage -ServiceName $service.Name -ServicePath $service.Path)) {
        $buildErrors++
    }
}

# Build frontend (special case - build from client directory)
Write-Host "🌐 Building frontend image..." -ForegroundColor Cyan

if (-not (Test-Path "client")) {
    Write-Error "Client directory not found: client"
    exit 1
}

if (-not (Test-Path "client/Dockerfile")) {
    Write-Warning "No Dockerfile found for frontend, skipping..."
} else {
    # Build frontend from client directory (not root)
    try {
        docker build -f "client/Dockerfile" -t "frontend:latest" "client/"
        Write-Success "frontend image built successfully"
    } catch {
        Write-Error "Failed to build frontend image"
        Write-Host $_.Exception.Message
        $buildErrors++
    }
}

if ($buildErrors -gt 0) {
    Write-Error "$buildErrors images failed to build"
    exit 1
}

Write-Host "📋 Built images:" -ForegroundColor Cyan
docker images | Select-String -Pattern "(auth-service|api-gateway|link-service|community-service|chat-service|news-service|admin-service|frontend)" | Select-Object -First 20

Write-Host ""
Write-Success "All images built successfully!"
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "1. Test images locally: docker run -p 3001:3001 auth-service:latest"
Write-Host "2. Push to registry (if using remote cluster): docker push <registry>/auth-service:latest"
Write-Host "3. Deploy to Kubernetes: cd k8s && .\deploy-all.ps1"
Write-Host ""

# Show image sizes
Write-Host "📊 Image sizes:" -ForegroundColor Cyan
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | Select-String -Pattern "(auth-service|api-gateway|link-service|community-service|chat-service|news-service|admin-service|frontend|REPOSITORY)"
