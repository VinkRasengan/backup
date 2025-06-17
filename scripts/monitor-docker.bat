@echo off
REM =============================================================================
REM 📊 Docker Monitor Script - Theo dõi trạng thái Docker
REM =============================================================================

echo Docker Monitor
echo ================
echo.

:monitor_loop
cls
echo Docker Monitor - %date% %time%
echo ========================================
echo.

REM Check Docker daemon
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Docker Engine: RUNNING
    docker info | findstr "Server Version"
    docker info | findstr "Total Memory"
    docker info | findstr "CPUs"
    echo.
    
    REM Check containers
    echo Running Containers:
    for /f "skip=1" %%i in ('docker ps --format "table {{.Names}}\t{{.Status}}" 2^>nul') do echo    %%i
    echo.
    
    REM Check images
    echo Available Images:
    for /f "skip=1" %%i in ('docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2^>nul') do echo    %%i
    
) else (
    echo [ERROR] Docker Engine: STOPPED
    echo.
    echo Options:
    echo    [1] Run fix-docker.bat to fix
    echo    [2] Open Docker Desktop manually
    echo    [3] Exit monitor
    echo.
)

echo.
echo Auto refresh in 30 seconds... (Ctrl+C to exit)
timeout /t 30 >nul
goto monitor_loop
