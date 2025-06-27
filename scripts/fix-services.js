#!/usr/bin/env node

const { spawn } = require('child_process');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const isWindows = os.platform() === 'win32';

class ServiceFixer {
  constructor() {
    this.services = [
      { name: 'link-service', port: 3002 },
      { name: 'chat-service', port: 3004 }
    ];
  }

  async fix() {
    console.log('🔧 Fixing Link & Chat Services...');
    console.log('='.repeat(50));

    try {
      // Step 1: Check if .env exists
      await this.checkEnvironment();

      // Step 2: Check Firebase emulator
      await this.checkFirebaseEmulator();

      // Step 3: Restart problematic services
      await this.restartServices();

      console.log('✅ Services fixed successfully!');
      console.log('🌐 Try accessing:');
      console.log('  - Link Service: http://localhost:3002/health');
      console.log('  - Chat Service: http://localhost:3004/health');
      
    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    console.log('1. 🔍 Checking environment...');
    
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log('  ⚠️ .env file missing, creating minimal .env...');
      const envContent = `# Development Environment
FIREBASE_PROJECT_ID=factcheck-1d6e8
NODE_ENV=development
FIRESTORE_EMULATOR_HOST=127.0.0.1:8081
AUTH_SERVICE_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
`;
      fs.writeFileSync(envPath, envContent);
      console.log('  ✅ .env file created');
    } else {
      console.log('  ✅ .env file exists');
    }
  }

  async checkFirebaseEmulator() {
    console.log('2. 🔥 Checking Firebase emulator...');
    
    return new Promise((resolve) => {
      exec('netstat -ano | findstr :8081', (error, stdout) => {
        if (stdout.includes('8081')) {
          console.log('  ✅ Firebase emulator is running');
          resolve();
        } else {
          console.log('  ⚠️ Firebase emulator not running, starting...');
          this.startFirebaseEmulator();
          setTimeout(resolve, 5000); // Wait for emulator to start
        }
      });
    });
  }

  startFirebaseEmulator() {
    const command = isWindows ? 'firebase.cmd' : 'firebase';
    const emulator = spawn(command, ['emulators:start', '--only', 'firestore', '--project', 'factcheck-1d6e8'], {
      detached: true,
      stdio: 'ignore'
    });
    emulator.unref();
    console.log('  🚀 Firebase emulator starting...');
  }

  async restartServices() {
    console.log('3. 🔄 Restarting services...');
    
    for (const service of this.services) {
      try {
        console.log(`  🛑 Stopping ${service.name}...`);
        
        // Kill existing service process
        await this.killServiceOnPort(service.port);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`  🚀 Starting ${service.name}...`);
        
        // Start service
        const servicePath = path.join(process.cwd(), 'services', service.name);
        const child = spawn('npm.cmd', ['start'], {
          cwd: servicePath,
          env: { ...process.env, PORT: service.port },
          detached: true,
          stdio: 'ignore'
        });
        child.unref();
        
        console.log(`  ✅ ${service.name} restarted`);
        
      } catch (error) {
        console.log(`  ⚠️ Failed to restart ${service.name}: ${error.message}`);
      }
    }
    
    // Wait for services to start
    console.log('  ⏳ Waiting for services to initialize...');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  async killServiceOnPort(port) {
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          lines.forEach(line => {
            const match = line.match(/LISTENING\s+(\d+)/);
            if (match) {
              const pid = match[1];
              exec(`taskkill /PID ${pid} /F`, () => {});
            }
          });
        }
        resolve();
      });
    });
  }
}

// Run the fixer
const fixer = new ServiceFixer();
fixer.fix().catch(console.error); 