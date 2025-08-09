#!/usr/bin/env node
/**
 * Stop all services running on their respective ports
 */

import { exec  } from 'child_process';
import os from 'os';

const services = [
  { name: 'Auth Service', port: 3001 },
  { name: 'Link Service', port: 3002 },
  { name: 'Community Service', port: 3003 },
  { name: 'Chat Service', port: 3004 },
  { name: 'News Service', port: 3005 },
  { name: 'Admin Service', port: 3006 },
  { name: 'API Gateway', port: 8080 },
  { name: 'Frontend Client', port: 3000 } // Added frontend
];

const isWindows = os.platform() === 'win32';

console.log('🛑 Stopping all services + frontend...\n');

function stopService(service) {
  return new Promise((resolve) => {
    const port = service.port;
    let command;
    
    if (isWindows) {
      // Windows: Find and kill process using netstat and taskkill
      command = `for /f "tokens=5" %a in ('netstat -aon ^| find ":${port}" ^| find "LISTENING"') do taskkill /PID %a /F`;
    } else {
      // Linux/Mac: Find and kill process using lsof
      command = `lsof -ti:${port} | xargs kill -9`;
    }
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ ${service.name} (port ${port}): Not running or failed to stop`);
      } else {
        console.log(`✅ ${service.name} (port ${port}): Stopped`);
      }
      resolve();
    });
  });
}

// Stop all services
async function stopAllServices() {
  const promises = services.map(service => stopService(service));
  await Promise.all(promises);
  
  console.log('\n🔄 Cleaning up any remaining Node.js processes...');
  
  // Additional cleanup for Node.js processes
  const cleanupCommand = isWindows 
    ? 'taskkill /F /IM node.exe /T 2>nul || echo "No Node.js processes found"'
    : 'pkill -f "node.*npm start" || echo "No Node.js processes found"';
  
  exec(cleanupCommand, (error, stdout, stderr) => {
    if (stdout) console.log(stdout);
    console.log('\n✅ All services stopped!');
  });
}

stopAllServices().catch(console.error);
