@echo off
REM Build all Docker images for the FactCheck Platform
REM Usage: scripts\docker-build-all.bat [environment]
REM Environments: development, production, render

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

set REGISTRY=%2
if "%REGISTRY%"=="" set REGISTRY=factcheck

echo 🐳 Building all Docker images for environment: %ENVIRONMENT%
echo Registry: %REGISTRY%

REM Services to build
set SERVICES=api-gateway auth-service link-service community-service chat-service news-service admin-service phishtank-service criminalip-service

REM Build each service
for %%s in (%SERVICES%) do (
    echo.
    echo 🔨 Building %%s...
    
    cd services\%%s
    
    REM Set default port based on service
    if "%%s"=="api-gateway" set DEFAULT_PORT=8080
    if "%%s"=="auth-service" set DEFAULT_PORT=3001
    if "%%s"=="link-service" set DEFAULT_PORT=3002
    if "%%s"=="community-service" set DEFAULT_PORT=3003
    if "%%s"=="chat-service" set DEFAULT_PORT=3004
    if "%%s"=="news-service" set DEFAULT_PORT=3005
    if "%%s"=="admin-service" set DEFAULT_PORT=3006
    
    REM Build with appropriate settings for Render
    if "%ENVIRONMENT%"=="render" set DEFAULT_PORT=10000
    
    docker build --build-arg NODE_ENV=%ENVIRONMENT% --build-arg BUILD_CONTEXT=%ENVIRONMENT% --build-arg DEFAULT_PORT=!DEFAULT_PORT! -t "%REGISTRY%/%%s:%ENVIRONMENT%" .
    
    if errorlevel 1 (
        echo ❌ Failed to build %%s
        cd ..\..
        exit /b 1
    )
    
    cd ..\..
    echo ✅ Built %REGISTRY%/%%s:%ENVIRONMENT%
)

REM Build client
echo.
echo 🔨 Building client...
cd client

docker build --build-arg NODE_ENV=%ENVIRONMENT% -t "%REGISTRY%/client:%ENVIRONMENT%" .

if errorlevel 1 (
    echo ❌ Failed to build client
    cd ..
    exit /b 1
)

cd ..
echo ✅ Built %REGISTRY%/client:%ENVIRONMENT%

echo.
echo 🎉 All Docker images built successfully!
echo.
echo 📋 Built images:
for %%s in (%SERVICES%) do (
    echo   - %REGISTRY%/%%s:%ENVIRONMENT%
)
echo   - %REGISTRY%/client:%ENVIRONMENT%

echo.
echo 🚀 To run with docker-compose:
echo   docker-compose up -d

endlocal
