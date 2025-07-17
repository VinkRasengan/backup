# Dừng toàn bộ service, process, cửa sổ cmd/powershell liên quan đến npm start

Write-Host "🛑 Đang dừng toàn bộ dịch vụ FactCheck Platform..." -ForegroundColor Red

# 1. Dừng theo PID file nếu có
$pidFile = Join-Path $PSScriptRoot "..\.service-pids"
if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile
    foreach ($procId in $pids) {
        try {
            $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  🛑 Kill PID: $procId ($($proc.ProcessName))" -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        } catch {}
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    Write-Host "  ✅ Đã dừng theo PID file" -ForegroundColor Green
}

# 2. Dừng theo port (nếu có)
$ports = @(3000,3001,3002,3003,3004,3005,3006,3008,8080,9090,3010,9093,9100,4000,5001)
foreach ($port in $ports) {
    $lines = netstat -ano | findstr ":$port" | findstr "LISTENING"
    foreach ($line in $lines) {
        $parts = $line.Trim() -split '\s+'
        $procId = $parts[-1]
        if ($procId -and $procId -ne '0') {
            Write-Host "  🛑 Kill process on port $port (PID: $procId)" -ForegroundColor Yellow
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "  ✅ Đã dừng theo port" -ForegroundColor Green

# 3. Dừng các process node/npm/concurrently
$patterns = @(
    '*node*', '*npm*', '*concurrently*', '*factcheck*', '*Service*', '*react-scripts*', '*webpack*', '*phishtank*'
)
foreach ($pat in $patterns) {
    $procs = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like "*$pat*" }
    foreach ($proc in $procs) {
        try {
            Write-Host "  🛑 Kill process: $($proc.ProcessName) (PID: $($proc.ProcessId))" -ForegroundColor Yellow
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        } catch {}
    }
}
Write-Host "  ✅ Đã dừng các process node/npm/concurrently" -ForegroundColor Green

# 4. Dừng các cửa sổ PowerShell/cmd liên quan
$currentPid = $PID
Get-Process powershell | Where-Object { $_.Id -ne $currentPid -and $_.MainWindowTitle -ne "" } | ForEach-Object {
    try {
        Write-Host "  🛑 Kill PowerShell window: $($_.MainWindowTitle) (PID: $($_.Id))" -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    } catch {}
}
Get-Process cmd | Where-Object { $_.MainWindowTitle -ne "" } | ForEach-Object {
    try {
        Write-Host "  🛑 Kill CMD window: $($_.MainWindowTitle) (PID: $($_.Id))" -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    } catch {}
}
Write-Host "  ✅ Đã dừng các cửa sổ PowerShell/cmd" -ForegroundColor Green

# 5. Dừng docker (nếu có)
try {
    docker-compose -f docker-compose.monitoring.yml down | Out-Null
    docker stop antifraud-redis antifraud-api-gateway antifraud-auth antifraud-link antifraud-community antifraud-chat antifraud-news antifraud-admin | Out-Null
    docker rm antifraud-redis antifraud-api-gateway antifraud-auth antifraud-link antifraud-community antifraud-chat antifraud-news antifraud-admin | Out-Null
    Write-Host "  ✅ Đã dừng docker container" -ForegroundColor Green
} catch {}

Write-Host "\n✅ Tất cả dịch vụ đã được dừng thành công!" -ForegroundColor Green
Write-Host "💡 Bạn có thể chạy lại bằng: npm start" -ForegroundColor Cyan