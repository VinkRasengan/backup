@echo off
echo 🔧 Setting up Monitoring Stack for Windows...

REM Make scripts executable (Windows equivalent)
echo 📝 Setting up script permissions...

REM Install monitoring dependencies
echo 📦 Installing monitoring dependencies...
call npm run monitoring:install

REM Start monitoring stack
echo 🚀 Starting monitoring stack...
call npm run monitoring:start

echo ✅ Monitoring setup complete!
echo.
echo 📊 Access URLs:
echo    Grafana:      http://localhost:3001 (admin/admin123)
echo    Prometheus:   http://localhost:9090
echo    Alertmanager: http://localhost:9093
echo    Webhook:      http://localhost:5001
echo.
echo 🔧 Commands:
echo    Start:  npm run monitoring:start
echo    Stop:   npm run monitoring:stop
echo    Status: npm run monitoring:status
echo.
pause
