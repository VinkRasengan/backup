#!/usr/bin/env node

/**
 * Deploy Docker All - Comprehensive Docker Deployment Script
 * Deploys all services and client using Docker Compose
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class DockerDeployment {
  constructor() {
    this.rootDir = process.cwd();
    this.composeFile = 'docker-compose.local.yml';
    this.services = [
      'redis',
      'auth-service',
      'link-service', 
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'api-gateway',
      'client'
    ];
  }

  /**
   * Main deployment function
   */
  async deploy() {
    console.log('🐳 Starting Docker Deployment - All Services & Client');
    console.log('=' .repeat(60));

    try {
      await this.checkPrerequisites();
      await this.createDockerComposeFile();
      await this.buildImages();
      await this.startServices();
      await this.healthCheck();
      this.showSummary();
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Check Docker prerequisites
   */
  async checkPrerequisites() {
    console.log('🔍 Checking Docker prerequisites...');
    
    try {
      // Check Docker
      const dockerVersion = await this.execAsync('docker --version');
      console.log(`  ✅ Docker: ${dockerVersion.trim()}`);
      
      // Check Docker Compose
      const composeVersion = await this.execAsync('docker-compose --version');
      console.log(`  ✅ Docker Compose: ${composeVersion.trim()}`);
      
      // Check if Docker daemon is running
      await this.execAsync('docker info');
      console.log('  ✅ Docker daemon is running');
      
    } catch (error) {
      throw new Error('Docker or Docker Compose not available. Please install Docker Desktop.');
    }

    console.log('✅ Prerequisites check passed');
  }

  /**
   * Create optimized docker-compose file for local development
   */
  async createDockerComposeFile() {
    console.log('📝 Creating Docker Compose configuration...');
    
    const composeContent = `version: '3.8'

networks:
  factcheck-network:
    driver: bridge

volumes:
  redis-data:
    driver: local
  node_modules_auth:
  node_modules_link:
  node_modules_community:
  node_modules_chat:
  node_modules_news:
  node_modules_admin:
  node_modules_gateway:
  node_modules_client:

services:
  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: factcheck-redis-local
    ports:
      - "6379:6379"
    command: redis-server --requirepass antifraud123 --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - factcheck-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Auth Service
  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile
    container_name: factcheck-auth-local
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - REDIS_HOST=redis
      - REDIS_PASSWORD=antifraud123
    volumes:
      - ./services/auth-service:/app
      - node_modules_auth:/app/node_modules
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - factcheck-network
    restart: unless-stopped

  # Link Service
  link-service:
    build:
      context: ./services/link-service
      dockerfile: Dockerfile
    container_name: factcheck-link-local
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - PORT=3002
      - REDIS_HOST=redis
      - REDIS_PASSWORD=antifraud123
    volumes:
      - ./services/link-service:/app
      - node_modules_link:/app/node_modules
    depends_on:
      - redis
    networks:
      - factcheck-network
    restart: unless-stopped

  # Community Service
  community-service:
    build:
      context: ./services/community-service
      dockerfile: Dockerfile
    container_name: factcheck-community-local
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - PORT=3003
      - REDIS_HOST=redis
      - REDIS_PASSWORD=antifraud123
      - AUTH_SERVICE_URL=http://auth-service:3001
    volumes:
      - ./services/community-service:/app
      - node_modules_community:/app/node_modules
    depends_on:
      - redis
      - auth-service
    networks:
      - factcheck-network
    restart: unless-stopped

  # Chat Service
  chat-service:
    build:
      context: ./services/chat-service
      dockerfile: Dockerfile
    container_name: factcheck-chat-local
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=development
      - PORT=3004
      - REDIS_HOST=redis
      - REDIS_PASSWORD=antifraud123
      - AUTH_SERVICE_URL=http://auth-service:3001
    volumes:
      - ./services/chat-service:/app
      - node_modules_chat:/app/node_modules
    depends_on:
      - redis
      - auth-service
    networks:
      - factcheck-network
    restart: unless-stopped

  # News Service
  news-service:
    build:
      context: ./services/news-service
      dockerfile: Dockerfile
    container_name: factcheck-news-local
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=development
      - PORT=3005
      - REDIS_HOST=redis
      - REDIS_PASSWORD=antifraud123
      - AUTH_SERVICE_URL=http://auth-service:3001
    volumes:
      - ./services/news-service:/app
      - node_modules_news:/app/node_modules
    depends_on:
      - redis
      - auth-service
    networks:
      - factcheck-network
    restart: unless-stopped

  # Admin Service
  admin-service:
    build:
      context: ./services/admin-service
      dockerfile: Dockerfile
    container_name: factcheck-admin-local
    ports:
      - "3006:3006"
    environment:
      - NODE_ENV=development
      - PORT=3006
      - REDIS_HOST=redis
      - REDIS_PASSWORD=antifraud123
      - AUTH_SERVICE_URL=http://auth-service:3001
    volumes:
      - ./services/admin-service:/app
      - node_modules_admin:/app/node_modules
    depends_on:
      - redis
      - auth-service
    networks:
      - factcheck-network
    restart: unless-stopped

  # API Gateway
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile
    container_name: factcheck-gateway-local
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=development
      - PORT=8080
      - REDIS_HOST=redis
      - REDIS_PASSWORD=antifraud123
      - AUTH_SERVICE_URL=http://auth-service:3001
      - LINK_SERVICE_URL=http://link-service:3002
      - COMMUNITY_SERVICE_URL=http://community-service:3003
      - CHAT_SERVICE_URL=http://chat-service:3004
      - NEWS_SERVICE_URL=http://news-service:3005
      - ADMIN_SERVICE_URL=http://admin-service:3006
    volumes:
      - ./services/api-gateway:/app
      - node_modules_gateway:/app/node_modules
    depends_on:
      - redis
      - auth-service
      - link-service
      - community-service
      - chat-service
      - news-service
      - admin-service
    networks:
      - factcheck-network
    restart: unless-stopped

  # Client (Frontend)
  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: factcheck-client-local
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - REACT_APP_API_URL=http://localhost:8080
    volumes:
      - ./client:/app
      - node_modules_client:/app/node_modules
    depends_on:
      - api-gateway
    networks:
      - factcheck-network
    restart: unless-stopped
`;

    const composeFilePath = path.join(this.rootDir, this.composeFile);
    fs.writeFileSync(composeFilePath, composeContent);
    
    console.log(`  ✅ Created ${this.composeFile}`);
  }

  /**
   * Build Docker images
   */
  async buildImages() {
    console.log('🔨 Building Docker images...');
    console.log('  ⏱️  This may take several minutes for the first build...');
    
    try {
      const buildCommand = `docker-compose -f ${this.composeFile} build --parallel`;
      
      // Show real-time output
      const child = spawn('docker-compose', ['-f', this.composeFile, 'build', '--parallel'], {
        cwd: this.rootDir,
        stdio: 'inherit'
      });
      
      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Build failed with exit code ${code}`));
          }
        });
        
        child.on('error', reject);
      });
      
      console.log('✅ Docker images built successfully');
    } catch (error) {
      throw new Error(`Failed to build images: ${error.message}`);
    }
  }

  /**
   * Start all services
   */
  async startServices() {
    console.log('🚀 Starting Docker services...');
    
    try {
      // Stop any existing containers
      console.log('  🛑 Stopping existing containers...');
      await this.execAsync(`docker-compose -f ${this.composeFile} down --remove-orphans`, {
        cwd: this.rootDir
      });
      
      // Start services
      console.log('  🚀 Starting all services...');
      const startCommand = `docker-compose -f ${this.composeFile} up -d`;
      
      const child = spawn('docker-compose', ['-f', this.composeFile, 'up', '-d'], {
        cwd: this.rootDir,
        stdio: 'inherit'
      });
      
      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Start failed with exit code ${code}`));
          }
        });
        
        child.on('error', reject);
      });
      
      console.log('✅ All services started');
    } catch (error) {
      throw new Error(`Failed to start services: ${error.message}`);
    }
  }

  /**
   * Perform health check
   */
  async healthCheck() {
    console.log('🏥 Performing health checks...');
    
    // Wait for services to start
    console.log('  ⏱️  Waiting for services to initialize...');
    await this.sleep(15000);
    
    const healthChecks = [
      { name: 'Redis', url: null, container: 'factcheck-redis-local' },
      { name: 'Auth Service', url: 'http://localhost:3001/health' },
      { name: 'Link Service', url: 'http://localhost:3002/health' },
      { name: 'Community Service', url: 'http://localhost:3003/health' },
      { name: 'Chat Service', url: 'http://localhost:3004/health' },
      { name: 'News Service', url: 'http://localhost:3005/health' },
      { name: 'Admin Service', url: 'http://localhost:3006/health' },
      { name: 'API Gateway', url: 'http://localhost:8080/health' },
      { name: 'Client', url: 'http://localhost:3000' }
    ];
    
    for (const check of healthChecks) {
      try {
        if (check.container) {
          // Check container status
          const status = await this.execAsync(`docker inspect --format='{{.State.Status}}' ${check.container}`);
          if (status.trim() === 'running') {
            console.log(`  ✅ ${check.name} - Container running`);
          } else {
            console.log(`  ❌ ${check.name} - Container not running`);
          }
        } else if (check.url) {
          // HTTP health check
          await this.httpGet(check.url);
          console.log(`  ✅ ${check.name} - Health check passed`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${check.name} - Health check failed (service might still be starting)`);
      }
    }
    
    console.log('✅ Health checks completed');
  }

  /**
   * Show deployment summary
   */
  showSummary() {
    console.log('\n🎉 Docker Deployment Completed Successfully!');
    console.log('=' .repeat(60));
    console.log('🐳 Container Status:');
    
    // Show container status
    exec(`docker-compose -f ${this.composeFile} ps`, { cwd: this.rootDir }, (error, stdout) => {
      if (!error) {
        console.log(stdout);
      }
    });
    
    console.log('\n🌐 Service URLs:');
    console.log('  Frontend:     http://localhost:3000');
    console.log('  API Gateway:  http://localhost:8080');
    console.log('  Auth Service: http://localhost:3001');
    console.log('  Link Service: http://localhost:3002');
    console.log('  Community:    http://localhost:3003');
    console.log('  Chat:         http://localhost:3004');
    console.log('  News:         http://localhost:3005');
    console.log('  Admin:        http://localhost:3006');
    console.log('  Redis:        localhost:6379');
    
    console.log('\n📝 Management Commands:');
    console.log(`  View logs:    docker-compose -f ${this.composeFile} logs -f`);
    console.log(`  Stop all:     docker-compose -f ${this.composeFile} down`);
    console.log(`  Restart:      docker-compose -f ${this.composeFile} restart`);
    console.log(`  Status:       docker-compose -f ${this.composeFile} ps`);
    
    console.log('\n💡 Tips:');
    console.log('  - All services run in isolated containers');
    console.log('  - Volume mounts enable hot reloading');
    console.log('  - Use Docker Desktop to monitor containers');
    console.log('  - Check logs if services fail to start');
  }

  /**
   * Utility functions
   */
  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
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
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }
}

// Run deployment
if (require.main === module) {
  const deployment = new DockerDeployment();
  deployment.deploy().catch(console.error);
}

module.exports = DockerDeployment;
