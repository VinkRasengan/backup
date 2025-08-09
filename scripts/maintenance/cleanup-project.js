#!/usr/bin/env node

/**
 * FactCheck Platform - Project Cleanup Script
 * Comprehensive cleanup for development environment
 */

import { execSync, spawn  } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧹 FactCheck Platform - Project Cleanup');
console.log('=====================================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function executeCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'pipe', shell: true });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`⚠️  ${description} failed: ${error.message}`, 'yellow');
    return false;
  }
}

function deleteFileOrDir(path, description) {
  try {
    if (fs.existsSync(path)) {
      if (fs.lstatSync(path).isDirectory()) {
        fs.rmSync(path, { recursive: true, force: true });
      } else {
        fs.unlinkSync(path);
      }
      log(`🗑️  Deleted: ${description}`, 'green');
      return true;
    }
    return false;
  } catch (error) {
    log(`⚠️  Failed to delete ${description}: ${error.message}`, 'yellow');
    return false;
  }
}

function cleanupNodeModules() {
  log('\n📦 Cleaning up node_modules...', 'cyan');
  
  const directories = [
    'node_modules',
    'client/node_modules',
    'services/*/node_modules',
    'monitoring/*/node_modules',
    'presentation/node_modules'
  ];
  
  directories.forEach(dir => {
    const pattern = path.join(process.cwd(), dir);
    if (fs.existsSync(pattern)) {
      deleteFileOrDir(pattern, dir);
    }
  });
}

function cleanupBuildFiles() {
  log('\n🏗️  Cleaning up build files...', 'cyan');
  
  const buildDirs = [
    'dist', 'build', '.next', 'out',
    'client/dist', 'client/build', 'client/.next',
    'services/*/dist', 'services/*/build'
  ];
  
  buildDirs.forEach(dir => {
    const pattern = path.join(process.cwd(), dir);
    if (fs.existsSync(pattern)) {
      deleteFileOrDir(pattern, dir);
    }
  });
}

function cleanupCacheFiles() {
  log('\n🗂️  Cleaning up cache files...', 'cyan');
  
  const cachePatterns = [
    '*.log',
    'logs/*.log',
    'temp/*',
    'tmp/*',
    '.cache',
    'node_modules/.cache',
    'services/*/logs/*.log',
    'services/*/temp/*',
    'client/.cache'
  ];
  
  cachePatterns.forEach(pattern => {
    const fullPattern = path.join(process.cwd(), pattern);
    try {
      execSync(`del /s /q "${fullPattern}" 2>nul`, { shell: true });
    } catch (error) {
      // Ignore errors for non-existent files
    }
  });
}

function cleanupLockFiles() {
  log('\n🔒 Cleaning up lock files...', 'cyan');
  
  const lockFiles = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'services/*/package-lock.json',
    'services/*/yarn.lock',
    'client/package-lock.json',
    'client/yarn.lock'
  ];
  
  lockFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    deleteFileOrDir(fullPath, file);
  });
}

function cleanupDocker() {
  log('\n🐳 Cleaning up Docker...', 'cyan');
  
  executeCommand('docker compose down -v --remove-orphans', 'Stopping Docker containers');
  executeCommand('docker system prune -f', 'Cleaning Docker system');
  executeCommand('docker volume prune -f', 'Cleaning Docker volumes');
  executeCommand('docker network prune -f', 'Cleaning Docker networks');
}

function cleanupProcesses() {
  log('\n🔄 Stopping running processes...', 'cyan');
  
  const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012, 8080];
  
  ports.forEach(port => {
    try {
      execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' });
      execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`, { shell: true });
      log(`✅ Stopped process on port ${port}`, 'green');
    } catch (error) {
      // Port not in use
    }
  });
}

function cleanupEnvFiles() {
  log('\n🔧 Cleaning up environment files...', 'cyan');
  
  const envFiles = [
    '.env.local',
    '.env.backup',
    '.env.*.backup',
    'services/*/.env.local',
    'services/*/.env.backup'
  ];
  
  envFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    deleteFileOrDir(fullPath, file);
  });
}

function cleanupTestFiles() {
  log('\n🧪 Cleaning up test files...', 'cyan');
  
  const testDirs = [
    'coverage',
    'services/*/coverage',
    'client/coverage',
    '.nyc_output',
    'services/*/.nyc_output'
  ];
  
  testDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    deleteFileOrDir(fullPath, dir);
  });
}

function cleanupIDE() {
  log('\n💻 Cleaning up IDE files...', 'cyan');
  
  const ideFiles = [
    '.vscode/settings.json',
    '.vscode/launch.json',
    '.idea',
    '*.swp',
    '*.swo',
    '*~',
    '.DS_Store',
    'Thumbs.db'
  ];
  
  ideFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    deleteFileOrDir(fullPath, file);
  });
}

function generateCleanupReport() {
  log('\n📊 Cleanup Report', 'magenta');
  log('================', 'magenta');
  
  const report = {
    timestamp: new Date().toISOString(),
    nodeModules: 'Cleaned',
    buildFiles: 'Cleaned',
    cacheFiles: 'Cleaned',
    lockFiles: 'Cleaned',
    docker: 'Cleaned',
    processes: 'Stopped',
    envFiles: 'Cleaned',
    testFiles: 'Cleaned',
    ideFiles: 'Cleaned'
  };
  
  console.table(report);
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'cleanup-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`📄 Cleanup report saved to: ${reportPath}`, 'green');
}

function main() {
  try {
    log('🚀 Starting comprehensive project cleanup...', 'bright');
    
    // Stop all processes first
    cleanupProcesses();
    
    // Clean up Docker
    cleanupDocker();
    
    // Clean up files and directories
    cleanupCacheFiles();
    cleanupLockFiles();
    cleanupEnvFiles();
    cleanupTestFiles();
    cleanupIDE();
    cleanupBuildFiles();
    cleanupNodeModules();
    
    // Generate report
    generateCleanupReport();
    
    log('\n🎉 Project cleanup completed successfully!', 'bright');
    log('💡 Next steps:', 'cyan');
    log('   1. Run: npm install', 'yellow');
    log('   2. Run: npm run setup', 'yellow');
    log('   3. Run: npm start', 'yellow');
    
  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run cleanup
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default {
  cleanupNodeModules,
  cleanupBuildFiles,
  cleanupCacheFiles,
  cleanupLockFiles,
  cleanupDocker,
  cleanupProcesses,
  cleanupEnvFiles,
  cleanupTestFiles,
  cleanupIDE
}; 