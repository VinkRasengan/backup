@echo off
title Monitoring Stack - Prometheus & Grafana

echo.
echo ====================================
echo    MONITORING STACK LAUNCHER
echo ====================================
echo.
echo 🔧 Starting Prometheus, Grafana, Alertmanager...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running!
    echo Please start Docker Desktop first.
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.

REM Start monitoring stack
echo 📦 Installing dependencies...
call npm run monitoring:install

echo.
echo 🚀 Starting monitoring services...
call npm run monitoring:start

echo.
echo 🎉 Monitoring Stack Started!
echo.
echo 📊 Access URLs:
echo    Grafana:      http://localhost:3010 (admin/admin123)
echo    Prometheus:   http://localhost:9090
echo    Alertmanager: http://localhost:9093
echo    Webhook:      http://localhost:5001
echo.
echo 💡 Tips:
echo    - Import dashboards from monitoring/grafana/dashboards/
echo    - Check alerts at http://localhost:5001/alerts
echo.

REM Ask user if they want to open Grafana
set /p choice="Open Grafana in browser? (y/n): "
if /i "%choice%"=="y" (
    start http://localhost:3010
)

echo.
echo Press any key to close this window...
pause >nul
