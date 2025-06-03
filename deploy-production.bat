@echo off
echo ========================================
echo    FACTCHECK PRODUCTION DEPLOYMENT
echo ========================================

echo.
echo [1/5] Cleaning previous build...
cd client
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo [2/5] Installing dependencies...
call npm ci

echo.
echo [3/5] Building production...
call npm run build

echo.
echo [4/5] Deploying to Firebase...
cd ..
call firebase deploy --only hosting

echo.
echo [5/5] Opening production site...
start https://factcheck-1d6e8.web.app

echo.
echo ========================================
echo    DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Production URL: https://factcheck-1d6e8.web.app
echo.
echo Tips to see latest changes:
echo - Press Ctrl+F5 to force refresh
echo - Use Incognito mode
echo - Clear browser cache
echo ========================================

pause
