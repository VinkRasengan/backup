#!/usr/bin/env node

/**
 * API Gateway Verification Script
 * Tests all routes and proxy configurations
 */

const axios = require('axios');

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
const TIMEOUT = 10000; // 10 seconds

// Test routes configuration
const TEST_ROUTES = [
  {
    name: 'API Gateway Health Check',
    method: 'GET',
    path: '/health',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'API Gateway Info',
    method: 'GET', 
    path: '/info',
    expectedStatus: 200,
    critical: true
  },
  {
    name: 'Auth Service Health (via proxy)',
    method: 'GET',
    path: '/api/auth/health',
    expectedStatus: [200, 404, 503],
    critical: false
  },
  {
    name: 'Link Service Health (via proxy)',
    method: 'GET',
    path: '/api/links/health',
    expectedStatus: [200, 404, 503],
    critical: false
  },
  {
    name: 'Community Service Health (via proxy)',
    method: 'GET',
    path: '/api/community/health',
    expectedStatus: [200, 404, 503],
    critical: false
  },
  {
    name: 'Votes Endpoint (via proxy)',
    method: 'POST',
    path: '/api/votes/batch/stats',
    body: { linkIds: ['test-id'] },
    expectedStatus: [200, 400, 503],
    critical: true
  },
  {
    name: 'Chat Service Health (via proxy)',
    method: 'GET',
    path: '/api/chat/health',
    expectedStatus: [200, 404, 503],
    critical: false
  },
  {
    name: 'News Service Health (via proxy)',
    method: 'GET',
    path: '/api/news/health',
    expectedStatus: [200, 404, 503],
    critical: false
  },
  {
    name: 'Admin Service Health (via proxy)',
    method: 'GET',
    path: '/api/admin/health',
    expectedStatus: [200, 404, 503],
    critical: false
  }
];

class APIGatewayVerifier {
  constructor() {
    this.results = [];
    this.errors = [];
    this.client = axios.create({
      baseURL: API_GATEWAY_URL,
      timeout: TIMEOUT,
      validateStatus: () => true // Don't throw on any status code
    });
  }

  async testRoute(route) {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 Testing: ${route.name}`);
      
      const config = {
        method: route.method,
        url: route.path,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'API-Gateway-Verifier/1.0'
        }
      };

      if (route.body) {
        config.data = route.body;
      }

      const response = await this.client.request(config);
      const duration = Date.now() - startTime;

      const expectedStatuses = Array.isArray(route.expectedStatus) 
        ? route.expectedStatus 
        : [route.expectedStatus];

      const success = expectedStatuses.includes(response.status);
      
      const result = {
        name: route.name,
        path: route.path,
        method: route.method,
        status: response.status,
        duration: `${duration}ms`,
        success,
        critical: route.critical,
        response: response.data,
        error: null
      };

      if (success) {
        console.log(`   ✅ ${response.status} - ${duration}ms`);
      } else {
        console.log(`   ❌ ${response.status} (expected ${expectedStatuses.join(' or ')}) - ${duration}ms`);
        if (route.critical) {
          this.errors.push(`Critical route failed: ${route.name}`);
        }
      }

      this.results.push(result);
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(`   💥 Error: ${error.message} - ${duration}ms`);
      
      const result = {
        name: route.name,
        path: route.path,
        method: route.method,
        status: 'ERROR',
        duration: `${duration}ms`,
        success: false,
        critical: route.critical,
        response: null,
        error: error.message
      };

      if (route.critical) {
        this.errors.push(`Critical route error: ${route.name} - ${error.message}`);
      }

      this.results.push(result);
      return result;
    }
  }

  async runAllTests() {
    console.log(`🚀 Starting API Gateway verification...`);
    console.log(`🔗 Target: ${API_GATEWAY_URL}`);
    console.log(`⏱️  Timeout: ${TIMEOUT}ms\n`);

    const startTime = Date.now();

    // Test all routes
    for (const route of TEST_ROUTES) {
      await this.testRoute(route);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const totalDuration = Date.now() - startTime;
    
    // Generate report
    this.generateReport(totalDuration);
  }

  generateReport(totalDuration) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 API GATEWAY VERIFICATION REPORT');
    console.log('='.repeat(60));

    const successful = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const critical = this.results.filter(r => r.critical).length;
    const criticalFailed = this.results.filter(r => r.critical && !r.success).length;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Critical Tests: ${critical}`);
    console.log(`   Critical Failures: ${criticalFailed}`);
    console.log(`   Total Duration: ${totalDuration}ms`);

    console.log(`\n📋 Detailed Results:`);
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const critical = result.critical ? ' [CRITICAL]' : '';
      console.log(`   ${icon} ${result.name}${critical}`);
      console.log(`      ${result.method} ${result.path} → ${result.status} (${result.duration})`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });

    if (this.errors.length > 0) {
      console.log(`\n🚨 Critical Issues:`);
      this.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }

    console.log(`\n🎯 Overall Status: ${criticalFailed === 0 ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`);
    
    if (criticalFailed > 0) {
      console.log('\n💡 Recommendations:');
      console.log('   - Check if all services are running');
      console.log('   - Verify environment variables are set correctly');
      console.log('   - Check service URLs and network connectivity');
      console.log('   - Review API Gateway logs for detailed errors');
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run verification if called directly
if (require.main === module) {
  const verifier = new APIGatewayVerifier();
  verifier.runAllTests().catch(error => {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  });
}

module.exports = { APIGatewayVerifier, TEST_ROUTES };
