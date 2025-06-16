@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Anti-Fraud Platform - Windows Kubernetes Deployment
echo ==================================================

REM Check if kubectl is available
kubectl version --client >nul 2>&1
if errorlevel 1 (
    echo ❌ kubectl not found. Please install kubectl first.
    echo    Download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
    pause
    exit /b 1
)

echo ✅ kubectl found

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Set script directory
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set K8S_DIR=%PROJECT_ROOT%\k8s

REM Parse command line arguments
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=help

if "%COMMAND%"=="help" goto :show_help
if "%COMMAND%"=="generate" goto :generate_manifests
if "%COMMAND%"=="deploy" goto :deploy_k8s
if "%COMMAND%"=="status" goto :show_status
if "%COMMAND%"=="logs" goto :show_logs
if "%COMMAND%"=="clean" goto :cleanup
if "%COMMAND%"=="build" goto :build_images
goto :show_help

:show_help
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   help       - Show this help message
echo   generate   - Generate Kubernetes manifests
echo   build      - Build and push Docker images
echo   deploy     - Deploy to Kubernetes
echo   status     - Show deployment status
echo   logs       - Show pod logs
echo   clean      - Clean up deployment
echo.
echo Examples:
echo   %0 generate
echo   %0 build
echo   %0 deploy
echo   %0 status
goto :end

:generate_manifests
echo.
echo 📦 Generating Kubernetes manifests...
cd /d "%PROJECT_ROOT%"
if exist "scripts\generate-k8s-manifests.sh" (
    bash scripts\generate-k8s-manifests.sh
) else (
    echo ❌ Generate script not found
    exit /b 1
)
echo ✅ Manifests generated
goto :end

:build_images
echo.
echo 🔨 Building Docker images...
cd /d "%PROJECT_ROOT%"

REM Set Docker registry
set /p DOCKER_REGISTRY="Enter Docker registry (e.g., your-registry.com/anti-fraud-platform): "
if "%DOCKER_REGISTRY%"=="" set DOCKER_REGISTRY=anti-fraud-platform

echo Building images for registry: %DOCKER_REGISTRY%

REM Build all service images
echo Building auth-service...
docker build -t %DOCKER_REGISTRY%/auth-service:latest services\auth-service\

echo Building api-gateway...
docker build -t %DOCKER_REGISTRY%/api-gateway:latest services\api-gateway\

echo Building link-service...
docker build -t %DOCKER_REGISTRY%/link-service:latest services\link-service\

echo Building community-service...
docker build -t %DOCKER_REGISTRY%/community-service:latest services\community-service\

echo Building chat-service...
docker build -t %DOCKER_REGISTRY%/chat-service:latest services\chat-service\

echo Building news-service...
docker build -t %DOCKER_REGISTRY%/news-service:latest services\news-service\

echo Building admin-service...
docker build -t %DOCKER_REGISTRY%/admin-service:latest services\admin-service\

echo Building frontend...
docker build -t %DOCKER_REGISTRY%/frontend:latest client\

echo ✅ All images built successfully

REM Ask if user wants to push images
set /p PUSH_IMAGES="Push images to registry? (y/n): "
if /i "%PUSH_IMAGES%"=="y" (
    echo Pushing images...
    docker push %DOCKER_REGISTRY%/auth-service:latest
    docker push %DOCKER_REGISTRY%/api-gateway:latest
    docker push %DOCKER_REGISTRY%/link-service:latest
    docker push %DOCKER_REGISTRY%/community-service:latest
    docker push %DOCKER_REGISTRY%/chat-service:latest
    docker push %DOCKER_REGISTRY%/news-service:latest
    docker push %DOCKER_REGISTRY%/admin-service:latest
    docker push %DOCKER_REGISTRY%/frontend:latest
    echo ✅ Images pushed successfully
)
goto :end

:deploy_k8s
echo.
echo 🚀 Deploying to Kubernetes...

REM Check if manifests exist
if not exist "%K8S_DIR%\manifests" (
    echo ❌ Manifests not found. Run 'generate' command first.
    exit /b 1
)

cd /d "%K8S_DIR%"

REM Create namespace
echo Creating namespace...
kubectl apply -f namespace.yml

REM Deploy Redis
echo Deploying Redis...
kubectl apply -f redis.yml

REM Deploy ConfigMap
echo Deploying ConfigMap...
kubectl apply -f manifests\configmap.yml

REM Deploy Secret
echo.
echo ⚠️  Make sure you have updated the secret values in manifests\secret-template.yml
set /p DEPLOY_SECRET="Continue with secret deployment? (y/n): "
if /i "%DEPLOY_SECRET%"=="y" (
    kubectl apply -f manifests\secret-template.yml
) else (
    echo Please update the secret values first!
    exit /b 1
)

REM Deploy services
echo Deploying services...
kubectl apply -f manifests\api-gateway.yml
kubectl apply -f manifests\auth-service.yml
kubectl apply -f manifests\link-service.yml
kubectl apply -f manifests\community-service.yml
kubectl apply -f manifests\chat-service.yml
kubectl apply -f manifests\news-service.yml
kubectl apply -f manifests\admin-service.yml
kubectl apply -f manifests\frontend.yml

REM Deploy HPA
echo Deploying Horizontal Pod Autoscalers...
kubectl apply -f manifests\*-hpa.yml

REM Deploy Ingress
echo Deploying Ingress...
kubectl apply -f manifests\ingress.yml

echo ✅ Deployment completed!

echo.
echo Waiting for pods to be ready...
kubectl wait --for=condition=ready pod -l app=api-gateway -n anti-fraud-platform --timeout=300s

echo.
echo 📊 Deployment Status:
kubectl get pods -n anti-fraud-platform
kubectl get services -n anti-fraud-platform
kubectl get ingress -n anti-fraud-platform

echo.
echo 🎉 Anti-Fraud Platform deployed successfully!
echo Access your application at:
echo   Frontend: https://anti-fraud-platform.com
echo   API: https://api.anti-fraud-platform.com
goto :end

:show_status
echo.
echo 📊 Deployment Status:
kubectl get pods -n anti-fraud-platform
echo.
kubectl get services -n anti-fraud-platform
echo.
kubectl get ingress -n anti-fraud-platform
goto :end

:show_logs
echo.
echo 📋 Recent logs:
set SERVICE=%2
if "%SERVICE%"=="" set SERVICE=api-gateway

echo Showing logs for %SERVICE%...
kubectl logs -l app=%SERVICE% -n anti-fraud-platform --tail=50
goto :end

:cleanup
echo.
echo 🧹 Cleaning up deployment...
set /p CONFIRM="Are you sure you want to delete the deployment? (y/n): "
if /i "%CONFIRM%"=="y" (
    kubectl delete namespace anti-fraud-platform
    echo ✅ Deployment cleaned up
) else (
    echo Cleanup cancelled
)
goto :end

:end
echo.
pause
