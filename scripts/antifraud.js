#!/usr/bin/env node

/**
 * AntiFreud Platform Management Script
 * Provides various operations for the platform
 */

const { spawn } = require('child_process');
const path = require('path');

const command = process.argv[2];
const args = process.argv.slice(3);

function runCommand(cmd, cmdArgs = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, cmdArgs, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function main() {
  console.log(`🔧 AntiFreud Platform - ${command || 'help'}`);

  switch (command) {
    case 'test':
      console.log('Running platform tests...');
      try {
        await runCommand('npm', ['test'], { cwd: path.resolve(__dirname, '..') });
      } catch (error) {
        console.error('❌ Tests failed:', error.message);
        process.exit(1);
      }
      break;

    case 'docker':
      console.log('Starting Docker deployment...');
      try {
        await runCommand('docker-compose', ['up', '-d']);
      } catch (error) {
        console.error('❌ Docker deployment failed:', error.message);
        process.exit(1);
      }
      break;

    case 'logs':
      console.log('Showing Docker logs...');
      try {
        await runCommand('docker-compose', ['logs', '-f']);
      } catch (error) {
        console.error('❌ Failed to show logs:', error.message);
        process.exit(1);
      }
      break;

    case 'k8s':
      console.log('Deploying to Kubernetes...');
      try {
        await runCommand('kubectl', ['apply', '-f', 'k8s/']);
      } catch (error) {
        console.error('❌ Kubernetes deployment failed:', error.message);
        process.exit(1);
      }
      break;

    case 'help':
    default:
      console.log(`
Usage: node scripts/antifraud.js <command>

Commands:
  test     - Run platform tests
  docker   - Start Docker deployment
  logs     - Show Docker logs
  k8s      - Deploy to Kubernetes
  help     - Show this help message

Examples:
  node scripts/antifraud.js test
  node scripts/antifraud.js docker
  node scripts/antifraud.js logs
      `);
      break;
  }
}

main().catch((error) => {
  console.error('❌ AntiFreud script failed:', error.message);
  process.exit(1);
}); 