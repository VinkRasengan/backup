#!/usr/bin/env node

/**
 * Monitoring Status Check Script
 */

const axios = require('axios').default;

const services = [
  { name: 'Frontend', url: 'http://localhost:3000', timeout: 3000 },
  { name: 'API Gateway', url: 'http://localhost:8080/health', timeout: 3000 },
  { name: 'Auth Service', url: 'http://localhost:3001/health', timeout: 3000 },
  { name: 'Link Service', url: 'http://localhost:3002/health', timeout: 3000 },
  { name: 'Community Service', url: 'http://localhost:3003/health', timeout: 3000 },
  { name: 'Chat Service', url: 'http://localhost:3004/health', timeout: 3000 },
  { name: 'News Service', url: 'http://localhost:3005/health', timeout: 3000 },
  { name: 'Admin Service', url: 'http://localhost:3006/health', timeout: 3000 }
];

const monitoringServices = [
  { name: 'Prometheus', url: 'http://localhost:9090', timeout: 3000 },
  { name: 'Grafana', url: 'http://localhost:3010', timeout: 3000 },
  { name: 'Alertmanager', url: 'http://localhost:9093', timeout: 3000 },
  { name: 'Node Exporter', url: 'http://localhost:9100', timeout: 3000 },
  { name: 'cAdvisor', url: 'http://localhost:8081', timeout: 3000 },
  { name: 'Webhook Service', url: 'http://localhost:5001', timeout: 3000 }
];

async function checkService(service) {
  try {
    const response = await axios.get(service.url, {
      timeout: service.timeout,
      validateStatus: () => true
    });
    
    return {
      name: service.name,
      status: response.status < 400 ? '✅ HEALTHY' : '⚠️ UNHEALTHY',
      statusCode: response.status,
      responseTime: 'OK'
    };
  } catch (error) {
    return {
      name: service.name,
      status: '❌ OFFLINE',
      statusCode: 0,
      error: error.code || error.message
    };
  }
}

async function checkAllServices() {
  console.log('📊 FactCheck Platform - Service Health Check');
  console.log('='.repeat(60));
  
  console.log('\n🚀 MAIN SERVICES:');
  console.log('-'.repeat(40));

  const results = await Promise.all(services.map(checkService));
  results.forEach(result => {
    console.log(`${result.status.padEnd(15)} ${result.name.padEnd(20)} (${result.statusCode})`);
  });

  console.log('\n📈 MONITORING SERVICES:');
  console.log('-'.repeat(40));

  const monitoringResults = await Promise.all(monitoringServices.map(checkService));
  monitoringResults.forEach(result => {
    console.log(`${result.status.padEnd(15)} ${result.name.padEnd(20)} (${result.statusCode})`);
  });

  // Summary
  const totalServices = results.length + monitoringResults.length;
  const healthyServices = [...results, ...monitoringResults].filter(r => r.status.includes('HEALTHY')).length;
  const offlineServices = [...results, ...monitoringResults].filter(r => r.status.includes('OFFLINE')).length;

  console.log('\n📋 SUMMARY:');
  console.log('-'.repeat(40));
  console.log(`Total Services: ${totalServices}`);
  console.log(`Healthy: ${healthyServices} ✅`);
  console.log(`Unhealthy: ${totalServices - healthyServices - offlineServices} ⚠️`);
  console.log(`Offline: ${offlineServices} ❌`);

  console.log('\n🌐 QUICK ACCESS:');
  console.log('-'.repeat(40));
  console.log('Frontend:    http://localhost:3000');
  console.log('API Gateway: http://localhost:8080');
  console.log('Grafana:     http://localhost:3010 (admin/admin123)');
  console.log('Prometheus:  http://localhost:9090');

  if (offlineServices > 0) {
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('-'.repeat(40));
    console.log('• Run: npm restart');
    console.log('• Check: npm run monitoring:start');
    console.log('• Logs: npm run monitoring:logs');
  }
}

// Run the health check
checkAllServices().catch(error => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});
