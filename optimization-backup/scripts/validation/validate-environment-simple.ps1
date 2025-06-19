# =============================================================================
# Cross-Platform Environment Validation Script - PowerShell Version
# =============================================================================

# Simple function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        Write-Host "[OK] $Command is installed" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "[FAIL] $Command is not installed" -ForegroundColor Red
        return $false
    }
}

function Test-File {
    param([string]$Path)
    if (Test-Path $Path -PathType Leaf) {
        Write-Host "[OK] File exists: $Path" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "[FAIL] File missing: $Path" -ForegroundColor Red
        return $false
    }
}

Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host "CROSS-PLATFORM ENVIRONMENT VALIDATION" -ForegroundColor Blue
Write-Host "==============================================================================" -ForegroundColor Blue

# Check OS
Write-Host "`nOperating System: Windows" -ForegroundColor Cyan
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor Cyan

# Check essential commands
Write-Host "`nChecking Essential Commands..." -ForegroundColor Yellow
$CommandsOK = $true

if (-not (Test-Command "node")) { $CommandsOK = $false }
if (-not (Test-Command "npm")) { $CommandsOK = $false }
if (-not (Test-Command "docker")) { $CommandsOK = $false }
if (-not (Test-Command "git")) { $CommandsOK = $false }

# Check PowerShell execution policy
Write-Host "`nChecking PowerShell Execution Policy..." -ForegroundColor Yellow
$ExecutionPolicy = Get-ExecutionPolicy
if ($ExecutionPolicy -eq "Restricted") {
    Write-Host "[FAIL] PowerShell execution policy is Restricted" -ForegroundColor Red
    Write-Host "[INFO] Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
    $CommandsOK = $false
}
else {
    Write-Host "[OK] PowerShell execution policy: $ExecutionPolicy" -ForegroundColor Green
}

# Check essential files
Write-Host "`nChecking Essential Files..." -ForegroundColor Yellow
$FilesOK = $true

if (-not (Test-File "package.json")) { $FilesOK = $false }
if (-not (Test-File "docker-compose.yml")) { $FilesOK = $false }

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[WARN] .env file not found - copy from .env.template" -ForegroundColor Yellow
}

# Final assessment
Write-Host "`n==============================================================================" -ForegroundColor Blue
Write-Host "VALIDATION SUMMARY" -ForegroundColor Blue
Write-Host "==============================================================================" -ForegroundColor Blue

if ($CommandsOK -and $FilesOK) {
    Write-Host "[SUCCESS] Environment is ready for development!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Copy .env.template to .env and configure your settings"
    Write-Host "2. Run: npm install"
    Write-Host "3. Choose your deployment method:"
    Write-Host "   - Docker: .\build-images.ps1; docker-compose up"
    Write-Host "   - Local: npm run dev"
}
else {
    Write-Host "[FAILED] Environment validation failed!" -ForegroundColor Red
    Write-Host "Please fix the issues above and run this script again." -ForegroundColor Yellow
}
