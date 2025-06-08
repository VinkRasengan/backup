@echo off
echo === Final FactCheck Chat System Test ===
echo.

echo Checking if server is running on port 5000...
netstat -an | findstr :5000 > nul
if %errorlevel% equ 0 (
    echo ✅ Server is running on port 5000
) else (
    echo ❌ Server is NOT running on port 5000
    echo Please start the server first: cd server ^&^& node src\app.js
    pause
    exit /b 1
)

echo.
echo === Testing Backend Endpoints ===

echo.
echo 1. Health Check...
curl -s -w "Status: %%{http_code}\n" "http://localhost:5000/health"

echo.
echo 2. Chat Test...
curl -s -w "Status: %%{http_code}\n" "http://localhost:5000/api/chat/test"

echo.
echo 3. OpenAI Configuration Test...
curl -s -w "Status: %%{http_code}\n" "http://localhost:5000/api/chat/test-openai"

echo.
echo 4. Widget Chat Test...
curl -s -X POST -H "Content-Type: application/json" -d "{\"message\":\"Hello, test message\"}" -w "Status: %%{http_code}\n" "http://localhost:5000/api/chat/widget"

echo.
echo 5. OpenAI Chat Test...
curl -s -X POST -H "Content-Type: application/json" -d "{\"message\":\"Hello OpenAI\"}" -w "Status: %%{http_code}\n" "http://localhost:5000/api/chat/openai"

echo.
echo === Testing Complete ===
echo.
echo If you see Status: 200 for all tests, the backend is working correctly.
echo Next steps:
echo 1. Start React app: cd client ^&^& npm start
echo 2. Test chat functionality in browser
echo 3. Check browser console for any frontend errors
echo.
pause
