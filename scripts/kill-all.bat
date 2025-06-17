@echo off
echo ========================================
echo  🛑 Kill All Services - Anti-Fraud Platform
echo ========================================
echo.

echo [1/5] Killing processes on specific ports...

REM Core Services
for %%p in (3000 3001 3002 3003 3004 3005 3006 3007 3008 8082) do (
    call :kill_port %%p
)

REM Monitoring Services  
for %%p in (3010 5001 6379 8081 9090 9093 9100 9121) do (
    call :kill_port %%p
)

REM Development ports
for %%p in (3009 3011 3012 8080 8000 8001) do (
    call :kill_port %%p
)

echo.
echo [2/5] Killing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodejs.exe >nul 2>&1
if not errorlevel 1 (
    echo ✅ Killed Node.js processes
) else (
    echo ℹ️  No Node.js processes found
)

echo.
echo [3/5] Killing npm processes...
taskkill /f /im npm.cmd >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
if not errorlevel 1 (
    echo ✅ Killed npm processes
) else (
    echo ℹ️  No npm processes found
)

echo.
echo [4/5] Stopping Docker containers...
docker-compose -f docker-compose.monitoring.yml down >nul 2>&1
if not errorlevel 1 (
    echo ✅ Stopped monitoring containers
) else (
    echo ℹ️  No monitoring containers running
)

docker-compose -f docker-compose.microservices.yml down >nul 2>&1
if not errorlevel 1 (
    echo ✅ Stopped microservices containers
) else (
    echo ℹ️  No microservices containers running
)

docker-compose -f docker-compose.dev.yml down >nul 2>&1
if not errorlevel 1 (
    echo ✅ Stopped dev containers
) else (
    echo ℹ️  No dev containers running
)

echo.
echo [5/5] Final cleanup...
timeout /t 2 /nobreak >nul

REM Final aggressive cleanup
taskkill /f /fi "IMAGENAME eq node.exe" >nul 2>&1
taskkill /f /fi "IMAGENAME eq npm.cmd" >nul 2>&1
echo ✅ Final cleanup completed

echo.
echo 🎉 All Services Killed Successfully!
echo ====================================
echo.
echo 🚀 To start services again:
echo    npm run start:full
echo    npm run start:safe
echo    npm run monitoring:start
echo.

pause
exit /b 0

:kill_port
set port=%1

REM Find and kill process on port
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find ":%port% "') do (
    taskkill /PID %%a /F >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Killed process on port %port%
        goto :eof
    )
)

echo ⚪ Port %port% - not running
goto :eof
