#!/usr/bin/env node

/**
 * Windows Force Stop - Aggressive process and terminal killer
 * Specifically designed for Windows to force kill all service processes and close terminals
 */

import { exec, spawn  } from 'child_process';
import path from 'path';
import fs from 'fs';

class WindowsForceStop {
  constructor() {
    this.rootDir = process.cwd();
    
    // All possible ports our services might use
    this.ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 8080, 6379, 5672, 15672];
    
    // Process names to kill
    this.processNames = [
      'node.exe',
      'npm.exe', 
      'npx.exe',
      'nodemon.exe'
    ];
    
    // Window titles to close
    this.windowTitles = [
      '*Service*',
      '*Gateway*', 
      '*Frontend*',
      '*Auth*',
      '*Link*',
      '*Community*',
      '*Chat*',
      '*News*',
      '*Admin*',
      '*Event Bus*'
    ];
    
    // Command line patterns to match
    this.cmdPatterns = [
      'auth-service',
      'link-service',
      'community-service', 
      'chat-service',
      'news-service',
      'admin-service',
      'api-gateway',
      'event-bus-service',
      'client',
      'npm start',
      'npm run dev',
      'react-scripts'
    ];
  }

  /**
   * Main force stop function
   */
  async forceStop() {
    console.log('💀 Windows Force Stop - Aggressive Mode');
    console.log('=' .repeat(50));
    console.log('⚠️  This will forcefully kill ALL related processes and terminals!');
    
    try {
      await this.killByPorts();
      await this.killByProcessNames();
      await this.killByCommandLine();
      await this.closeTerminalWindows();
      await this.killRemainingNodeProcesses();
      await this.cleanup();
      
      console.log('\n✅ Force stop completed! All processes and terminals should be closed.');
      console.log('💡 You can now restart with: npm start');
      
    } catch (error) {
      console.error('❌ Force stop encountered errors:', error.message);
      console.log('🔄 Attempting final cleanup...');
      await this.emergencyCleanup();
    }
  }

  /**
   * Kill processes by port
   */
  async killByPorts() {
    console.log('🔌 Force killing processes by port...');
    
    for (const port of this.ports) {
      try {
        const result = await this.execAsync(`netstat -ano | findstr :${port}`);
        if (result) {
          const lines = result.split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 4) {
              const pid = parts[parts.length - 1];
              if (pid && !isNaN(pid)) {
                await this.execAsync(`taskkill /PID ${pid} /F /T`);
                console.log(`    💀 Force killed PID ${pid} on port ${port}`);
              }
            }
          }
        }
      } catch (error) {
        // Port not in use - continue
      }
    }
  }

  /**
   * Kill processes by name
   */
  async killByProcessNames() {
    console.log('📛 Force killing processes by name...');
    
    for (const processName of this.processNames) {
      try {
        // Kill all instances of this process name
        await this.execAsync(`taskkill /IM ${processName} /F /T`);
        console.log(`    💀 Force killed all ${processName} processes`);
      } catch (error) {
        // Process not running - continue
      }
    }
  }

  /**
   * Kill processes by command line pattern
   */
  async killByCommandLine() {
    console.log('🎯 Force killing processes by command line...');
    
    for (const pattern of this.cmdPatterns) {
      try {
        // Use wmic to find and kill processes with specific command line
        const command = `wmic process where "CommandLine like '%${pattern}%'" get ProcessId /format:value`;
        const result = await this.execAsync(command);
        
        if (result) {
          const pids = result.split('\n')
            .filter(line => line.includes('ProcessId='))
            .map(line => line.split('=')[1])
            .filter(pid => pid && pid.trim() && !isNaN(pid.trim()));
          
          for (const pid of pids) {
            try {
              await this.execAsync(`taskkill /PID ${pid.trim()} /F /T`);
              console.log(`    💀 Force killed process with '${pattern}' PID: ${pid.trim()}`);
            } catch (e) {
              // Process might already be dead
            }
          }
        }
      } catch (error) {
        // Pattern not found - continue
      }
    }
  }

  /**
   * Close terminal windows
   */
  async closeTerminalWindows() {
    console.log('🪟 Force closing terminal windows...');
    
    for (const title of this.windowTitles) {
      try {
        await this.execAsync(`taskkill /FI "WINDOWTITLE eq ${title}" /F /T`);
        console.log(`    🪟 Closed windows with title: ${title}`);
      } catch (error) {
        // Window not found - continue
      }
    }
    
    // Close any cmd.exe with service-related titles
    try {
      await this.execAsync('taskkill /FI "IMAGENAME eq cmd.exe" /FI "WINDOWTITLE eq *npm*" /F');
      console.log('    🪟 Closed npm-related cmd windows');
    } catch (error) {
      // No windows found
    }
  }

  /**
   * Kill any remaining Node.js processes
   */
  async killRemainingNodeProcesses() {
    console.log('🔥 Final cleanup - killing remaining Node processes...');
    
    try {
      // Get all Node.js processes
      const result = await this.execAsync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:csv');
      
      if (result) {
        const lines = result.split('\n').filter(line => line.includes('node.exe'));
        
        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 3) {
            const pid = parts[2];
            if (pid && !isNaN(pid.trim())) {
              try {
                await this.execAsync(`taskkill /PID ${pid.trim()} /F /T`);
                console.log(`    🔥 Final kill PID: ${pid.trim()}`);
              } catch (e) {
                // Process already dead
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('    ⚠️  No remaining Node processes found');
    }
  }

  /**
   * Emergency cleanup
   */
  async emergencyCleanup() {
    console.log('🚨 Emergency cleanup...');
    
    const emergencyCommands = [
      'taskkill /F /IM node.exe',
      'taskkill /F /IM npm.exe', 
      'taskkill /F /IM npx.exe',
      'taskkill /F /IM nodemon.exe',
      'taskkill /F /FI "WINDOWTITLE eq *Service*"',
      'taskkill /F /FI "WINDOWTITLE eq *npm*"'
    ];
    
    for (const command of emergencyCommands) {
      try {
        await this.execAsync(command);
      } catch (error) {
        // Ignore errors in emergency cleanup
      }
    }
    
    console.log('🚨 Emergency cleanup completed');
  }

  /**
   * Cleanup files
   */
  async cleanup() {
    console.log('🧹 Cleaning up files...');
    
    const filesToRemove = [
      '.local-deploy-pids',
      '.node-deploy-pids',
      '.service-pids', 
      '.fast-start-pids'
    ];
    
    for (const file of filesToRemove) {
      const filePath = path.join(this.rootDir, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`    🗑️  Removed ${file}`);
        } catch (error) {
          console.log(`    ⚠️  Could not remove ${file}`);
        }
      }
    }
  }

  /**
   * Execute command with timeout
   */
  execAsync(command, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const child = exec(command, { 
        timeout,
        windowsHide: true 
      }, (error, stdout, stderr) => {
        if (error) {
          // Don't reject on expected errors
          if (error.message.includes('not found') || 
              error.message.includes('No such process') ||
              error.message.includes('not running')) {
            resolve('');
          } else {
            reject(error);
          }
        } else {
          resolve(stdout);
        }
      });
      
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
          resolve('');
        }
      }, timeout);
    });
  }
}

// Handle interruption
process.on('SIGINT', () => {
  console.log('\n🛑 Force stop interrupted');
  process.exit(0);
});

// Run force stop
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.platform !== 'win32') {
    console.log('❌ This script is designed for Windows only!');
    console.log('💡 Use "npm run stop" for cross-platform stopping');
    process.exit(1);
  }
  
  const forceStop = new WindowsForceStop();
  forceStop.forceStop()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default WindowsForceStop;
