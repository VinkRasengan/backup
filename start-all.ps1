#!/usr/bin/env pwsh

Write-Host "🚀 Starting FactCheck Platform - All Services" -ForegroundColor Green
Write-Host ""
Write-Host "This will start:" -ForegroundColor Yellow
Write-Host "  - API Gateway (port 8080)" -ForegroundColor Cyan
Write-Host "  - All Backend Services (ports 3001-3006)" -ForegroundColor Cyan
Write-Host "  - Frontend Client (port 3000)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Red
Write-Host ""

# Start all services using the existing script
& "$PSScriptRoot/scripts/start-services.ps1"

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Blue
Write-Host "🔧 API Gateway: http://localhost:8080" -ForegroundColor Blue
Write-Host ""
Write-Host "To stop all services, run: npm run stop" -ForegroundColor Yellow
