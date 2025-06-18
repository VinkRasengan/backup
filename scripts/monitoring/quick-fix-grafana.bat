@echo off
title Quick Fix Grafana

echo =======================================
echo      QUICK FIX GRAFANA METRICS
echo =======================================
echo.

echo 🔧 Step 1: Restart Prometheus with new config...
docker-compose -f docker-compose.monitoring.yml restart prometheus
timeout /t 3 > nul

echo.
echo 🔧 Step 2: Testing auth-service metrics endpoint...
echo Making request to http://localhost:3001/metrics
curl -s http://localhost:3001/metrics > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Auth service metrics endpoint is working!
) else (
    echo ❌ Auth service metrics endpoint not responding
    echo    Make sure auth-service is running on port 3001
)

echo.
echo 🔧 Step 3: Check Prometheus targets...
echo Opening Prometheus targets page...
start http://localhost:9090/targets

echo.
echo 🔧 Step 4: Open Grafana dashboard...
timeout /t 2 > nul
start http://localhost:3010

echo.
echo 📋 What to check:
echo 1. Prometheus targets should show auth-service as UP
echo 2. Grafana dashboard should show auth-service as healthy (green 1)
echo 3. If still red (0), wait 30 seconds for metrics to update
echo.

echo 💡 If auth-service still shows as down:
echo 1. Make sure auth-service is running: npm run start:auth
echo 2. Test metrics manually: curl http://localhost:3001/metrics
echo 3. Check Prometheus logs: docker logs prometheus
echo.

pause
