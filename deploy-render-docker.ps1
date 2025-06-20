# Advanced Render Docker Deployment Helper for Anti-Fraud Platform
# This script validates your environment, checks for required files, and provides interactive deployment guidance.
# Author: FactCheck Platform Team

param(
    [switch]$CheckOnly
)

function Show-Error {
    param([string]$msg)
    Write-Host "[ERROR] $msg" -ForegroundColor Red
}

function Show-Info {
    param([string]$msg)
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

function Test-RequiredFile {
    param([string]$file)
    if (!(Test-Path $file)) {
        Show-Error "Missing required file: $file"
        return $false
    }
    return $true
}

function Test-RequiredEnvVar {
    param([string]$var)
    if (-not (Test-Path Env:$var)) {
        Show-Error "Missing required environment variable: $var"
        return $false
    }
    return $true
}

function Pause-ForUser {
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

# 1. Check for required files
$requiredFiles = @(
    "RENDER_DOCKER_DEPLOYMENT_GUIDE.md",
    "docker-compose.yml",
    "package.json"
)
$allFilesPresent = $true
foreach ($file in $requiredFiles) {
    if (-not (Test-RequiredFile $file)) { $allFilesPresent = $false }
}
if (-not $allFilesPresent) {
    Show-Error "One or more required files are missing. Please fix before deploying."
    exit 1
}

# 2. Check for .env or .env.example
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Show-Info ".env not found. Copying from .env.example..."
        Copy-Item ".env.example" ".env"
        Show-Info ".env created. Please review and update environment variables."
    } else {
        Show-Error "No .env or .env.example found. Please create your .env file."
        exit 1
    }
}

# 3. Validate essential environment variables
$requiredEnvVars = @(
    "NODE_ENV",
    "REACT_APP_API_URL",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY"
)
$allEnvPresent = $true
foreach ($var in $requiredEnvVars) {
    if (-not (Test-RequiredEnvVar $var)) { $allEnvPresent = $false }
}
if (-not $allEnvPresent) {
    Show-Error "One or more required environment variables are missing in .env."
    exit 1
}

# 4. Show deployment checklist
Show-Info "All checks passed. Ready for Render Docker deployment."
Write-Host "\nDeployment Steps:" -ForegroundColor Green
Write-Host "1. Push your latest code to GitHub."
Write-Host "2. Log in to https://dashboard.render.com and create a new Web Service for each microservice."
Write-Host "3. Set Docker context and Dockerfile path as per documentation."
Write-Host "4. Copy environment variables from your .env file to Render's dashboard for each service."
Write-Host "5. Deploy services in the recommended order (see RENDER_DOCKER_DEPLOYMENT_GUIDE.md)."
Write-Host "6. Monitor build logs and health endpoints."
Write-Host "7. If you encounter issues, see the troubleshooting section in RENDER_DOCKER_DEPLOYMENT_GUIDE.md."

Pause-ForUser

# 5. Optionally open the deployment guide
if (Test-Path "RENDER_DOCKER_DEPLOYMENT_GUIDE.md") {
    Show-Info "Opening Render Docker Deployment Guide..."
    Start-Process "RENDER_DOCKER_DEPLOYMENT_GUIDE.md"
}

Show-Info "Deployment helper finished. Good luck!"
