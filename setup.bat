@echo off
echo 🛠️  Setting up FactCheck development environment...

REM Check Node.js
echo [INFO] Checking Node.js version...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)
echo [SUCCESS] Node.js version: 
node --version

REM Check Firebase CLI
echo [INFO] Checking Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Firebase CLI not found. Installing...
    npm install -g firebase-tools
)
echo [SUCCESS] Firebase CLI installed

REM Setup environment files
echo [INFO] Setting up environment files...
if not exist "server\.env" (
    echo [INFO] Creating server .env file...
    copy "server\.env.example" "server\.env"
    echo [WARNING] Please update server\.env with your Firebase and email configuration
) else (
    echo [SUCCESS] Server .env file already exists
)

REM Install dependencies
echo [INFO] Installing dependencies...

echo [INFO] Installing server dependencies...
cd server
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Server dependencies installed
cd ..

echo [INFO] Installing client dependencies...
cd client
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install client dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Client dependencies installed
cd ..

echo [INFO] Installing functions dependencies...
cd functions
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install functions dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Functions dependencies installed
cd ..

REM Root dependencies
if exist "package.json" (
    echo [INFO] Installing root dependencies...
    npm install
)

echo.
echo [SUCCESS] ✅ Development environment setup completed!
echo.
echo [INFO] 🚀 To start development:
echo.
echo 1. Update your environment variables:
echo    - Edit server\.env with your Firebase credentials
echo    - Add your email service configuration
echo.
echo 2. Start the development servers:
echo    - Backend: cd server ^&^& npm run dev
echo    - Frontend: cd client ^&^& npm start
echo    - Firebase Emulators: firebase emulators:start
echo.
echo 3. Access the application:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo    - Firebase Emulator UI: http://localhost:4000
echo.
echo [INFO] 📚 For more information, check the README.md file
pause
