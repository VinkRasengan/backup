@echo off
REM =============================================================================
REM ☸️ Kubernetes Deployment Script for Windows
REM =============================================================================
REM This script deploys the Anti-Fraud Platform to Kubernetes on Windows

setlocal enabledelayedexpansion

set NAMESPACE=anti-fraud-platform

echo ☸️ Anti-Fraud Platform - Kubernetes Deployment (Windows)
echo ========================================================
echo.

REM Check if kubectl is installed
echo [INFO] Checking prerequisites...
kubectl version --client >nul 2>&1
if errorlevel 1 (
    echo [ERROR] kubectl is not installed
    echo Please install kubectl: https://kubernetes.io/docs/tasks/tools/
    pause
    exit /b 1
)

for /f "tokens=3" %%i in ('kubectl version --client --short 2^>nul') do set KUBECTL_VERSION=%%i
echo [SUCCESS] kubectl version %KUBECTL_VERSION% is available

REM Check cluster connectivity
kubectl cluster-info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Cannot connect to Kubernetes cluster
    echo Please ensure kubectl is configured and cluster is accessible
    pause
    exit /b 1
)

echo [SUCCESS] Connected to Kubernetes cluster

REM Check if Docker is available
docker --version >nul 2>&1
if not errorlevel 1 (
    docker info >nul 2>&1
    if not errorlevel 1 (
        echo [SUCCESS] Docker is available for building images
        set DOCKER_AVAILABLE=true
    ) else (
        echo [WARNING] Docker daemon is not running. Images must be pre-built.
        set DOCKER_AVAILABLE=false
    )
) else (
    echo [WARNING] Docker is not installed. Images must be pre-built.
    set DOCKER_AVAILABLE=false
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "services" (
    echo [ERROR] services directory not found. Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "client" (
    echo [ERROR] client directory not found. Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "k8s" (
    echo [ERROR] k8s directory not found. Please run this script from the project root directory
    pause
    exit /b 1
)

REM Build images if Docker is available
if "%DOCKER_AVAILABLE%"=="true" (
    echo [INFO] Building Docker images...
    
    REM Build services
    for %%s in (auth-service link-service community-service chat-service news-service admin-service api-gateway) do (
        echo [INFO] Building %%s...
        if exist "services\%%s" (
            docker build -t %%s:latest services\%%s
            if errorlevel 1 (
                echo [ERROR] Failed to build %%s
                pause
                exit /b 1
            )
            echo [SUCCESS] Built %%s:latest
        ) else (
            echo [ERROR] Service directory not found: services\%%s
            pause
            exit /b 1
        )
    )
    
    REM Build frontend
    echo [INFO] Building frontend...
    if exist "client" (
        docker build -t frontend:latest client
        if errorlevel 1 (
            echo [ERROR] Failed to build frontend
            pause
            exit /b 1
        )
        echo [SUCCESS] Built frontend:latest
    ) else (
        echo [ERROR] Client directory not found
        pause
        exit /b 1
    )
    
    echo [SUCCESS] All images built successfully
) else (
    echo [WARNING] Skipping image build. Ensure images are available in your cluster.
)

REM Create namespace
echo [INFO] Creating namespace: %NAMESPACE%
kubectl get namespace %NAMESPACE% >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Namespace %NAMESPACE% already exists
) else (
    kubectl apply -f k8s\namespace.yml
    echo [SUCCESS] Namespace %NAMESPACE% created
)

REM Create secrets
echo [INFO] Creating secrets...

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found. Creating template...
    (
        echo # Kubernetes Deployment Configuration
        echo FIREBASE_PROJECT_ID=factcheck-1d6e8
        echo FIREBASE_CLIENT_EMAIL=your-client-email@factcheck-1d6e8.iam.gserviceaccount.com
        echo FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
        echo JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
        echo GEMINI_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
        echo VIRUSTOTAL_API_KEY=your-virustotal-api-key
        echo SCAMADVISER_API_KEY=your-scamadviser-api-key
        echo SCREENSHOTLAYER_API_KEY=your-screenshotlayer-api-key
        echo NEWSAPI_API_KEY=your-newsapi-api-key
        echo NEWSDATA_API_KEY=your-newsdata-api-key
        echo REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
    ) > .env
    echo [WARNING] Please edit .env file with your actual credentials
)

REM Read environment variables from .env file
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" (
        set %%a=%%b
    )
)

REM Create secret (simplified for Windows batch)
kubectl create secret generic app-secrets --namespace=%NAMESPACE% --dry-run=client -o yaml > temp-secret.yml
kubectl apply -f temp-secret.yml
del temp-secret.yml

echo [SUCCESS] Secrets created/updated

REM Deploy services
echo [INFO] Deploying services to Kubernetes...

kubectl apply -f k8s\configmap.yml
kubectl apply -f k8s\redis.yml
kubectl apply -f k8s\auth-service.yml
kubectl apply -f k8s\microservices.yml
kubectl apply -f k8s\api-gateway.yml
kubectl apply -f k8s\frontend.yml

echo [SUCCESS] All services deployed

REM Wait for deployments
echo [INFO] Waiting for deployments to be ready...
for %%d in (auth-service link-service community-service chat-service news-service admin-service api-gateway frontend redis) do (
    echo [INFO] Waiting for %%d...
    kubectl wait --for=condition=available --timeout=300s deployment/%%d -n %NAMESPACE%
    if not errorlevel 1 (
        echo [SUCCESS] %%d is ready
    ) else (
        echo [WARNING] %%d is taking longer than expected
    )
)

REM Show status
echo.
echo [INFO] Deployment Status:
echo.
echo 📦 Pods:
kubectl get pods -n %NAMESPACE%
echo.
echo 🌐 Services:
kubectl get services -n %NAMESPACE%
echo.

REM Show access information
echo.
echo [SUCCESS] 🎉 Kubernetes deployment completed!
echo.
echo 📋 Access Information:
echo.
echo    API Gateway:   kubectl port-forward service/api-gateway 8080:8080 -n %NAMESPACE%
echo    Frontend:      kubectl port-forward service/frontend 3000:3000 -n %NAMESPACE%
echo.
echo 📝 Useful Commands:
echo    View pods:     kubectl get pods -n %NAMESPACE%
echo    View logs:     kubectl logs -f deployment/[service-name] -n %NAMESPACE%
echo    Scale service: kubectl scale deployment [service-name] --replicas=3 -n %NAMESPACE%
echo    Delete all:    kubectl delete namespace %NAMESPACE%
echo.
echo 🔧 Troubleshooting:
echo    Check events:  kubectl get events -n %NAMESPACE%
echo    Describe pod:  kubectl describe pod [pod-name] -n %NAMESPACE%
echo    Service logs:  kubectl logs [pod-name] -n %NAMESPACE%
echo.

pause
