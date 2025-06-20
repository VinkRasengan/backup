# FactCheck Platform - Auto Deploy Script
# Sử dụng: .\deploy-to-render.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$DeployType = "all",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false
)

Write-Host "🚀 FactCheck Platform - Auto Deploy to Render" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Kiểm tra requirements
function Check-Requirements {
    Write-Host "🔍 Checking requirements..." -ForegroundColor Yellow
    
    # Check Node.js
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed. Please install Node.js first."
        exit 1
    }
    
    # Check npm
    if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed. Please install npm first."
        exit 1
    }
    
    # Check git
    if (!(Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git is not installed. Please install Git first."
        exit 1
    }
    
    Write-Host "✅ All requirements satisfied" -ForegroundColor Green
}

# Build client
function Build-Client {
    if ($SkipBuild) {
        Write-Host "⏭️ Skipping client build..." -ForegroundColor Yellow
        return
    }
    
    Write-Host "🔨 Building client..." -ForegroundColor Yellow
    
    Push-Location "client"
    
    try {
        # Install dependencies
        npm ci
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install client dependencies"
        }
        
        # Build
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to build client"
        }
        
        Write-Host "✅ Client built successfully" -ForegroundColor Green
    }
    catch {
        Write-Error $_.Exception.Message
        Pop-Location
        exit 1
    }
    finally {
        Pop-Location
    }
}

# Test services
function Test-Services {
    Write-Host "🧪 Testing services..." -ForegroundColor Yellow
    
    $services = @("auth-service", "api-gateway", "community-service", "admin-service", "chat-service", "link-service", "news-service")
    
    foreach ($service in $services) {
        Write-Host "Testing $service..." -ForegroundColor Cyan
        
        Push-Location "services\$service"
        
        try {
            # Install dependencies
            if (!(Test-Path "node_modules")) {
                npm ci
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to install $service dependencies"
                }
            }
            
            # Run tests (if test script exists)
            $package = Get-Content "package.json" | ConvertFrom-Json
            if ($package.scripts.test) {
                npm test
                if ($LASTEXITCODE -ne 0) {
                    Write-Warning "Tests failed for $service"
                }
            }
        }
        catch {
            Write-Warning "Error testing $service`: $($_.Exception.Message)"
        }
        finally {
            Pop-Location
        }
    }
    
    Write-Host "✅ Service testing completed" -ForegroundColor Green
}

# Deploy to Render
function Deploy-ToRender {
    Write-Host "🚀 Deploying to Render..." -ForegroundColor Yellow
    
    # Check if render.yaml exists
    if (!(Test-Path "render.yaml")) {
        Write-Error "render.yaml not found. Please create render.yaml file first."
        exit 1
    }
    
    # Check if we're in a git repository
    if (!(Test-Path ".git")) {
        Write-Error "Not in a git repository. Please initialize git first."
        exit 1
    }
    
    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "📝 Committing changes..." -ForegroundColor Yellow
        git add .
        git commit -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    # Push to GitHub (assumes GitHub Actions is set up)
    Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Code pushed successfully! Check GitHub Actions for deployment status." -ForegroundColor Green
        Write-Host "🌐 GitHub Actions: https://github.com/$(git config --get remote.origin.url | ForEach-Object { $_ -replace '.*github\.com[:/](.*)\.git.*', '$1' })/actions" -ForegroundColor Cyan
    } else {
        Write-Error "Failed to push to GitHub"
        exit 1
    }
}

# Check environment variables
function Check-Environment {
    Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow
    
    $envFile = "client\.env.production"
    if (Test-Path $envFile) {
        Write-Host "✅ Found $envFile" -ForegroundColor Green
        
        # Display current config (without sensitive data)
        $envContent = Get-Content $envFile
        foreach ($line in $envContent) {
            if ($line -match "^REACT_APP_API_URL=") {
                Write-Host "   $line" -ForegroundColor Cyan
            }
            elseif ($line -match "^REACT_APP_FIREBASE_PROJECT_ID=") {
                Write-Host "   $line" -ForegroundColor Cyan
            }
        }
    } else {
        Write-Warning "$envFile not found. Make sure to configure environment variables."
    }
}

# Show deployment URLs
function Show-DeploymentInfo {
    Write-Host "`n🎉 Deployment Info" -ForegroundColor Green
    Write-Host "==================" -ForegroundColor Green
    Write-Host "After deployment completes, your services will be available at:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Frontend:     https://factcheck-client.onrender.com" -ForegroundColor Yellow
    Write-Host "API Gateway:  https://factcheck-api-gateway.onrender.com" -ForegroundColor Yellow
    Write-Host "Auth Service: https://factcheck-auth-service.onrender.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📊 Monitor deployment:" -ForegroundColor Cyan
    Write-Host "- GitHub Actions: Check your repository's Actions tab" -ForegroundColor White
    Write-Host "- Render Dashboard: https://dashboard.render.com" -ForegroundColor White
    Write-Host ""
}

# Main execution
try {
    Check-Requirements
    Check-Environment
    
    switch ($DeployType.ToLower()) {
        "client" {
            Build-Client
        }
        "services" {
            Test-Services
        }
        "all" {
            Build-Client
            Test-Services
            Deploy-ToRender
            Show-DeploymentInfo
        }
        default {
            Write-Error "Invalid deploy type. Use: all, client, or services"
            exit 1
        }
    }
    
    Write-Host "`n✅ Deployment script completed successfully!" -ForegroundColor Green
}
catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    exit 1
}
