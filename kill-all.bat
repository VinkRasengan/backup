@echo off
echo ====================================
echo FactCheck - Kill All Processes
echo ====================================
echo.

echo Killing existing processes...
echo.

REM Kill processes by port
echo Killing processes on port 3000 (React)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    if not "%%a"=="" (
        echo Killing PID %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo Killing processes on port 5000 (Express)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    if not "%%a"=="" (
        echo Killing PID %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo Killing processes on port 9099 (Firebase Functions)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":9099" ^| find "LISTENING"') do (
    if not "%%a"=="" (
        echo Killing PID %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)

REM Kill processes by name
echo Killing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1
taskkill /F /IM nodemon.exe >nul 2>&1

REM Kill any remaining FactCheck processes
echo Killing FactCheck processes...
for /f "tokens=2" %%a in ('tasklist /FI "WINDOWTITLE eq FactCheck*" ^| findstr /R "^FactCheck"') do (
    if not "%%a"=="" (
        echo Killing FactCheck window PID %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo Waiting 3 seconds for processes to terminate...
timeout /t 3 /nobreak >nul

echo.
echo ====================================
echo Kill Process Complete!
echo ====================================
echo.
echo All FactCheck processes have been terminated.
echo.
pause
