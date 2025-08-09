import { exec  } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
r Start Script
 * Starts all services with Docker Compose for development
 */

import { exec  } from 'child_process';
const util = require('util');
import path from 'path';

const execAsync = util.promisify(exec);

class DockerStarter {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.composeFile = 'docker-compose.dev.yml';
  }

  /**
   * Main start method
   */
  async start() {
    console.log('🐳 Starting FactCheck Platform with Docker...\n');
    
    try {
      // Step 1: Check Docker
      await this.checkDocker();
      
      // Step 2: Check environment
      await this.checkEnvironment();

      // Step 3: Copy environment to services
      await this.copyEnvironmentToServices();

      // Step 4: Start services
      await this.startServices();
      
      // Step 5: Wait for services to be ready
      await this.waitForServices();

      // Step 6: Show access information
      this.showAccessInfo();

      // Step 7: Setup graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('• Make sure Docker is running');
      console.log('• Try: npm run setup:full');
      console.log('• Check: npm run health');
      process.exit(1);
    }
  }

  /**
   * Check Docker availability
   */
  async checkDocker() {
    console.log('1. 🔍 Checking Docker...');
    
    try {
      await execAsync('docker info', { timeout: 10000 });
      console.log('  ✅ Docker is running');
    } catch (error) {
      throw new Error('Docker is not running. Please start Docker Desktop.');
    }
  }

  /**
   * Check environment setup
   */
  async checkEnvironment() {
    console.log('2. 🔧 Checking environment...');
    
    import fs from 'fs';
    const envPath = path.join(this.rootDir, '.env');
    
    if (!fs.existsSync(envPath)) {
      throw new Error('.env file not found. Please run: npm run setup:full');
    }
    
    console.log('  ✅ Environment file exists');
  }

  /**
   * Setup service-specific environment files (NEW MICROSERVICES APPROACH)
   */
  async copyEnvironmentToServices() {
    console.log('3. 📋 Setting up service-specific environment files...');

    import fs from 'fs';
    const envPath = path.join(this.rootDir, '.env');

    if (!fs.existsSync(envPath)) {
      console.log('  ⚠️  .env file not found, skipping setup');
      return;
    }

    // Load root environment variables
    require('dotenv').config({ path: envPath });

    const servicesDir = path.join(this.rootDir, 'services');
    const clientDir = path.join(this.rootDir, 'client');
    let setupCount = 0;

    // Setup service-specific .env files (don't overwrite existing ones)
    if (fs.existsSync(servicesDir)) {
      const services = fs.readdirSync(servicesDir).filter(item => {
        const servicePath = path.join(servicesDir, item);
        return fs.statSync(servicePath).isDirectory() &&
               fs.existsSync(path.join(servicePath, 'package.json'));
      });

      for (const service of services) {
        const serviceEnvPath = path.join(servicesDir, service, '.env');

        // Only create if doesn't exist or is empty
        if (!fs.existsSync(serviceEnvPath) || fs.readFileSync(serviceEnvPath, 'utf8').trim().length === 0) {
          try {
            await this.createServiceEnvFile(service, serviceEnvPath);
            console.log(`  ✅ Created service-specific .env for ${service}`);
            setupCount++;
          } catch (error) {
            console.log(`  ⚠️  Failed to create .env for ${service}: ${error.message}`);
          }
        } else {
          console.log(`  ✅ Service .env already exists for ${service}`);
          setupCount++;
        }
      }
    }

    // Setup client .env (only React-specific variables)
    if (fs.existsSync(clientDir)) {
      const clientEnvPath = path.join(clientDir, '.env');

      if (!fs.existsSync(clientEnvPath) || fs.readFileSync(clientEnvPath, 'utf8').trim().length === 0) {
        try {
          await this.createClientEnvFile(clientEnvPath);
          console.log('  ✅ Created client-specific .env');
          setupCount++;
        } catch (error) {
          console.log(`  ⚠️  Failed to create client .env: ${error.message}`);
        }
      } else {
        console.log('  ✅ Client .env already exists');
        setupCount++;
      }
    }

    console.log(`  📊 Environment setup completed for ${setupCount} locations`);
    console.log('  💡 Each service now has its own isolated configuration');
  }

  /**
   * Start Docker services
   */
  async startServices() {
    console.log('4. 🚀 Starting all services...');
    console.log('  ⏱️  This may take a moment...\n');
    
    try {
      // Stop any existing containers first
      console.log('  🛑 Stopping existing containers...');
      await execAsync(`docker-compose -f ${this.composeFile} down --remove-orphans`, { 
        cwd: this.rootDir,
        timeout: 60000 
      });
      
      // Start all services
      console.log('  🚀 Starting all services...');
      const command = `docker-compose -f ${this.composeFile} up -d`;
      
      // Show real-time output
      const child = exec(command, { cwd: this.rootDir, timeout: 300000 });
      
      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      
      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
      
      await new Promise((resolve, reject) => {
        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Docker compose failed with code ${code}`));
          }
        });
        
        child.on('error', reject);
      });
      
      console.log('\n  ✅ All services started successfully!');
      
    } catch (error) {
      throw new Error(`Failed to start services: ${error.message}`);
    }
  }

  /**
   * Wait for services to be ready
   */
  async waitForServices() {
    console.log('5. ⏳ Waiting for services to be ready...');
    
    const services = [
      { name: 'Redis', url: 'http://localhost:6379', timeout: 30000 },
      { name: 'API Gateway', url: 'http://localhost:8080/health', timeout: 60000 },
      { name: 'Frontend', url: 'http://localhost:3000', timeout: 90000 }
    ];
    
    for (const service of services) {
      console.log(`  ⏳ Waiting for ${service.name}...`);
      await this.waitForService(service.name, service.url, service.timeout);
      console.log(`  ✅ ${service.name} is ready`);
    }
    
    console.log('  ✅ All services are ready!');
  }

  /**
   * Wait for a specific service
   */
  async waitForService(name, url, timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        if (name === 'Redis') {
          // Check Redis with docker command
          await execAsync('docker exec factcheck-redis redis-cli ping', { timeout: 5000 });
          return;
        } else {
          // Check HTTP services
          const axios = require('axios');
          await axios.get(url, { timeout: 5000 });
          return;
        }
      } catch (error) {
        // Service not ready yet, wait and retry
        await this.sleep(2000);
      }
    }
    
    console.log(`  ⚠️  ${name} may not be fully ready (timeout reached)`);
  }

  /**
   * Show access information
   */
  showAccessInfo() {
    console.log('\n🎉 FactCheck Platform is running!');
    console.log('\n🌐 Access Points:');
    console.log('  🖥️  Frontend:          http://localhost:3000');
    console.log('  🔌 API Gateway:       http://localhost:8080');
    console.log('  🔐 Auth Service:      http://localhost:3001');
    console.log('  🔗 Link Service:      http://localhost:3002');
    console.log('  👥 Community Service: http://localhost:3003');
    console.log('  💬 Chat Service:      http://localhost:3004');
    console.log('  📰 News Service:      http://localhost:3005');
    console.log('  ⚙️  Admin Service:     http://localhost:3006');
    console.log('  🔴 Redis:             localhost:6379');
    console.log('  📊 Prometheus:        http://localhost:9090');
    console.log('  📈 Grafana:           http://localhost:3010 (admin/admin123)');
    
    console.log('\n🛠️  Management Commands:');
    console.log('  📋 View logs:         npm run logs');
    console.log('  📊 Check status:      npm run status');
    console.log('  🔄 Restart:           npm restart');
    console.log('  🛑 Stop all:          npm stop');
    
    console.log('\n💡 Tips:');
    console.log('  • All data is persisted in Docker volumes');
    console.log('  • Edit .env file to change configuration');
    console.log('  • Use Ctrl+C to stop all services');
    
    console.log('\n✨ Happy coding! Press Ctrl+C to stop all services.');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async () => {
      console.log('\n\n🛑 Shutting down services...');
      
      try {
        await execAsync(`docker-compose -f ${this.composeFile} down`, { 
          cwd: this.rootDir,
          timeout: 60000 
        });
        console.log('✅ All services stopped successfully');
      } catch (error) {
        console.log('⚠️  Error during shutdown:', error.message);
      }
      
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /**
   * Create service-specific .env file with intelligent variable extraction
   */
  async createServiceEnvFile(serviceName, envPath) {
    import fs from 'fs';

    // Service configuration mapping (simplified for docker-start)
    const serviceConfigs = {
      'api-gateway': {
        port: 8080,
        vars: ['SERVICE_NAME', 'API_GATEWAY_PORT', 'JWT_SECRET', 'AUTH_SERVICE_URL', 'LINK_SERVICE_URL', 'COMMUNITY_SERVICE_URL', 'CHAT_SERVICE_URL', 'NEWS_SERVICE_URL', 'ADMIN_SERVICE_URL']
      },
      'auth-service': {
        port: 3001,
        vars: ['SERVICE_NAME', 'AUTH_SERVICE_PORT', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET']
      },
      'chat-service': {
        port: 3004,
        vars: ['SERVICE_NAME', 'CHAT_SERVICE_PORT', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'GEMINI_API_KEY']
      },
      'link-service': {
        port: 3002,
        vars: ['SERVICE_NAME', 'LINK_SERVICE_PORT', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'VIRUSTOTAL_API_KEY', 'GOOGLE_SAFE_BROWSING_API_KEY', 'SCAMADVISER_API_KEY', 'IPQUALITYSCORE_API_KEY']
      },
      'community-service': {
        port: 3003,
        vars: ['SERVICE_NAME', 'COMMUNITY_SERVICE_PORT', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET']
      },
      'news-service': {
        port: 3005,
        vars: ['SERVICE_NAME', 'NEWS_SERVICE_PORT', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'NEWSAPI_API_KEY', 'NEWSDATA_API_KEY']
      },
      'admin-service': {
        port: 3006,
        vars: ['SERVICE_NAME', 'ADMIN_SERVICE_PORT', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET']
      },
      'phishtank-service': {
        port: 3007,
        vars: ['SERVICE_NAME', 'PHISHTANK_SERVICE_PORT', 'JWT_SECRET', 'PHISHTANK_API_KEY']
      },
      'criminalip-service': {
        port: 3008,
        vars: ['SERVICE_NAME', 'CRIMINALIP_SERVICE_PORT', 'JWT_SECRET', 'CRIMINALIP_API_KEY']
      }
    };

    const config = serviceConfigs[serviceName];
    if (!config) {
      // Default config for unknown services
      const content = `SERVICE_NAME=${serviceName}\nJWT_SECRET=${process.env.JWT_SECRET || ''}\n`;
      fs.writeFileSync(envPath, content);
      return;
    }

    let content = `# ${serviceName.toUpperCase().replace('-', ' ')} - ENVIRONMENT CONFIGURATION\n`;
    content += `SERVICE_NAME=${serviceName}\n`;

    config.vars.forEach(varName => {
      let value = process.env[varName];

      // Handle service-specific port mapping
      if (varName.endsWith('_PORT')) {
        const servicePortName = varName.replace('_PORT', '').toLowerCase().replace('_', '-');
        if (servicePortName === serviceName) {
          value = config.port;
        }
      }

      // Add variable if it exists
      if (value !== undefined && varName !== 'SERVICE_NAME') {
        content += `${varName}=${value}\n`;
      }
    });

    fs.writeFileSync(envPath, content);
  }

  /**
   * Create client-specific .env file
   */
  async createClientEnvFile(envPath) {
    import fs from 'fs';

    const content = `# CLIENT (REACT APP) - ENVIRONMENT CONFIGURATION
REACT_APP_API_URL=${process.env.REACT_APP_API_URL || 'http://localhost:8080'}
REACT_APP_FIREBASE_API_KEY=${process.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE'}
REACT_APP_FIREBASE_AUTH_DOMAIN=${process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'factcheck-1d6e8.firebaseapp.com'}
REACT_APP_FIREBASE_PROJECT_ID=${process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'factcheck-1d6e8'}
`;

    fs.writeFileSync(envPath, content);
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const starter = new DockerStarter();
  starter.start().catch(console.error);
}

export default DockerStarter;
