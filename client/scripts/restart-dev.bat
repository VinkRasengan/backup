@echo off
echo ========================================
echo  Restart Development Server
echo ========================================
echo.

echo [1/3] Killing existing development servers...
call "%~dp0kill-dev-servers.bat"

echo [2/3] Waiting for processes to terminate...
timeout /t 3 /nobreak >nul

echo [3/3] Starting fresh development server...
cd /d "%~dp0.."
npm start

echo.
echo ✅ Development server restarted successfully!
pause
