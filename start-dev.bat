@echo off
echo 🚀 Starting FactCheck development environment...

REM Check if .env exists
if not exist "server\.env" (
    echo [ERROR] Server .env file not found. Please run setup.bat first.
    pause
    exit /b 1
)

echo [INFO] Starting development servers...
echo.
echo [INFO] 🌐 Access URLs:
echo    Frontend:           http://localhost:3000
echo    Backend API:        http://localhost:5000
echo    Firebase Emulator:  http://localhost:4000
echo    Firestore:          http://localhost:8080
echo    Auth:               http://localhost:9099
echo.
echo [INFO] 📊 Health Checks:
echo    Backend Health:     http://localhost:5000/health
echo    Functions Health:   http://localhost:5001/factcheck-project/us-central1/healthCheck
echo.
echo [WARNING] Press Ctrl+C to stop all services
echo.

REM Start Firebase Emulators in background
echo [INFO] Starting Firebase Emulators...
start "Firebase Emulators" cmd /c "firebase emulators:start --only auth,firestore,functions,hosting"

REM Wait a bit for emulators to start
timeout /t 5 /nobreak >nul

REM Start Backend Server in background
echo [INFO] Starting Backend Server...
start "Backend Server" cmd /c "cd server && npm run dev"

REM Wait a bit for server to start
timeout /t 3 /nobreak >nul

REM Start Frontend (this will be the main window)
echo [INFO] Starting Frontend...
cd client
npm start

REM When frontend closes, this script ends
echo [INFO] Frontend closed. Development session ended.
pause
