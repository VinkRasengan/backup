@echo off
REM Quick test for chat layout on Windows

echo 🧪 Quick Chat Layout Test
echo ========================
echo.

REM Check if we're in the right directory
if not exist "client" (
    echo [ERROR] Please run this from the project root directory
    pause
    exit /b 1
)

echo [INFO] Starting React development server...
cd client

REM Start development server
start /b npm start

echo [INFO] Waiting for server to start...
timeout /t 15 /nobreak >nul

echo.
echo [SUCCESS] Development server should be starting!
echo.
echo 📋 Test Instructions:
echo    1. Open http://localhost:3000 in your browser
echo    2. Navigate to Chat tab
echo    3. Check for:
echo       ✅ No black space at bottom
echo       ✅ Full screen height
echo       ✅ Proper scrolling
echo       ✅ Messenger-like layout
echo.
echo Press any key to open browser...
pause >nul

REM Try to open browser
start http://localhost:3000/chat

echo.
echo Chat page should open automatically!
echo Press Ctrl+C in the other window to stop the server.
pause
