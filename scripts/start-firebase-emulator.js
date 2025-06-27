#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

console.log('🔥 Starting Firebase Emulator for Development...');

// Set environment variables for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
process.env.FIREBASE_PROJECT_ID = 'factcheck-1d6e8';

// Start Firebase emulator
const command = isWindows ? 'firebase.cmd' : 'firebase';
const args = ['emulators:start', '--only', 'firestore', '--project', 'factcheck-1d6e8'];

const emulator = spawn(command, args, {
  stdio: 'inherit',
  shell: true
});

emulator.on('error', (error) => {
  console.error('❌ Failed to start Firebase emulator:', error.message);
  console.log('💡 Make sure Firebase CLI is installed: npm install -g firebase-tools');
  process.exit(1);
});

emulator.on('close', (code) => {
  console.log(`🔥 Firebase emulator exited with code ${code}`);
});

console.log('🚀 Firebase Emulator starting on port 8081...');
console.log('📝 Firestore UI will be available at: http://localhost:4000'); 