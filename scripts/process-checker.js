#!/usr/bin/env node

/**
 * Process Check Script - Check what processes are still running
 */

const { exec } = require('child_process');
const os = require('os');

class ProcessChecker {
  constructor() {
    this.isWindows = os.platform() === 'win32';
    this.ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 8080, 9090, 3010, 9093, 9100, 8081, 5001];
  }

  async checkProcesses() {
    console.log('🔍 Checking for running processes...');
    console.log('='.repeat(50));

    // Check ports
    await this.checkPorts();
    
    // Check Node processes
    await this.checkNodeProcesses();

    // Check Docker containers
    await this.checkDockerContainers();
  }

  async checkPorts() {
    console.log('\n📊 PORT STATUS:');
    console.log('-'.repeat(30));

    let runningPorts = 0;
    
    for (const port of this.ports) {
      try {
        const result = await this.runCommand(`netstat -ano | findstr :${port} | findstr LISTENING`);
        if (result.trim()) {
          const lines = result.split('\n').filter(line => line.trim());
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            console.log(`⚠️  Port ${port} - Process PID: ${pid}`);
            runningPorts++;
          }
        }
      } catch {
        // Port not in use - good
      }
    }

    if (runningPorts === 0) {
      console.log('✅ All ports are free');
    } else {
      console.log(`❌ ${runningPorts} ports still in use`);
    }
  }

  async checkNodeProcesses() {
    console.log('\n🚀 NODE.JS PROCESSES:');
    console.log('-'.repeat(30));

    try {
      const result = await this.runCommand('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
      const lines = result.split('\n').filter(line => line.includes('node.exe'));
      
      if (lines.length > 0) {
        console.log(`❌ ${lines.length} Node.js processes still running:`);
        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length > 1) {
            const pid = parts[1].replace(/"/g, '');
            console.log(`   • Node.js PID: ${pid}`);
          }
        });
      } else {
        console.log('✅ No Node.js processes running');
      }
    } catch {
      console.log('✅ No Node.js processes running');
    }
  }

  async checkDockerContainers() {
    console.log('\n🐳 DOCKER CONTAINERS:');
    console.log('-'.repeat(30));

    try {
      const result = await this.runCommand('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
      const lines = result.split('\n').filter(line => 
        line.includes('antifraud') || 
        line.includes('prometheus') || 
        line.includes('grafana') || 
        line.includes('alertmanager')
      );
      
      if (lines.length > 0) {
        console.log(`❌ ${lines.length} containers still running:`);
        lines.forEach(line => console.log(`   • ${line}`));
      } else {
        console.log('✅ No relevant containers running');
      }
    } catch {
      console.log('ℹ️  Docker not available or no containers running');
    }
  }

  async forceCleanup() {
    console.log('\n🔨 FORCE CLEANUP:');
    console.log('-'.repeat(30));

    try {
      // Kill all node processes
      await this.runCommand('taskkill /F /IM node.exe /T');
      console.log('✅ Killed all Node.js processes');

      // Kill all npm processes
      await this.runCommand('taskkill /F /IM npm.cmd /T');
      console.log('✅ Killed all NPM processes');

      // Stop all containers
      await this.runCommand('docker stop $(docker ps -q)');
      console.log('✅ Stopped all Docker containers');

    } catch (error) {
      console.log('ℹ️  Some cleanup commands failed (this is normal)');
    }

    console.log('\n✅ Force cleanup completed!');
  }

  async runCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }
}

// CLI interface
const command = process.argv[2] || 'check';
const checker = new ProcessChecker();

switch (command) {
  case 'check':
    checker.checkProcesses().catch(console.error);
    break;
  case 'force':
    checker.forceCleanup().catch(console.error);
    break;
  default:
    console.log('Usage: node process-checker.js [check|force]');
    console.log('');
    console.log('Commands:');
    console.log('  check  - Check running processes');
    console.log('  force  - Force cleanup all processes');
    break;
}
