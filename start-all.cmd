@echo off
echo 🚀 Starting FactCheck Platform - All Services
echo.
echo This will start:
echo   - API Gateway (port 8080)
echo   - All Backend Services (ports 3001-3006)
echo   - Frontend Client (port 3000)
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start all services using the PowerShell script
powershell -ExecutionPolicy Bypass -File "./scripts/start-services.ps1"

echo.
echo ✅ All services started!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 API Gateway: http://localhost:8080
echo.
echo Press any key to exit...
pause >nul
