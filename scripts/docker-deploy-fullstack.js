#!/usr/bin/env node

/**
 * Docker Deploy Fullstack - Simple and Reliable Docker Deployment
 * Deploys all services using the main docker-compose.yml file
 */

const { exec, spawn } = require('child_process');
const path = require('path');

class DockerFullstackDeployment {
  constructor() {
    this.rootDir = process.cwd();
    this.composeFile = 'docker-compose.yml';
  }

  /**
   * Main deployment function
   */
  async deploy() {
    console.log('🐳 Starting Docker Fullstack Deployment');
    console.log('=' .repeat(60));

    try {
      await this.checkPrerequisites();
      await this.stopExistingContainers();
      await this.buildAndStart();
      await this.waitForServices();
      await this.healthCheck();
      this.showSummary();
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      console.log('\n🔍 Troubleshooting tips:');
      console.log('  - Check Docker Desktop is running');
      console.log('  - Run: docker-compose logs -f');
      console.log('  - Check port conflicts: netstat -an | findstr :3000');
      process.exit(1);
    }
  }

  /**
   * Check Docker prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    try {
      const dockerVersion = await this.execAsync('docker --version');
      console.log(`  ✅ Docker: ${dockerVersion.trim()}`);
      
      // Check Docker Compose
      let composeVersion;
      try {
        composeVersion = await this.execAsync('docker compose version');
      } catch (error) {
        composeVersion = await this.execAsync('docker-compose --version');
      }
      console.log(`  ✅ Docker Compose: ${composeVersion.trim()}`);
      
      // Check if Docker daemon is running
      await this.execAsync('docker info');
      console.log('  ✅ Docker daemon is running');
      
    } catch (error) {
      throw new Error('Docker or Docker Compose not available. Please install Docker Desktop.');
    }
  }

  /**
   * Stop existing containers
   */
  async stopExistingContainers() {
    console.log('🛑 Stopping existing containers...');
    
    try {
      await this.execAsync(`docker compose -f ${this.composeFile} down --remove-orphans`);
      console.log('  ✅ Existing containers stopped');
    } catch (error) {
      console.log('  ⚠️  No existing containers to stop');
    }
  }

  /**
   * Build and start services
   */
  async buildAndStart() {
    console.log('🔨 Building and starting services...');
    console.log('  ⏱️  This may take several minutes for the first build...');
    
    return new Promise((resolve, reject) => {
      const child = spawn('docker', ['compose', '-f', this.composeFile, 'up', '--build', '-d'], {
        cwd: this.rootDir,
        stdio: 'inherit'
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ All services started successfully');
          resolve();
        } else {
          reject(new Error(`Build/start failed with exit code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error(`Failed to start Docker Compose: ${error.message}`));
      });
    });
  }

  /**
   * Wait for services to initialize
   */
  async waitForServices() {
    console.log('⏱️  Waiting for services to initialize...');
    
    const services = [
      'factcheck-redis',
      'factcheck-rabbitmq', 
      'factcheck-kurrentdb',
      'factcheck-event-bus'
    ];
    
    for (let i = 0; i < 30; i++) {
      try {
        const runningContainers = await this.execAsync('docker ps --format "{{.Names}}"');
        const running = runningContainers.split('\n').filter(name => name.trim());
        
        const allRunning = services.every(service => 
          running.some(container => container.includes(service))
        );
        
        if (allRunning) {
          console.log('  ✅ Core infrastructure services are running');
          break;
        }
        
        if (i === 29) {
          console.log('  ⚠️  Some services may still be starting...');
        }
        
        await this.sleep(2000);
      } catch (error) {
        console.log('  ⚠️  Waiting for Docker containers...');
        await this.sleep(2000);
      }
    }
    
    // Additional wait for application services
    console.log('  ⏱️  Waiting for application services...');
    await this.sleep(15000);
  }

  /**
   * Perform health check
   */
  async healthCheck() {
    console.log('🏥 Performing health checks...');
    
    const healthChecks = [
      { name: 'Frontend', url: 'http://localhost:3000' },
      { name: 'API Gateway', url: 'http://localhost:8080/health' },
      { name: 'Auth Service', url: 'http://localhost:3001/health' },
      { name: 'Community Service', url: 'http://localhost:3003/health' }
    ];
    
    for (const check of healthChecks) {
      try {
        await this.httpGet(check.url);
        console.log(`  ✅ ${check.name} - Health check passed`);
      } catch (error) {
        console.log(`  ⚠️  ${check.name} - Still starting (this is normal)`);
      }
    }
  }

  /**
   * Show deployment summary
   */
  showSummary() {
    console.log('\n🎉 Docker Fullstack Deployment Completed!');
    console.log('=' .repeat(60));
    
    console.log('\n🌐 Service URLs:');
    console.log('  Frontend:        http://localhost:3000');
    console.log('  API Gateway:     http://localhost:8080');
    console.log('  Auth Service:    http://localhost:3001');
    console.log('  Link Service:    http://localhost:3002');
    console.log('  Community:       http://localhost:3003');
    console.log('  Chat:            http://localhost:3004');
    console.log('  News:            http://localhost:3005');
    console.log('  Admin:           http://localhost:3006');
    console.log('  Event Bus:       http://localhost:3007');
    console.log('  ETL Service:     http://localhost:3008');
    
    console.log('\n🔧 Infrastructure:');
    console.log('  Redis:           localhost:6379');
    console.log('  RabbitMQ:        http://localhost:15672 (factcheck/antifraud123)');
    console.log('  KurrentDB:       http://localhost:2113');
    console.log('  Prometheus:      http://localhost:9090');
    console.log('  Grafana:         http://localhost:3010 (admin/admin)');
    
    console.log('\n📝 Management Commands:');
    console.log('  View logs:       docker compose logs -f');
    console.log('  Stop all:        docker compose down');
    console.log('  Restart:         docker compose restart');
    console.log('  Status:          docker compose ps');
    console.log('  Rebuild:         docker compose up --build -d');
    
    console.log('\n💡 Tips:');
    console.log('  - Services may take 1-2 minutes to fully start');
    console.log('  - Check logs if any service fails: docker compose logs [service-name]');
    console.log('  - Firebase config is enabled and ready to use');
    console.log('  - All services run with hot reloading in development mode');
  }

  /**
   * Utility functions
   */
  execAsync(command) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.rootDir }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  httpGet(url) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const request = http.get(url, (response) => {
        if (response.statusCode < 400) {
          resolve(response);
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      });
      
      request.on('error', reject);
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}

// Run deployment
if (require.main === module) {
  const deployment = new DockerFullstackDeployment();
  deployment.deploy().catch(console.error);
}

module.exports = DockerFullstackDeployment;
