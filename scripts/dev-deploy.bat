@echo off
setlocal enabledelayedexpansion

REM =============================================================================
REM 🚀 Anti-Fraud Platform - Windows Development Deployment Script
REM Easy deployment and debugging for all services
REM =============================================================================

REM Colors for Windows (limited support)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "CYAN=[96m"
set "WHITE=[97m"
set "NC=[0m"

REM Configuration
set "PROJECT_ROOT=%~dp0.."
set "COMPOSE_FILE=docker-compose.microservices.yml"
set "ENV_FILE=.env"

REM Default values
set "COMMAND=start"
set "TARGET_SERVICE="
set "FORCE_BUILD=false"
set "NO_BUILD=false"
set "FOLLOW_LOGS=false"
set "FORCE_ACTION=false"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :end_parse
if /i "%~1"=="start" set "COMMAND=start" & shift & goto :parse_args
if /i "%~1"=="up" set "COMMAND=start" & shift & goto :parse_args
if /i "%~1"=="deploy" set "COMMAND=start" & shift & goto :parse_args
if /i "%~1"=="stop" set "COMMAND=stop" & shift & goto :parse_args
if /i "%~1"=="down" set "COMMAND=stop" & shift & goto :parse_args
if /i "%~1"=="restart" set "COMMAND=restart" & shift & goto :parse_args
if /i "%~1"=="rebuild" set "COMMAND=rebuild" & shift & goto :parse_args
if /i "%~1"=="logs" set "COMMAND=logs" & shift & goto :parse_args
if /i "%~1"=="status" set "COMMAND=status" & shift & goto :parse_args
if /i "%~1"=="ps" set "COMMAND=status" & shift & goto :parse_args
if /i "%~1"=="health" set "COMMAND=health" & shift & goto :parse_args
if /i "%~1"=="clean" set "COMMAND=clean" & shift & goto :parse_args
if /i "%~1"=="setup" set "COMMAND=setup" & shift & goto :parse_args
if /i "%~1"=="debug" set "COMMAND=debug" & shift & goto :parse_args
if /i "%~1"=="help" goto :show_usage
if /i "%~1"=="--help" goto :show_usage
if /i "%~1"=="-h" goto :show_usage
if /i "%~1"=="--service" set "TARGET_SERVICE=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--no-build" set "NO_BUILD=true" & shift & goto :parse_args
if /i "%~1"=="--force" set "FORCE_ACTION=true" & set "FORCE_BUILD=true" & shift & goto :parse_args
if /i "%~1"=="--follow" set "FOLLOW_LOGS=true" & shift & goto :parse_args
echo %RED%❌ Unknown option: %~1%NC%
goto :show_usage
:end_parse

REM Change to project root
cd /d "%PROJECT_ROOT%"

echo.
echo %WHITE%🚀 Anti-Fraud Platform Development Deployment%NC%
echo %WHITE%=============================================%NC%
echo %WHITE%Project Root:%NC% %PROJECT_ROOT%
echo %WHITE%Command:%NC% %COMMAND%
if not "%TARGET_SERVICE%"=="" echo %WHITE%Target Service:%NC% %TARGET_SERVICE%
echo.

REM Execute command
if /i "%COMMAND%"=="setup" goto :setup
if /i "%COMMAND%"=="start" goto :start
if /i "%COMMAND%"=="stop" goto :stop
if /i "%COMMAND%"=="restart" goto :restart
if /i "%COMMAND%"=="rebuild" goto :rebuild
if /i "%COMMAND%"=="logs" goto :logs
if /i "%COMMAND%"=="status" goto :status
if /i "%COMMAND%"=="health" goto :health
if /i "%COMMAND%"=="clean" goto :clean
if /i "%COMMAND%"=="debug" goto :debug

echo %RED%❌ Unknown command: %COMMAND%%NC%
goto :show_usage

:setup
echo %CYAN%⚙️ Setting up environment...%NC%
call :check_prerequisites
if errorlevel 1 exit /b 1
call :create_env_file
if errorlevel 1 exit /b 1
echo %GREEN%✅ Setup completed successfully%NC%
goto :end

:start
echo %CYAN%⚙️ Starting services...%NC%
call :check_prerequisites
if errorlevel 1 exit /b 1

if "%NO_BUILD%"=="false" (
    echo %BLUE%ℹ️ Building services...%NC%
    if not "%TARGET_SERVICE%"=="" (
        docker-compose -f %COMPOSE_FILE% build %TARGET_SERVICE%
    ) else (
        docker-compose -f %COMPOSE_FILE% build
    )
)

echo %BLUE%ℹ️ Starting services...%NC%
if not "%TARGET_SERVICE%"=="" (
    docker-compose -f %COMPOSE_FILE% up -d %TARGET_SERVICE%
) else (
    docker-compose -f %COMPOSE_FILE% up -d
)

echo %GREEN%✅ Services started successfully%NC%
call :show_urls
goto :end

:stop
echo %CYAN%⚙️ Stopping services...%NC%
if not "%TARGET_SERVICE%"=="" (
    docker-compose -f %COMPOSE_FILE% stop %TARGET_SERVICE%
) else (
    docker-compose -f %COMPOSE_FILE% down
)
echo %GREEN%✅ Services stopped successfully%NC%
goto :end

:restart
echo %CYAN%⚙️ Restarting services...%NC%
if not "%TARGET_SERVICE%"=="" (
    docker-compose -f %COMPOSE_FILE% restart %TARGET_SERVICE%
) else (
    docker-compose -f %COMPOSE_FILE% restart
)
echo %GREEN%✅ Services restarted successfully%NC%
goto :end

:rebuild
echo %CYAN%⚙️ Rebuilding and starting services...%NC%
call :check_prerequisites
if errorlevel 1 exit /b 1

if not "%TARGET_SERVICE%"=="" (
    docker-compose -f %COMPOSE_FILE% build %TARGET_SERVICE%
    docker-compose -f %COMPOSE_FILE% up -d %TARGET_SERVICE%
) else (
    docker-compose -f %COMPOSE_FILE% build
    docker-compose -f %COMPOSE_FILE% up -d
)
echo %GREEN%✅ Services rebuilt and started successfully%NC%
call :show_urls
goto :end

:logs
echo %CYAN%⚙️ Showing logs...%NC%
if "%FOLLOW_LOGS%"=="true" (
    if not "%TARGET_SERVICE%"=="" (
        docker-compose -f %COMPOSE_FILE% logs -f %TARGET_SERVICE%
    ) else (
        docker-compose -f %COMPOSE_FILE% logs -f
    )
) else (
    if not "%TARGET_SERVICE%"=="" (
        docker-compose -f %COMPOSE_FILE% logs --tail=50 %TARGET_SERVICE%
    ) else (
        docker-compose -f %COMPOSE_FILE% logs --tail=20
    )
)
goto :end

:status
echo %CYAN%⚙️ Service status...%NC%
docker-compose -f %COMPOSE_FILE% ps
echo.
echo %WHITE%Resource Usage:%NC%
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
goto :end

:health
echo %CYAN%⚙️ Checking service health...%NC%
call :check_health
goto :end

:clean
echo %CYAN%⚙️ Cleaning up...%NC%
if "%FORCE_ACTION%"=="false" (
    set /p "confirm=This will remove all containers and images. Continue? (y/N): "
    if /i not "!confirm!"=="y" (
        echo %BLUE%ℹ️ Cleanup cancelled%NC%
        goto :end
    )
)
docker-compose -f %COMPOSE_FILE% down -v --remove-orphans
docker system prune -f
echo %GREEN%✅ Cleanup completed%NC%
goto :end

:debug
echo %CYAN%⚙️ Starting debug mode...%NC%
call :check_prerequisites
if errorlevel 1 exit /b 1
docker-compose -f %COMPOSE_FILE% up --build
goto :end

:check_prerequisites
echo %BLUE%ℹ️ Checking prerequisites...%NC%
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Docker is not installed or not in PATH%NC%
    exit /b 1
)
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Docker is not running. Please start Docker Desktop%NC%
    exit /b 1
)
echo %GREEN%✅ Docker is running%NC%
exit /b 0

:create_env_file
if exist "%ENV_FILE%" exit /b 0
echo %BLUE%ℹ️ Creating .env template file...%NC%
(
echo # Anti-Fraud Platform Environment Configuration
echo NODE_ENV=development
echo.
echo # Firebase Configuration - REQUIRED
echo FIREBASE_PROJECT_ID=your_firebase_project_id_here
echo FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
echo FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
echo.
echo # JWT Configuration - REQUIRED
echo JWT_SECRET=CHANGE_THIS_TO_A_STRONG_SECRET_KEY_AT_LEAST_32_CHARS
echo.
echo # API Keys - REQUIRED
echo GEMINI_API_KEY=your_gemini_api_key_here
echo VIRUSTOTAL_API_KEY=your_virustotal_api_key_here
echo SCAMADVISER_API_KEY=your_scamadviser_api_key_here
echo SCREENSHOTLAYER_API_KEY=your_screenshotlayer_api_key_here
echo NEWSAPI_API_KEY=your_newsapi_api_key_here
echo NEWSDATA_API_KEY=your_newsdata_api_key_here
echo.
echo # Service URLs
echo AUTH_SERVICE_URL=http://auth-service:3001
echo LINK_SERVICE_URL=http://link-service:3002
echo COMMUNITY_SERVICE_URL=http://community-service:3003
echo CHAT_SERVICE_URL=http://chat-service:3004
echo NEWS_SERVICE_URL=http://news-service:3005
echo ADMIN_SERVICE_URL=http://admin-service:3006
echo.
echo # CORS
echo ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
echo.
echo # React App Configuration - REQUIRED
echo REACT_APP_API_URL=http://localhost:8080
echo REACT_APP_FIREBASE_API_KEY=your_firebase_web_api_key_here
echo REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
echo REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id_here
) > "%ENV_FILE%"
echo %GREEN%✅ .env template created%NC%
echo %YELLOW%⚠️ Please update all placeholder values in .env before deployment%NC%
exit /b 1

:check_health
echo %WHITE%Checking service endpoints...%NC%
set "healthy=0"
set "total=7"

curl -s --max-time 5 http://localhost:8080/health >nul 2>&1 && (echo %GREEN%✅ API Gateway is healthy%NC% & set /a healthy+=1) || echo %RED%❌ API Gateway is not responding%NC%
curl -s --max-time 5 http://localhost:3001/health >nul 2>&1 && (echo %GREEN%✅ Auth Service is healthy%NC% & set /a healthy+=1) || echo %RED%❌ Auth Service is not responding%NC%
curl -s --max-time 5 http://localhost:3002/health >nul 2>&1 && (echo %GREEN%✅ Link Service is healthy%NC% & set /a healthy+=1) || echo %RED%❌ Link Service is not responding%NC%
curl -s --max-time 5 http://localhost:3003/health >nul 2>&1 && (echo %GREEN%✅ Community Service is healthy%NC% & set /a healthy+=1) || echo %RED%❌ Community Service is not responding%NC%
curl -s --max-time 5 http://localhost:3004/health >nul 2>&1 && (echo %GREEN%✅ Chat Service is healthy%NC% & set /a healthy+=1) || echo %RED%❌ Chat Service is not responding%NC%
curl -s --max-time 5 http://localhost:3005/health >nul 2>&1 && (echo %GREEN%✅ News Service is healthy%NC% & set /a healthy+=1) || echo %RED%❌ News Service is not responding%NC%
curl -s --max-time 5 http://localhost:3006/health >nul 2>&1 && (echo %GREEN%✅ Admin Service is healthy%NC% & set /a healthy+=1) || echo %RED%❌ Admin Service is not responding%NC%

echo.
echo %WHITE%Health Summary: %healthy%/%total% services are healthy%NC%
exit /b 0

:show_urls
echo.
echo %WHITE%📊 Service URLs:%NC%
echo   %GREEN%Frontend Application:%NC%     http://localhost:3000
echo   %GREEN%API Gateway:%NC%              http://localhost:8080
echo   %GREEN%Admin Panel:%NC%              http://localhost:3006
echo.
echo %WHITE%📊 Monitoring:%NC%
echo   %CYAN%Prometheus:%NC%                http://localhost:9090
echo   %CYAN%Grafana:%NC%                   http://localhost:3007 (admin/admin)
echo   %CYAN%Jaeger Tracing:%NC%            http://localhost:16686
echo.
echo %WHITE%📋 Quick Commands:%NC%
echo   docker-compose -f %COMPOSE_FILE% logs -f [service]  # Follow logs
echo   docker-compose -f %COMPOSE_FILE% restart [service]  # Restart service
echo   %~nx0 health                                         # Check health
exit /b 0

:show_usage
echo.
echo %WHITE%Usage: %~nx0 [COMMAND] [OPTIONS]%NC%
echo.
echo %CYAN%Commands:%NC%
echo   start, up, deploy    - Start all services (default)
echo   stop, down          - Stop all services
echo   restart             - Restart all services
echo   rebuild             - Force rebuild and start
echo   logs               - Show logs for all services
echo   status, ps         - Show service status
echo   health             - Check service health
echo   clean              - Clean up containers and images
echo   setup              - Initial setup and environment check
echo   debug              - Debug mode with detailed logging
echo   help               - Show this help message
echo.
echo %CYAN%Options:%NC%
echo   --service ^<name^>   - Target specific service
echo   --no-build         - Skip building (use existing images)
echo   --force            - Force action without confirmation
echo   --follow           - Follow logs (for logs command)
echo.
echo %CYAN%Examples:%NC%
echo   %~nx0 start                    # Start all services
echo   %~nx0 logs --service auth      # Show auth service logs
echo   %~nx0 restart --service api    # Restart API gateway
echo   %~nx0 rebuild --force          # Force rebuild all services
echo   %~nx0 debug                    # Start in debug mode
exit /b 0

:end
echo.
echo %GREEN%✅ Operation completed successfully!%NC%
pause
