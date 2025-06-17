@echo off
REM =============================================================================
REM 🔧 Docker Fix Script - Khắc phục Docker Engine stopped
REM =============================================================================

echo Docker Fix Script
echo ===================
echo.

echo Checking Docker status...
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Docker is running normally!
    docker info | findstr "Server Version"
    echo.
    echo [INFO] No fix needed.
    pause
    exit /b 0
)

echo [ERROR] Docker Engine stopped - Starting fix process...
echo.

REM Step 1: Stop all Docker processes
echo Step 1: Stopping all Docker processes...
taskkill /f /im "Docker Desktop.exe" >nul 2>&1
taskkill /f /im "dockerd.exe" >nul 2>&1
taskkill /f /im "com.docker.backend.exe" >nul 2>&1
taskkill /f /im "com.docker.vpnkit.exe" >nul 2>&1
taskkill /f /im "vpnkit.exe" >nul 2>&1
echo [SUCCESS] Docker processes stopped

REM Step 2: Remove lock files
echo.
echo Step 2: Removing lock files...
del "%APPDATA%\Docker\*.lock" >nul 2>&1
del "%APPDATA%\Docker Desktop\*.lock" >nul 2>&1
echo [SUCCESS] Lock files removed

REM Step 3: Start Docker Desktop
echo.
echo Step 3: Starting Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if %errorlevel% neq 0 (
    echo [ERROR] Cannot start Docker Desktop automatically
    echo [INFO] Please start Docker Desktop manually from Start Menu
    pause
    exit /b 1
)

echo [SUCCESS] Docker Desktop started

REM Step 4: Wait for Docker to start
echo.
echo Step 4: Waiting for Docker to start (may take 1-2 minutes)...
echo [INFO] Please wait...

set /a count=0
:wait_loop
timeout /t 10 >nul
docker info >nul 2>&1
if %errorlevel% equ 0 goto docker_ready

set /a count+=1
if %count% geq 12 (
    echo [WARNING] Docker is taking too long to start
    echo.
    echo Manual troubleshooting steps:
    echo    1. Open Docker Desktop from Start Menu
    echo    2. Wait for Docker to start completely
    echo    3. Check system tray for Docker icon
    echo    4. If still failing, restart computer
    echo.
    pause
    exit /b 1
)

echo [INFO] Still waiting... (^%count^%/12)
goto wait_loop

:docker_ready
echo.
echo [SUCCESS] Docker started successfully!
docker info | findstr "Server Version"
echo.
echo Available commands:
echo    npm run docker:up
echo    npm run deploy:docker
echo.
pause
