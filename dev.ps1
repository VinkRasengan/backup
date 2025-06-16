# =============================================================================
# Anti-Fraud Platform - Development PowerShell Script (Windows)
# Equivalent to Makefile commands for Windows users
# =============================================================================

param(
    [string]$Command = "help",
    [string]$Service = ""
)

# Colors for output
$RED = "`e[0;31m"
$GREEN = "`e[0;32m"
$YELLOW = "`e[1;33m"
$BLUE = "`e[0;34m"
$CYAN = "`e[0;36m"
$WHITE = "`e[1;37m"
$NC = "`e[0m"

function Write-ColorOutput {
    param($Message, $Color = $NC)
    Write-Host "$Color$Message$NC"
}

function Show-Help {
    Write-Host ""
    Write-ColorOutput "🚀 Anti-Fraud Platform - Development Commands" $CYAN
    Write-ColorOutput "=============================================" $CYAN
    Write-Host ""
    Write-ColorOutput "Basic Commands:" $WHITE
    Write-Host "  .\dev.ps1 setup                 # Initial setup and environment check"
    Write-Host "  .\dev.ps1 dev                   # Start in development mode (recommended)"
    Write-Host "  .\dev.ps1 start                 # Start all services"
    Write-Host "  .\dev.ps1 stop                  # Stop all services"
    Write-Host "  .\dev.ps1 restart               # Restart all services"
    Write-Host "  .\dev.ps1 rebuild               # Force rebuild all services"
    Write-Host ""
    Write-ColorOutput "Monitoring Commands:" $WHITE
    Write-Host "  .\dev.ps1 logs                  # Show logs for all services"
    Write-Host "  .\dev.ps1 logs -Service auth    # Show logs for specific service"
    Write-Host "  .\dev.ps1 health                # Check service health"
    Write-Host "  .\dev.ps1 status                # Show service status"
    Write-Host "  .\dev.ps1 urls                  # Show service URLs"
    Write-Host ""
    Write-ColorOutput "Development Shortcuts:" $WHITE
    Write-Host "  .\dev.ps1 dev-full              # Complete setup (setup + dev + health + urls)"
    Write-Host "  .\dev.ps1 quick                 # Quick start without building"
    Write-Host "  .\dev.ps1 clean                 # Clean up everything"
    Write-Host ""
}

function Check-Script {
    $scriptPath = "scripts\dev-deploy.sh"
    if (!(Test-Path $scriptPath)) {
        Write-ColorOutput "❌ Deployment script not found: $scriptPath" $RED
        exit 1
    }
}

function Run-DevScript {
    param($Args)
    Check-Script
    & ".\scripts\dev-deploy.sh" @Args
}

# Main command logic
switch ($Command.ToLower()) {
    "help" { Show-Help }
    
    "setup" {
        Write-ColorOutput "ℹ️  Setting up development environment..." $BLUE
        Run-DevScript @("setup")
    }
    
    "dev" {
        Write-ColorOutput "ℹ️  Starting development mode with hot reload..." $BLUE
        Run-DevScript @("dev")
    }
    
    "start" {
        Write-ColorOutput "ℹ️  Starting all services..." $BLUE
        Run-DevScript @("start")
    }
    
    "stop" {
        Write-ColorOutput "ℹ️  Stopping all services..." $BLUE
        Run-DevScript @("stop")
    }
    
    "restart" {
        Write-ColorOutput "ℹ️  Restarting all services..." $BLUE
        Run-DevScript @("restart")
    }
    
    "rebuild" {
        Write-ColorOutput "ℹ️  Rebuilding all services..." $BLUE
        Run-DevScript @("rebuild", "--force")
    }
    
    "logs" {
        if ($Service) {
            Write-ColorOutput "ℹ️  Showing logs for $Service..." $BLUE
            Run-DevScript @("logs", "--service", $Service)
        } else {
            Write-ColorOutput "ℹ️  Showing logs for all services..." $BLUE
            Run-DevScript @("logs")
        }
    }
    
    "health" {
        Write-ColorOutput "ℹ️  Checking service health..." $BLUE
        Run-DevScript @("health")
    }
    
    "status" {
        Write-ColorOutput "ℹ️  Checking service status..." $BLUE
        Run-DevScript @("status")
    }
    
    "urls" {
        Write-ColorOutput "ℹ️  Showing service URLs..." $BLUE
        Run-DevScript @("urls")
    }
    
    "dev-full" {
        Write-ColorOutput "ℹ️  Complete development setup..." $BLUE
        Run-DevScript @("setup")
        Run-DevScript @("dev")
        Run-DevScript @("health")
        Run-DevScript @("urls")
    }
    
    "quick" {
        Write-ColorOutput "ℹ️  Quick starting with existing images..." $BLUE
        Run-DevScript @("start", "--no-build")
    }
    
    "clean" {
        Write-ColorOutput "ℹ️  Cleaning up everything..." $BLUE
        Run-DevScript @("clean")
    }
    
    default {
        Write-ColorOutput "❌ Unknown command: $Command" $RED
        Write-ColorOutput "Use '.\dev.ps1 help' to see available commands" $YELLOW
        exit 1
    }
}
