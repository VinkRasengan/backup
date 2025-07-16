#!/usr/bin/env pwsh
# Start all services in separate Windows Terminal tabs
# PowerShell script for Windows

Write-Host "🚀 Starting all services + frontend in separate Windows Terminal tabs..." -ForegroundColor Green

$services = @(
    @{Name="API Gateway"; Path="services\api-gateway"; Port=8080; Color="White"; Priority=1},
    @{Name="Auth Service"; Path="services\auth-service"; Port=3001; Color="Blue"; Priority=2},
    @{Name="Link Service"; Path="services\link-service"; Port=3002; Color="Magenta"; Priority=3},
    @{Name="Community Service"; Path="services\community-service"; Port=3003; Color="Green"; Priority=4},
    @{Name="Chat Service"; Path="services\chat-service"; Port=3004; Color="Yellow"; Priority=5},
    @{Name="News Service"; Path="services\news-service"; Port=3005; Color="Red"; Priority=6},
    @{Name="Admin Service"; Path="services\admin-service"; Port=3006; Color="Cyan"; Priority=7},
    @{Name="Frontend Client"; Path="client"; Port=3000; Color="Magenta"; Priority=8}
)

# Check if Windows Terminal is available
$wtAvailable = Get-Command wt -ErrorAction SilentlyContinue

if ($wtAvailable) {
    Write-Host "Using Windows Terminal..." -ForegroundColor Green
    
    # Sort services by priority and start each service in a new Windows Terminal tab
    $sortedServices = $services | Sort-Object Priority
    foreach ($service in $sortedServices) {
        $title = "$($service.Name) - Port $($service.Port)"
        $command = "cd $($service.Path) && npm start"
        
        Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor $service.Color
        
        # Start new tab with specific title and command
        Start-Process wt -ArgumentList "new-tab", "--title", "`"$title`"", "cmd", "/k", "cd /d `"$PWD\$($service.Path)`" && npm start"
        
        Start-Sleep -Seconds 2  # Wait a bit between starts
    }
} else {
    Write-Host "Windows Terminal not found. Using separate CMD windows..." -ForegroundColor Yellow
    
    # Fallback to separate CMD windows
    $sortedServices = $services | Sort-Object Priority
    foreach ($service in $sortedServices) {
        $title = "$($service.Name) - Port $($service.Port)"
        $command = "cd /d `"$PWD\$($service.Path)`" && npm start"
        
        Write-Host "Starting $($service.Name) on port $($service.Port)..." -ForegroundColor $service.Color
        
        # Start new CMD window
        Start-Process cmd -ArgumentList "/k", "title `"$title`" && $command"
        
        Start-Sleep -Seconds 2
    }
}

Write-Host "✅ All services + frontend started in separate terminals!" -ForegroundColor Green
Write-Host "🌐 Main URLs:" -ForegroundColor Yellow
Write-Host "  🎯 Frontend App:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  🚪 API Gateway:   http://localhost:8080" -ForegroundColor Cyan
Write-Host "  📊 Health Check:  http://localhost:8080/health" -ForegroundColor Cyan
Write-Host "🛑 To stop all services, use: npm run stop:separate" -ForegroundColor Red
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
