@echo off
REM =============================================================================
REM 🐳 Docker Deployment Script (Windows)
REM =============================================================================
REM This script deploys the Anti-Fraud Platform using Docker Compose on Windows

echo 🐳 Anti-Fraud Platform - Docker Deployment
echo ===========================================
echo.

REM Check if Docker is running
echo 📋 Checking prerequisites...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker daemon is not running
    echo Please start Docker Desktop and try again
    exit /b 1
)

echo ✅ Docker is running

REM Check Docker Compose
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    docker-compose --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Docker Compose is not available
        exit /b 1
    ) else (
        echo ✅ Docker Compose (standalone) is available
        set COMPOSE_CMD=docker-compose
    )
) else (
    echo ✅ Docker Compose (plugin) is available
    set COMPOSE_CMD=docker compose
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Please run this script from the project root directory
    exit /b 1
)

if not exist "services" (
    echo ❌ Services directory not found
    exit /b 1
)

if not exist "client" (
    echo ❌ Client directory not found
    exit /b 1
)

echo ✅ Project structure verified

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file for Docker deployment...
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
        echo # API Keys ^(Optional^)
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
    echo ✅ .env file created for Docker deployment
    echo ⚠️  Please edit .env file with your Firebase credentials and API keys
) else (
    echo ✅ .env file already exists
)

REM Clean up old containers
echo 🧹 Cleaning up old containers...
%COMPOSE_CMD% down --remove-orphans >nul 2>&1

REM Build and start services
echo 🔨 Building and starting Docker containers...
echo ⚠️  This may take several minutes on first run...
%COMPOSE_CMD% up --build -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker containers
    exit /b 1
)

REM Wait for services to start
echo ⏳ Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
curl -s http://localhost:8082/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ API Gateway is running on http://localhost:8082
) else (
    echo ⚠️  API Gateway health check failed, but services may still be starting...
)

curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is running on http://localhost:3000
) else (
    echo ⚠️  Frontend health check failed, but it may still be starting...
)

echo.
echo 🎉 Docker deployment completed!
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
echo    4. Stop services: npm run docker:down
echo.
echo 🔧 Troubleshooting:
echo    - View logs: %COMPOSE_CMD% logs [service-name]
echo    - Restart service: %COMPOSE_CMD% restart [service-name]
echo    - Check containers: docker ps
echo    - Check service health: curl http://localhost:8082/services/status
