#!/usr/bin/env node

/**
 * Enhanced Monitoring and Logging for CI/CD
 * Provides comprehensive monitoring, logging, and alerting capabilities
 */

const fs = require('fs');
const path = require('path');

class EnhancedMonitoring {
  constructor() {
    this.projectRoot = process.cwd();
    this.metrics = {
      startTime: Date.now(),
      services: {},
      errors: [],
      warnings: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toISOString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async setupMonitoring() {
    this.log('🔍 Setting up Enhanced Monitoring...', 'info');
    this.log('==========================================', 'info');

    await this.createPrometheusConfig();
    await this.createGrafanaDashboards();
    await this.setupLogging();
    await this.createHealthChecks();
    
    this.generateMonitoringReport();
  }

  async createPrometheusConfig() {
    this.log('\n1. 📊 Creating Prometheus configuration...', 'info');
    
    const prometheusConfig = `global:
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
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'link-service'
    static_configs:
      - targets: ['link-service:3002']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'community-service'
    static_configs:
      - targets: ['community-service:3003']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'chat-service'
    static_configs:
      - targets: ['chat-service:3004']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'news-service'
    static_configs:
      - targets: ['news-service:3005']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'admin-service'
    static_configs:
      - targets: ['admin-service:3006']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    scrape_interval: 10s

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']
    scrape_interval: 10s`;

    const prometheusDir = path.join(this.projectRoot, 'monitoring', 'prometheus');
    if (!fs.existsSync(prometheusDir)) {
      fs.mkdirSync(prometheusDir, { recursive: true });
    }

    fs.writeFileSync(path.join(prometheusDir, 'prometheus.yml'), prometheusConfig);
    this.log('✅ Created Prometheus configuration', 'success');
  }

  async createGrafanaDashboards() {
    this.log('\n2. 📈 Creating Grafana dashboards...', 'info');
    
    const grafanaDir = path.join(this.projectRoot, 'monitoring', 'grafana', 'dashboards');
    if (!fs.existsSync(grafanaDir)) {
      fs.mkdirSync(grafanaDir, { recursive: true });
    }

    // Microservices Overview Dashboard
    const microservicesDashboard = {
      "dashboard": {
        "id": null,
        "title": "Microservices Overview",
        "tags": ["microservices"],
        "timezone": "browser",
        "panels": [
          {
            "id": 1,
            "title": "Service Health",
            "type": "stat",
            "targets": [
              {
                "expr": "up",
                "legendFormat": "{{job}}"
              }
            ]
          },
          {
            "id": 2,
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total[5m])",
                "legendFormat": "{{job}}"
              }
            ]
          },
          {
            "id": 3,
            "title": "Response Time",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "{{job}}"
              }
            ]
          },
          {
            "id": 4,
            "title": "Error Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
                "legendFormat": "{{job}}"
              }
            ]
          }
        ]
      }
    };

    fs.writeFileSync(
      path.join(grafanaDir, 'microservices-overview.json'),
      JSON.stringify(microservicesDashboard, null, 2)
    );

    this.log('✅ Created Grafana dashboards', 'success');
  }

  async setupLogging() {
    this.log('\n3. 📝 Setting up logging configuration...', 'info');
    
    const loggingConfig = `# Logging configuration for microservices
log_level: info
log_format: json
log_output: stdout

# Structured logging fields
log_fields:
  service: ${process.env.SERVICE_NAME || 'unknown'}
  version: ${process.env.SERVICE_VERSION || '1.0.0'}
  environment: ${process.env.NODE_ENV || 'development'}

# Log rotation
log_rotation:
  max_size: 100MB
  max_files: 5
  max_age: 7d

# Error tracking
error_tracking:
  enabled: true
  sample_rate: 1.0
  ignore_patterns:
    - "ECONNREFUSED"
    - "ENOTFOUND"`;

    const configDir = path.join(this.projectRoot, 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(path.join(configDir, 'logging.yml'), loggingConfig);
    this.log('✅ Created logging configuration', 'success');
  }

  async createHealthChecks() {
    this.log('\n4. 🏥 Creating health check scripts...', 'info');
    
    const healthCheckScript = `#!/bin/bash

# Enhanced Health Check Script
# Checks all microservices health endpoints

set -e

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Configuration
SERVICES=(
  "api-gateway:8080"
  "auth-service:3001"
  "link-service:3002"
  "community-service:3003"
  "chat-service:3004"
  "news-service:3005"
  "admin-service:3006"
)

TIMEOUT=30
RETRY_INTERVAL=5

log() {
    echo -e "\${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] \$1\${NC}"
}

error() {
    echo -e "\${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: \$1\${NC}"
}

warning() {
    echo -e "\${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: \$1\${NC}"
}

check_service() {
    local service=\$1
    local host=\$(echo \$service | cut -d: -f1)
    local port=\$(echo \$service | cut -d: -f2)
    local url="http://\${host}:\${port}/health"
    
    log "Checking \${host}:\${port}..."
    
    for i in \$(seq 1 \$TIMEOUT); do
        if curl -f -s "\${url}" > /dev/null 2>&1; then
            log "✅ \${host} is healthy"
            return 0
        fi
        
        if [ \$i -lt \$TIMEOUT ]; then
            warning "\${host} not ready, retrying in \${RETRY_INTERVAL}s... (\${i}/\${TIMEOUT})"
            sleep \$RETRY_INTERVAL
        fi
    done
    
    error "\${host} failed health check after \${TIMEOUT} attempts"
    return 1
}

# Check all services
main() {
    log "Starting health checks..."
    
    local failed_services=()
    
    for service in "\${SERVICES[@]}"; do
        if ! check_service "\$service"; then
            failed_services+=("\$service")
        fi
    done
    
    if [ \${#failed_services[@]} -eq 0 ]; then
        log "🎉 All services are healthy!"
        exit 0
    else
        error "❌ The following services failed health checks:"
        for service in "\${failed_services[@]}"; do
            error "  - \$service"
        done
        exit 1
    fi
}

main "\$@"`;

    const scriptsDir = path.join(this.projectRoot, 'scripts');
    fs.writeFileSync(path.join(scriptsDir, 'health-check.sh'), healthCheckScript);
    
    // Make script executable
    const { execSync } = require('child_process');
    try {
      execSync(`chmod +x ${path.join(scriptsDir, 'health-check.sh')}`);
    } catch (error) {
      this.log('⚠️ Could not make script executable (Windows)', 'warning');
    }

    this.log('✅ Created health check script', 'success');
  }

  generateMonitoringReport() {
    this.log('\n📊 MONITORING SETUP REPORT', 'info');
    this.log('='.repeat(50), 'info');
    
    this.log('\n✅ MONITORING COMPONENTS CREATED:', 'success');
    this.log('1. Prometheus configuration (monitoring/prometheus/prometheus.yml)', 'success');
    this.log('2. Grafana dashboards (monitoring/grafana/dashboards/)', 'success');
    this.log('3. Logging configuration (config/logging.yml)', 'success');
    this.log('4. Health check script (scripts/health-check.sh)', 'success');
    
    this.log('\n📋 NEXT STEPS:', 'info');
    this.log('1. Add monitoring services to docker-compose.yml', 'info');
    this.log('2. Configure alerting rules in Prometheus', 'info');
    this.log('3. Set up Grafana data sources', 'info');
    this.log('4. Integrate with external monitoring services', 'info');
    
    this.log('\n🔧 INTEGRATION COMMANDS:', 'info');
    this.log('• Run health checks: ./scripts/health-check.sh', 'info');
    this.log('• Start monitoring: docker-compose -f docker-compose.monitoring.yml up -d', 'info');
    this.log('• View metrics: http://localhost:9090 (Prometheus)', 'info');
    this.log('• View dashboards: http://localhost:3000 (Grafana)', 'info');
    
    this.log('\n🎯 MONITORING FEATURES:', 'info');
    this.log('• Real-time service health monitoring', 'info');
    this.log('• Performance metrics collection', 'info');
    this.log('• Error rate tracking', 'info');
    this.log('• Response time analysis', 'info');
    this.log('• Automated health checks', 'info');
    
    this.log('\n🎉 Enhanced monitoring setup completed!', 'success');
  }
}

// Run monitoring setup if called directly
if (require.main === module) {
  const monitoring = new EnhancedMonitoring();
  monitoring.setupMonitoring().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Monitoring setup failed:', error);
    process.exit(1);
  });
}

module.exports = EnhancedMonitoring; 