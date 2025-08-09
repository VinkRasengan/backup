import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

/**
 * Cross-Platform Stop Script
 * Safely stops all services across different platforms
 */

import { spawn  } from 'child_process';
import os from 'os';
import path from 'path';

class CrossPlatformStopper {
  constructor() {
    this.platform = os.platform();
    this.isWindows = this.platform === 'win32';
    this.projectRoot = path.resolve(__dirname, '..');
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

  async execCommand(command, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
      const shell = this.isWindows ? 'cmd' : 'bash';
      const shellFlag = this.isWindows ? '/c' : '-c';
      
      const child = spawn(shell, [shellFlag, command], {
        cwd,
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        resolve(code);
      });

      child.on('error', reject);
    });
  }

  async stopDockerServices() {
    this.log('🐳 Stopping Docker services...');
    
    try {
      await this.execCommand('docker-compose -f docker-compose.dev.yml down', this.projectRoot);
      this.log('✅ Docker services stopped', 'success');
    } catch (error) {
      this.log('⚠️  Docker compose down failed, trying alternative methods', 'warning');
    }

    // Alternative: Stop all containers
    try {
      await this.execCommand('docker stop $(docker ps -q) 2>/dev/null || true');
      this.log('✅ All Docker containers stopped', 'success');
    } catch (error) {
      this.log('ℹ️  No running containers to stop', 'info');
    }
  }

  async killProcessesByPort() {
    this.log('🔌 Killing processes on known ports...');
    
    const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 8080, 6379];
    
    for (const port of ports) {
      try {
        if (this.isWindows) {
          // Windows: Find and kill process by port
          await this.execCommand(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a 2>nul`);
        } else {
          // Unix: Find and kill process by port
          await this.execCommand(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
        }
        this.log(`✅ Processes on port ${port} killed`, 'success');
      } catch (error) {
        // Ignore errors - port might not be in use
      }
    }
  }

  async cleanupNodeProcesses() {
    this.log('🧹 Cleaning up Node.js processes...');
    
    try {
      if (this.isWindows) {
        // Windows: Kill node processes related to our project
        await this.execCommand('taskkill /f /im node.exe 2>nul || echo "No node processes to kill"');
      } else {
        // Unix: Kill node processes more selectively
        await this.execCommand('pkill -f "node.*antifraud\\|node.*factcheck\\|node.*backup" 2>/dev/null || true');
      }
      this.log('✅ Node.js processes cleaned up', 'success');
    } catch (error) {
      this.log('ℹ️  No Node.js processes to clean up', 'info');
    }
  }

  async cleanupDocker() {
    this.log('🧹 Cleaning up Docker resources...');
    
    try {
      // Remove stopped containers
      await this.execCommand('docker container prune -f 2>/dev/null || true');
      
      // Remove unused networks
      await this.execCommand('docker network prune -f 2>/dev/null || true');
      
      // Remove unused volumes (be careful with this)
      await this.execCommand('docker volume prune -f 2>/dev/null || true');
      
      this.log('✅ Docker resources cleaned up', 'success');
    } catch (error) {
      this.log('⚠️  Docker cleanup failed', 'warning');
    }
  }

  async stop() {
    try {
      this.log('🛑 Starting cross-platform stop process...', 'info');
      
      await this.stopDockerServices();
      await this.killProcessesByPort();
      await this.cleanupNodeProcesses();
      await this.cleanupDocker();
      
      this.log('🎉 All services stopped successfully!', 'success');
      this.log('💡 You can now run "npm start" or "node scripts/cross-platform-deploy.js" to restart', 'info');
      
    } catch (error) {
      this.log(`💥 Stop process failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run stop if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stopper = new CrossPlatformStopper();
  stopper.stop();
}

export default CrossPlatformStopper;
