@echo off
REM =============================================================================
REM 🚀 Quick Deploy Script - Anti-Fraud Platform (Windows)
REM =============================================================================
REM One-command deployment for local development

echo 🚀 Quick Deploy - Anti-Fraud Platform
echo =====================================
echo.

REM Check if services are already running
curl -s http://localhost:8082/health >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠️  Services are already running!
    echo.
    echo Options:
    echo   1. Stop and restart: npm run restart
    echo   2. Just stop: npm run kill:all
    echo   3. Check status: npm run health
    echo.
    exit /b 0
)

echo 📦 Installing dependencies...
npm run install:all >nul 2>&1

echo 🔧 Starting services...
start /b npm run start:safe >nul 2>&1

echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Check if services started successfully
curl -s http://localhost:8082/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Services started successfully!
    echo.
    echo 🌐 Access URLs:
    echo    Frontend:    http://localhost:3000
    echo    API Gateway: http://localhost:8082
    echo.
    echo 🔧 Quick Commands:
    echo    Stop all:    npm run kill:all
    echo    Restart:     npm run restart
    echo    Health:      npm run health
) else (
    echo ⚠️  Services may still be starting...
    echo    Check status: npm run health
    echo    View logs: npm run logs
)

echo.
echo 🎉 Quick deployment completed!
