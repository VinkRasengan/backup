@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   FactCheck Platform - User Guide Converter
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo 📥 Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Pandoc is installed
pandoc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Pandoc is not installed or not in PATH
    echo 📥 Please install Pandoc from: https://pandoc.org/installing.html
    echo 💡 For Windows, you can also run: pandoc-installer.msi
    echo.
    echo 🔄 Attempting to install Pandoc using the installer...
    if exist "..\pandoc-installer.msi" (
        echo 📦 Found pandoc-installer.msi, running installer...
        start /wait msiexec /i "..\pandoc-installer.msi" /quiet
        echo ✅ Pandoc installation completed
    ) else (
        echo ❌ pandoc-installer.msi not found in project root
        pause
        exit /b 1
    )
)

echo ✅ All requirements are met
echo.

REM Run the conversion script
echo 🚀 Starting conversion...
node convert-md-to-docx.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ Conversion completed successfully!
    echo 📄 User Guide saved as: docs\User_Guide.docx
    echo.
    echo 🎉 You can now open the DOCX file in Microsoft Word or any compatible editor.
) else (
    echo.
    echo ❌ Conversion failed. Please check the error messages above.
)

echo.
pause 