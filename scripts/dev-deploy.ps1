# =============================================================================
# 🚀 Anti-Fraud Platform - PowerShell Development Deployment Script
# Easy deployment and debugging for all services
# =============================================================================

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "up", "deploy", "stop", "down", "restart", "rebuild", "logs", "status", "ps", "health", "clean", "setup", "debug", "help")]
    [string]$Command = "start",
    
    [string]$Service = "",
    [switch]$NoBuild,
    [switch]$Force,
    [switch]$Follow,
    [switch]$Verbose
)

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = "docker-compose.microservices.yml"
$EnvFile = ".env"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    White = "White"
}

# Print functions
function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "🚀 $Message" -ForegroundColor $Colors.White
    Write-Host ("=" * 60) -ForegroundColor $Colors.White
}

function Write-Status {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "⚙️  $Message" -ForegroundColor $Colors.Cyan
    Write-Host ("-" * 40) -ForegroundColor $Colors.Cyan
}

# Function to show usage
function Show-Usage {
    Write-Host ""
    Write-Host "Usage: .\dev-deploy.ps1 [COMMAND] [OPTIONS]" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor $Colors.Cyan
    Write-Host "  start, up, deploy    - Start all services (default)"
    Write-Host "  stop, down          - Stop all services"
    Write-Host "  restart             - Restart all services"
    Write-Host "  rebuild             - Force rebuild and start"
    Write-Host "  logs               - Show logs for all services"
    Write-Host "  status, ps         - Show service status"
    Write-Host "  health             - Check service health"
    Write-Host "  clean              - Clean up containers and images"
    Write-Host "  setup              - Initial setup and environment check"
    Write-Host "  debug              - Debug mode with detailed logging"
    Write-Host "  help               - Show this help message"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Colors.Cyan
    Write-Host "  -Service <name>    - Target specific service"
    Write-Host "  -NoBuild           - Skip building (use existing images)"
    Write-Host "  -Force             - Force action without confirmation"
    Write-Host "  -Follow            - Follow logs (for logs command)"
    Write-Host "  -Verbose           - Verbose output"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.Cyan
    Write-Host "  .\dev-deploy.ps1 start                    # Start all services"
    Write-Host "  .\dev-deploy.ps1 logs -Service auth       # Show auth service logs"
    Write-Host "  .\dev-deploy.ps1 restart -Service api     # Restart API gateway"
    Write-Host "  .\dev-deploy.ps1 rebuild -Force           # Force rebuild all services"
    Write-Host "  .\dev-deploy.ps1 debug                    # Start in debug mode"
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Section "Checking Prerequisites"
    
    # Check Docker
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker not found"
        }
        Write-Success "Docker is installed: $dockerVersion"
    }
    catch {
        Write-Error "Docker is not installed. Please install Docker Desktop."
        return $false
    }
    
    # Check if Docker is running
    try {
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker not running"
        }
        Write-Success "Docker is running"
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop."
        return $false
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Docker Compose not found"
        }
        Write-Success "Docker Compose is available: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose is not installed."
        return $false
    }
    
    return $true
}

# Function to create environment file
function New-EnvFile {
    if (Test-Path $EnvFile) {
        return $true
    }
    
    Write-Section "Creating Environment File"
    Write-Status "Creating .env template file..."
    
    $envContent = @"
# =============================================================================
# Anti-Fraud Platform Environment Configuration
# =============================================================================

# Service Configuration
NODE_ENV=development

# Firebase Configuration - REQUIRED: Update with your project details
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# JWT Configuration - REQUIRED: Generate a secure secret key
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_SECRET_KEY_AT_LEAST_32_CHARS

# API Keys - REQUIRED: Get from respective providers
GEMINI_API_KEY=your_gemini_api_key_here
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
SCAMADVISER_API_KEY=your_scamadviser_api_key_here
SCREENSHOTLAYER_API_KEY=your_screenshotlayer_api_key_here
NEWSAPI_API_KEY=your_newsapi_api_key_here
NEWSDATA_API_KEY=your_newsdata_api_key_here

# Service URLs (for development)
AUTH_SERVICE_URL=http://auth-service:3001
LINK_SERVICE_URL=http://link-service:3002
COMMUNITY_SERVICE_URL=http://community-service:3003
CHAT_SERVICE_URL=http://chat-service:3004
NEWS_SERVICE_URL=http://news-service:3005
ADMIN_SERVICE_URL=http://admin-service:3006

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# React App Configuration - REQUIRED: Update with your Firebase settings
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
"@
    
    $envContent | Out-File -FilePath $EnvFile -Encoding UTF8
    Write-Success ".env template created"
    Write-Warning "Please update all placeholder values in .env before deployment"
    Write-Host ""
    Write-Host "Required configurations:" -ForegroundColor $Colors.Yellow
    Write-Host "  - Firebase project settings"
    Write-Host "  - JWT secret key"
    Write-Host "  - API keys for external services"
    Write-Host ""
    Write-Host "See DEPLOYMENT_SETUP.md for detailed instructions" -ForegroundColor $Colors.Cyan
    return $false
}

# Function to start services
function Start-Services {
    Write-Section "Starting Services"
    
    if (-not $NoBuild) {
        Write-Status "Building services..."
        if ($Service) {
            docker-compose -f $ComposeFile build $Service
        } else {
            docker-compose -f $ComposeFile build
        }
    }
    
    Write-Status "Starting services..."
    if ($Service) {
        docker-compose -f $ComposeFile up -d $Service
    } else {
        docker-compose -f $ComposeFile up -d
    }
    
    Write-Success "Services started successfully"
}

# Function to stop services
function Stop-Services {
    Write-Section "Stopping Services"
    
    if ($Service) {
        docker-compose -f $ComposeFile stop $Service
    } else {
        docker-compose -f $ComposeFile down
    }
    
    Write-Success "Services stopped successfully"
}

# Function to show service status
function Show-Status {
    Write-Section "Service Status"
    
    Write-Host "Container Status:" -ForegroundColor $Colors.White
    docker-compose -f $ComposeFile ps
    
    Write-Host ""
    Write-Host "Resource Usage:" -ForegroundColor $Colors.White
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Function to show logs
function Show-Logs {
    Write-Section "Service Logs"
    
    if ($Follow) {
        if ($Service) {
            Write-Status "Following logs for $Service (Ctrl+C to exit)..."
            docker-compose -f $ComposeFile logs -f $Service
        } else {
            Write-Status "Following logs for all services (Ctrl+C to exit)..."
            docker-compose -f $ComposeFile logs -f
        }
    } else {
        if ($Service) {
            Write-Status "Showing recent logs for $Service..."
            docker-compose -f $ComposeFile logs --tail=50 $Service
        } else {
            Write-Status "Showing recent logs for all services..."
            docker-compose -f $ComposeFile logs --tail=20
        }
    }
}

# Function to check health
function Test-Health {
    Write-Section "Health Check"
    
    $healthEndpoints = @(
        @{Url="http://localhost:8080/health"; Name="API Gateway"},
        @{Url="http://localhost:3001/health"; Name="Auth Service"},
        @{Url="http://localhost:3002/health"; Name="Link Service"},
        @{Url="http://localhost:3003/health"; Name="Community Service"},
        @{Url="http://localhost:3004/health"; Name="Chat Service"},
        @{Url="http://localhost:3005/health"; Name="News Service"},
        @{Url="http://localhost:3006/health"; Name="Admin Service"}
    )
    
    $healthyCount = 0
    $totalCount = $healthEndpoints.Count
    
    Write-Host "Checking service endpoints..." -ForegroundColor $Colors.White
    
    foreach ($endpoint in $healthEndpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Success "$($endpoint.Name) is healthy"
                $healthyCount++
            } else {
                Write-Error "$($endpoint.Name) returned status $($response.StatusCode)"
            }
        }
        catch {
            Write-Error "$($endpoint.Name) is not responding"
        }
    }
    
    Write-Host ""
    if ($healthyCount -eq $totalCount) {
        Write-Success "All services are healthy ($healthyCount/$totalCount)"
    } else {
        Write-Warning "Health check: $healthyCount/$totalCount services are healthy"
    }
    
    Show-ServiceUrls
}

# Function to show service URLs
function Show-ServiceUrls {
    Write-Host ""
    Write-Host "📊 Service URLs:" -ForegroundColor $Colors.White
    Write-Host "  Frontend Application:     http://localhost:3000" -ForegroundColor $Colors.Green
    Write-Host "  API Gateway:              http://localhost:8080" -ForegroundColor $Colors.Green
    Write-Host "  Admin Panel:              http://localhost:3006" -ForegroundColor $Colors.Green
    Write-Host ""
    Write-Host "📊 Monitoring:" -ForegroundColor $Colors.White
    Write-Host "  Prometheus:               http://localhost:9090" -ForegroundColor $Colors.Cyan
    Write-Host "  Grafana:                  http://localhost:3007 (admin/admin)" -ForegroundColor $Colors.Cyan
    Write-Host "  Jaeger Tracing:           http://localhost:16686" -ForegroundColor $Colors.Cyan
}

# Main execution
Set-Location $ProjectRoot

Write-Header "Anti-Fraud Platform Development Deployment"
Write-Host "Project Root: $ProjectRoot" -ForegroundColor $Colors.White
Write-Host "Command: $Command" -ForegroundColor $Colors.White
if ($Service) {
    Write-Host "Target Service: $Service" -ForegroundColor $Colors.White
}
Write-Host ""

switch ($Command) {
    "setup" {
        if (-not (Test-Prerequisites)) { exit 1 }
        if (-not (New-EnvFile)) { exit 1 }
        Write-Success "Setup completed successfully"
    }
    
    { $_ -in @("start", "up", "deploy") } {
        if (-not (Test-Prerequisites)) { exit 1 }
        if (-not (New-EnvFile)) { exit 1 }
        Start-Services
        Start-Sleep -Seconds 30
        Test-Health
    }
    
    { $_ -in @("stop", "down") } {
        Stop-Services
    }
    
    "restart" {
        Write-Section "Restarting Services"
        if ($Service) {
            docker-compose -f $ComposeFile restart $Service
        } else {
            docker-compose -f $ComposeFile restart
        }
        Write-Success "Services restarted successfully"
    }
    
    "rebuild" {
        if (-not (Test-Prerequisites)) { exit 1 }
        Write-Section "Rebuilding Services"
        if ($Service) {
            docker-compose -f $ComposeFile build $Service
            docker-compose -f $ComposeFile up -d $Service
        } else {
            docker-compose -f $ComposeFile build
            docker-compose -f $ComposeFile up -d
        }
        Write-Success "Services rebuilt and started successfully"
        Start-Sleep -Seconds 30
        Test-Health
    }
    
    "logs" {
        Show-Logs
    }
    
    { $_ -in @("status", "ps") } {
        Show-Status
    }
    
    "health" {
        Test-Health
    }
    
    "clean" {
        Write-Section "Cleanup"
        if (-not $Force) {
            $confirm = Read-Host "This will remove all containers and images. Continue? (y/N)"
            if ($confirm -ne "y" -and $confirm -ne "Y") {
                Write-Status "Cleanup cancelled"
                exit 0
            }
        }
        docker-compose -f $ComposeFile down -v --remove-orphans
        docker system prune -f
        Write-Success "Cleanup completed"
    }
    
    "debug" {
        if (-not (Test-Prerequisites)) { exit 1 }
        Write-Section "Debug Mode"
        Write-Host "System Information:" -ForegroundColor $Colors.White
        docker --version
        docker-compose --version
        Write-Host ""
        docker-compose -f $ComposeFile up --build
    }
    
    "help" {
        Show-Usage
    }
    
    default {
        Write-Error "Unknown command: $Command"
        Show-Usage
        exit 1
    }
}

Write-Host ""
Write-Success "Operation completed successfully!"
