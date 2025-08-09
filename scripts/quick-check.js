#!/usr/bin/env node
/**
 * Quick Check Services
 * Kiểm tra nhanh xem services có đang chạy không
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const services = [
  { name: 'Frontend', port: 3000 },
  { name: 'Auth Service', port: 3001 },
  { name: 'Link Service', port: 3002 },
  { name: 'Community Service', port: 3003 },
  { name: 'Chat Service', port: 3004 },
  { name: 'News Service', port: 3005 },
  { name: 'Admin Service', port: 3006 },
  { name: 'Event Bus', port: 3009 },
  { name: 'API Gateway', port: 8080 }
];

console.log('🔍 Quick Service Check');
console.log('=' .repeat(50));

function checkPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      resolve(stdout.trim() !== '');
    });
  });
}

async function checkAllServices() {
  console.log('\n📋 Service Status:');
  
  for (const service of services) {
    const isRunning = await checkPort(service.port);
    const status = isRunning ? '🟢 RUNNING' : '🔴 STOPPED';
    console.log(`  ${status} ${service.name.padEnd(20)} (Port ${service.port})`);
  }
  
  // Count running processes
  exec('tasklist | findstr node', (error, stdout) => {
    const nodeProcesses = stdout ? stdout.split('\n').filter(line => line.includes('node.exe')).length : 0;
    console.log(`\n📊 Summary:`);
    console.log(`  Node.js processes: ${nodeProcesses}`);
  });
  
  exec('tasklist | findstr cmd', (error, stdout) => {
    const cmdProcesses = stdout ? stdout.split('\n').filter(line => line.includes('cmd.exe')).length : 0;
    console.log(`  CMD windows: ${cmdProcesses}`);
    console.log('\n💡 Use "npm run stop" to stop all services');
  });
}

// Run check
const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] === scriptPath) {
  checkAllServices();
}

export default checkAllServices;
