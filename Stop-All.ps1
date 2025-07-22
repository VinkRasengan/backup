# Enhanced Stop All Services - PowerShell Script
# Provides advanced process and terminal management for Windows

param(
    [switch]$Force,
    [switch]$Ports,
    [switch]$Emergency,
    [switch]$Help
)

# Colors for output
$Red = "Red"
$Green = "Green" 
$Yellow = "Yellow"
$Cyan = "Cyan"
$Magenta = "Magenta"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "Enhanced Stop All Services - PowerShell Edition" $Cyan
    Write-ColorOutput "=" * 50 $Cyan
    Write-ColorOutput ""
    Write-ColorOutput "Usage:" $Yellow
    Write-ColorOutput "  .\Stop-All.ps1                 # Normal stop (recommended)"
    Write-ColorOutput "  .\Stop-All.ps1 -Force          # Force stop (aggressive)"
    Write-ColorOutput "  .\Stop-All.ps1 -Ports          # Kill by ports only"
    Write-ColorOutput "  .\Stop-All.ps1 -Emergency      # Nuclear option"
    Write-ColorOutput "  .\Stop-All.ps1 -Help           # Show this help"
    Write-ColorOutput ""
    Write-ColorOutput "Examples:" $Yellow
    Write-ColorOutput "  .\Stop-All.ps1                 # Safe stop"
    Write-ColorOutput "  .\Stop-All.ps1 -Force          # When normal stop fails"
    Write-ColorOutput "  .\Stop-All.ps1 -Emergency      # Last resort"
    Write-ColorOutput ""
}

function Stop-ProcessesByPort {
    param([int[]]$Ports)
    
    Write-ColorOutput "🔌 Stopping processes by port..." $Cyan
    
    foreach ($port in $Ports) {
        try {
            $connections = netstat -ano | Select-String ":$port "
            if ($connections) {
                foreach ($connection in $connections) {
                    $parts = $connection.ToString().Split(' ', [StringSplitOptions]::RemoveEmptyEntries)
                    if ($parts.Length -gt 4) {
                        $pid = $parts[-1]
                        if ($pid -match '^\d+$') {
                            try {
                                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                                Write-ColorOutput "    ✅ Killed process PID $pid on port $port" $Green
                            }
                            catch {
                                Write-ColorOutput "    ⚠️  Process PID $pid already stopped" $Yellow
                            }
                        }
                    }
                }
            }
        }
        catch {
            Write-ColorOutput "    ⚠️  No process found on port $port" $Yellow
        }
    }
}

function Stop-ProcessesByName {
    param([string[]]$ProcessNames)
    
    Write-ColorOutput "📛 Stopping processes by name..." $Cyan
    
    foreach ($processName in $ProcessNames) {
        try {
            $processes = Get-Process -Name $processName.Replace('.exe', '') -ErrorAction SilentlyContinue
            if ($processes) {
                foreach ($process in $processes) {
                    try {
                        Stop-Process -Id $process.Id -Force
                        Write-ColorOutput "    ✅ Killed $processName PID $($process.Id)" $Green
                    }
                    catch {
                        Write-ColorOutput "    ⚠️  Could not kill $processName PID $($process.Id)" $Yellow
                    }
                }
            }
        }
        catch {
            Write-ColorOutput "    ⚠️  No $processName processes found" $Yellow
        }
    }
}

function Close-ServiceWindows {
    Write-ColorOutput "🪟 Closing service terminal windows..." $Cyan
    
    $windowTitles = @(
        "*Service*",
        "*Gateway*", 
        "*Frontend*",
        "*Auth*",
        "*Link*",
        "*Community*",
        "*Chat*",
        "*News*",
        "*Admin*"
    )
    
    foreach ($title in $windowTitles) {
        try {
            $processes = Get-WmiObject Win32_Process | Where-Object { 
                $_.CommandLine -like "*cmd*" -and $_.Name -eq "cmd.exe" 
            }
            
            foreach ($process in $processes) {
                try {
                    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
                }
                catch {
                    # Ignore errors
                }
            }
        }
        catch {
            # Ignore errors
        }
    }
    
    Write-ColorOutput "    ✅ Terminal windows closed" $Green
}

function Invoke-NormalStop {
    Write-ColorOutput "🛑 Running normal stop..." $Cyan
    
    if (Test-Path "scripts/stop-all.js") {
        try {
            & node "scripts/stop-all.js"
            Write-ColorOutput "✅ Normal stop completed" $Green
        }
        catch {
            Write-ColorOutput "❌ Normal stop failed: $($_.Exception.Message)" $Red
            Write-ColorOutput "🔄 Falling back to PowerShell stop..." $Yellow
            Invoke-PowerShellStop
        }
    }
    else {
        Write-ColorOutput "⚠️  stop-all.js not found, using PowerShell stop" $Yellow
        Invoke-PowerShellStop
    }
}

function Invoke-ForceStop {
    Write-ColorOutput "💀 Running force stop..." $Red
    Write-ColorOutput "⚠️  This will forcefully kill ALL related processes!" $Yellow
    
    if (Test-Path "scripts/stop-windows-force.js") {
        try {
            & node "scripts/stop-windows-force.js"
            Write-ColorOutput "✅ Force stop completed" $Green
        }
        catch {
            Write-ColorOutput "❌ Force stop script failed: $($_.Exception.Message)" $Red
            Write-ColorOutput "🔄 Using PowerShell force stop..." $Yellow
            Invoke-PowerShellForceStop
        }
    }
    else {
        Write-ColorOutput "⚠️  stop-windows-force.js not found, using PowerShell force stop" $Yellow
        Invoke-PowerShellForceStop
    }
}

function Invoke-PowerShellStop {
    $ports = @(3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 6379, 5672, 15672)
    $processNames = @("node", "npm", "npx", "nodemon")
    
    Stop-ProcessesByPort -Ports $ports
    Stop-ProcessesByName -ProcessNames $processNames
    Close-ServiceWindows
}

function Invoke-PowerShellForceStop {
    Write-ColorOutput "🔥 PowerShell force stop..." $Red
    
    # Kill all Node.js related processes
    $processNames = @("node", "npm", "npx", "nodemon", "cmd")
    Stop-ProcessesByName -ProcessNames $processNames
    
    # Kill by ports
    $ports = @(3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 6379, 5672, 15672)
    Stop-ProcessesByPort -Ports $ports
    
    # Close windows
    Close-ServiceWindows
    
    Write-ColorOutput "✅ PowerShell force stop completed" $Green
}

function Invoke-EmergencyStop {
    Write-ColorOutput "🚨 EMERGENCY STOP - NUCLEAR OPTION!" $Red
    Write-ColorOutput "This will kill ALL Node.js processes system-wide!" $Yellow
    
    $confirmation = Read-Host "Type 'YES' to confirm emergency stop"
    if ($confirmation -eq "YES") {
        Write-ColorOutput "💥 Executing emergency stop..." $Red
        
        # Kill everything
        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
        Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force  
        Get-Process -Name "npx" -ErrorAction SilentlyContinue | Stop-Process -Force
        Get-Process -Name "nodemon" -ErrorAction SilentlyContinue | Stop-Process -Force
        
        # Close all cmd windows
        Get-Process -Name "cmd" -ErrorAction SilentlyContinue | Stop-Process -Force
        
        Write-ColorOutput "💥 Emergency stop completed!" $Red
    }
    else {
        Write-ColorOutput "Emergency stop cancelled" $Yellow
        Invoke-NormalStop
    }
}

# Main execution
Write-ColorOutput ""
Write-ColorOutput "🚀 Enhanced Stop All Services - PowerShell Edition" $Magenta
Write-ColorOutput "=" * 60 $Magenta
Write-ColorOutput ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-ColorOutput "❌ ERROR: package.json not found!" $Red
    Write-ColorOutput "Please run this script from the project root directory." $Red
    exit 1
}

# Handle parameters
if ($Help) {
    Show-Help
    exit 0
}

if ($Emergency) {
    Invoke-EmergencyStop
}
elseif ($Force) {
    Invoke-ForceStop
}
elseif ($Ports) {
    $ports = @(3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 6379, 5672, 15672)
    Stop-ProcessesByPort -Ports $ports
}
else {
    Invoke-NormalStop
}

Write-ColorOutput ""
Write-ColorOutput "🎉 Stop operation completed!" $Green
Write-ColorOutput ""
Write-ColorOutput "You can restart with:" $Cyan
Write-ColorOutput "  npm start" $Yellow
Write-ColorOutput "  npm run start" $Yellow
Write-ColorOutput ""
Write-ColorOutput "Check status with:" $Cyan  
Write-ColorOutput "  npm run status" $Yellow
Write-ColorOutput ""
