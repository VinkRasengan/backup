# OnRender Deployment Preparation Script for Windows
# PowerShell script to prepare FactCheck Platform for OnRender deployment

Write-Host "🚀 Preparing FactCheck Platform for OnRender Deployment..." -ForegroundColor Green

# Function to print colored output
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

# Check prerequisites
function Check-Prerequisites {
    Write-Host "📋 Checking prerequisites..." -ForegroundColor Cyan
    
    if (-not (Test-Path "package.json")) {
        Write-Error "package.json not found. Are you in the project root?"
        exit 1
    }
    
    if (-not (Test-Path "services")) {
        Write-Error "services directory not found."
        exit 1
    }
    
    if (-not (Test-Path "client")) {
        Write-Error "client directory not found."
        exit 1
    }
    
    Write-Success "All required directories found"
}

# Create environment template
function Create-EnvTemplate {
    Write-Host "🔑 Creating environment variables template..." -ForegroundColor Cyan
    
    $envTemplate = @"
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for backend services)
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# API Keys
VIRUSTOTAL_API_KEY=your_virustotal_api_key
SCAMADVISER_API_KEY=your_scamadviser_api_key
PHISHTANK_API_KEY=your_phishtank_api_key
CRIMINALIP_API_KEY=your_criminalip_api_key
GEMINI_API_KEY=your_gemini_api_key
NEWS_API_KEY=your_news_api_key

# Security
JWT_SECRET=your_jwt_secret_key

# Redis (OnRender will provide this)
REDIS_URL=redis://localhost:6379

# Service URLs (Update after deployment)
AUTH_SERVICE_URL=https://factcheck-auth.onrender.com
LINK_SERVICE_URL=https://factcheck-link.onrender.com
COMMUNITY_SERVICE_URL=https://factcheck-community.onrender.com
CHAT_SERVICE_URL=https://factcheck-chat.onrender.com
NEWS_SERVICE_URL=https://factcheck-news.onrender.com
ADMIN_SERVICE_URL=https://factcheck-admin.onrender.com
API_GATEWAY_URL=https://factcheck-api-gateway.onrender.com
"@

    $envTemplate | Out-File -FilePath ".env.render.template" -Encoding UTF8
    Write-Success "Created .env.render.template"
}

# Create OnRender configuration checker
function Create-OnRenderChecker {
    Write-Host "🔍 Creating OnRender configuration checker..." -ForegroundColor Cyan
    
    $checkerScript = @"
# OnRender Configuration Checker
param(
    [string]`$ServiceName = "all"
)

Write-Host "🔍 Checking OnRender Configuration for `$ServiceName" -ForegroundColor Green

`$configFiles = @{
    "frontend" = "render-frontend.yaml"
    "api-gateway" = "render-api-gateway.yaml"
    "auth" = "render-auth-service.yaml"
    "link" = "render-link-service.yaml"
    "community" = "render-community-service.yaml"
    "chat" = "render-chat-service.yaml"
    "news" = "render-news-service.yaml"
    "admin" = "render-admin-service.yaml"
}

function Check-ConfigFile {
    param([string]`$fileName)
    
    if (Test-Path `$fileName) {
        `$content = Get-Content `$fileName -Raw
        Write-Host "✅ `$fileName exists" -ForegroundColor Green
        
        # Check for required fields
        if (`$content -match "name:") {
            Write-Host "  ✅ Service name configured" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Service name missing" -ForegroundColor Red
        }
        
        if (`$content -match "buildCommand:") {
            Write-Host "  ✅ Build command configured" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Build command missing" -ForegroundColor Red
        }
        
        if (`$content -match "startCommand:" -or `$content -match "staticPublishPath:") {
            Write-Host "  ✅ Start command/static path configured" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Start command/static path missing" -ForegroundColor Red
        }
        
    } else {
        Write-Host "❌ `$fileName not found" -ForegroundColor Red
    }
    Write-Host ""
}

if (`$ServiceName -eq "all") {
    foreach (`$service in `$configFiles.Keys) {
        Check-ConfigFile `$configFiles[`$service]
    }
} elseif (`$configFiles.ContainsKey(`$ServiceName)) {
    Check-ConfigFile `$configFiles[`$ServiceName]
} else {
    Write-Host "❌ Unknown service: `$ServiceName" -ForegroundColor Red
    Write-Host "Available services: " + (`$configFiles.Keys -join ", ")
}
"@

    $checkerScript | Out-File -FilePath "check-onrender-config.ps1" -Encoding UTF8
    Write-Success "Created check-onrender-config.ps1"
}

# Create deployment checklist
function Create-DeploymentChecklist {
    Write-Host "📋 Creating deployment checklist..." -ForegroundColor Cyan
    
    $checklist = @"
# OnRender Deployment Checklist

## ✅ Pre-Deployment Checklist

### 🔧 Prerequisites
- [ ] OnRender account created
- [ ] GitHub repository connected to OnRender
- [ ] Firebase project created and configured
- [ ] All API keys obtained
- [ ] Redis instance created on OnRender

### 🔑 Environment Variables Prepared
- [ ] Firebase configuration
- [ ] API keys (VirusTotal, ScamAdviser, Gemini, etc.)
- [ ] JWT secret generated
- [ ] Redis URL obtained from OnRender

### 📦 Code Preparation
- [ ] Health check endpoints added to all services
- [ ] CORS settings updated for production
- [ ] Package.json files updated with correct Node.js version
- [ ] Build commands tested locally

## 🚀 Deployment Order

### 1. Infrastructure Services
- [ ] Redis instance created and running
- [ ] Environment variables configured in OnRender

### 2. Core Services (Deploy in this order)
1. [ ] Auth Service
   - [ ] Service deployed
   - [ ] Health check working
   - [ ] Environment variables set
   
2. [ ] Link Service
   - [ ] Service deployed
   - [ ] API keys configured
   - [ ] Health check working
   
3. [ ] Community Service
   - [ ] Service deployed
   - [ ] Connected to Auth Service
   - [ ] Health check working
   
4. [ ] Chat Service
   - [ ] Service deployed
   - [ ] Gemini AI configured
   - [ ] Health check working
   
5. [ ] News Service
   - [ ] Service deployed
   - [ ] News API configured
   - [ ] Health check working
   
6. [ ] Admin Service
   - [ ] Service deployed
   - [ ] Connected to other services
   - [ ] Health check working

### 3. Gateway and Frontend
7. [ ] API Gateway
   - [ ] Service deployed
   - [ ] All service URLs configured
   - [ ] Routing working correctly
   
8. [ ] Frontend (Static Site)
   - [ ] Build successful
   - [ ] API URL configured
   - [ ] Firebase config set
   - [ ] Site accessible

## 🧪 Post-Deployment Testing

### Service Health Checks
- [ ] Auth Service: https://factcheck-auth.onrender.com/health
- [ ] Link Service: https://factcheck-link.onrender.com/health
- [ ] Community Service: https://factcheck-community.onrender.com/health
- [ ] Chat Service: https://factcheck-chat.onrender.com/health
- [ ] News Service: https://factcheck-news.onrender.com/health
- [ ] Admin Service: https://factcheck-admin.onrender.com/health
- [ ] API Gateway: https://factcheck-api-gateway.onrender.com/health

### Functionality Testing
- [ ] User registration/login works
- [ ] Link verification works
- [ ] Community features work
- [ ] Chat functionality works
- [ ] News feed loads
- [ ] Admin panel accessible

### Performance Testing
- [ ] Cold start times acceptable (<30 seconds)
- [ ] Response times reasonable
- [ ] No memory/timeout issues
- [ ] Database connections stable

## 🔧 Common Issues & Solutions

### Build Failures
- Check Node.js version (must be 18+)
- Verify package.json dependencies
- Check build logs for specific errors
- Ensure build command is correct

### Service Connection Issues
- Verify all environment variables
- Check service URLs are correct
- Ensure CORS is properly configured
- Check firewall/security settings

### Database Connection Problems
- Verify Firebase configuration
- Check service account permissions
- Ensure Firestore rules allow access
- Test connection locally first

### API Integration Issues
- Verify all API keys are valid
- Check rate limits on external APIs
- Test API endpoints individually
- Monitor API usage quotas

## 📞 Getting Help

If you encounter issues:
1. Check OnRender logs and documentation
2. Review this checklist
3. Test services individually
4. Check environment variables
5. Contact OnRender support if needed

## 🎉 Deployment Complete!

Once all items are checked:
- [ ] All services deployed and healthy
- [ ] Frontend accessible and functional
- [ ] All integrations working
- [ ] Performance acceptable
- [ ] Monitoring set up
- [ ] Documentation updated with live URLs
"@

    $checklist | Out-File -FilePath "ONRENDER_CHECKLIST.md" -Encoding UTF8
    Write-Success "Created ONRENDER_CHECKLIST.md"
}

# Create service URL updater
function Create-URLUpdater {
    Write-Host "🔗 Creating service URL updater..." -ForegroundColor Cyan
    
    $urlUpdater = @"
# Service URL Updater for OnRender
param(
    [hashtable]`$ServiceUrls
)

if (-not `$ServiceUrls) {
    Write-Host "Usage: .\update-service-urls.ps1 -ServiceUrls @{'auth'='https://factcheck-auth.onrender.com'; 'link'='https://factcheck-link.onrender.com'}" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔗 Updating service URLs in configuration files..." -ForegroundColor Green

# Update API Gateway configuration
if (Test-Path "render-api-gateway.yaml") {
    `$content = Get-Content "render-api-gateway.yaml" -Raw
    
    foreach (`$service in `$ServiceUrls.Keys) {
        `$oldPattern = "value: https://factcheck-`$service.onrender.com"
        `$newValue = "value: " + `$ServiceUrls[`$service]
        `$content = `$content -replace `$oldPattern, `$newValue
    }
    
    `$content | Out-File "render-api-gateway.yaml" -Encoding UTF8
    Write-Host "✅ Updated API Gateway configuration" -ForegroundColor Green
}

# Update frontend configuration
if (Test-Path "render-frontend.yaml" -and `$ServiceUrls.ContainsKey('api-gateway')) {
    `$content = Get-Content "render-frontend.yaml" -Raw
    `$content = `$content -replace "value: https://factcheck-api-gateway.onrender.com", ("value: " + `$ServiceUrls['api-gateway'])
    `$content | Out-File "render-frontend.yaml" -Encoding UTF8
    Write-Host "✅ Updated Frontend configuration" -ForegroundColor Green
}

Write-Host "🎉 Service URLs updated successfully!" -ForegroundColor Green
"@

    $urlUpdater | Out-File -FilePath "update-service-urls.ps1" -Encoding UTF8
    Write-Success "Created update-service-urls.ps1"
}

# Main execution
function Main {
    Write-Host "🎯 Starting OnRender deployment preparation..." -ForegroundColor Green
    Write-Host ""
    
    Check-Prerequisites
    Create-EnvTemplate
    Create-OnRenderChecker
    Create-DeploymentChecklist
    Create-URLUpdater
    
    Write-Host ""
    Write-Success "🎉 OnRender deployment preparation completed!"
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review and fill out .env.render.template with your API keys"
    Write-Host "2. Create OnRender account and connect your GitHub repository"
    Write-Host "3. Follow instructions in ONRENDER_CHECKLIST.md"
    Write-Host "4. Deploy services using the provided render-*.yaml files"
    Write-Host ""
    Write-Warning "Important: Update all service URLs after deployment using update-service-urls.ps1!"
}

# Run the script
Main
