# Fix Prometheus Service Discovery
# Update Prometheus config for proper service discovery

Write-Host "🔧 Fixing Prometheus service discovery..." -ForegroundColor Green

# Backup original config
$prometheusConfig = "monitoring/prometheus/prometheus.yml"
$backupConfig = "monitoring/prometheus/prometheus.yml.backup"

if (Test-Path $prometheusConfig) {
    Copy-Item $prometheusConfig $backupConfig
    Write-Host "✅ Backed up original Prometheus config" -ForegroundColor Green
}

# New Prometheus configuration with proper service discovery
$newPrometheusConfig = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter for system metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # API Gateway Service (host network)
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['host.docker.internal:8082']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Auth Service (host network)
  - job_name: 'auth-service'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Link Service (host network)
  - job_name: 'link-service'
    static_configs:
      - targets: ['host.docker.internal:3002']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Community Service (host network)
  - job_name: 'community-service'
    static_configs:
      - targets: ['host.docker.internal:3003']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Chat Service (host network)
  - job_name: 'chat-service'
    static_configs:
      - targets: ['host.docker.internal:3004']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # News Service (host network)
  - job_name: 'news-service'
    static_configs:
      - targets: ['host.docker.internal:3005']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Admin Service (host network)
  - job_name: 'admin-service'
    static_configs:
      - targets: ['host.docker.internal:3006']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # CriminalIP Service (host network)
  - job_name: 'criminalip-service'
    static_configs:
      - targets: ['host.docker.internal:3007']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # PhishTank Service (host network)
  - job_name: 'phishtank-service'
    static_configs:
      - targets: ['host.docker.internal:3008']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Frontend Health Check (host network)
  - job_name: 'frontend'
    static_configs:
      - targets: ['host.docker.internal:3000']
    metrics_path: '/health'
    scrape_interval: 30s
    scrape_timeout: 10s
"@

# Write new config
$newPrometheusConfig | Out-File -FilePath $prometheusConfig -Encoding UTF8
Write-Host "✅ Updated Prometheus configuration" -ForegroundColor Green

Write-Host "🔄 Restarting Prometheus container..." -ForegroundColor Cyan
try {
    # Restart Prometheus container
    docker-compose -f docker-compose.monitoring.yml restart prometheus
    Write-Host "✅ Prometheus restarted successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart Prometheus: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "1. Make sure all your services are running on localhost"
Write-Host "2. Check Prometheus targets: http://localhost:9090/targets"
Write-Host "3. Services should be accessible at:"
Write-Host "   - API Gateway: http://localhost:8082/metrics"
Write-Host "   - Auth Service: http://localhost:3001/metrics"
Write-Host "   - Link Service: http://localhost:3002/metrics"
Write-Host "   - etc..."
Write-Host ""
Write-Host "🔍 Test metrics endpoints:" -ForegroundColor Yellow
Write-Host "curl http://localhost:3001/metrics"
Write-Host "curl http://localhost:3002/metrics"
Write-Host "curl http://localhost:8082/metrics"
