Write-Host "=== Testing Chat Endpoints ===" -ForegroundColor Green

# Test health endpoint
try {
    Write-Host "`n1. Testing health endpoint..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    Write-Host "✅ Health check: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test chat test endpoint
try {
    Write-Host "`n2. Testing chat test endpoint..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chat/test" -Method Get
    Write-Host "✅ Chat test: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Chat test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test OpenAI test endpoint
try {
    Write-Host "`n3. Testing OpenAI test endpoint..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chat/test-openai" -Method Get
    Write-Host "✅ OpenAI test: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ OpenAI test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test simple chat message
try {
    Write-Host "`n4. Testing simple chat message..." -ForegroundColor Yellow
    $body = @{
        message = "Hello, can you help me fact-check something?"
        conversationId = "test-conversation"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/chat/message" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Chat message: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ Chat message failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Green
Read-Host "Press Enter to close"
