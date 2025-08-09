@echo off
setlocal enabledelayedexpansion

REM Deployment Checklist Script for Windows
REM Kiểm tra tất cả các thành phần cần thiết trước khi triển khai

echo 🔍 DEPLOYMENT CHECKLIST - Anti-Fraud Platform
echo ==============================================

echo.
echo 📋 1. PREREQUISITES CHECK
echo ------------------------

REM Check required tools
echo Checking required tools...

where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker is installed
) else (
    echo ❌ Docker is not installed
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker Compose is installed
) else (
    echo ❌ Docker Compose is not installed
    exit /b 1
)

where kubectl >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ kubectl is installed
) else (
    echo ❌ kubectl is not installed
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js is installed
) else (
    echo ❌ Node.js is not installed
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ npm is installed
) else (
    echo ❌ npm is not installed
    exit /b 1
)

echo.
echo 📋 2. PROJECT STRUCTURE CHECK
echo ----------------------------

REM Check project structure
echo Checking project structure...

if exist "services" (
    echo ✅ services directory exists
) else (
    echo ❌ services directory not found
    exit /b 1
)

if exist "client" (
    echo ✅ client directory exists
) else (
    echo ❌ client directory not found
    exit /b 1
)

if exist "k8s" (
    echo ✅ k8s directory exists
) else (
    echo ❌ k8s directory not found
    exit /b 1
)

if exist "monitoring" (
    echo ✅ monitoring directory exists
) else (
    echo ❌ monitoring directory not found
    exit /b 1
)

if exist "shared-contracts" (
    echo ✅ shared-contracts directory exists
) else (
    echo ❌ shared-contracts directory not found
    exit /b 1
)

REM Check key configuration files
echo Checking configuration files...

if exist "docker-compose.bigdata.yml" (
    echo ✅ docker-compose.bigdata.yml exists
) else (
    echo ❌ docker-compose.bigdata.yml not found
    exit /b 1
)

if exist "k8s\api-gateway.yml" (
    echo ✅ k8s\api-gateway.yml exists
) else (
    echo ❌ k8s\api-gateway.yml not found
    exit /b 1
)

if exist "monitoring\prometheus\prometheus.yml" (
    echo ✅ monitoring\prometheus\prometheus.yml exists
) else (
    echo ❌ monitoring\prometheus\prometheus.yml not found
    exit /b 1
)

echo.
echo 📋 3. SERVICES CHECK
echo -------------------

REM Check all services exist
set services=api-gateway auth-service link-service community-service chat-service news-service admin-service criminalip-service phishtank-service analytics-service etl-service spark-service event-bus-service

for %%s in (%services%) do (
    if exist "services\%%s" (
        echo ✅ %%s exists
        
        REM Check for Dockerfile
        if exist "services\%%s\Dockerfile" (
            echo   ✅ Dockerfile exists
        ) else (
            echo   ⚠️  Dockerfile missing
        )
        
        REM Check for package.json
        if exist "services\%%s\package.json" (
            echo   ✅ package.json exists
        ) else (
            echo   ⚠️  package.json missing
        )
        
    ) else (
        echo ❌ %%s missing
    )
)

echo.
echo 📋 4. ENVIRONMENT CHECK
echo ----------------------

REM Check environment variables
echo Checking environment variables...
if defined NODE_ENV (
    echo ✅ NODE_ENV is set to: %NODE_ENV%
) else (
    echo ⚠️  NODE_ENV not set
)

REM Check Docker network
docker network ls | findstr "factcheck-network" >nul
if %errorlevel% equ 0 (
    echo ✅ factcheck-network exists
) else (
    echo ⚠️  factcheck-network not found
)

REM Check Kubernetes context
kubectl config current-context >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Kubernetes context is set
    for /f "tokens=*" %%i in ('kubectl config current-context') do echo   Current context: %%i
) else (
    echo ❌ Kubernetes context not set
)

echo.
echo 📋 5. DEPENDENCIES CHECK
echo -----------------------

REM Check if dependencies are installed
echo Checking service dependencies...

for %%s in (%services%) do (
    if exist "services\%%s" (
        if exist "services\%%s\package.json" (
            if exist "services\%%s\node_modules" (
                echo ✅ %%s dependencies installed
            ) else (
                echo ⚠️  %%s dependencies not installed
            )
        )
    )
)

echo.
echo 📋 6. BUILD CHECK
echo ----------------

REM Check if Docker images exist
echo Checking Docker images...
for %%s in (%services%) do (
    docker images | findstr "%%s" >nul
    if %errorlevel% equ 0 (
        echo ✅ %%s image exists
    ) else (
        echo ⚠️  %%s image not found
    )
)

echo.
echo 📋 7. CONFIGURATION CHECK
echo ------------------------

REM Check Kubernetes configurations
echo Checking Kubernetes configurations...
set k8s_files=k8s\api-gateway.yml k8s\auth-service.yml k8s\link-service.yml k8s\community-service.yml k8s\chat-service.yml k8s\news-service.yml k8s\admin-service.yml

for %%f in (%k8s_files%) do (
    if exist "%%f" (
        echo ✅ %%f exists
    ) else (
        echo ❌ %%f not found
    )
)

REM Check monitoring configurations
echo Checking monitoring configurations...
set monitoring_files=monitoring\prometheus\prometheus.yml monitoring\grafana\provisioning\datasources\prometheus.yml monitoring\alertmanager\alertmanager.yml

for %%f in (%monitoring_files%) do (
    if exist "%%f" (
        echo ✅ %%f exists
    ) else (
        echo ❌ %%f not found
    )
)

echo.
echo 📋 8. SECURITY CHECK
echo -------------------

REM Check for secrets and sensitive files
echo Checking security configurations...

REM Check if .env files exist
if exist ".env" (
    echo ✅ .env file exists
) else (
    echo ⚠️  .env file not found
)

REM Check if secrets are configured
kubectl get secrets >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Kubernetes secrets accessible
) else (
    echo ⚠️  Kubernetes secrets not accessible
)

echo.
echo 📋 9. NETWORK CHECK
echo ------------------

REM Check network connectivity
echo Checking network connectivity...

REM Check if localhost ports are available
set ports=3000 8080 6379 9090 3010
for %%p in (%ports%) do (
    netstat -an | findstr ":%%p " >nul
    if %errorlevel% equ 0 (
        echo ⚠️  Port %%p is in use
    ) else (
        echo ✅ Port %%p is available
    )
)

echo.
echo 📋 10. FINAL VALIDATION
echo ----------------------

REM Run final validation tests
echo Running final validation...

REM Test Docker daemon
docker info >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Docker daemon is running
) else (
    echo ❌ Docker daemon is not running
    exit /b 1
)

REM Test Kubernetes cluster
kubectl cluster-info >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Kubernetes cluster is accessible
) else (
    echo ❌ Kubernetes cluster is not accessible
    exit /b 1
)

REM Test Node.js and npm
node --version >nul 2>&1
if %errorlevel% equ 0 (
    npm --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Node.js and npm are working
    ) else (
        echo ❌ npm is not working
        exit /b 1
    )
) else (
    echo ❌ Node.js is not working
    exit /b 1
)

echo.
echo 🎉 DEPLOYMENT CHECKLIST COMPLETED!
echo ==================================

echo.
echo 📝 NEXT STEPS:
echo 1. Run: scripts\build-all-services.bat
echo 2. Run: scripts\deploy-dev.bat
echo 3. Run: scripts\setup-monitoring.bat
echo 4. Run: scripts\health-check.bat

echo.
echo 📚 DOCUMENTATION:
echo - Deployment Guide: docs\deployment-view-diagram.md
echo - Monitoring Setup: monitoring\README.md
echo - Service Documentation: docs\

echo.
echo 🚨 IMPORTANT NOTES:
echo - Ensure all environment variables are set
echo - Check firewall settings for required ports
echo - Verify SSL certificates for production
echo - Test backup and recovery procedures

exit /b 0
