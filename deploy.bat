@echo off
echo 🚀 Starting FactCheck deployment with Firebase Auth...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Firebase CLI is not installed. Please install it first:
    echo npm install -g firebase-tools
    echo firebase login
    pause
    exit /b 1
)

REM Check if logged in to Firebase
firebase projects:list >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not logged in to Firebase. Please run:
    echo firebase login
    pause
    exit /b 1
)

echo [SUCCESS] Firebase CLI is ready!

REM Check if .firebaserc exists
if not exist ".firebaserc" (
    echo [WARNING] .firebaserc not found. Please create it with your project ID.
    echo Example:
    echo {
    echo   "projects": {
    echo     "default": "your-project-id"
    echo   }
    echo }
    pause
)

REM Check if .env file exists for server (optional for Firebase Auth)
if not exist "server\.env" (
    echo [INFO] Server .env file not found. This is optional for Firebase Auth.
    echo [INFO] Create server\.env only if you need backend data sync.
)

REM Install server dependencies
echo [INFO] Installing server dependencies...
cd server
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install server dependencies
    pause
    exit /b 1
)
cd ..

REM Install client dependencies
echo [INFO] Installing client dependencies...
cd client
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install client dependencies
    pause
    exit /b 1
)

REM Build client for production
echo [INFO] Building client for production...
npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build client
    pause
    exit /b 1
)
cd ..

REM Install functions dependencies
echo [INFO] Installing functions dependencies...
cd functions
npm install
if errorlevel 1 (
    echo [ERROR] Failed to install functions dependencies
    pause
    exit /b 1
)
cd ..

REM Deploy to Firebase
echo [INFO] Deploying to Firebase...

REM Deploy Firestore rules and indexes
echo [INFO] Deploying Firestore rules and indexes...
firebase deploy --only firestore
if errorlevel 1 (
    echo [ERROR] Failed to deploy Firestore rules
    pause
    exit /b 1
)

REM Deploy Functions
echo [INFO] Deploying Cloud Functions...
firebase deploy --only functions
if errorlevel 1 (
    echo [ERROR] Failed to deploy functions
    pause
    exit /b 1
)

REM Deploy Hosting
echo [INFO] Deploying to Firebase Hosting...
firebase deploy --only hosting
if errorlevel 1 (
    echo [ERROR] Failed to deploy hosting
    pause
    exit /b 1
)

REM Deploy Data Connect (if configured)
if exist "dataconnect" (
    echo [INFO] Deploying Data Connect...
    firebase deploy --only dataconnect
)

echo [SUCCESS] 🎉 Deployment completed successfully!
echo [INFO] Your app should be available at your Firebase Hosting URL

REM Show deployment info
echo [INFO] Getting deployment info...
firebase hosting:channel:list

echo.
echo [SUCCESS] ✅ FactCheck with Firebase Auth has been deployed successfully!
echo.
echo [INFO] Next steps:
echo 1. Test authentication features (register/login/logout)
echo 2. Verify Firebase Auth is working in Firebase Console
echo 3. Test all features in the deployed environment
echo 4. Monitor logs: firebase functions:log
echo 5. Check hosting: firebase hosting:channel:list
echo.
echo [INFO] Firebase Auth features available:
echo - Email/Password authentication
echo - Automatic email verification
echo - Password reset
echo - Secure API authentication with Firebase ID tokens

pause
