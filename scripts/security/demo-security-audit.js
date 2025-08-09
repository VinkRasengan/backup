#!/usr/bin/env node

/**
 * Demo Security Audit Script
 * Script demo để show cách sử dụng npm audit
 */

import { execSync  } from 'child_process';
const chalk = require('chalk');

// Màu sắc cho output
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  title: chalk.cyan.bold,
  highlight: chalk.magenta
};

function log(message, color = 'info') {
  console.log(colors[color](message));
}

function logTitle(title) {
  console.log(`\n${colors.title(title)}`);
  console.log('='.repeat(title.length));
}

function logSection(section) {
  console.log(`\n${colors.highlight(section)}`);
  console.log('-'.repeat(section.length));
}

/**
 * Demo 1: Basic npm audit
 */
function demoBasicAudit() {
  logSection('🔍 Demo 1: Basic npm audit');
  
  log('Command: npm audit', 'info');
  log('Description: Kiểm tra tất cả vulnerabilities trong dependencies', 'info');
  
  try {
    const result = execSync('npm audit', { encoding: 'utf8', stdio: 'pipe' });
    
    if (result.includes('found 0 vulnerabilities')) {
      log('✅ Result: No vulnerabilities found!', 'success');
    } else {
      log('⚠️  Result: Vulnerabilities found', 'warning');
      console.log(result);
    }
  } catch (error) {
    if (error.stdout) {
      log('⚠️  Result: Vulnerabilities found', 'warning');
      console.log(error.stdout);
    } else {
      log('❌ Error running audit', 'error');
    }
  }
}

/**
 * Demo 2: npm audit với audit level
 */
function demoAuditWithLevel() {
  logSection('🎯 Demo 2: npm audit với audit level');
  
  const levels = ['low', 'moderate', 'high', 'critical'];
  
  levels.forEach(level => {
    log(`Command: npm audit --audit-level=${level}`, 'info');
    
    try {
      const result = execSync(`npm audit --audit-level=${level}`, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      
      if (result.includes('found 0 vulnerabilities')) {
        log(`✅ ${level.toUpperCase()}: No vulnerabilities`, 'success');
      } else {
        log(`⚠️  ${level.toUpperCase()}: Vulnerabilities found`, 'warning');
      }
    } catch (error) {
      if (error.stdout && error.stdout.includes('found 0 vulnerabilities')) {
        log(`✅ ${level.toUpperCase()}: No vulnerabilities`, 'success');
      } else if (error.stdout) {
        log(`⚠️  ${level.toUpperCase()}: Vulnerabilities found`, 'warning');
      } else {
        log(`❌ ${level.toUpperCase()}: Error`, 'error');
      }
    }
  });
}

/**
 * Demo 3: npm audit fix
 */
function demoAuditFix() {
  logSection('🔧 Demo 3: npm audit fix');
  
  log('Command: npm audit fix', 'info');
  log('Description: Tự động fix các vulnerabilities có thể sửa được', 'info');
  
  try {
    const result = execSync('npm audit fix', { encoding: 'utf8', stdio: 'pipe' });
    log('✅ Result: Fix completed', 'success');
    console.log(result);
  } catch (error) {
    if (error.stdout) {
      log('⚠️  Result: Some issues fixed, some require manual review', 'warning');
      console.log(error.stdout);
    } else {
      log('❌ Error running fix', 'error');
    }
  }
}

/**
 * Demo 4: npm audit với JSON output
 */
function demoAuditJSON() {
  logSection('📊 Demo 4: npm audit với JSON output');
  
  log('Command: npm audit --json', 'info');
  log('Description: Tạo báo cáo JSON chi tiết', 'info');
  
  try {
    const result = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
    const auditData = JSON.parse(result);
    
    if (auditData.metadata && auditData.metadata.vulnerabilities) {
      const vulns = auditData.metadata.vulnerabilities;
      log(`📈 Vulnerability Summary:`, 'info');
      log(`   Total: ${vulns.total || 0}`, 'info');
      log(`   Critical: ${vulns.critical || 0}`, 'error');
      log(`   High: ${vulns.high || 0}`, 'warning');
      log(`   Moderate: ${vulns.moderate || 0}`, 'warning');
      log(`   Low: ${vulns.low || 0}`, 'info');
    } else {
      log('✅ No vulnerabilities found', 'success');
    }
  } catch (error) {
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);
        if (auditData.metadata && auditData.metadata.vulnerabilities) {
          const vulns = auditData.metadata.vulnerabilities;
          log(`📈 Vulnerability Summary:`, 'info');
          log(`   Total: ${vulns.total || 0}`, 'info');
          log(`   Critical: ${vulns.critical || 0}`, 'error');
          log(`   High: ${vulns.high || 0}`, 'warning');
          log(`   Moderate: ${vulns.moderate || 0}`, 'warning');
          log(`   Low: ${vulns.low || 0}`, 'info');
        }
      } catch (parseError) {
        log('❌ Error parsing JSON output', 'error');
      }
    } else {
      log('❌ Error running JSON audit', 'error');
    }
  }
}

/**
 * Demo 5: Kiểm tra outdated packages
 */
function demoOutdatedPackages() {
  logSection('📦 Demo 5: Kiểm tra outdated packages');
  
  log('Command: npm outdated', 'info');
  log('Description: Kiểm tra packages có thể cập nhật', 'info');
  
  try {
    const result = execSync('npm outdated --depth=0', { encoding: 'utf8', stdio: 'pipe' });
    
    if (result.trim() === '') {
      log('✅ All packages are up to date!', 'success');
    } else {
      log('⚠️  Outdated packages found:', 'warning');
      console.log(result);
    }
  } catch (error) {
    if (error.stdout) {
      log('⚠️  Outdated packages found:', 'warning');
      console.log(error.stdout);
    } else {
      log('✅ All packages are up to date!', 'success');
    }
  }
}

/**
 * Demo 6: Security best practices
 */
function demoBestPractices() {
  logSection('🛡️ Demo 6: Security Best Practices');
  
  const practices = [
    {
      title: 'Regular Auditing',
      description: 'Chạy npm audit định kỳ',
      command: 'npm audit --audit-level=moderate',
      frequency: 'Hàng tuần'
    },
    {
      title: 'Auto-fix Vulnerabilities',
      description: 'Tự động fix các lỗ hổng',
      command: 'npm audit fix',
      frequency: 'Sau mỗi lần audit'
    },
    {
      title: 'Update Dependencies',
      description: 'Cập nhật packages thường xuyên',
      command: 'npm update',
      frequency: 'Hàng tháng'
    },
    {
      title: 'Check Outdated Packages',
      description: 'Kiểm tra packages cũ',
      command: 'npm outdated',
      frequency: 'Hàng tuần'
    },
    {
      title: 'Use Lock Files',
      description: 'Sử dụng package-lock.json',
      command: 'npm ci',
      frequency: 'Trong CI/CD'
    }
  ];
  
  practices.forEach((practice, index) => {
    log(`${index + 1}. ${practice.title}`, 'highlight');
    log(`   Description: ${practice.description}`, 'info');
    log(`   Command: ${practice.command}`, 'info');
    log(`   Frequency: ${practice.frequency}`, 'info');
    console.log('');
  });
}

/**
 * Demo 7: Integration với CI/CD
 */
function demoCICDIntegration() {
  logSection('🔄 Demo 7: Integration với CI/CD');
  
  log('GitHub Actions Example:', 'info');
  console.log(`
# .github/workflows/security-audit.yml
name: Security Audit

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security audit
      run: npm audit --audit-level=moderate
    
    - name: Generate audit report
      run: npm audit --json > audit-report.json
    
    - name: Upload audit report
      uses: actions/upload-artifact@v3
      with:
        name: security-audit-report
        path: audit-report.json
  `);
}

/**
 * Main demo function
 */
function runDemo() {
  logTitle('🔒 Security Audit Demo');
  log(`Started at: ${new Date().toISOString()}`, 'info');
  
  // Chạy các demo
  demoBasicAudit();
  demoAuditWithLevel();
  demoAuditFix();
  demoAuditJSON();
  demoOutdatedPackages();
  demoBestPractices();
  demoCICDIntegration();
  
  logSection('📋 Demo Summary');
  log('✅ Basic npm audit: Kiểm tra vulnerabilities', 'success');
  log('✅ Audit levels: Kiểm tra theo mức độ nghiêm trọng', 'success');
  log('✅ Auto-fix: Tự động sửa lỗ hổng', 'success');
  log('✅ JSON output: Tạo báo cáo chi tiết', 'success');
  log('✅ Outdated check: Kiểm tra packages cũ', 'success');
  log('✅ Best practices: Quy trình bảo mật', 'success');
  log('✅ CI/CD integration: Tự động hóa', 'success');
  
  log('\n🎯 Next Steps:', 'highlight');
  log('1. Chạy: npm run security:audit (cho toàn bộ dự án)', 'info');
  log('2. Chạy: npm run security:test (cho test nhanh)', 'info');
  log('3. Setup: CI/CD pipeline với security audit', 'info');
  log('4. Monitor: Định kỳ kiểm tra vulnerabilities', 'info');
  
  log(`\nCompleted at: ${new Date().toISOString()}`, 'info');
}

// Chạy demo nếu được gọi trực tiếp
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDemo();
}

export default {
  demoBasicAudit,
  demoAuditWithLevel,
  demoAuditFix,
  demoAuditJSON,
  demoOutdatedPackages,
  demoBestPractices,
  demoCICDIntegration
};
