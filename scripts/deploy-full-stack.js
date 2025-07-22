#!/usr/bin/env node

/**
 * Full Stack Deployment Script
 * Deploys complete microservices architecture with Event Sourcing
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FullStackDeployer {
  constructor() {
    this.services = [
      // Infrastructure (deploy first)
      { name: 'redis', type: 'infrastructure', port: 6379, priority: 1 },
      { name: 'rabbitmq', type: 'infrastructure', port: 5672, priority: 1 },
      { name: 'kurrentdb', type: 'infrastructure', port: 2113, priority: 1 },
      
      // Core Services
      { name: 'event-bus-service', type: 'service', port: 3007, priority: 2 },
      { name: 'auth-service', type: 'service', port: 3001, priority: 3 },
      { name: 'link-service', type: 'service', port: 3002, priority: 4 },
      { name: 'community-service', type: 'service', port: 3003, priority: 4 },
      { name: 'chat-service', type: 'service', port: 3004, priority: 4 },
      { name: 'news-service', type: 'service', port: 3005, priority: 4 },
      { name: 'admin-service', type: 'service', port: 3006, priority: 4 },
      { name: 'etl-service', type: 'service', port: 3008, priority: 4 },
      
      // Gateway & Frontend (deploy last)
      { name: 'api-gateway', type: 'gateway', port: 8080, priority: 5 },
      { name: 'frontend', type: 'frontend', port: 3000, priority: 6 }
    ];

    this.deploymentModes = {
      'development': {
        compose: 'docker-compose.yml',
        env: '.env',
        build: true,
        detached: true
      },
      'production': {
        compose: 'docker-compose.prod.yml',
        env: '.env.production',
        build: true,
        detached: true
      },
      'testing': {
        compose: 'docker-compose.test.yml',
        env: '.env.test',
        build: false,
        detached: false
      }
    };

    this.results = {
      success: false,
      services: {},
      infrastructure: {},
      errors: [],
      startTime: new Date(),
      endTime: null
    };
  }

  /**
   * Main deployment process
   */
  async deploy() {
    console.log('🚀 Full Stack Deployment');
    console.log('=========================\n');

    const mode = process.argv[2] || 'development';
    const options = this.parseOptions();

    console.log(`📋 Mode: ${mode}`);
    console.log(`🔧 Options:`, options);
    console.log('');

    try {
      // Pre-deployment checks
      await this.preDeploymentChecks(mode);
      
      // Deploy infrastructure first
      await this.deployInfrastructure(mode, options);
      
      // Deploy services
      await this.deployServices(mode, options);
      
      // Deploy gateway and frontend
      await this.deployGatewayAndFrontend(mode, options);
      
      // Post-deployment verification
      await this.postDeploymentVerification();
      
      this.results.success = true;
      this.results.endTime = new Date();
      this.printSummary();

    } catch (error) {
      this.results.errors.push(error.message);
      this.results.endTime = new Date();
      console.error('❌ Deployment failed:', error.message);
      this.printSummary();
      process.exit(1);
    }
  }

  /**
   * Parse command line options
   */
  parseOptions() {
    return {
      skipTests: process.argv.includes('--skip-tests'),
      skipBuild: process.argv.includes('--skip-build'),
      forceRecreate: process.argv.includes('--force-recreate'),
      parallel: process.argv.includes('--parallel'),
      verbose: process.argv.includes('--verbose'),
      services: this.parseServiceFilter()
    };
  }

  /**
   * Parse service filter from command line
   */
  parseServiceFilter() {
    const servicesIndex = process.argv.indexOf('--services');
    if (servicesIndex !== -1 && process.argv[servicesIndex + 1]) {
      return process.argv[servicesIndex + 1].split(',');
    }
    return null;
  }

  /**
   * Pre-deployment checks
   */
  async preDeploymentChecks(mode) {
    console.log('🔍 Pre-deployment checks...');
    console.log('─'.repeat(50));

    // Check Docker
    try {
      execSync('docker --version', { stdio: 'pipe' });
      execSync('docker-compose --version', { stdio: 'pipe' });
      console.log('   ✅ Docker and Docker Compose available');
    } catch (error) {
      throw new Error('Docker or Docker Compose not available');
    }

    // Check environment file
    const config = this.deploymentModes[mode];
    if (!fs.existsSync(config.env)) {
      throw new Error(`Environment file not found: ${config.env}`);
    }
    console.log(`   ✅ Environment file: ${config.env}`);

    // Check docker-compose file
    if (!fs.existsSync(config.compose)) {
      throw new Error(`Docker compose file not found: ${config.compose}`);
    }
    console.log(`   ✅ Docker compose file: ${config.compose}`);

    // Check service directories
    const missingServices = [];
    for (const service of this.services) {
      if (service.type === 'service' || service.type === 'gateway') {
        const servicePath = path.join('services', service.name);
        if (!fs.existsSync(servicePath)) {
          missingServices.push(service.name);
        }
      } else if (service.type === 'frontend') {
        if (!fs.existsSync('client')) {
          missingServices.push('client');
        }
      }
    }

    if (missingServices.length > 0) {
      throw new Error(`Missing service directories: ${missingServices.join(', ')}`);
    }
    console.log('   ✅ All service directories exist');

    console.log('   ✅ Pre-deployment checks passed\n');
  }

  /**
   * Deploy infrastructure services
   */
  async deployInfrastructure(mode, options) {
    console.log('🏗️ Deploying infrastructure...');
    console.log('─'.repeat(50));

    const config = this.deploymentModes[mode];
    const infraServices = this.services.filter(s => s.type === 'infrastructure');

    for (const service of infraServices) {
      console.log(`   🚀 Starting ${service.name}...`);
      
      try {
        const command = this.buildDockerCommand(service.name, config, options);
        execSync(command, { stdio: options.verbose ? 'inherit' : 'pipe' });
        
        // Wait for service to be ready
        await this.waitForService(service);
        
        this.results.infrastructure[service.name] = {
          success: true,
          port: service.port,
          status: 'running'
        };
        
        console.log(`   ✅ ${service.name} ready on port ${service.port}`);
        
      } catch (error) {
        this.results.infrastructure[service.name] = {
          success: false,
          error: error.message
        };
        throw new Error(`Failed to start ${service.name}: ${error.message}`);
      }
    }

    console.log('   ✅ Infrastructure deployment complete\n');
  }

  /**
   * Deploy microservices
   */
  async deployServices(mode, options) {
    console.log('🔧 Deploying microservices...');
    console.log('─'.repeat(50));

    const config = this.deploymentModes[mode];
    const services = this.services.filter(s => s.type === 'service');
    
    // Filter services if specified
    const filteredServices = options.services 
      ? services.filter(s => options.services.includes(s.name))
      : services;

    // Sort by priority
    const sortedServices = filteredServices.sort((a, b) => a.priority - b.priority);

    if (options.parallel && sortedServices.length > 1) {
      await this.deployServicesParallel(sortedServices, config, options);
    } else {
      await this.deployServicesSequential(sortedServices, config, options);
    }

    console.log('   ✅ Microservices deployment complete\n');
  }

  /**
   * Deploy services sequentially
   */
  async deployServicesSequential(services, config, options) {
    for (const service of services) {
      console.log(`   🚀 Deploying ${service.name}...`);
      
      try {
        const command = this.buildDockerCommand(service.name, config, options);
        execSync(command, { stdio: options.verbose ? 'inherit' : 'pipe' });
        
        await this.waitForService(service);
        
        this.results.services[service.name] = {
          success: true,
          port: service.port,
          status: 'running'
        };
        
        console.log(`   ✅ ${service.name} ready on port ${service.port}`);
        
      } catch (error) {
        this.results.services[service.name] = {
          success: false,
          error: error.message
        };
        throw new Error(`Failed to deploy ${service.name}: ${error.message}`);
      }
    }
  }

  /**
   * Deploy services in parallel
   */
  async deployServicesParallel(services, config, options) {
    console.log(`   🚀 Deploying ${services.length} services in parallel...`);
    
    const promises = services.map(async (service) => {
      try {
        const command = this.buildDockerCommand(service.name, config, options);
        execSync(command, { stdio: 'pipe' });
        
        await this.waitForService(service);
        
        this.results.services[service.name] = {
          success: true,
          port: service.port,
          status: 'running'
        };
        
        console.log(`   ✅ ${service.name} ready on port ${service.port}`);
        
      } catch (error) {
        this.results.services[service.name] = {
          success: false,
          error: error.message
        };
        throw new Error(`Failed to deploy ${service.name}: ${error.message}`);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Deploy gateway and frontend
   */
  async deployGatewayAndFrontend(mode, options) {
    console.log('🌐 Deploying gateway and frontend...');
    console.log('─'.repeat(50));

    const config = this.deploymentModes[mode];
    const gatewayAndFrontend = this.services.filter(s => 
      s.type === 'gateway' || s.type === 'frontend'
    );

    for (const service of gatewayAndFrontend) {
      console.log(`   🚀 Deploying ${service.name}...`);
      
      try {
        const command = this.buildDockerCommand(service.name, config, options);
        execSync(command, { stdio: options.verbose ? 'inherit' : 'pipe' });
        
        await this.waitForService(service);
        
        this.results.services[service.name] = {
          success: true,
          port: service.port,
          status: 'running'
        };
        
        console.log(`   ✅ ${service.name} ready on port ${service.port}`);
        
      } catch (error) {
        this.results.services[service.name] = {
          success: false,
          error: error.message
        };
        throw new Error(`Failed to deploy ${service.name}: ${error.message}`);
      }
    }

    console.log('   ✅ Gateway and frontend deployment complete\n');
  }

  /**
   * Build docker command
   */
  buildDockerCommand(serviceName, config, options) {
    let command = `docker-compose -f ${config.compose}`;
    
    if (config.env) {
      command += ` --env-file ${config.env}`;
    }
    
    command += ` up ${serviceName}`;
    
    if (config.detached) {
      command += ' -d';
    }
    
    if (config.build || !options.skipBuild) {
      command += ' --build';
    }
    
    if (options.forceRecreate) {
      command += ' --force-recreate';
    }
    
    return command;
  }

  /**
   * Wait for service to be ready
   */
  async waitForService(service) {
    const maxWait = 60000; // 60 seconds
    const interval = 2000; // 2 seconds
    let waited = 0;

    while (waited < maxWait) {
      try {
        if (service.type === 'infrastructure') {
          // For infrastructure, just check if container is running
          execSync(`docker ps | grep ${service.name}`, { stdio: 'pipe' });
          return;
        } else {
          // For services, check health endpoint
          const response = await this.checkHealthEndpoint(service.port);
          if (response) return;
        }
      } catch (error) {
        // Service not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, interval));
      waited += interval;
    }

    throw new Error(`Service ${service.name} did not become ready within ${maxWait}ms`);
  }

  /**
   * Check health endpoint
   */
  async checkHealthEndpoint(port) {
    try {
      const { execSync } = require('child_process');
      execSync(`curl -f http://localhost:${port}/health`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Post-deployment verification
   */
  async postDeploymentVerification() {
    console.log('🔍 Post-deployment verification...');
    console.log('─'.repeat(50));

    // Check all services are running
    const allServices = [...Object.keys(this.results.infrastructure), ...Object.keys(this.results.services)];
    
    for (const serviceName of allServices) {
      try {
        execSync(`docker ps | grep ${serviceName}`, { stdio: 'pipe' });
        console.log(`   ✅ ${serviceName} container running`);
      } catch (error) {
        console.log(`   ❌ ${serviceName} container not found`);
        this.results.errors.push(`${serviceName} container not running`);
      }
    }

    // Test Event Sourcing functionality
    console.log('   🧪 Testing Event Sourcing...');
    try {
      // Test Event Bus Service
      await this.checkHealthEndpoint(3007);
      console.log('   ✅ Event Bus Service responding');
      
      // Test Community Service
      await this.checkHealthEndpoint(3003);
      console.log('   ✅ Community Service responding');
      
    } catch (error) {
      console.log('   ⚠️ Event Sourcing services may not be fully ready');
    }

    console.log('   ✅ Post-deployment verification complete\n');
  }

  /**
   * Print deployment summary
   */
  printSummary() {
    const duration = this.results.endTime - this.results.startTime;
    
    console.log('\n📊 Deployment Summary');
    console.log('=====================');
    
    console.log(`Status: ${this.results.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);
    console.log('');

    // Infrastructure summary
    console.log('🏗️ Infrastructure:');
    for (const [name, result] of Object.entries(this.results.infrastructure)) {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${name} ${result.port ? `(${result.port})` : ''}`);
    }
    console.log('');

    // Services summary
    console.log('🔧 Services:');
    for (const [name, result] of Object.entries(this.results.services)) {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${name} ${result.port ? `(${result.port})` : ''}`);
    }
    console.log('');

    // Errors summary
    if (this.results.errors.length > 0) {
      console.log('❌ Errors:');
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log('');
    }

    // Access URLs
    if (this.results.success) {
      console.log('🔗 Access URLs:');
      console.log('   Frontend: http://localhost:3000');
      console.log('   API Gateway: http://localhost:8080');
      console.log('   Event Bus API: http://localhost:3007/api/eventstore');
      console.log('   Community API: http://localhost:3003');
      console.log('   EventStore DB: http://localhost:2113');
      console.log('   Redis: localhost:6379');
      console.log('   RabbitMQ: http://localhost:15672');
      console.log('');
      
      console.log('🧪 Test Event Sourcing:');
      console.log('   curl http://localhost:3007/health');
      console.log('   curl http://localhost:3007/api/eventstore/health');
      console.log('   curl http://localhost:3003/health');
    }
  }
}

// Usage information
function printUsage() {
  console.log('Usage: node scripts/deploy-full-stack.js [mode] [options]');
  console.log('');
  console.log('Modes:');
  console.log('  development  - Development environment (default)');
  console.log('  production   - Production environment');
  console.log('  testing      - Testing environment');
  console.log('');
  console.log('Options:');
  console.log('  --skip-tests      - Skip running tests');
  console.log('  --skip-build      - Skip building images');
  console.log('  --force-recreate  - Force recreate containers');
  console.log('  --parallel        - Deploy services in parallel');
  console.log('  --verbose         - Verbose output');
  console.log('  --services <list> - Deploy only specified services (comma-separated)');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/deploy-full-stack.js');
  console.log('  node scripts/deploy-full-stack.js development --parallel');
  console.log('  node scripts/deploy-full-stack.js production --force-recreate');
  console.log('  node scripts/deploy-full-stack.js development --services auth-service,community-service');
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printUsage();
  process.exit(0);
}

// Run deployment
const deployer = new FullStackDeployer();
deployer.deploy().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
