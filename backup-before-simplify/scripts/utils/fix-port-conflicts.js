#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Port Conflicts Across All Files');
console.log('==========================================');
console.log('');

const fixes = [
  {
    file: 'docker-compose.dev.yml',
    changes: [
      { line: 11, from: '"8080:8080"', to: '"8082:8082"' },
      { line: 222, from: 'REACT_APP_API_URL=http://localhost:8080', to: 'REACT_APP_API_URL=http://localhost:8082' }
    ]
  },
  {
    file: 'docker-compose.microservices.yml',
    changes: [
      { line: 10, from: '"8080:8080"', to: '"8082:8082"' },
      { line: 200, from: 'REACT_APP_API_URL=http://localhost:8080', to: 'REACT_APP_API_URL=http://localhost:8082' },
      { line: 231, from: '"3007:3000"', to: '"3010:3000"' }
    ]
  },
  {
    file: 'monitoring/prometheus/prometheus.yml',
    changes: [
      { line: 68, from: 'community-service:3005', to: 'community-service:3003' },
      { line: 54, from: 'news-service:3003', to: 'news-service:3005' }
    ]
  },
  {
    file: 'package.json',
    changes: [
      { line: 42, from: 'http://localhost:8080/services/status', to: 'http://localhost:8082/services/status' }
    ]
  }
];

function updateFile(filePath, changes) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let modified = false;

    changes.forEach(change => {
      if (lines[change.line - 1] && lines[change.line - 1].includes(change.from)) {
        lines[change.line - 1] = lines[change.line - 1].replace(change.from, change.to);
        console.log(`✅ ${filePath}:${change.line} - ${change.from} → ${change.to}`);
        modified = true;
      } else {
        console.log(`⚠️  ${filePath}:${change.line} - Pattern not found: ${change.from}`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      return true;
    }
    return false;
  } catch (error) {
    console.log(`❌ Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

function updateStopScripts() {
  console.log('\n📝 Updating stop scripts...');
  
  // Update stop-local.bat
  const batFile = 'scripts/stop-local.bat';
  if (fs.existsSync(batFile)) {
    let content = fs.readFileSync(batFile, 'utf8');
    content = content.replace('set PORTS=3000 3001 3002 3003 3004 3005 3006 8080', 
                             'set PORTS=3000 3001 3002 3003 3004 3005 3006 8082');
    content = content.replace('set SERVICE_8080=API Gateway', 
                             'set SERVICE_8082=API Gateway');
    fs.writeFileSync(batFile, content);
    console.log('✅ Updated scripts/stop-local.bat');
  }

  // Update stop-local.sh
  const shFile = 'scripts/stop-local.sh';
  if (fs.existsSync(shFile)) {
    let content = fs.readFileSync(shFile, 'utf8');
    content = content.replace('[8080]="API Gateway"', '[8082]="API Gateway"');
    fs.writeFileSync(shFile, content);
    console.log('✅ Updated scripts/stop-local.sh');
  }

  // Update kill-dev-servers.js
  const killFile = 'client/scripts/kill-dev-servers.js';
  if (fs.existsSync(killFile)) {
    let content = fs.readFileSync(killFile, 'utf8');
    content = content.replace('const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];',
                             'const ports = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 8082];');
    fs.writeFileSync(killFile, content);
    console.log('✅ Updated client/scripts/kill-dev-servers.js');
  }
}

function updateServiceConfigs() {
  console.log('\n⚙️  Updating service configurations...');
  
  // Update API Gateway Docker port
  const apiGatewayDockerfile = 'services/api-gateway/Dockerfile';
  if (fs.existsSync(apiGatewayDockerfile)) {
    let content = fs.readFileSync(apiGatewayDockerfile, 'utf8');
    if (content.includes('EXPOSE 8080')) {
      content = content.replace('EXPOSE 8080', 'EXPOSE 8082');
      fs.writeFileSync(apiGatewayDockerfile, content);
      console.log('✅ Updated services/api-gateway/Dockerfile');
    }
  }

  // Update .env.template
  const envTemplate = '.env.template';
  if (fs.existsSync(envTemplate)) {
    let content = fs.readFileSync(envTemplate, 'utf8');
    if (content.includes('PORT=5000')) {
      content = content.replace('# Server\nPORT=5000', '# Server\nPORT=8082');
      fs.writeFileSync(envTemplate, content);
      console.log('✅ Updated .env.template');
    }
  }
}

function createPortValidationScript() {
  console.log('\n🔍 Creating port validation script...');
  
  const validationScript = `#!/usr/bin/env node

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
      execSync(\`netstat -an | findstr :\${port}\`, { stdio: 'ignore' });
    } else {
      execSync(\`lsof -i :\${port}\`, { stdio: 'ignore' });
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
    running.push(\`✅ Port \${port}: \${service}\`);
  } else {
    console.log(\`⚪ Port \${port}: \${service} (not running)\`);
  }
});

if (running.length > 0) {
  console.log('\\n🟢 Running Services:');
  running.forEach(line => console.log(line));
}

if (conflicts.length > 0) {
  console.log('\\n🔴 Port Conflicts:');
  conflicts.forEach(line => console.log(line));
} else {
  console.log('\\n🎉 No port conflicts detected!');
}

console.log(\`\\n📊 Summary: \${running.length} services running, \${conflicts.length} conflicts\`);
`;

  fs.writeFileSync('scripts/validate-ports.js', validationScript);
  console.log('✅ Created scripts/validate-ports.js');
}

// Main execution
console.log('🔄 Processing file updates...');
let totalUpdated = 0;

fixes.forEach(fix => {
  console.log(`\\n📁 Updating ${fix.file}...`);
  if (updateFile(fix.file, fix.changes)) {
    totalUpdated++;
  }
});

updateStopScripts();
updateServiceConfigs();
createPortValidationScript();

console.log('\\n🎉 Port Conflict Fix Complete!');
console.log('================================');
console.log(`✅ Updated ${totalUpdated} main files`);
console.log('✅ Updated stop scripts');
console.log('✅ Updated service configs');
console.log('✅ Created port validation script');
console.log('');
console.log('🚀 Next steps:');
console.log('1. Run: npm run validate:ports');
console.log('2. Restart services: npm run stop:all && npm start');
console.log('3. Test monitoring: http://localhost:3010');
console.log('4. Test API Gateway: http://localhost:8082');
console.log('');
