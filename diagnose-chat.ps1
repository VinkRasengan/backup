Write-Host "=== FactCheck Chat System Diagnosis ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if server is running
Write-Host "1. Checking if server is running on port 5000..." -ForegroundColor Yellow
$port5000 = netstat -an | Select-String ":5000"
if ($port5000) {
    Write-Host "✅ Server appears to be running on port 5000" -ForegroundColor Green
    Write-Host $port5000 -ForegroundColor Gray
} else {
    Write-Host "❌ No server detected on port 5000" -ForegroundColor Red
}

# Test 2: Try to connect to health endpoint
Write-Host "`n2. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Health endpoint responded: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Try chat test endpoint
Write-Host "`n3. Testing chat test endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/chat/test" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Chat test endpoint responded: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Chat test endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Try OpenAI test endpoint
Write-Host "`n4. Testing OpenAI configuration..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/chat/test-openai" -Method Get -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ OpenAI test endpoint responded: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ OpenAI test endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Try widget chat
Write-Host "`n5. Testing widget chat..." -ForegroundColor Yellow
try {
    $body = @{
        message = "Hello, this is a test message"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/chat/widget" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ Widget chat responded: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Widget chat failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Diagnosis Complete ===" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "- If server is not running, start it with: cd server && node src\app.js" -ForegroundColor White
Write-Host "- If OpenAI test fails, check API key in .env file" -ForegroundColor White
Write-Host "- If widget chat works, the basic chat should work in frontend" -ForegroundColor White

Read-Host "`nPress Enter to close"
