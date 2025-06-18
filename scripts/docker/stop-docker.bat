@echo off
REM =============================================================================
REM 🛑 Stop Docker Services Script for Windows
REM =============================================================================
REM This script stops all Docker containers for the Anti-Fraud Platform

echo 🛑 Stopping Anti-Fraud Platform Docker Services (Windows)
echo ========================================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    pause
    exit /b 1
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

echo [INFO] Stopping Docker containers...

REM Determine which Docker Compose command to use
docker-compose --version >nul 2>&1
if not errorlevel 1 (
    set COMPOSE_CMD=docker-compose
) else (
    docker compose version >nul 2>&1
    if not errorlevel 1 (
        set COMPOSE_CMD=docker compose
    ) else (
        echo [ERROR] Docker Compose is not available
        goto manual_stop
    )
)

REM Stop containers using docker-compose
if exist "docker-compose.yml" (
    %COMPOSE_CMD% down --remove-orphans
) else if exist "docker-compose.microservices.yml" (
    %COMPOSE_CMD% -f docker-compose.microservices.yml down --remove-orphans
) else (
    echo [WARNING] No docker-compose.yml file found
    goto manual_stop
)

goto cleanup

:manual_stop
echo [INFO] Attempting to stop containers manually...

REM Get container IDs for our services and stop them
for /f %%i in ('docker ps -q --filter "name=backup_" 2^>nul') do (
    docker stop %%i
    docker rm %%i
)

if not errorlevel 1 (
    echo [SUCCESS] Stopped containers manually
) else (
    echo [WARNING] No running containers found
)

:cleanup
echo [INFO] Performing additional cleanup...

REM Remove any dangling containers
for /f %%i in ('docker ps -aq --filter "status=exited" 2^>nul') do (
    docker rm %%i >nul 2>&1
)

REM Show remaining containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>nul | find /v "CONTAINER" >nul
if not errorlevel 1 (
    echo [WARNING] Some containers are still running:
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
)

echo.
echo [SUCCESS] 🎉 Docker services stopped successfully!
echo.
echo [INFO] To start services again, run:
echo    scripts\deploy-docker.bat
echo.
echo [INFO] To remove all images and volumes (complete cleanup):
echo    docker system prune -a --volumes
echo.

pause
