#!/usr/bin/env node
/**
 * Start all services in separate terminals
 * Cross-platform script using Node.js
 */

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const services = [
  { name: 'API Gateway', dir: 'services/api-gateway', port: 8080, color: '\x1b[37m', priority: 1 },
  { name: 'Auth Service', dir: 'services/auth-service', port: 3001, color: '\x1b[34m', priority: 2 },
  { name: 'Link Service', dir: 'services/link-service', port: 3002, color: '\x1b[35m', priority: 3 },
  { name: 'Community Service', dir: 'services/community-service', port: 3003, color: '\x1b[32m', priority: 4 },
  { name: 'Chat Service', dir: 'services/chat-service', port: 3004, color: '\x1b[33m', priority: 5 },
  { name: 'News Service', dir: 'services/news-service', port: 3005, color: '\x1b[31m', priority: 6 },
  { name: 'Admin Service', dir: 'services/admin-service', port: 3006, color: '\x1b[36m', priority: 7 },
  { name: 'Frontend Client', dir: 'client', port: 3000, color: '\x1b[95m', priority: 8 } // Added frontend
];

const isWindows = os.platform() === 'win32';

console.log('🚀 Starting all services + frontend in separate terminals...\n');

function startService(service) {
  const title = `${service.name} - Port ${service.port}`;
  const servicePath = path.join(__dirname, '..', service.dir);
  
  console.log(`${service.color}Starting ${service.name} on port ${service.port}...\x1b[0m`);

  if (isWindows) {
    // Windows: Use start command to open new CMD window
    const command = `start "${title}" cmd /k "cd /d "${servicePath}" && npm start"`;
    spawn('cmd', ['/c', command], { 
      stdio: 'inherit',
      shell: true 
    });
  } else {
    // Linux/Mac: Use gnome-terminal, xterm, or Terminal.app
    let terminal;
    let args;
    
    if (os.platform() === 'darwin') {
      // macOS
      terminal = 'osascript';
      args = ['-e', `tell application "Terminal" to do script "cd '${servicePath}' && npm start"`];
    } else {
      // Linux - try gnome-terminal first, then xterm
      try {
        terminal = 'gnome-terminal';
        args = ['--title', title, '--', 'bash', '-c', `cd '${servicePath}' && npm start; exec bash`];
      } catch (error) {
        terminal = 'xterm';
        args = ['-title', title, '-e', `bash -c "cd '${servicePath}' && npm start; exec bash"`];
      }
    }
    
    spawn(terminal, args, { 
      stdio: 'inherit',
      detached: true 
    });
  }
}

// Sort services by priority and start them
const sortedServices = services.sort((a, b) => a.priority - b.priority);

// Start all services with a small delay between each
sortedServices.forEach((service, index) => {
  setTimeout(() => {
    startService(service);
  }, index * 2000); // 2 second delay between each service
});

console.log('\n✅ All services + frontend are being started in separate terminals!');
console.log('📝 Each service will have its own terminal window/tab');
console.log('🔍 Check each terminal for service-specific logs');

// Wait a bit then show summary
setTimeout(() => {
  console.log('\n📊 Service Summary:');
  const sortedServices = services.sort((a, b) => a.priority - b.priority);
  sortedServices.forEach(service => {
    const url = service.name === 'Frontend Client' 
      ? `http://localhost:${service.port}` 
      : `http://localhost:${service.port}`;
    console.log(`  ${service.color}• ${service.name.padEnd(20)} - ${url}\x1b[0m`);
  });
  
  console.log('\n🌐 Main URLs:');
  console.log('  🎯 Frontend App:  http://localhost:3000');
  console.log('  🚪 API Gateway:   http://localhost:8080');
  console.log('  📊 Health Check:  http://localhost:8080/health');
  
  console.log('\n🛑 To stop all services, use: npm run stop:separate');
  console.log('   or close each terminal window manually');
}, 8000); // Wait longer for all services to start
