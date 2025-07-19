#!/usr/bin/env node
/**
 * Create Monitoring Directories Script
 * Creates necessary directories for Prometheus and Grafana
 */

const fs = require('fs');
const path = require('path');

class MonitoringDirCreator {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.monitoringDir = path.join(this.rootDir, 'monitoring');
  }

  /**
   * Create all monitoring directories
   */
  create() {
    console.log('📁 Creating monitoring directories...');
    
    try {
      // Create main monitoring directory
      this.createDir(this.monitoringDir);
      
      // Create Prometheus directories
      const prometheusDir = path.join(this.monitoringDir, 'prometheus');
      this.createDir(prometheusDir);
      
      // Create Grafana directories
      const grafanaDir = path.join(this.monitoringDir, 'grafana');
      this.createDir(grafanaDir);
      
      const grafanaProvisioningDir = path.join(grafanaDir, 'provisioning');
      this.createDir(grafanaProvisioningDir);
      
      const grafanaDashboardsDir = path.join(grafanaProvisioningDir, 'dashboards');
      this.createDir(grafanaDashboardsDir);
      
      const grafanaDatasourcesDir = path.join(grafanaProvisioningDir, 'datasources');
      this.createDir(grafanaDatasourcesDir);
      
      // Create basic Prometheus config if it doesn't exist
      this.createPrometheusConfig();
      
      // Create basic Grafana datasource config
      this.createGrafanaDatasourceConfig();
      
      console.log('✅ All monitoring directories created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create monitoring directories:', error.message);
      process.exit(1);
    }
  }

  /**
   * Create directory if it doesn't exist
   */
  createDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  ✅ Created: ${path.relative(this.rootDir, dirPath)}`);
    } else {
      console.log(`  ℹ️  Exists: ${path.relative(this.rootDir, dirPath)}`);
    }
  }

  /**
   * Create basic Prometheus configuration
   */
  createPrometheusConfig() {
    const prometheusConfigPath = path.join(this.monitoringDir, 'prometheus', 'prometheus.yml');
    
    if (!fs.existsSync(prometheusConfigPath)) {
      const prometheusConfig = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:8080']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'link-service'
    static_configs:
      - targets: ['link-service:3002']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'community-service'
    static_configs:
      - targets: ['community-service:3003']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'chat-service'
    static_configs:
      - targets: ['chat-service:3004']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'news-service'
    static_configs:
      - targets: ['news-service:3005']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'admin-service'
    static_configs:
      - targets: ['admin-service:3006']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
`;

      fs.writeFileSync(prometheusConfigPath, prometheusConfig);
      console.log('  ✅ Created Prometheus configuration');
    } else {
      console.log('  ℹ️  Prometheus configuration already exists');
    }
  }

  /**
   * Create Grafana datasource configuration
   */
  createGrafanaDatasourceConfig() {
    const datasourceConfigPath = path.join(
      this.monitoringDir, 
      'grafana', 
      'provisioning', 
      'datasources', 
      'prometheus.yml'
    );
    
    if (!fs.existsSync(datasourceConfigPath)) {
      const datasourceConfig = `apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
`;

      fs.writeFileSync(datasourceConfigPath, datasourceConfig);
      console.log('  ✅ Created Grafana datasource configuration');
    } else {
      console.log('  ℹ️  Grafana datasource configuration already exists');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const creator = new MonitoringDirCreator();
  creator.create();
}

module.exports = MonitoringDirCreator;
