@echo off
echo 🧹 Killing all Node.js processes...

REM Kill all node.exe processes
taskkill /F /IM node.exe /T 2>nul

REM Kill all npm processes
taskkill /F /IM npm.cmd /T 2>nul

REM Kill all nodemon processes
taskkill /F /IM nodemon.cmd /T 2>nul

echo ✅ All Node.js processes killed!
echo 🚀 Ready to start fresh: npm run dev:services

pause
