@echo off
echo ====================================
echo FactCheck Chat System Startup
echo ====================================
echo.

echo Step 1: Starting Backend Server...
echo.
start "FactCheck Backend" cmd /k "cd /d c:\Project\backup\server && echo Starting server... && node src\app.js"

echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak >nul

echo.
echo Step 2: Testing Server Connectivity...
echo.

echo Testing health endpoint...
curl -s http://localhost:5000/health
echo.

echo Testing chat test endpoint...
curl -s http://localhost:5000/api/chat/test
echo.

echo Testing widget chat...
curl -s -X POST -H "Content-Type: application/json" -d "{\"message\":\"Hello test\"}" http://localhost:5000/api/chat/widget
echo.

echo.
echo Step 3: Starting Frontend...
echo.
echo Opening frontend in new window...
start "FactCheck Frontend" cmd /k "cd /d c:\Project\backup\client && echo Starting React app... && npm start"

echo.
echo ====================================
echo Startup Complete!
echo ====================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Both servers should be running in separate windows.
echo Check the server windows for any error messages.
echo.
echo To test the chat:
echo 1. Wait for React app to open in browser
echo 2. Look for chat bot icon in bottom right
echo 3. Try sending a message
echo.
pause
