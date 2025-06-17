@echo off
REM =============================================================================
REM 🐳 Docker Deployment Script for Windows
REM =============================================================================
REM This script deploys the Anti-Fraud Platform using Docker Compose on Windows

setlocal enabledelayedexpansion

echo 🐳 Anti-Fraud Platform - Docker Deployment (Windows)
echo ===================================================
echo.

REM Check if Docker is installed
echo [INFO] Checking prerequisites...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

for /f "tokens=3" %%i in ('docker --version') do set DOCKER_VERSION=%%i
echo [SUCCESS] Docker version %DOCKER_VERSION% is available

REM Check if Docker daemon is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker daemon is not running. Please start Docker Desktop
    pause
    exit /b 1
)

echo [SUCCESS] Docker daemon is running

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=3" %%i in ('docker-compose --version') do set COMPOSE_VERSION=%%i
    echo [SUCCESS] Docker Compose version %COMPOSE_VERSION% is available
    set COMPOSE_CMD=docker-compose
) else (
    docker compose version >nul 2>&1
    if not errorlevel 1 (
        for /f "tokens=3" %%i in ('docker compose version') do set COMPOSE_VERSION=%%i
        echo [SUCCESS] Docker Compose (plugin) version %COMPOSE_VERSION% is available
        set COMPOSE_CMD=docker compose
    ) else (
        echo [ERROR] Docker Compose is not installed
        pause
        exit /b 1
    )
)

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

REM Create .env file for Docker if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env file for Docker deployment...
    (
        echo # =============================================================================
        echo # Anti-Fraud Platform - Docker Deployment Configuration
        echo # =============================================================================
        echo.
        echo # Environment
        echo NODE_ENV=production
        echo.
        echo # Service URLs ^(Docker Internal Network^)
        echo AUTH_SERVICE_URL=http://auth-service:3001
        echo LINK_SERVICE_URL=http://link-service:3002
        echo COMMUNITY_SERVICE_URL=http://community-service:3003
        echo CHAT_SERVICE_URL=http://chat-service:3004
        echo NEWS_SERVICE_URL=http://news-service:3005
        echo ADMIN_SERVICE_URL=http://admin-service:3006
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
        echo NEWSDATA_API_KEY=your-newsdata-api-key
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
    echo [SUCCESS] .env file created for Docker deployment
    echo [WARNING] Please edit .env file with your Firebase credentials and API keys
) else (
    echo [SUCCESS] .env file already exists
)

REM Clean up old containers
echo [INFO] Cleaning up old containers and images...
%COMPOSE_CMD% down --remove-orphans >nul 2>&1
if exist "docker-compose.microservices.yml" (
    %COMPOSE_CMD% -f docker-compose.microservices.yml down --remove-orphans >nul 2>&1
)
docker image prune -f >nul 2>&1

echo [SUCCESS] Docker cleanup completed

REM Build and start services
echo [INFO] Building and starting Docker containers...
echo [WARNING] This may take several minutes on first run...

if exist "docker-compose.yml" (
    %COMPOSE_CMD% up --build -d
) else if exist "docker-compose.microservices.yml" (
    %COMPOSE_CMD% -f docker-compose.microservices.yml up --build -d
) else (
    echo [ERROR] No docker-compose.yml file found
    pause
    exit /b 1
)

if errorlevel 1 (
    echo [ERROR] Failed to start Docker containers
    pause
    exit /b 1
)

REM Wait for services to start
echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service health
echo [INFO] Checking service health...

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
echo [SUCCESS] 🎉 Docker deployment completed!
echo.
echo 📋 Service URLs:
echo    Frontend:      http://localhost:3000
echo    API Gateway:   http://localhost:8082
echo    Redis:         http://localhost:6379
echo.
echo 📝 Next Steps:
echo    1. Configure Firebase credentials in .env file
echo    2. Visit http://localhost:3000 to access the application
echo    3. Check service logs: %COMPOSE_CMD% logs -f
echo    4. Stop services: scripts\stop-docker.bat
echo.
echo 🔧 Troubleshooting:
echo    - View logs: %COMPOSE_CMD% logs [service-name]
echo    - Restart service: %COMPOSE_CMD% restart [service-name]
echo    - Check containers: docker ps
echo    - Check service health: curl http://localhost:8082/services/status
echo.

pause
