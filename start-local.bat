@echo off
echo 💻 Local Development Environment Setup
echo =====================================

echo.
echo 📋 Step 1: Check Node.js version
node --version
npm --version

echo.
echo 📋 Step 2: Install dependencies
echo Installing root dependencies...
call npm install

echo Installing server dependencies...
cd server
call npm install
cd ..

echo Installing client dependencies...
cd client
call npm install
cd ..

echo.
echo 📋 Step 3: Check environment configuration
if not exist ".env" (
    echo ⚠️ .env not found. Creating from template...
    copy ".env.example" ".env"
    echo ✅ Please edit .env with your credentials
    pause
)

if not exist "server\.env" (
    echo ⚠️ server\.env not found. Copying from root .env...
    copy ".env" "server\.env"
    echo ✅ Copied .env to server\.env
)

echo.
echo 📋 Step 4: Start development servers
echo 🚀 Starting backend server on port 5002...
echo 🚀 Starting frontend server on port 3001...
echo.
echo 🌐 Frontend: http://localhost:3001
echo 🌐 Backend: http://localhost:5002
echo 🌐 Health Check: http://localhost:5002/api/health
echo.
echo Press Ctrl+C to stop servers
echo.

start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd client && npm start"

echo.
echo 🎉 Development servers started!
echo Check the opened terminal windows for logs.
pause
