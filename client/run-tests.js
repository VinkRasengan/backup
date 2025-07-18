#!/usr/bin/env node

/**
 * Test Runner with proper ES module handling
 * This script runs Jest tests with the correct configuration for ES modules
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running tests with ES module support...\n');

// Set environment variables for Jest
process.env.NODE_ENV = 'test';
process.env.BABEL_ENV = 'test';

// Jest command with proper configuration
const jestArgs = [
  'test',
  '--coverage',
  '--watchAll=false',
  '--verbose',
  '--passWithNoTests',
  '--transformIgnorePatterns=node_modules/(?!(axios|@tanstack|framer-motion|lucide-react|gsap)/)',
  '--testEnvironment=jsdom'
];

// Run Jest via react-scripts
const testProcess = spawn('npx', ['react-scripts', ...jestArgs], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    CI: 'true' // Prevent watch mode
  }
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log(`\n❌ Tests failed with exit code ${code}`);
  }
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Failed to start test process:', error);
  process.exit(1);
});
