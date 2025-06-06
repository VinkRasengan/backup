@echo off
echo 🧹 FactCheck Codebase Cleanup Script
echo ====================================

echo.
echo 📋 Phase 1: Remove unused test files and components
echo.

echo Removing test files...
if exist "client\src\pages\TestRegisterPage.js" del "client\src\pages\TestRegisterPage.js"
if exist "client\src\pages\ChatTest.js" del "client\src\pages\ChatTest.js"
if exist "client\src\test-auth.js" del "client\src\test-auth.js"
if exist "client\src\test" rmdir /s /q "client\src\test"

echo Removing unused components...
if exist "client\src\components\ModernNavigation.js" del "client\src\components\ModernNavigation.js"
if exist "client\src\components\Navbar.js" del "client\src\components\Navbar.js"
if exist "client\src\pages\RegisterPage.js" del "client\src\pages\RegisterPage.js"

echo.
echo 📋 Phase 2: Remove unused authentication files
echo.

echo Removing duplicate auth middleware...
if exist "server\src\middleware\hybridAuth.js" del "server\src\middleware\hybridAuth.js"
if exist "server\src\routes\hybridAuth.js" del "server\src\routes\hybridAuth.js"
if exist "server\src\routes\firebaseBackend.js" del "server\src\routes\firebaseBackend.js"

echo.
echo 📋 Phase 3: Remove unused database files
echo.

echo Removing Sequelize files...
if exist "server\src\config\sequelize.js" del "server\src\config\sequelize.js"
if exist "server\src\models" rmdir /s /q "server\src\models"

echo.
echo 📋 Phase 4: Remove unused Firebase functions
echo.

echo Removing functions folder...
if exist "functions" rmdir /s /q "functions"

echo.
echo 📋 Phase 5: Remove unused scripts and documentation
echo.

echo Removing generated documentation...
if exist "*_GUIDE.md" del "*_GUIDE.md"
if exist "*_FIX.md" del "*_FIX.md"
if exist "test-*.js" del "test-*.js"

echo Removing deployment scripts...
if exist "deploy-*.sh" del "deploy-*.sh"
if exist "deploy-*.bat" del "deploy-*.bat"
if exist "setup-*.sh" del "setup-*.sh"
if exist "setup-*.bat" del "setup-*.bat"

echo.
echo 📋 Phase 6: Clean node_modules (optional)
echo.

set /p cleanup_modules="Clean node_modules? (y/n): "
if /i "%cleanup_modules%"=="y" (
    echo Cleaning node_modules...
    if exist "node_modules" rmdir /s /q "node_modules"
    if exist "client\node_modules" rmdir /s /q "client\node_modules"
    if exist "server\node_modules" rmdir /s /q "server\node_modules"
    
    echo Reinstalling dependencies...
    call npm install
    cd client && call npm install && cd ..
    cd server && call npm install && cd ..
)

echo.
echo ✅ Cleanup completed!
echo.
echo 📊 Summary of removed items:
echo - ❌ Test files and components
echo - ❌ Duplicate authentication systems  
echo - ❌ Unused Sequelize/PostgreSQL code
echo - ❌ Firebase Functions folder
echo - ❌ Generated documentation files
echo - ❌ Old deployment scripts
echo.
echo 🎯 Remaining clean architecture:
echo - ✅ Single auth system (pureAuth.js)
echo - ✅ Firestore database only
echo - ✅ Clean component structure
echo - ✅ Consolidated API services
echo.
echo 🚀 Ready for deployment!

pause
