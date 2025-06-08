@echo off
echo === Testing FactCheck Chat Endpoints ===

echo.
echo 1. Testing Health Endpoint...
curl -s "http://localhost:5000/health"

echo.
echo.
echo 2. Testing Chat Test Endpoint...
curl -s "http://localhost:5000/api/chat/test"

echo.
echo.
echo 3. Testing OpenAI Test Endpoint...
curl -s "http://localhost:5000/api/chat/test-openai"

echo.
echo.
echo 4. Testing Widget Chat Endpoint...
curl -s -X POST "http://localhost:5000/api/chat/widget" -H "Content-Type: application/json" -d "{\"message\":\"Hello, can you help me fact-check something?\"}"

echo.
echo.
echo 5. Testing OpenAI Chat Endpoint...
curl -s -X POST "http://localhost:5000/api/chat/openai" -H "Content-Type: application/json" -d "{\"message\":\"Hello OpenAI\"}"

echo.
echo.
echo === Testing Complete ===
pause
