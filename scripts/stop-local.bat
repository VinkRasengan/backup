@echo off
REM =============================================================================
REM 🛑 Stop Local Services Script for Windows
REM =============================================================================
REM This script stops all locally running services on Windows

echo 🛑 Stopping Anti-Fraud Platform Services (Windows)
echo =================================================
echo.

echo [INFO] Stopping all Node.js processes...

REM Kill Node.js processes
taskkill /F /IM node.exe >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Stopped Node.js processes
) else (
    echo [INFO] No Node.js processes were running
)

REM Kill npm processes
taskkill /F /IM npm.cmd >nul 2>&1
if not errorlevel 1 (
    echo [SUCCESS] Stopped npm processes
) else (
    echo [INFO] No npm processes were running
)

REM Wait a moment
timeout /t 2 /nobreak >nul

echo [INFO] Stopping services on specific ports...

REM Define ports and services
set PORTS=3000 3001 3002 3003 3004 3005 3006 8082
set SERVICE_3000=Frontend
set SERVICE_3001=Auth Service
set SERVICE_3002=Link Service
set SERVICE_3003=Community Service
set SERVICE_3004=Chat Service
set SERVICE_3005=News Service
set SERVICE_3006=Admin Service
set SERVICE_8082=API Gateway

REM Stop processes on each port
for %%p in (%PORTS%) do (
    call :kill_port %%p !SERVICE_%%p!
)

echo.
echo [SUCCESS] 🎉 All services stopped successfully!
echo.
echo [INFO] To start services again, run:
echo    scripts\deploy-local.bat
echo    or
echo    npm start
echo.

pause
exit /b 0

:kill_port
set port=%1
set service_name=%2

REM Find and kill process on port
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find ":%port% "') do (
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 (
        echo [SUCCESS] Stopped %service_name% ^(port %port%^)
        goto :eof
    )
)

echo [WARNING] %service_name% ^(port %port%^) was not running
goto :eof
