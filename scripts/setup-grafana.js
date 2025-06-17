const { execSync } = require('child_process');

console.log('🎯 Setting up Grafana with Prometheus datasource and dashboards...');

// Wait for Grafana to be ready
async function waitForGrafana() {
  console.log('⏳ Waiting for Grafana to be ready...');
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      execSync('curl -s http://localhost:3010/api/health', { stdio: 'ignore' });
      console.log('✅ Grafana is ready!');
      return true;
    } catch (error) {
      attempts++;
      console.log(`⏳ Attempt ${attempts}/${maxAttempts} - Grafana not ready yet...`);
      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('❌ Grafana failed to start after 60 seconds');
  return false;
}

// Add Prometheus datasource
function addPrometheusDataSource() {
  console.log('📊 Adding Prometheus datasource...');
  
  const datasourceConfig = {
    name: 'Prometheus',
    type: 'prometheus',
    url: 'http://prometheus:9090',
    access: 'proxy',
    isDefault: true,
    basicAuth: false
  };
  
  try {
    // Create datasource using curl
    const curlCommand = `curl -X POST ` +
      `-H "Content-Type: application/json" ` +
      `-u admin:admin123 ` +
      `-d '${JSON.stringify(datasourceConfig)}' ` +
      `http://localhost:3010/api/datasources`;
    
    execSync(curlCommand, { stdio: 'inherit' });
    console.log('✅ Prometheus datasource added successfully!');
  } catch (error) {
    console.log('ℹ️  Datasource might already exist or there was an error');
  }
}

// Import dashboard
function importDashboard() {
  console.log('📈 Importing microservices dashboard...');
  
  const dashboardJson = {
    dashboard: {
      id: null,
      title: 'Microservices Monitoring',
      tags: ['microservices', 'monitoring'],
      timezone: 'browser',
      panels: [
        {
          id: 1,
          title: 'Service Status',
          type: 'stat',
          targets: [
            {
              expr: 'up',
              legendFormat: '{{job}}'
            }
          ],
          gridPos: { h: 8, w: 12, x: 0, y: 0 }
        },
        {
          id: 2,
          title: 'Request Rate',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_requests_total[5m])',
              legendFormat: '{{job}} - {{method}}'
            }
          ],
          gridPos: { h: 8, w: 12, x: 12, y: 0 }
        },
        {
          id: 3,
          title: 'Response Time',
          type: 'graph',
          targets: [
            {
              expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
              legendFormat: '{{job}} - 95th percentile'
            }
          ],
          gridPos: { h: 8, w: 12, x: 0, y: 8 }
        },
        {
          id: 4,
          title: 'CPU Usage',
          type: 'graph',
          targets: [
            {
              expr: '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
              legendFormat: 'CPU Usage - {{instance}}'
            }
          ],
          gridPos: { h: 8, w: 12, x: 12, y: 8 }
        }
      ],
      time: {
        from: 'now-1h',
        to: 'now'
      },
      refresh: '5s'
    },
    overwrite: true
  };
  
  try {
    const curlCommand = `curl -X POST ` +
      `-H "Content-Type: application/json" ` +
      `-u admin:admin123 ` +
      `-d '${JSON.stringify(dashboardJson)}' ` +
      `http://localhost:3010/api/dashboards/db`;
    
    execSync(curlCommand, { stdio: 'inherit' });
    console.log('✅ Dashboard imported successfully!');
  } catch (error) {
    console.log('❌ Error importing dashboard:', error.message);
  }
}

// Main setup function
async function setupGrafana() {
  if (!(await waitForGrafana())) {
    process.exit(1);
  }

  // Wait a bit more for full initialization
  console.log('⏳ Waiting for Grafana to fully initialize...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  addPrometheusDataSource();
  
  // Wait before importing dashboard
  console.log('⏳ Waiting before importing dashboard...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  importDashboard();
  
  console.log('');
  console.log('🎉 Grafana setup completed!');
  console.log('');
  console.log('📊 Access Grafana:');
  console.log('   URL: http://localhost:3010');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('');
  console.log('📈 Available dashboards:');
  console.log('   - Microservices Monitoring (auto-imported)');
  console.log('');
  console.log('🔧 Next steps:');
  console.log('   1. Login to Grafana');
  console.log('   2. Go to Dashboards');
  console.log('   3. Open "Microservices Monitoring"');
  console.log('   4. Start your microservices to see metrics');
}

// Run setup
setupGrafana().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
