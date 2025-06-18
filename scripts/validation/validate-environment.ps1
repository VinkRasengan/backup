# =============================================================================
# Cross-Platform Environment Validation Script - PowerShell Version
# =============================================================================
# This script validates that the environment is properly set up for 
# cross-platform development and deployment on Windows
# =============================================================================

param(
    [switch]$Detailed = $false
)

# Colors for output
$Script:Colors = @{
    Red    = [System.ConsoleColor]::Red
    Green  = [System.ConsoleColor]::Green
    Yellow = [System.ConsoleColor]::Yellow
    Blue   = [System.ConsoleColor]::Blue
    White  = [System.ConsoleColor]::White
}

function Write-Header {
    param([string]$Message)
    Write-Host "==============================================================================" -ForegroundColor $Colors.Blue
    Write-Host $Message -ForegroundColor $Colors.Blue
    Write-Host "==============================================================================" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor $Colors.Red
}

function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        Write-Success "$Command is installed"
        return $true
    }
    catch {
        Write-Error "$Command is not installed"
        return $false
    }
}

function Test-File {
    param([string]$Path)
    if (Test-Path $Path -PathType Leaf) {
        Write-Success "File exists: $Path"
        return $true
    }
    else {
        Write-Error "File missing: $Path"
        return $false
    }
}

function Test-Directory {
    param([string]$Path)
    if (Test-Path $Path -PathType Container) {
        Write-Success "Directory exists: $Path"
        return $true
    }
    else {
        Write-Error "Directory missing: $Path"
        return $false
    }
}

# Main validation
Write-Header "CROSS-PLATFORM ENVIRONMENT VALIDATION (PowerShell)"

# Check OS
Write-Host "`nDetecting Operating System..." -ForegroundColor $Colors.Blue
$OS = [System.Environment]::OSVersion.Platform
$OSVersion = [System.Environment]::OSVersion.VersionString
$PSVersion = $PSVersionTable.PSVersion.ToString()

Write-Success "Operating System: Windows ($OSVersion)"
Write-Success "PowerShell Version: $PSVersion"

# Check essential commands
Write-Host "`nChecking Essential Commands..." -ForegroundColor $Colors.Blue
$CommandsOK = $true

if (-not (Test-Command "node")) { $CommandsOK = $false }
if (-not (Test-Command "npm")) { $CommandsOK = $false }
if (-not (Test-Command "docker")) { $CommandsOK = $false }
if (-not (Test-Command "git")) { $CommandsOK = $false }

# Check optional commands
Write-Host "`nChecking Optional Commands..." -ForegroundColor $Colors.Blue
if (-not (Test-Command "docker-compose")) {
    if (-not (Test-Command "docker compose")) {
        Write-Warning "docker-compose not found"
    }
    else {
        Write-Success "docker compose (v2) is available"
    }
}

if (-not (Test-Command "kubectl")) {
    Write-Warning "kubectl not found (needed for Kubernetes deployment)"
}

if (-not (Test-Command "make")) {
    Write-Warning "make not found (optional for build automation)"
}

# Check PowerShell execution policy
Write-Host "`nChecking PowerShell Execution Policy..." -ForegroundColor $Colors.Blue
$ExecutionPolicy = Get-ExecutionPolicy
if ($ExecutionPolicy -eq "Restricted") {
    Write-Error "PowerShell execution policy is Restricted. Scripts cannot run."
    Write-Warning "Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"
    $CommandsOK = $false
}
else {
    Write-Success "PowerShell execution policy: $ExecutionPolicy"
}

# Check Node.js version
Write-Host "`nChecking Node.js Version..." -ForegroundColor $Colors.Blue
try {
    $NodeVersion = node --version
    $NodeMajor = [int]($NodeVersion -replace 'v', '' -split '\.')[0]
    if ($NodeMajor -ge 16) {
        Write-Success "Node.js version: $NodeVersion (>= 16)"
    }
    else {
        Write-Error "Node.js version: $NodeVersion (< 16 - please upgrade)"
        $CommandsOK = $false
    }
}
catch {
    Write-Error "Could not determine Node.js version"
}

# Check Docker version and status
Write-Host "`nChecking Docker Version..." -ForegroundColor $Colors.Blue
try {
    $DockerVersion = docker --version
    Write-Success "Docker version: $DockerVersion"
    
    # Check if Docker is running
    try {
        $null = docker info 2>$null
        Write-Success "Docker daemon is running"
    }
    catch {
        Write-Error "Docker daemon is not running"
        $CommandsOK = $false
    }
}
catch {
    Write-Error "Could not determine Docker version"
}

# Check essential files
Write-Host "`nChecking Essential Files..." -ForegroundColor $Colors.Blue
$FilesOK = $true

if (-not (Test-File "package.json")) { $FilesOK = $false }
if (-not (Test-File "docker-compose.yml")) { $FilesOK = $false }
if (-not (Test-File ".env.template")) { $FilesOK = $false }

if (-not (Test-File ".env")) {
    Write-Warning ".env file not found - copy from .env.template"
}

# Check essential directories
Write-Host "`nChecking Essential Directories..." -ForegroundColor $Colors.Blue
$DirsOK = $true

if (-not (Test-Directory "client")) { $DirsOK = $false }
if (-not (Test-Directory "services")) { $DirsOK = $false }
if (-not (Test-Directory "scripts")) { $DirsOK = $false }
if (-not (Test-Directory "k8s")) { $DirsOK = $false }
if (-not (Test-Directory "monitoring")) { $DirsOK = $false }

# Check cross-platform scripts
Write-Host "`nChecking Cross-Platform Scripts..." -ForegroundColor $Colors.Blue
$ScriptsOK = $true

$ScriptNames = @("deploy-microservices", "build-images", "start-monitoring")
foreach ($ScriptName in $ScriptNames) {
    $Found = $false
    $Extensions = @("ps1", "bat", "sh")
    
    foreach ($Ext in $Extensions) {
        if ((Test-Path "scripts\$ScriptName.$Ext") -or (Test-Path "$ScriptName.$Ext")) {
            $Found = $true
            break
        }
    }
    
    if ($Found) {
        Write-Success "Cross-platform script available: $ScriptName"
    }
    else {
        Write-Error "Missing cross-platform script: $ScriptName"
        $ScriptsOK = $false
    }
}

# Check Docker Compose files
Write-Host "`nChecking Docker Compose Configuration..." -ForegroundColor $Colors.Blue
$ComposeFiles = @("docker-compose.yml", "docker-compose.dev.yml", "docker-compose.microservices.yml")
foreach ($ComposeFile in $ComposeFiles) {
    if (Test-Path $ComposeFile) {
        Write-Success "Docker Compose file: $ComposeFile"
    }
    else {
        Write-Warning "Docker Compose file missing: $ComposeFile"
    }
}

# Check Kubernetes manifests
Write-Host "`nChecking Kubernetes Configuration..." -ForegroundColor $Colors.Blue
if (Test-Path "k8s" -PathType Container) {
    $K8sFiles = @(Get-ChildItem "k8s" -Filter "*.yml") + @(Get-ChildItem "k8s" -Filter "*.yaml")
    if ($K8sFiles.Count -gt 0) {
        Write-Success "Kubernetes manifests found: $($K8sFiles.Count) files"
    }
    else {
        Write-Warning "No Kubernetes manifests found in k8s/"
    }
}
else {
    Write-Warning "k8s directory not found"
}

# Check Windows-specific tools
Write-Host "`nChecking Windows-Specific Tools..." -ForegroundColor $Colors.Blue
if (Test-Command "pwsh") {
    Write-Success "PowerShell Core (pwsh) is available"
}
else {
    Write-Warning "PowerShell Core (pwsh) not found - consider upgrading"
}

if ($env:PATH -like "*Git*") {
    Write-Success "Git appears to be in PATH"
}
else {
    Write-Warning "Git may not be properly configured in PATH"
}

# Final assessment
Write-Host "`n==============================================================================" -ForegroundColor $Colors.Blue
Write-Host "VALIDATION SUMMARY" -ForegroundColor $Colors.Blue
Write-Host "==============================================================================" -ForegroundColor $Colors.Blue

if ($CommandsOK -and $FilesOK -and $DirsOK -and $ScriptsOK) {
    Write-Success "Environment is ready for cross-platform development!"
    Write-Host "`nNext steps:" -ForegroundColor $Colors.Green
    Write-Host "1. Copy .env.template to .env and configure your settings"
    Write-Host "2. Run: npm install"
    Write-Host "3. Choose your deployment method:"
    Write-Host "   - Docker: .\build-images.ps1; docker-compose up"
    Write-Host "   - Kubernetes: .\k8s\deploy-all.ps1"
    Write-Host "   - Local development: npm run dev"
    exit 0
}
else {
    Write-Error "Environment validation failed!"
    Write-Host "`nIssues found:" -ForegroundColor $Colors.Red
    if (-not $CommandsOK) { Write-Host "- Missing essential commands" }
    if (-not $FilesOK) { Write-Host "- Missing essential files" }
    if (-not $DirsOK) { Write-Host "- Missing essential directories" }
    if (-not $ScriptsOK) { Write-Host "- Missing cross-platform scripts" }
    
    Write-Host "`nPlease fix the issues above and run this script again." -ForegroundColor $Colors.Yellow
    exit 1
}
