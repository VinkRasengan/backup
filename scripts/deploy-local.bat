@echo off
REM =============================================================================
REM 🚀 Local Deployment Script for Windows (No Docker)
REM =============================================================================
REM This script deploys the Anti-Fraud Platform locally without Docker on Windows

setlocal enabledelayedexpansion

echo 🚀 Anti-Fraud Platform - Local Deployment (Windows)
echo =====================================================
echo.

REM Check if Node.js is installed
echo [INFO] Checking prerequisites...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js version %NODE_VERSION% is available

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm
    pause
    exit /b 1
)

for /f %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm version %NPM_VERSION% is available

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "services" (
    echo [ERROR] services directory not found. Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "client" (
    echo [ERROR] client directory not found. Please run this script from the project root directory
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env file from template...
    (
        echo # =============================================================================
        echo # Anti-Fraud Platform - Local Development Configuration
        echo # =============================================================================
        echo.
        echo # Environment
        echo NODE_ENV=development
        echo.
        echo # Service URLs ^(Local Development^)
        echo AUTH_SERVICE_URL=http://localhost:3001
        echo LINK_SERVICE_URL=http://localhost:3002
        echo COMMUNITY_SERVICE_URL=http://localhost:3003
        echo CHAT_SERVICE_URL=http://localhost:3004
        echo NEWS_SERVICE_URL=http://localhost:3005
        echo ADMIN_SERVICE_URL=http://localhost:3006
        echo.
        echo # CORS Configuration
        echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8082
        echo.
        echo # Firebase Configuration ^(Required^)
        echo FIREBASE_PROJECT_ID=factcheck-1d6e8
        echo FIREBASE_CLIENT_EMAIL=your-client-email@factcheck-1d6e8.iam.gserviceaccount.com
        echo FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
        echo JWT_EXPIRE=7d
        echo.
        echo # API Keys ^(Optional - will use mock data if not provided^)
        echo GEMINI_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
        echo VIRUSTOTAL_API_KEY=your-virustotal-api-key
        echo SCAMADVISER_API_KEY=your-scamadviser-api-key
        echo SCREENSHOTLAYER_API_KEY=your-screenshotlayer-api-key
        echo NEWSAPI_API_KEY=your-newsapi-api-key
        echo.
        echo # React App Configuration
        echo REACT_APP_API_URL=http://localhost:8082
        echo REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
        echo REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
        echo REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
        echo.
        echo # Database Configuration
        echo USE_FIREBASE_EMULATOR=false
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo RATE_LIMIT_WINDOW_MS=900000
        echo.
        echo # Logging
        echo LOG_LEVEL=info
    ) > .env
    echo [SUCCESS] .env file created. Please edit it with your configuration.
    echo [WARNING] You need to configure Firebase credentials in .env file before starting services.
) else (
    echo [SUCCESS] .env file already exists
)

REM Check for occupied ports
echo [INFO] Checking port availability...
set PORTS=3000 3001 3002 3003 3004 3005 3006 8082
set OCCUPIED_PORTS=

for %%p in (%PORTS%) do (
    netstat -an | find ":%%p " >nul 2>&1
    if not errorlevel 1 (
        set OCCUPIED_PORTS=!OCCUPIED_PORTS! %%p
    )
)

if not "!OCCUPIED_PORTS!"=="" (
    echo [WARNING] The following ports are occupied:!OCCUPIED_PORTS!
    echo.
    set /p KILL_PORTS="Do you want to kill processes on these ports? (y/N): "
    if /i "!KILL_PORTS!"=="y" (
        for %%p in (!OCCUPIED_PORTS!) do (
            echo [INFO] Attempting to free port %%p...
            for /f "tokens=5" %%a in ('netstat -ano ^| find ":%%p "') do (
                taskkill /PID %%a /F >nul 2>&1
            )
            echo [SUCCESS] Killed process on port %%p
        )
    ) else (
        echo [ERROR] Cannot proceed with occupied ports. Please free them manually.
        pause
        exit /b 1
    )
)

REM Install dependencies
echo [INFO] Installing dependencies...
call npm run install:all
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [SUCCESS] All dependencies installed successfully

REM Start services
echo [INFO] Starting all services...
echo [WARNING] This will start all services in the background.
echo [WARNING] Use 'scripts\stop-local.bat' to stop all services.
echo.

REM Start services in background
start /b npm run start

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 15 /nobreak >nul

REM Check if services are running
echo [INFO] Checking service health...

REM Try to check API Gateway health
curl -s http://localhost:8082/health >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] API Gateway is running on http://localhost:8082
) else (
    echo [WARNING] API Gateway health check failed, but services may still be starting...
)

curl -s http://localhost:3000 >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Frontend is running on http://localhost:3000
) else (
    echo [WARNING] Frontend health check failed, but it may still be starting...
)

echo.
echo [SUCCESS] 🎉 Local deployment completed!
echo.
echo 📋 Service URLs:
echo    Frontend:      http://localhost:3000
echo    API Gateway:   http://localhost:8082
echo    Auth Service:  http://localhost:3001
echo    Link Service:  http://localhost:3002
echo    Community:     http://localhost:3003
echo    Chat Service:  http://localhost:3004
echo    News Service:  http://localhost:3005
echo    Admin Service: http://localhost:3006
echo.
echo 📝 Next Steps:
echo    1. Configure Firebase credentials in .env file
echo    2. Visit http://localhost:3000 to access the application
echo    3. Check service logs if any issues occur
echo    4. Use 'scripts\stop-local.bat' to stop all services
echo.
echo 🔧 Troubleshooting:
echo    - Check service health: curl http://localhost:8082/services/status
echo    - View logs in the console windows that opened
echo.

pause
