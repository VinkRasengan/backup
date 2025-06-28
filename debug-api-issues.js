#!/usr/bin/env node

/**
 * Comprehensive API Debug Script
 * Tests all endpoints to identify connectivity and timeout issues
 */

const axios = require('axios');

// Configuration
const SERVICES = {
  'Link Service (Direct)': 'http://localhost:3002',
  'API Gateway': 'http://localhost:8080',
  'Community Service': 'http://localhost:3003',
  'Auth Service': 'http://localhost:3001',
  'Chat Service': 'http://localhost:3004',
  'News Service': 'http://localhost:3005',
  'Admin Service': 'http://localhost:3006'
};

const TEST_ENDPOINTS = [
  {
    name: 'Direct Link Service - Check URL',
    method: 'POST',
    url: 'http://localhost:3002/links/check',
    data: { url: 'https://example.com' },
    timeout: 60000,
    critical: true
  },
  {
    name: 'API Gateway - Health Check',
    method: 'GET',
    url: 'http://localhost:8080/health',
    timeout: 10000,
    critical: true
  },
  {
    name: 'API Gateway - Main Links Route',
    method: 'POST',
    url: 'http://localhost:8080/links/check',
    data: { url: 'https://example.com' },
    timeout: 60000,
    critical: true
  },
  {
    name: 'API Gateway - Backup Links Route',
    method: 'POST',
    url: 'http://localhost:8080/link-check/check',
    data: { url: 'https://example.com' },
    timeout: 60000,
    critical: true
  },
  {
    name: 'API Gateway - Service Info',
    method: 'GET',
    url: 'http://localhost:8080/info',
    timeout: 10000,
    critical: false
  }
];

class APIDebugger {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  async checkServiceHealth(serviceName, baseUrl) {
    try {
      console.log(`🔍 Checking ${serviceName}...`);
      
      const healthUrl = `${baseUrl}/health`;
      const response = await axios.get(healthUrl, {
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status
      });

      const status = response.status < 400 ? '✅ HEALTHY' : '⚠️ UNHEALTHY';
      console.log(`   ${status} - Status: ${response.status}`);
      
      return {
        service: serviceName,
        status: response.status,
        healthy: response.status < 400,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      console.log(`   ❌ OFFLINE - Error: ${error.code || error.message}`);
      return {
        service: serviceName,
        status: 0,
        healthy: false,
        error: error.code || error.message
      };
    }
  }

  async testEndpoint(test) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   URL: ${test.method} ${test.url}`);
    
    const startTime = Date.now();
    
    try {
      const config = {
        method: test.method,
        url: test.url,
        timeout: test.timeout,
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Don't throw on any status
      };

      if (test.data) {
        config.data = test.data;
      }

      const response = await axios(config);
      const duration = Date.now() - startTime;
      
      const success = response.status >= 200 && response.status < 400;
      const statusIcon = success ? '✅' : '❌';
      
      console.log(`   ${statusIcon} Status: ${response.status} - Duration: ${duration}ms`);
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success !== undefined) {
          console.log(`   📊 Success: ${response.data.success}`);
        }
        if (response.data.error) {
          console.log(`   ⚠️ Error: ${response.data.error}`);
        }
      }

      const result = {
        name: test.name,
        success,
        status: response.status,
        duration: `${duration}ms`,
        critical: test.critical,
        data: response.data
      };

      this.results.push(result);

      if (!success && test.critical) {
        this.errors.push(`Critical endpoint failed: ${test.name} - Status: ${response.status}`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(`   💥 Error: ${error.code || error.message} - Duration: ${duration}ms`);
      
      const result = {
        name: test.name,
        success: false,
        status: error.response?.status || 0,
        duration: `${duration}ms`,
        critical: test.critical,
        error: error.code || error.message
      };

      this.results.push(result);

      if (test.critical) {
        this.errors.push(`Critical endpoint error: ${test.name} - ${error.code || error.message}`);
      }

      return result;
    }
  }

  async runFullDiagnostic() {
    console.log('🚀 Starting Comprehensive API Diagnostic...\n');
    
    // 1. Check service health
    console.log('📋 PHASE 1: Service Health Check');
    console.log('=' .repeat(50));
    
    const healthResults = [];
    for (const [serviceName, baseUrl] of Object.entries(SERVICES)) {
      const result = await this.checkServiceHealth(serviceName, baseUrl);
      healthResults.push(result);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    }

    // 2. Test specific endpoints
    console.log('\n📋 PHASE 2: Endpoint Testing');
    console.log('=' .repeat(50));
    
    for (const test of TEST_ENDPOINTS) {
      await this.testEndpoint(test);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    // 3. Generate report
    console.log('\n📊 DIAGNOSTIC REPORT');
    console.log('=' .repeat(50));
    
    console.log('\n🏥 Service Health Summary:');
    healthResults.forEach(result => {
      const icon = result.healthy ? '✅' : '❌';
      console.log(`  ${icon} ${result.service}: ${result.status}`);
    });

    console.log('\n🔍 Endpoint Test Summary:');
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const critical = result.critical ? ' [CRITICAL]' : '';
      console.log(`  ${icon} ${result.name}: ${result.status} (${result.duration})${critical}`);
    });

    if (this.errors.length > 0) {
      console.log('\n🚨 Critical Issues Found:');
      this.errors.forEach(error => console.log(`  ❌ ${error}`));
    } else {
      console.log('\n🎉 All critical endpoints are working!');
    }

    // 4. Recommendations
    console.log('\n💡 Recommendations:');
    
    const failedServices = healthResults.filter(r => !r.healthy);
    if (failedServices.length > 0) {
      console.log(`  🔧 ${failedServices.length} service(s) are down. Check if they're running.`);
    }

    const slowEndpoints = this.results.filter(r => parseInt(r.duration) > 10000);
    if (slowEndpoints.length > 0) {
      console.log(`  ⏱️ ${slowEndpoints.length} endpoint(s) are slow (>10s). Consider increasing timeouts.`);
    }

    const timeoutErrors = this.results.filter(r => r.error && r.error.includes('timeout'));
    if (timeoutErrors.length > 0) {
      console.log(`  ⏰ ${timeoutErrors.length} timeout error(s) found. Increase timeout values.`);
    }

    console.log('\n✅ Diagnostic Complete!');
  }
}

// Run diagnostic if script is executed directly
if (require.main === module) {
  const apiDebugger = new APIDebugger();
  apiDebugger.runFullDiagnostic().catch(error => {
    console.error('Diagnostic failed:', error);
    process.exit(1);
  });
}

module.exports = APIDebugger; 