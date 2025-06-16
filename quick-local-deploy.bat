@echo off
setlocal enabledelayedexpansion

echo 🚀 SUPER QUICK LOCAL DEPLOY
echo ==========================

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js found

REM Install concurrently globally if not exists
npm list -g concurrently >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing concurrently...
    npm install -g concurrently
)

echo 📦 Installing all dependencies...

REM Install dependencies in parallel
start /B cmd /c "cd client && npm install --silent"
start /B cmd /c "cd services\api-gateway && npm install --silent"
start /B cmd /c "cd services\auth-service && npm install --silent"
start /B cmd /c "cd services\link-service && npm install --silent"
start /B cmd /c "cd services\community-service && npm install --silent"
start /B cmd /c "cd services\chat-service && npm install --silent"
start /B cmd /c "cd services\news-service && npm install --silent"
start /B cmd /c "cd services\admin-service && npm install --silent"

REM Wait a bit for installs to complete
timeout /t 30 /nobreak >nul

echo ✅ Dependencies installed!

REM Check .env
if not exist ".env" (
    echo ⚠️  .env file not found. Using existing configuration...
)

echo 🚀 Starting all services...

REM Start all services with concurrently
npx concurrently ^
  -n "🌐frontend,🚪gateway,🔐auth,🔗link,👥community,💬chat,📰news,⚙️admin" ^
  -c "bgBlack,bgBlue,bgGreen,bgYellow,bgMagenta,bgCyan,bgRed,bgWhite" ^
  "cd client && npm start" ^
  "cd services/api-gateway && npm run dev" ^
  "cd services/auth-service && npm run dev" ^
  "cd services/link-service && npm run dev" ^
  "cd services/community-service && npm run dev" ^
  "cd services/chat-service && npm run dev" ^
  "cd services/news-service && npm run dev" ^
  "cd services/admin-service && npm run dev"

pause
