# Danh sách các service cần stop
$services = @(
    "services\api-gateway",
    "services\auth-service",
    "services\link-service",
    "services\community-service",
    "services\chat-service",
    "services\news-service",
    "services\admin-service",
    "services\phishtank-service"
)

foreach ($service in $services) {
    $fullPath = Resolve-Path "$PSScriptRoot\..\$service"
    Get-WmiObject Win32_Process | Where-Object {
        $_.CommandLine -like "*$($fullPath)*" -and $_.CommandLine -like "*node*"
    } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force
    }
}

# Đường dẫn file lưu PID
$pidFile = "$PSScriptRoot\..\.service-pids"
if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile
    foreach ($processId in $pids) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        } catch {}
    }
    Remove-Item $pidFile
}

# Kill luôn các cửa sổ PowerShell con đã mở (trừ chính mình)
Get-Process powershell | Where-Object { $_.MainWindowTitle -ne "" -and $_.Id -ne $PID } | Stop-Process -Force 