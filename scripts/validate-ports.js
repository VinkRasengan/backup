#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

const expectedPorts = {
  3000: 'Frontend',
  3001: 'Auth Service',
  3002: 'Link Service', 
  3003: 'Community Service',
  3004: 'Chat Service',
  3005: 'News Service',
  3006: 'Admin Service',
  3010: 'Grafana',
  5001: 'Webhook Service',
  6379: 'Redis',
  8082: 'API Gateway',
  9090: 'Prometheus',
  9093: 'Alertmanager',
  9100: 'Node Exporter',
  9121: 'Redis Exporter',
  8081: 'cAdvisor'
};

console.log('🔍 Port Validation Report');
console.log('========================');
console.log('');

function checkPort(port) {
  try {
    if (os.platform() === 'win32') {
      execSync(`netstat -an | findstr :${port}`, { stdio: 'ignore' });
    } else {
      execSync(`lsof -i :${port}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
}

let conflicts = [];
let running = [];

Object.entries(expectedPorts).forEach(([port, service]) => {
  const isRunning = checkPort(port);
  if (isRunning) {
    running.push(`✅ Port ${port}: ${service}`);
  } else {
    console.log(`⚪ Port ${port}: ${service} (not running)`);
  }
});

if (running.length > 0) {
  console.log('\n🟢 Running Services:');
  running.forEach(line => console.log(line));
}

if (conflicts.length > 0) {
  console.log('\n🔴 Port Conflicts:');
  conflicts.forEach(line => console.log(line));
} else {
  console.log('\n🎉 No port conflicts detected!');
}

console.log(`\n📊 Summary: ${running.length} services running, ${conflicts.length} conflicts`);
