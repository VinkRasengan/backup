# Monitoring Management Script for Windows
# PowerShell script to easily manage Prometheus & Grafana

param(
    [string]$Action = "start"
)

$ErrorActionPreference = "Stop"

function Write-ColoredMessage {
    param($Message, $Color = "Green")
    Write-Host "🔧 $Message" -ForegroundColor $Color
}

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

function Check-Prerequisites {
    Write-ColoredMessage "Checking prerequisites..." "Cyan"
    
    # Check Docker
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
    } catch {
        Write-Error "Docker is not running. Please start Docker Desktop first."
        Write-Host "Download: https://www.docker.com/products/docker-desktop"
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
        Write-Success "Docker Compose is available"
    } catch {
        Write-Error "Docker Compose not found"
        exit 1
    }
    
    # Check if monitoring directory exists
    if (-not (Test-Path "monitoring")) {
        Write-Error "Monitoring directory not found. Are you in the project root?"
        exit 1
    }
    
    Write-Success "All prerequisites met"
}

function Install-MonitoringDependencies {
    Write-ColoredMessage "Installing monitoring dependencies..." "Cyan"
    
    try {
        npm run monitoring:install
        Write-Success "Dependencies installed successfully"
    } catch {
        Write-Error "Failed to install dependencies: $_"
        exit 1
    }
}

function Start-MonitoringStack {
    Write-ColoredMessage "Starting Monitoring Stack..." "Cyan"
    
    try {
        # Create networks if they don't exist
        Write-ColoredMessage "Creating Docker networks..."
        try {
            docker network create monitoring 2>$null
            Write-Success "Created monitoring network"
        } catch {
            Write-Host "ℹ️  Network 'monitoring' already exists" -ForegroundColor Blue
        }
        
        try {
            docker network create app-network 2>$null
            Write-Success "Created app-network"
        } catch {
            Write-Host "ℹ️  Network 'app-network' already exists" -ForegroundColor Blue
        }
        
        # Start webhook service
        Write-ColoredMessage "Starting webhook service..."
        $webhookPath = "monitoring\webhook-service"
        if (Test-Path $webhookPath) {
            Start-Process -FilePath "node" -ArgumentList "app.js" -WorkingDirectory $webhookPath -WindowStyle Hidden
            Write-Success "Webhook service started"
        } else {
            Write-Warning "Webhook service directory not found"
        }
        
        # Wait for webhook service to initialize
        Start-Sleep -Seconds 3
        
        # Start Docker containers
        Write-ColoredMessage "Starting Docker containers..."
        docker-compose -f docker-compose.monitoring.yml up -d
        
        # Wait for services to be ready
        Write-ColoredMessage "Waiting for services to initialize..."
        Start-Sleep -Seconds 15
        
        # Check service status
        Check-ServiceStatus
        
    } catch {
        Write-Error "Failed to start monitoring stack: $_"
        exit 1
    }
}

function Stop-MonitoringStack {
    Write-ColoredMessage "Stopping Monitoring Stack..." "Yellow"
    
    try {
        # Stop Docker containers
        docker-compose -f docker-compose.monitoring.yml down
        
        # Stop webhook service if running
        $webhookPid = Get-Content "webhook-service.pid" -ErrorAction SilentlyContinue
        if ($webhookPid) {
            Stop-Process -Id $webhookPid -ErrorAction SilentlyContinue
            Remove-Item "webhook-service.pid" -ErrorAction SilentlyContinue
            Write-Success "Webhook service stopped"
        }
        
        Write-Success "Monitoring stack stopped"
    } catch {
        Write-Error "Failed to stop monitoring stack: $_"
    }
}

function Check-ServiceStatus {
    Write-ColoredMessage "Checking service status..." "Cyan"
    
    $services = @(
        @{Name="Prometheus"; Port=9090; URL="http://localhost:9090"},
        @{Name="Grafana"; Port=3010; URL="http://localhost:3010"},
        @{Name="Alertmanager"; Port=9093; URL="http://localhost:9093"},
        @{Name="Node Exporter"; Port=9100; URL="http://localhost:9100"},
        @{Name="Webhook Service"; Port=5001; URL="http://localhost:5001"}
    )
    
    foreach ($service in $services) {
        try {
            $connection = Test-NetConnection -ComputerName localhost -Port $service.Port -InformationLevel Quiet
            if ($connection) {
                Write-Success "$($service.Name) is running on port $($service.Port)"
            } else {
                Write-Warning "$($service.Name) is not responding on port $($service.Port)"
            }
        } catch {
            Write-Warning "$($service.Name) status unknown"
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Monitoring Stack Status Check Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Access URLs:" -ForegroundColor Cyan
    Write-Host "   Grafana:        http://localhost:3010 (admin/admin123)"
    Write-Host "   Prometheus:     http://localhost:9090"
    Write-Host "   Alertmanager:   http://localhost:9093"
    Write-Host "   Node Exporter:  http://localhost:9100"
    Write-Host "   Webhook Service: http://localhost:5001"
    Write-Host ""
    Write-Host "📈 Grafana Features:" -ForegroundColor Cyan
    Write-Host "   - Import dashboards from: monitoring/grafana/dashboards/"
    Write-Host "   - Default login: admin/admin123"
    Write-Host "   - Prometheus datasource pre-configured"
    Write-Host ""
    Write-Host "🚨 Alert Endpoints:" -ForegroundColor Cyan
    Write-Host "   - All Alerts:      http://localhost:5001/alerts"
    Write-Host "   - Critical Alerts: http://localhost:5001/alerts/critical"
    Write-Host "   - Warning Alerts:  http://localhost:5001/alerts/warning"
}

function Restart-MonitoringStack {
    Write-ColoredMessage "Restarting Monitoring Stack..." "Yellow"
    Stop-MonitoringStack
    Start-Sleep -Seconds 5
    Start-MonitoringStack
}

function Show-Logs {
    Write-ColoredMessage "Showing monitoring logs..." "Cyan"
    docker-compose -f docker-compose.monitoring.yml logs -f
}

function Show-Usage {
    Write-Host ""
    Write-Host "🔧 Monitoring Management Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\start-monitoring.ps1 [action]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Actions:"
    Write-Host "   start      - Start monitoring stack (default)"
    Write-Host "   stop       - Stop monitoring stack"
    Write-Host "   restart    - Restart monitoring stack"
    Write-Host "   status     - Check service status"
    Write-Host "   logs       - Show service logs"
    Write-Host "   install    - Install dependencies only"
    Write-Host "   help       - Show this help"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "   .\start-monitoring.ps1"
    Write-Host "   .\start-monitoring.ps1 start"
    Write-Host "   .\start-monitoring.ps1 stop"
    Write-Host "   .\start-monitoring.ps1 status"
    Write-Host ""
}

# Main execution
switch ($Action.ToLower()) {
    "start" {
        Check-Prerequisites
        Install-MonitoringDependencies
        Start-MonitoringStack
    }
    "stop" {
        Stop-MonitoringStack
    }
    "restart" {
        Check-Prerequisites
        Restart-MonitoringStack
    }
    "status" {
        Check-ServiceStatus
    }
    "logs" {
        Show-Logs
    }
    "install" {
        Check-Prerequisites
        Install-MonitoringDependencies
    }
    "help" {
        Show-Usage
    }
    default {
        Write-Error "Unknown action: $Action"
        Show-Usage
        exit 1
    }
}
