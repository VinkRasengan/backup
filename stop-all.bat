@echo off
REM Enhanced Stop All Services - Windows Batch Script
REM This script provides multiple stop options for Windows users

echo.
echo ===============================================
echo   Enhanced Stop All Services - Windows
echo ===============================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo Choose stop method:
echo.
echo 1. Normal Stop (Recommended)
echo 2. Force Stop (Aggressive - kills all processes and terminals)
echo 3. Quick Port Kill (Just kill processes on ports)
echo 4. Emergency Stop (Nuclear option)
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto normal_stop
if "%choice%"=="2" goto force_stop  
if "%choice%"=="3" goto port_kill
if "%choice%"=="4" goto emergency_stop

echo Invalid choice. Using normal stop...
goto normal_stop

:normal_stop
echo.
echo Running normal stop (enhanced)...
node scripts/stop-all.js
goto end

:force_stop
echo.
echo Running force stop (aggressive)...
echo WARNING: This will forcefully kill ALL related processes and terminals!
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    node scripts/stop-windows-force.js
) else (
    echo Force stop cancelled.
    goto normal_stop
)
goto end

:port_kill
echo.
echo Killing processes on common ports...
echo Killing processes on port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F /T 2>nul

echo Killing processes on port 8080 (API Gateway)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080') do taskkill /PID %%a /F /T 2>nul

echo Killing processes on port 3001 (Auth Service)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F /T 2>nul

echo Killing processes on port 3002 (Link Service)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do taskkill /PID %%a /F /T 2>nul

echo Killing processes on port 3003 (Community Service)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3003') do taskkill /PID %%a /F /T 2>nul

echo Killing processes on port 3004 (Chat Service)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004') do taskkill /PID %%a /F /T 2>nul

echo Killing processes on port 3005 (News Service)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005') do taskkill /PID %%a /F /T 2>nul

echo Killing processes on port 3006 (Admin Service)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3006') do taskkill /PID %%a /F /T 2>nul

echo Port cleanup completed.
goto end

:emergency_stop
echo.
echo EMERGENCY STOP - NUCLEAR OPTION!
echo This will kill ALL Node.js processes and close ALL cmd windows!
set /p confirm="Are you ABSOLUTELY sure? (type YES): "
if "%confirm%"=="YES" (
    echo.
    echo Executing emergency stop...
    
    REM Kill all Node.js processes
    taskkill /F /IM node.exe 2>nul
    taskkill /F /IM npm.exe 2>nul
    taskkill /F /IM npx.exe 2>nul
    taskkill /F /IM nodemon.exe 2>nul
    
    REM Close service-related cmd windows
    taskkill /F /FI "WINDOWTITLE eq *Service*" 2>nul
    taskkill /F /FI "WINDOWTITLE eq *Gateway*" 2>nul
    taskkill /F /FI "WINDOWTITLE eq *Frontend*" 2>nul
    taskkill /F /FI "WINDOWTITLE eq *npm*" 2>nul
    
    echo Emergency stop completed!
) else (
    echo Emergency stop cancelled.
    goto normal_stop
)
goto end

:end
echo.
echo ===============================================
echo Stop operation completed!
echo.
echo You can now restart with:
echo   npm start          (Fast separate mode)
echo   npm run start      (Same as above)
echo   start-all.bat      (If you have the start batch file)
echo.
echo Or check status with:
echo   npm run status
echo ===============================================
echo.
pause
