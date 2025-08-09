import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

/**
 * Security Audit Script for FactCheck Platform
 * Thực hiện security audit bằng npm audit cho toàn bộ dự án
 */

import { execSync, spawn  } from 'child_process';
import fs from 'fs';
import path from 'path';
const chalk = require('chalk');

// Cấu hình màu sắc cho output
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  title: chalk.cyan.bold
};

// Cấu hình audit levels
const AUDIT_LEVELS = {
  low: 'low',
  moderate: 'moderate', 
  high: 'high',
  critical: 'critical'
};

// Danh sách các thư mục cần audit
const AUDIT_DIRECTORIES = [
  '.', // Root directory
  'client',
  'services/api-gateway',
  'services/auth-service', 
  'services/community-service',
  'services/chat-service',
  'services/link-service',
  'services/news-service',
  'services/admin-service',
  'services/etl-service',
  'services/event-bus-service',
  'services/spark-service',
  'services/analytics-service',
  'services/phishtank-service',
  'services/criminalip-service'
];

class SecurityAuditor {
  constructor() {
    this.results = [];
    this.summary = {
      total: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      info: 0
    };
  }

  /**
   * Kiểm tra xem thư mục có package.json không
   */
  hasPackageJson(directory) {
    const packagePath = path.join(directory, 'package.json');
    return fs.existsSync(packagePath);
  }

  /**
   * Thực hiện npm audit cho một thư mục
   */
  async auditDirectory(directory, auditLevel = 'moderate') {
    if (!this.hasPackageJson(directory)) {
      console.log(colors.warning(`⚠️  Skipping ${directory}: No package.json found`));
      return null;
    }

    console.log(colors.info(`🔍 Auditing ${directory}...`));

    try {
      const result = {
        directory,
        timestamp: new Date().toISOString(),
        vulnerabilities: null,
        error: null
      };

      // Thực hiện npm audit với JSON output
      const auditCommand = `npm audit --audit-level=${auditLevel} --json`;
      const output = execSync(auditCommand, { 
        cwd: directory, 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      const auditData = JSON.parse(output);
      result.vulnerabilities = auditData;

      // Phân tích kết quả
      this.analyzeVulnerabilities(directory, auditData);

      console.log(colors.success(`✅ ${directory}: Audit completed`));
      return result;

    } catch (error) {
      const result = {
        directory,
        timestamp: new Date().toISOString(),
        vulnerabilities: null,
        error: error.message
      };

      console.log(colors.error(`❌ ${directory}: Audit failed - ${error.message}`));
      return result;
    }
  }

  /**
   * Phân tích vulnerabilities và cập nhật summary
   */
  analyzeVulnerabilities(directory, auditData) {
    if (!auditData.metadata || !auditData.metadata.vulnerabilities) {
      return;
    }

    const vulns = auditData.metadata.vulnerabilities;
    
    this.summary.total += vulns.total || 0;
    this.summary.critical += vulns.critical || 0;
    this.summary.high += vulns.high || 0;
    this.summary.moderate += vulns.moderate || 0;
    this.summary.low += vulns.low || 0;
    this.summary.info += vulns.info || 0;

    // Log chi tiết vulnerabilities
    if (vulns.total > 0) {
      console.log(colors.warning(`   Found ${vulns.total} vulnerabilities:`));
      if (vulns.critical) console.log(colors.error(`     Critical: ${vulns.critical}`));
      if (vulns.high) console.log(colors.error(`     High: ${vulns.high}`));
      if (vulns.moderate) console.log(colors.warning(`     Moderate: ${vulns.moderate}`));
      if (vulns.low) console.log(colors.info(`     Low: ${vulns.low}`));
      if (vulns.info) console.log(colors.info(`     Info: ${vulns.info}`));
    } else {
      console.log(colors.success(`   ✅ No vulnerabilities found`));
    }
  }

  /**
   * Thực hiện audit cho tất cả thư mục
   */
  async runFullAudit(auditLevel = 'moderate') {
    console.log(colors.title('\n🔒 SECURITY AUDIT STARTED'));
    console.log(colors.info(`Audit Level: ${auditLevel.toUpperCase()}`));
    console.log(colors.info(`Timestamp: ${new Date().toISOString()}`));
    console.log('='.repeat(60));

    for (const directory of AUDIT_DIRECTORIES) {
      const result = await this.auditDirectory(directory, auditLevel);
      if (result) {
        this.results.push(result);
      }
    }

    this.generateReport();
  }

  /**
   * Tạo báo cáo tổng hợp
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log(colors.title('📊 SECURITY AUDIT SUMMARY'));
    console.log('='.repeat(60));

    console.log(colors.info(`Total Directories Audited: ${this.results.length}`));
    console.log(colors.info(`Total Vulnerabilities Found: ${this.summary.total}`));
    
    if (this.summary.critical > 0) {
      console.log(colors.error(`🚨 CRITICAL: ${this.summary.critical}`));
    }
    if (this.summary.high > 0) {
      console.log(colors.error(`⚠️  HIGH: ${this.summary.high}`));
    }
    if (this.summary.moderate > 0) {
      console.log(colors.warning(`⚠️  MODERATE: ${this.summary.moderate}`));
    }
    if (this.summary.low > 0) {
      console.log(colors.info(`ℹ️  LOW: ${this.summary.low}`));
    }
    if (this.summary.info > 0) {
      console.log(colors.info(`ℹ️  INFO: ${this.summary.info}`));
    }

    // Đề xuất hành động
    this.generateRecommendations();

    // Lưu báo cáo
    this.saveReport();
  }

  /**
   * Tạo đề xuất hành động
   */
  generateRecommendations() {
    console.log('\n' + colors.title('🎯 RECOMMENDATIONS'));
    console.log('-'.repeat(40));

    if (this.summary.critical > 0 || this.summary.high > 0) {
      console.log(colors.error('🚨 IMMEDIATE ACTION REQUIRED:'));
      console.log('   • Run: npm audit fix');
      console.log('   • Review and update vulnerable dependencies');
      console.log('   • Consider using npm audit fix --force for critical issues');
    }

    if (this.summary.moderate > 0) {
      console.log(colors.warning('⚠️  RECOMMENDED ACTIONS:'));
      console.log('   • Run: npm audit fix');
      console.log('   • Update dependencies to latest stable versions');
      console.log('   • Review security advisories for affected packages');
    }

    if (this.summary.total === 0) {
      console.log(colors.success('✅ EXCELLENT: No vulnerabilities found!'));
      console.log('   • Continue regular security monitoring');
      console.log('   • Set up automated security scanning in CI/CD');
    }

    console.log('\n' + colors.info('📋 USEFUL COMMANDS:'));
    console.log('   • npm audit --audit-level=moderate');
    console.log('   • npm audit fix');
    console.log('   • npm audit fix --force');
    console.log('   • npm outdated');
    console.log('   • npm update');
  }

  /**
   * Lưu báo cáo vào file
   */
  saveReport() {
    const reportPath = path.join(__dirname, '../security-audit-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.summary,
      results: this.results
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(colors.success(`\n📄 Report saved to: ${reportPath}`));
    } catch (error) {
      console.log(colors.error(`\n❌ Failed to save report: ${error.message}`));
    }
  }

  /**
   * Thực hiện fix tự động cho các vulnerabilities
   */
  async runAutoFix() {
    console.log(colors.title('\n🔧 RUNNING AUTO-FIX'));
    console.log('-'.repeat(40));

    for (const directory of AUDIT_DIRECTORIES) {
      if (!this.hasPackageJson(directory)) continue;

      console.log(colors.info(`🔧 Fixing ${directory}...`));

      try {
        execSync('npm audit fix', { 
          cwd: directory, 
          stdio: 'inherit'
        });
        console.log(colors.success(`✅ ${directory}: Auto-fix completed`));
      } catch (error) {
        console.log(colors.warning(`⚠️  ${directory}: Auto-fix failed - ${error.message}`));
      }
    }
  }
}

// Main execution
async function main() {
  const auditor = new SecurityAuditor();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const auditLevel = args.includes('--critical') ? 'critical' :
                    args.includes('--high') ? 'high' :
                    args.includes('--low') ? 'low' : 'moderate';
  
  const shouldAutoFix = args.includes('--fix');

  try {
    // Chạy security audit
    await auditor.runFullAudit(auditLevel);

    // Chạy auto-fix nếu được yêu cầu
    if (shouldAutoFix) {
      await auditor.runAutoFix();
      
      console.log(colors.title('\n🔄 RE-AUDITING AFTER FIXES'));
      console.log('-'.repeat(40));
      
      // Chạy lại audit sau khi fix
      auditor.summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
      auditor.results = [];
      await auditor.runFullAudit(auditLevel);
    }

  } catch (error) {
    console.error(colors.error(`\n❌ Security audit failed: ${error.message}`));
    process.exit(1);
  }
}

// Chạy script nếu được gọi trực tiếp
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default SecurityAuditor;
