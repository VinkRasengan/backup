#!/usr/bin/env node

/**
 * Logs All - Universal Log Viewer Script
 * Shows logs from all services across different deployment methods
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

class UniversalLogs {
  constructor() {
    this.rootDir = process.cwd();
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
    this.logStreams = new Map();
  }

  /**
   * Main logs function
   */
  async showLogs() {
    console.log('📜 Universal Log Viewer - All Services');
    console.log('=' .repeat(60));

    try {
      await this.detectDeploymentMethod();
      await this.setupLogStreaming();
      this.setupInteractiveControls();
    } catch (error) {
      console.error('❌ Log viewing failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Detect which deployment method is currently running
   */
  async detectDeploymentMethod() {
    console.log('🔍 Detecting deployment method...');

    const methods = {
      docker: await this.checkDockerDeployment(),
      kubernetes: await this.checkKubernetesDeployment(),
      processes: await this.checkProcessDeployment()
    };

    console.log('📋 Deployment Status:');
    console.log(`  🐳 Docker: ${methods.docker ? '✅ Active' : '❌ Inactive'}`);
    console.log(`  ☸️  Kubernetes: ${methods.kubernetes ? '✅ Active' : '❌ Inactive'}`);
    console.log(`  🔧 Processes: ${methods.processes ? '✅ Active' : '❌ Inactive'}`);

    this.deploymentMethods = methods;
  }

  /**
   * Check if Docker deployment is active
   */
  async checkDockerDeployment() {
    try {
      const containers = await this.execAsync('docker ps --filter "name=factcheck" --format "{{.Names}}"');
      return containers.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Kubernetes deployment is active
   */
  async checkKubernetesDeployment() {
    try {
      const namespaces = ['factcheck-local', 'anti-fraud-platform', 'antifraud'];
      for (const namespace of namespaces) {
        try {
          const pods = await this.execAsync(`kubectl get pods -n ${namespace} --no-headers`);
          if (pods.trim().length > 0) {
            this.activeNamespace = namespace;
            return true;
          }
        } catch (error) {
          // Namespace doesn't exist
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if process deployment is active
   */
  async checkProcessDeployment() {
    try {
      const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080];
      for (const port of ports) {
        const isRunning = await this.isPortInUse(port);
        if (isRunning) return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Setup log streaming based on active deployment methods
   */
  async setupLogStreaming() {
    console.log('\n📡 Setting up log streaming...');

    if (this.deploymentMethods.docker) {
      await this.setupDockerLogs();
    }

    if (this.deploymentMethods.kubernetes) {
      await this.setupKubernetesLogs();
    }

    if (this.deploymentMethods.processes) {
      await this.setupProcessLogs();
    }

    if (this.logStreams.size === 0) {
      console.log('⚠️  No active deployments found. Starting log file monitoring...');
      await this.setupFileBasedLogs();
    }
  }

  /**
   * Setup Docker container logs
   */
  async setupDockerLogs() {
    console.log('🐳 Setting up Docker container logs...');

    try {
      const composeFiles = [
        'docker-compose.yml',
        'docker-compose.dev.yml',
        'docker-compose.local.yml'
      ];

      for (const composeFile of composeFiles) {
        const composePath = path.join(this.rootDir, composeFile);
        if (fs.existsSync(composePath)) {
          console.log(`  📄 Using ${composeFile}`);
          
          const logsProcess = spawn('docker-compose', ['-f', composeFile, 'logs', '-f', '--tail=50'], {
            cwd: this.rootDir,
            stdio: ['ignore', 'pipe', 'pipe']
          });

          this.logStreams.set('docker', logsProcess);

          logsProcess.stdout.on('data', (data) => {
            this.formatAndDisplayLog('DOCKER', data.toString());
          });

          logsProcess.stderr.on('data', (data) => {
            this.formatAndDisplayLog('DOCKER-ERR', data.toString());
          });

          break;
        }
      }
    } catch (error) {
      console.log('  ⚠️  Failed to setup Docker logs:', error.message);
    }
  }

  /**
   * Setup Kubernetes pod logs
   */
  async setupKubernetesLogs() {
    console.log('☸️  Setting up Kubernetes pod logs...');

    try {
      const pods = await this.execAsync(`kubectl get pods -n ${this.activeNamespace} --no-headers -o custom-columns=":metadata.name"`);
      const podNames = pods.trim().split('\n').filter(Boolean);

      for (const podName of podNames) {
        console.log(`  📦 Streaming logs from pod: ${podName}`);
        
        const logsProcess = spawn('kubectl', ['logs', '-f', '--tail=50', podName, '-n', this.activeNamespace], {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        this.logStreams.set(`k8s-${podName}`, logsProcess);

        logsProcess.stdout.on('data', (data) => {
          this.formatAndDisplayLog(`K8S-${podName.toUpperCase()}`, data.toString());
        });

        logsProcess.stderr.on('data', (data) => {
          this.formatAndDisplayLog(`K8S-${podName.toUpperCase()}-ERR`, data.toString());
        });
      }
    } catch (error) {
      console.log('  ⚠️  Failed to setup Kubernetes logs:', error.message);
    }
  }

  /**
   * Setup process logs (for local deployment)
   */
  async setupProcessLogs() {
    console.log('🔧 Setting up process logs...');
    console.log('  ⚠️  Process logs are limited - consider using Docker or K8s for better log aggregation');
    
    // For process-based deployment, we'll monitor log files if they exist
    await this.setupFileBasedLogs();
  }

  /**
   * Setup file-based log monitoring
   */
  async setupFileBasedLogs() {
    console.log('📁 Setting up file-based log monitoring...');

    const logPaths = [
      'logs',
      'services/*/logs',
      'client/logs',
      '/tmp/factcheck-logs'
    ];

    for (const logPath of logPaths) {
      const fullPath = path.join(this.rootDir, logPath);
      if (fs.existsSync(fullPath)) {
        console.log(`  📂 Monitoring log directory: ${logPath}`);
        await this.monitorLogDirectory(fullPath);
      }
    }

    // If no log files found, create a simple log aggregator
    if (this.logStreams.size === 0) {
      console.log('  📝 No log files found. Creating simple log aggregator...');
      this.createSimpleLogAggregator();
    }
  }

  /**
   * Monitor log directory for changes
   */
  async monitorLogDirectory(logDir) {
    try {
      const files = fs.readdirSync(logDir);
      const logFiles = files.filter(file => file.endsWith('.log'));

      for (const logFile of logFiles) {
        const logFilePath = path.join(logDir, logFile);
        console.log(`    📄 Monitoring: ${logFile}`);
        
        // Use tail -f equivalent for file monitoring
        const tailProcess = spawn('tail', ['-f', logFilePath], {
          stdio: ['ignore', 'pipe', 'pipe']
        });

        this.logStreams.set(`file-${logFile}`, tailProcess);

        tailProcess.stdout.on('data', (data) => {
          this.formatAndDisplayLog(`FILE-${logFile.toUpperCase()}`, data.toString());
        });
      }
    } catch (error) {
      console.log(`    ⚠️  Failed to monitor ${logDir}:`, error.message);
    }
  }

  /**
   * Create simple log aggregator for process-based deployment
   */
  createSimpleLogAggregator() {
    console.log('  🔄 Creating simple log aggregator...');
    
    // Monitor console output and system logs
    const systemLogProcess = spawn('journalctl', ['-f', '--user'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    this.logStreams.set('system', systemLogProcess);

    systemLogProcess.stdout.on('data', (data) => {
      const logData = data.toString();
      if (logData.includes('factcheck') || logData.includes('node')) {
        this.formatAndDisplayLog('SYSTEM', logData);
      }
    });

    // Fallback: Show a message about limited logging
    setTimeout(() => {
      if (this.logStreams.size <= 1) {
        console.log('\n⚠️  Limited log visibility in process mode.');
        console.log('💡 For better log aggregation, consider using:');
        console.log('   - npm run deploy:docker (Docker deployment)');
        console.log('   - npm run deploy:k8s (Kubernetes deployment)');
      }
    }, 3000);
  }

  /**
   * Format and display log entries
   */
  formatAndDisplayLog(source, data) {
    const timestamp = new Date().toISOString();
    const lines = data.toString().split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.trim()) {
        const coloredSource = this.colorizeSource(source);
        console.log(`[${timestamp}] ${coloredSource} ${line}`);
      }
    }
  }

  /**
   * Colorize log source for better readability
   */
  colorizeSource(source) {
    const colors = {
      'DOCKER': '\x1b[36m',      // Cyan
      'K8S': '\x1b[35m',         // Magenta
      'FILE': '\x1b[33m',        // Yellow
      'SYSTEM': '\x1b[32m',      // Green
      'ERR': '\x1b[31m'          // Red
    };

    const reset = '\x1b[0m';
    
    for (const [key, color] of Object.entries(colors)) {
      if (source.includes(key)) {
        return `${color}[${source}]${reset}`;
      }
    }
    
    return `[${source}]`;
  }

  /**
   * Setup interactive controls
   */
  setupInteractiveControls() {
    console.log('\n🎮 Interactive Log Controls:');
    console.log('  Press Ctrl+C to exit');
    console.log('  Press "h" + Enter for help');
    console.log('  Press "s" + Enter to show status');
    console.log('  Press "f" + Enter to filter logs');
    console.log('\n📜 Live Logs (press Ctrl+C to exit):');
    console.log('=' .repeat(80));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.on('line', (input) => {
      const command = input.trim().toLowerCase();
      
      switch (command) {
        case 'h':
        case 'help':
          this.showHelp();
          break;
        case 's':
        case 'status':
          this.showLogStatus();
          break;
        case 'f':
        case 'filter':
          this.setupLogFilter();
          break;
        case 'c':
        case 'clear':
          console.clear();
          break;
        default:
          if (command) {
            console.log(`Unknown command: ${command}. Type 'h' for help.`);
          }
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping log streaming...');
      this.cleanup();
      process.exit(0);
    });
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('\n📖 Log Viewer Help:');
    console.log('  h, help   - Show this help');
    console.log('  s, status - Show log stream status');
    console.log('  f, filter - Setup log filtering');
    console.log('  c, clear  - Clear screen');
    console.log('  Ctrl+C    - Exit log viewer');
    console.log('');
  }

  /**
   * Show log stream status
   */
  showLogStatus() {
    console.log('\n📊 Log Stream Status:');
    console.log(`  Active streams: ${this.logStreams.size}`);
    
    for (const [name, stream] of this.logStreams) {
      const status = stream.killed ? '🔴 Stopped' : '🟢 Active';
      console.log(`    ${name}: ${status}`);
    }
    console.log('');
  }

  /**
   * Setup log filtering
   */
  setupLogFilter() {
    console.log('\n🔍 Log filtering not implemented yet.');
    console.log('💡 Future feature: Filter logs by service, level, or keyword');
    console.log('');
  }

  /**
   * Cleanup log streams
   */
  cleanup() {
    for (const [name, stream] of this.logStreams) {
      try {
        stream.kill('SIGTERM');
      } catch (error) {
        // Stream might already be dead
      }
    }
    this.logStreams.clear();
  }

  /**
   * Utility functions
   */
  async isPortInUse(port) {
    try {
      const result = await this.execAsync(`netstat -ano | findstr :${port}`);
      return result.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  execAsync(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, { timeout: 10000, ...options }, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });
  }
}

// Run log viewer
if (require.main === module) {
  const logs = new UniversalLogs();
  logs.showLogs().catch(console.error);
}

module.exports = UniversalLogs;
