# Deploy Anti-Fraud Platform to Kubernetes
# This script deploys the entire microservices stack with monitoring

param(
    [switch]$SkipWait = $false
)

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Wait-ForDeployment {
    param(
        [string]$Namespace,
        [string]$Deployment,
        [int]$TimeoutSeconds = 300
    )
    
    if ($SkipWait) {
        Write-Info "Skipping wait for $Deployment"
        return
    }
    
    Write-Host "⏳ Waiting for $Deployment in $Namespace to be ready..." -ForegroundColor Yellow
    
    try {
        kubectl wait --for=condition=available --timeout="$($TimeoutSeconds)s" deployment/$Deployment -n $Namespace
        Write-Success "$Deployment is ready"
    } catch {
        Write-Error "$Deployment failed to become ready within $TimeoutSeconds seconds"
        throw
    }
}

Write-Host "🚀 Deploying Anti-Fraud Platform to Kubernetes..." -ForegroundColor Green
Write-Host ""

# Check if kubectl is available
try {
    kubectl version --client --short | Out-Null
    Write-Success "kubectl is available"
} catch {
    Write-Error "kubectl is not installed or not in PATH"
    exit 1
}

# Check if cluster is accessible
try {
    kubectl cluster-info | Out-Null
    Write-Success "Kubernetes cluster is accessible"
} catch {
    Write-Error "Cannot connect to Kubernetes cluster"
    Write-Host "Make sure your cluster is running and kubectl is configured"
    exit 1
}

Write-Host ""

# Step 1: Create namespaces
Write-Host "📁 Creating namespaces..." -ForegroundColor Cyan
kubectl apply -f monitoring-namespace.yml
Write-Host ""

# Step 2: Create ConfigMaps and Secrets
Write-Host "⚙️  Creating ConfigMaps..." -ForegroundColor Cyan
kubectl apply -f configmap.yml
Write-Host ""

# Step 3: Deploy Redis (dependency for other services)
Write-Host "🗄️  Deploying Redis..." -ForegroundColor Cyan
kubectl apply -f redis.yml
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "redis"
Write-Host ""

# Step 4: Deploy monitoring stack
Write-Host "📊 Deploying monitoring stack..." -ForegroundColor Cyan
kubectl apply -f prometheus.yml
kubectl apply -f grafana.yml

Wait-ForDeployment -Namespace "monitoring" -Deployment "prometheus"
Wait-ForDeployment -Namespace "monitoring" -Deployment "grafana"
Write-Host ""

# Step 5: Deploy microservices
Write-Host "🔧 Deploying microservices..." -ForegroundColor Cyan
kubectl apply -f auth-service.yml
kubectl apply -f api-gateway.yml
kubectl apply -f microservices.yml

# Wait for auth service first (other services depend on it)
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "auth-service"

# Wait for other services
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "api-gateway"
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "link-service"
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "community-service"
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "chat-service"
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "news-service"
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "admin-service"
Write-Host ""

# Step 6: Deploy frontend
Write-Host "🌐 Deploying frontend..." -ForegroundColor Cyan
kubectl apply -f frontend.yml
Wait-ForDeployment -Namespace "anti-fraud-platform" -Deployment "frontend"
Write-Host ""

# Step 7: Show deployment status
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Namespaces:"
kubectl get namespaces | Select-String -Pattern "(anti-fraud-platform|monitoring)"
Write-Host ""

Write-Host "Monitoring Stack:"
kubectl get pods -n monitoring
Write-Host ""

Write-Host "Application Services:"
kubectl get pods -n anti-fraud-platform
Write-Host ""

Write-Host "Services:"
kubectl get services -n anti-fraud-platform
kubectl get services -n monitoring
Write-Host ""

# Step 8: Show access information
Write-Host "🌐 Access Information:" -ForegroundColor Cyan
Write-Host ""

# Get NodePort for services
try {
    $apiGatewayPort = kubectl get service api-gateway -n anti-fraud-platform -o jsonpath='{.spec.ports[0].nodePort}' 2>$null
    $grafanaPort = kubectl get service grafana -n monitoring -o jsonpath='{.spec.ports[0].nodePort}' 2>$null
    $prometheusPort = kubectl get service prometheus -n monitoring -o jsonpath='{.spec.ports[0].nodePort}' 2>$null
    
    if (-not $grafanaPort) { $grafanaPort = "30300" }
    if (-not $prometheusPort) { $prometheusPort = "30090" }
    
    # Get cluster IP
    $clusterIP = kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' 2>$null
    if (-not $clusterIP) {
        $clusterIP = kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>$null
    }
    if (-not $clusterIP) {
        $clusterIP = "localhost"
    }
    
    Write-Host "🔗 Application URLs:"
    if ($apiGatewayPort) {
        Write-Host "   API Gateway: http://$clusterIP`:$apiGatewayPort"
    }
    Write-Host "   Grafana: http://$clusterIP`:$grafanaPort (admin/admin123)"
    Write-Host "   Prometheus: http://$clusterIP`:$prometheusPort"
    Write-Host ""
    
} catch {
    Write-Warning "Could not retrieve service ports. Use kubectl port-forward to access services."
}

Write-Success "Deployment completed successfully!"
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "1. Wait a few minutes for all services to fully start"
Write-Host "2. Check Prometheus targets: http://$clusterIP`:$prometheusPort/targets"
Write-Host "3. Import Grafana dashboards for microservices monitoring"
Write-Host "4. Test the application endpoints"
Write-Host ""

Write-Host "🔍 Useful commands:" -ForegroundColor Cyan
Write-Host "   kubectl get pods -n anti-fraud-platform"
Write-Host "   kubectl get pods -n monitoring"
Write-Host "   kubectl logs -f deployment/api-gateway -n anti-fraud-platform"
Write-Host "   kubectl port-forward service/grafana 3000:3000 -n monitoring"
