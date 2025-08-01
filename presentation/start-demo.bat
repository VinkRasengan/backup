@echo off
echo ========================================
echo   Hadoop & Spark Demo - FactCheck Platform
echo ========================================
echo.

echo 🚀 Starting Demo Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

echo ✅ npm version:
npm --version

echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
    echo.
)

REM Start the demo server
echo 🎮 Starting Demo Server...
echo.
echo 📊 Presentation will be available at: http://localhost:3000/demo
echo 🔧 API Base: http://localhost:3000/api
echo 💚 Health Check: http://localhost:3000/health
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

pause 