#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Validates that all services are running correctly
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class DeploymentValidator {
  constructor() {
    this.services = [
      { name: 'Frontend', url: 'http://localhost:3000', timeout: 10000 },
      { name: 'API Gateway', url: 'http://localhost:8080/health', timeout: 5000 },
      { name: 'Auth Service', url: 'http://localhost:3001/health', timeout: 5000 },
      { name: 'Link Service', url: 'http://localhost:3002/health', timeout: 5000 },
      { name: 'Community Service', url: 'http://localhost:3003/health', timeout: 5000 },
      { name: 'Chat Service', url: 'http://localhost:3004/health', timeout: 5000 },
      { name: 'News Service', url: 'http://localhost:3005/health', timeout: 5000 },
      { name: 'Admin Service', url: 'http://localhost:3006/health', timeout: 5000 },
      { name: 'PhishTank Service', url: 'http://localhost:3007/health', timeout: 5000 },
      { name: 'CriminalIP Service', url: 'http://localhost:3008/health', timeout: 5000 }
    ];
    
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async checkService(service) {
    return new Promise((resolve) => {
      const url = new URL(service.url);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(service.url, { timeout: service.timeout }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const success = res.statusCode >= 200 && res.statusCode < 400;
          resolve({
            success,
            statusCode: res.statusCode,
            data: data.substring(0, 200), // Limit data length
            responseTime: Date.now() - startTime
          });
        });
      });

      const startTime = Date.now();
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          responseTime: service.timeout
        });
      });
    });
  }

  async validateAllServices() {
    this.log('🔍 Starting deployment validation...', 'info');
    
    for (const service of this.services) {
      this.log(`Checking ${service.name}...`, 'info');
      
      const result = await this.checkService(service);
      
      if (result.success) {
        this.log(`✅ ${service.name} is healthy (${result.responseTime}ms)`, 'success');
        this.results.passed++;
      } else {
        this.log(`❌ ${service.name} failed: ${result.error || `HTTP ${result.statusCode}`}`, 'error');
        this.results.failed++;
      }
      
      this.results.details.push({
        service: service.name,
        url: service.url,
        success: result.success,
        statusCode: result.statusCode,
        error: result.error,
        responseTime: result.responseTime
      });
    }
  }

  async validateAPIEndpoints() {
    this.log('🔗 Validating API endpoints...', 'info');
    
    const apiTests = [
      { name: 'API Gateway Status', url: 'http://localhost:8080/health' },
      { name: 'Auth Service Status', url: 'http://localhost:3001/health' },
      { name: 'API Gateway Routes', url: 'http://localhost:8080/api/health' }
    ];

    for (const test of apiTests) {
      const result = await this.checkService(test);
      
      if (result.success) {
        this.log(`✅ ${test.name} is accessible`, 'success');
      } else {
        this.log(`⚠️  ${test.name} is not accessible`, 'warning');
      }
    }
  }

  async validateDockerContainers() {
    this.log('🐳 Validating Docker containers...', 'info');
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const child = spawn('docker', ['ps', '--format', 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'], {
        stdio: 'pipe'
      });

      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          this.log('Docker containers status:', 'info');
          console.log(output);
          
          const lines = output.split('\n');
          const containerCount = lines.length - 2; // Exclude header and empty line
          
          if (containerCount > 0) {
            this.log(`✅ Found ${containerCount} running containers`, 'success');
          } else {
            this.log('⚠️  No Docker containers found running', 'warning');
          }
        } else {
          this.log('❌ Failed to check Docker containers', 'error');
        }
        resolve();
      });

      child.on('error', () => {
        this.log('⚠️  Docker not available or not running', 'warning');
        resolve();
      });
    });
  }

  generateReport() {
    this.log('\n📊 Deployment Validation Report', 'info');
    this.log('================================', 'info');
    
    const totalServices = this.results.passed + this.results.failed;
    const successRate = ((this.results.passed / totalServices) * 100).toFixed(1);
    
    this.log(`Total Services: ${totalServices}`, 'info');
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
    this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
    
    if (this.results.failed > 0) {
      this.log('\n❌ Failed Services:', 'error');
      this.results.details
        .filter(detail => !detail.success)
        .forEach(detail => {
          this.log(`  - ${detail.service}: ${detail.error || `HTTP ${detail.statusCode}`}`, 'error');
        });
    }
    
    this.log('\n🔗 Service URLs:', 'info');
    this.log('  - Frontend: http://localhost:3000', 'info');
    this.log('  - API Gateway: http://localhost:8080', 'info');
    this.log('  - Health Check: http://localhost:8080/health', 'info');
    
    return successRate >= 80;
  }

  async validate() {
    try {
      await this.validateAllServices();
      await this.validateAPIEndpoints();
      await this.validateDockerContainers();
      
      const success = this.generateReport();
      
      if (success) {
        this.log('\n🎉 Deployment validation passed!', 'success');
        process.exit(0);
      } else {
        this.log('\n💥 Deployment validation failed!', 'error');
        this.log('Please check the failed services and try again.', 'error');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`💥 Validation error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DeploymentValidator();
  validator.validate();
}

module.exports = DeploymentValidator;
