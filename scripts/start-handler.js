#!/usr/bin/env node
/**
 * Smart Start Handler for FactCheck Platform
 * Handles: npm start [separate|together]
 */

const { spawn } = require('child_process');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'together'; // Default to 'together'

console.log(`🚀 Starting FactCheck Platform in "${mode}" mode...\n`);

// Define start modes
const startModes = {
  together: {
    description: 'Start all services in one terminal (using concurrently)',
    command: 'npm',
    args: ['run', 'start:together']
  },
  separate: {
    description: 'Start each service in separate terminal windows',
    command: 'node',
    args: ['scripts/start-services-separate.js']
  }
};

// Validate mode
if (!startModes[mode]) {
  console.error(`❌ Invalid mode: "${mode}"`);
  console.log('\n📋 Available modes:');
  Object.keys(startModes).forEach(key => {
    console.log(`  • ${key.padEnd(10)} - ${startModes[key].description}`);
  });
  console.log('\n💡 Usage:');
  console.log('  npm start              # Start in "together" mode (default)');
  console.log('  npm start separate     # Start in "separate" mode');
  console.log('  npm start together     # Start in "together" mode (explicit)');
  process.exit(1);
}

// Show selected mode info
console.log(`📋 Selected mode: ${mode}`);
console.log(`📖 Description: ${startModes[mode].description}\n`);

// Execute the selected mode
const selectedMode = startModes[mode];
const child = spawn(selectedMode.command, selectedMode.args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

// Handle process events
child.on('error', (error) => {
  console.error(`❌ Failed to start in "${mode}" mode:`, error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Process exited with code ${code}`);
    process.exit(code);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  child.kill('SIGTERM');
});
