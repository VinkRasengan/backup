#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const os = require('os');

console.log('========================================');
console.log('  Kill All Development Servers');
console.log('========================================');
console.log('');

const isWindows = os.platform() === 'win32';

// Ports to check and kill
const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 8080];

// Function to kill process by port
function killProcessOnPort(port) {
  return new Promise((resolve) => {
    if (isWindows) {
      // Windows command
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
              const pid = parts[4];
              if (pid && pid !== '0') {
                exec(`taskkill /f /pid ${pid}`, (killError) => {
                  if (!killError) {
                    console.log(`✅ Killed process on port ${port}: PID ${pid}`);
                  }
                });
              }
            }
          });
        }
        resolve();
      });
    } else {
      // Unix/Linux/Mac command
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (stdout) {
          const pid = stdout.trim();
          if (pid) {
            exec(`kill -9 ${pid}`, (killError) => {
              if (!killError) {
                console.log(`✅ Killed process on port ${port}: PID ${pid}`);
              }
            });
          }
        }
        resolve();
      });
    }
  });
}

// Function to kill processes by name
function killProcessByName(processName) {
  return new Promise((resolve) => {
    if (isWindows) {
      exec(`taskkill /f /im ${processName}`, (error) => {
        if (!error) {
          console.log(`✅ Killed ${processName} processes`);
        }
        resolve();
      });
    } else {
      exec(`pkill -f ${processName}`, (error) => {
        if (!error) {
          console.log(`✅ Killed ${processName} processes`);
        }
        resolve();
      });
    }
  });
}

// Main execution
async function killAllDevServers() {
  console.log('[1/4] Killing processes on development ports...');
  
  // Kill processes on specific ports
  for (const port of ports) {
    await killProcessOnPort(port);
  }
  
  console.log('\n[2/4] Killing Node.js processes...');
  await killProcessByName('node.exe');
  await killProcessByName('node');
  
  console.log('\n[3/4] Killing React Scripts processes...');
  await killProcessByName('react-scripts');
  
  console.log('\n[4/4] Killing npm processes...');
  if (isWindows) {
    await new Promise(resolve => {
      exec('wmic process where "commandline like \'%react-scripts%\'" delete', () => resolve());
    });
    await new Promise(resolve => {
      exec('wmic process where "commandline like \'%webpack-dev-server%\'" delete', () => resolve());
    });
    await new Promise(resolve => {
      exec('wmic process where "commandline like \'%npm start%\'" delete', () => resolve());
    });
  } else {
    await killProcessByName('webpack-dev-server');
    await killProcessByName('npm start');
  }
  
  console.log('\n✅ All development servers have been terminated!');
  console.log('\nYou can now run \'npm start\' on port 3000 again.');
  console.log('');
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

// Run the script
killAllDevServers().catch(console.error);
