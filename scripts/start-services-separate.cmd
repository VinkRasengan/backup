@echo off
echo 🚀 Starting all services + frontend in separate windows...

echo Starting API Gateway...
start "API Gateway - Port 8080" cmd /k "cd /d %~dp0..\services\api-gateway && npm start"
timeout /t 2 /nobreak >nul

echo Starting Auth Service...
start "Auth Service - Port 3001" cmd /k "cd /d %~dp0..\services\auth-service && npm start"
timeout /t 2 /nobreak >nul

echo Starting Link Service...
start "Link Service - Port 3002" cmd /k "cd /d %~dp0..\services\link-service && npm start"
timeout /t 2 /nobreak >nul

echo Starting Community Service...
start "Community Service - Port 3003" cmd /k "cd /d %~dp0..\services\community-service && npm start"
timeout /t 2 /nobreak >nul

echo Starting Chat Service...
start "Chat Service - Port 3004" cmd /k "cd /d %~dp0..\services\chat-service && npm start"
timeout /t 2 /nobreak >nul

echo Starting News Service...
start "News Service - Port 3005" cmd /k "cd /d %~dp0..\services\news-service && npm start"
timeout /t 2 /nobreak >nul

echo Starting Admin Service...
start "Admin Service - Port 3006" cmd /k "cd /d %~dp0..\services\admin-service && npm start"
timeout /t 2 /nobreak >nul

echo Starting Frontend Client...
start "Frontend Client - Port 3000" cmd /k "cd /d %~dp0..\client && npm start"

echo ✅ All services + frontend started in separate windows!
echo 🌐 Main URLs:
echo   🎯 Frontend App:  http://localhost:3000
echo   🚪 API Gateway:   http://localhost:8080
echo   📊 Health Check:  http://localhost:8080/health
echo 🛑 To stop all services, use: npm run stop:separate
echo Press any key to exit...
pause >nul
