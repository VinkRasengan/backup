@echo off
title Fix Grafana Service Discovery

echo.
echo ========================================
echo    FIX GRAFANA SERVICE DISCOVERY
echo ========================================
echo.

echo 🔧 This will fix Grafana showing services as down
echo.
echo What this script will do:
echo 1. Add /metrics endpoints to all services
echo 2. Fix Prometheus configuration
echo 3. Install missing dependencies
echo.

set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    goto :end
)

echo.
echo 📦 Step 1: Installing prom-client dependencies...
echo.

REM Install prom-client in each service
echo Installing in auth-service...
cd services\auth-service
call npm install prom-client@^15.1.0
cd ..\..

echo Installing in api-gateway...
cd services\api-gateway
call npm install prom-client@^15.1.0
cd ..\..

echo Installing in link-service...
cd services\link-service
call npm install prom-client@^15.1.0
cd ..\..

echo Installing in community-service...
cd services\community-service
call npm install prom-client@^15.1.0
cd ..\..

echo Installing in chat-service...
cd services\chat-service
call npm install prom-client@^15.1.0
cd ..\..

echo Installing in news-service...
cd services\news-service
call npm install prom-client@^15.1.0
cd ..\..

echo Installing in admin-service...
cd services\admin-service
call npm install prom-client@^15.1.0
cd ..\..

echo.
echo ✅ Dependencies installed!
echo.

echo 🔧 Step 2: Updating Prometheus configuration...
echo.

REM Backup original config
if exist monitoring\prometheus\prometheus.yml (
    copy monitoring\prometheus\prometheus.yml monitoring\prometheus\prometheus.yml.backup
    echo ✅ Backed up original config
)

REM Create new Prometheus config with host.docker.internal
echo global: > monitoring\prometheus\prometheus.yml
echo   scrape_interval: 15s >> monitoring\prometheus\prometheus.yml
echo   evaluation_interval: 15s >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo rule_files: >> monitoring\prometheus\prometheus.yml
echo   - "alert_rules.yml" >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo alerting: >> monitoring\prometheus\prometheus.yml
echo   alertmanagers: >> monitoring\prometheus\prometheus.yml
echo     - static_configs: >> monitoring\prometheus\prometheus.yml
echo         - targets: >> monitoring\prometheus\prometheus.yml
echo           - alertmanager:9093 >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo scrape_configs: >> monitoring\prometheus\prometheus.yml
echo   # Prometheus itself >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'prometheus' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['localhost:9090'] >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo   # Node Exporter >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'node-exporter' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['node-exporter:9100'] >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo   # API Gateway >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'api-gateway' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['host.docker.internal:8082'] >> monitoring\prometheus\prometheus.yml
echo     metrics_path: '/metrics' >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo   # Auth Service >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'auth-service' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['host.docker.internal:3001'] >> monitoring\prometheus\prometheus.yml
echo     metrics_path: '/metrics' >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo   # Link Service >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'link-service' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['host.docker.internal:3002'] >> monitoring\prometheus\prometheus.yml
echo     metrics_path: '/metrics' >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo   # Community Service >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'community-service' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['host.docker.internal:3003'] >> monitoring\prometheus\prometheus.yml
echo     metrics_path: '/metrics' >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo   # Chat Service >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'chat-service' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['host.docker.internal:3004'] >> monitoring\prometheus\prometheus.yml
echo     metrics_path: '/metrics' >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo   # News Service >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'news-service' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['host.docker.internal:3005'] >> monitoring\prometheus\prometheus.yml
echo     metrics_path: '/metrics' >> monitoring\prometheus\prometheus.yml
echo. >> monitoring\prometheus\prometheus.yml
echo   # Admin Service >> monitoring\prometheus\prometheus.yml
echo   - job_name: 'admin-service' >> monitoring\prometheus\prometheus.yml
echo     static_configs: >> monitoring\prometheus\prometheus.yml
echo       - targets: ['host.docker.internal:3006'] >> monitoring\prometheus\prometheus.yml
echo     metrics_path: '/metrics' >> monitoring\prometheus\prometheus.yml

echo ✅ Prometheus config updated!
echo.

echo 🔄 Step 3: Restarting Prometheus...
docker-compose -f docker-compose.monitoring.yml restart prometheus

echo.
echo 🎉 Fix completed!
echo.
echo 📋 Next steps:
echo 1. Add metrics endpoints to your services manually
echo 2. Restart all your microservices
echo 3. Check Prometheus targets: http://localhost:9090/targets
echo 4. Refresh Grafana dashboard: http://localhost:3010
echo.
echo 💡 To add metrics endpoints, add this to each service's app.js:
echo.
echo const promClient = require('prom-client');
echo collectDefaultMetrics = promClient.collectDefaultMetrics;
echo collectDefaultMetrics({ timeout: 5000 });
echo.
echo app.get('/metrics', async (req, res) =^> {
echo   const metrics = await promClient.register.metrics();
echo   res.set('Content-Type', promClient.register.contentType);
echo   res.end(metrics);
echo });
echo.

:end
pause
