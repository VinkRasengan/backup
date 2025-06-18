@echo off
REM =============================================================================
REM 🐳 Docker Status Check Script
REM =============================================================================

echo Docker Status Check
echo ====================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed
    echo.
    echo To install Docker:
    echo    1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo    2. Install and restart your computer
    echo    3. Run this script again
    echo.
    exit /b 1
)

echo [SUCCESS] Docker is installed
docker --version

REM Check if Docker daemon is running
echo.
echo Checking Docker daemon...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running
    echo.
    echo To start Docker:
    echo    1. Open Docker Desktop application
    echo    2. Wait for Docker to start (may take 1-2 minutes)
    echo    3. Look for "Docker Desktop is running" in system tray
    echo    4. Run this script again
    echo.
    echo Alternative: Start Docker Desktop from Start Menu
    echo.
    
    REM Try to start Docker Desktop automatically
    echo Attempting to start Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Docker Desktop launch attempted
        echo [INFO] Please wait 1-2 minutes for Docker to start, then try again
    ) else (
        echo [WARNING] Could not auto-start Docker Desktop
        echo Please start it manually from the Start Menu
    )
    echo.
    exit /b 1
)

echo [SUCCESS] Docker daemon is running

REM Check Docker Compose
echo.
echo Checking Docker Compose...
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    docker-compose --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Docker Compose is not available
        echo Please reinstall Docker Desktop
        exit /b 1
    ) else (
        echo [SUCCESS] Docker Compose (standalone) is available
        docker-compose --version
    )
) else (
    echo [SUCCESS] Docker Compose (plugin) is available
    docker compose version
)

echo.
echo [SUCCESS] Docker is ready for deployment!
echo.
echo Next steps:
echo    npm run deploy:docker    - Deploy with Docker
echo    npm run docker:up        - Start containers
echo    npm run docker:down      - Stop containers
echo    npm run docker:logs      - View logs
