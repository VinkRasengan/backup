# Danh sách các service cần chạy
$services = @(
    "services\api-gateway",
    "services\auth-service",
    "services\link-service",
    "services\community-service",
    "services\chat-service",
    "services\news-service",
    "services\admin-service",
    "services\phishtank-service",
    "client"
)

# Đường dẫn file lưu PID
$pidFile = "$PSScriptRoot\..\.service-pids"
if (Test-Path $pidFile) { Remove-Item $pidFile }

foreach ($service in $services) {
    $proc = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$PSScriptRoot\..\$service`"; npm start" -PassThru
    Add-Content -Path $pidFile -Value $proc.Id
} 