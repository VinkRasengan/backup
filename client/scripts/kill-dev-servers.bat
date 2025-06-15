@echo off
echo ========================================
echo  Kill All Development Servers
echo ========================================
echo.

echo [1/4] Killing React Development Servers...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Killing process on port 3000: %%a
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do (
    echo Killing process on port 3001: %%a
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do (
    echo Killing process on port 3002: %%a
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| find ":3003" ^| find "LISTENING"') do (
    echo Killing process on port 3003: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/4] Killing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im nodejs.exe >nul 2>&1

echo [3/4] Killing React Scripts processes...
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo table /nh 2^>nul') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [4/4] Killing any remaining development processes...
wmic process where "commandline like '%%react-scripts%%'" delete >nul 2>&1
wmic process where "commandline like '%%webpack-dev-server%%'" delete >nul 2>&1
wmic process where "commandline like '%%npm start%%'" delete >nul 2>&1

echo.
echo ✅ All development servers have been terminated!
echo.
echo You can now run 'npm start' on port 3000 again.
echo.
pause
