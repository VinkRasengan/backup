import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class ESLintMaintainabilityChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      totalFiles: 0,
      filesWithIssues: 0,
      totalIssues: 0,
      maintainabilityIssues: 0,
      criticalIssues: 0,
      warnings: 0,
      errors: 0
    };
  }

  /**
   * Chạy ESLint trên toàn bộ dự án
   */
  async runESLint() {
    console.log('🔍 Đang chạy ESLint để kiểm tra maintainability...\n');
    
    try {
      // Kiểm tra xem ESLint đã được cài đặt chưa
      this.checkESLintInstallation();
      
      // Chạy ESLint với format JSON để parse kết quả
      const eslintOutput = execSync('npx eslint . --format json --ext .js,.jsx', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const results = JSON.parse(eslintOutput);
      this.analyzeResults(results);
      this.generateReport();
      
    } catch (error) {
      if (error.status === 1) {
        // ESLint tìm thấy lỗi - đây là expected behavior
        const results = JSON.parse(error.stdout || '[]');
        this.analyzeResults(results);
        this.generateReport();
      } else {
        console.error('❌ Lỗi khi chạy ESLint:', error.message);
        this.suggestInstallation();
      }
    }
  }

  /**
   * Kiểm tra xem ESLint đã được cài đặt chưa
   */
  checkESLintInstallation() {
    try {
      execSync('npx eslint --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 ESLint chưa được cài đặt. Đang cài đặt...');
      this.installESLint();
    }
  }

  /**
   * Cài đặt ESLint và các plugin cần thiết
   */
  installESLint() {
    try {
      console.log('📦 Cài đặt ESLint và các plugin...');
      execSync('npm install --save-dev eslint @eslint/js eslint-plugin-node eslint-plugin-import', {
        stdio: 'inherit'
      });
      console.log('✅ ESLint đã được cài đặt thành công!');
    } catch (error) {
      console.error('❌ Lỗi khi cài đặt ESLint:', error.message);
      process.exit(1);
    }
  }

  /**
   * Phân tích kết quả ESLint
   */
  analyzeResults(results) {
    this.results.totalFiles = results.length;
    
    results.forEach(fileResult => {
      if (fileResult.messages.length > 0) {
        this.results.filesWithIssues++;
        this.results.totalIssues += fileResult.messages.length;
        
        fileResult.messages.forEach(message => {
          // Phân loại các vấn đề
          if (message.severity === 2) {
            this.results.errors++;
          } else {
            this.results.warnings++;
          }
          
          // Kiểm tra các vấn đề về maintainability
          if (this.isMaintainabilityIssue(message.ruleId)) {
            this.results.maintainabilityIssues++;
          }
          
          // Kiểm tra các vấn đề nghiêm trọng
          if (this.isCriticalIssue(message.ruleId)) {
            this.results.criticalIssues++;
          }
        });
      }
    });
  }

  /**
   * Kiểm tra xem có phải là vấn đề maintainability không
   */
  isMaintainabilityIssue(ruleId) {
    const maintainabilityRules = [
      'complexity',
      'max-depth',
      'max-lines',
      'max-lines-per-function',
      'max-params',
      'max-statements',
      'id-length',
      'no-unused-vars',
      'prefer-const',
      'no-var',
      'func-style',
      'prefer-arrow-callback',
      'object-shorthand',
      'prefer-destructuring',
      'prefer-template',
      'no-else-return',
      'no-nested-ternary'
    ];
    
    return maintainabilityRules.includes(ruleId);
  }

  /**
   * Kiểm tra xem có phải là vấn đề nghiêm trọng không
   */
  isCriticalIssue(ruleId) {
    const criticalRules = [
      'no-eval',
      'no-implied-eval',
      'no-new-func',
      'no-script-url',
      'no-throw-literal',
      'no-unreachable',
      'no-unreachable-loop',
      'no-use-before-define',
      'no-undef'
    ];
    
    return criticalRules.includes(ruleId);
  }

  /**
   * Tạo báo cáo chi tiết
   */
  generateReport() {
    console.log('\n📊 BÁO CÁO MAINTAINABILITY ESLINT');
    console.log('=====================================');
    
    console.log(`📁 Tổng số file: ${this.results.totalFiles}`);
    console.log(`⚠️  File có vấn đề: ${this.results.filesWithIssues}`);
    console.log(`🔍 Tổng số vấn đề: ${this.results.totalIssues}`);
    console.log(`🔧 Vấn đề maintainability: ${this.results.maintainabilityIssues}`);
    console.log(`🚨 Vấn đề nghiêm trọng: ${this.results.criticalIssues}`);
    console.log(`❌ Lỗi: ${this.results.errors}`);
    console.log(`⚠️  Cảnh báo: ${this.results.warnings}`);
    
    // Tính điểm maintainability
    const maintainabilityScore = this.calculateMaintainabilityScore();
    console.log(`\n📈 ĐIỂM MAINTAINABILITY: ${maintainabilityScore}/100`);
    
    this.printRecommendations();
    this.printQuickFixes();
  }

  /**
   * Tính điểm maintainability
   */
  calculateMaintainabilityScore() {
    if (this.results.totalFiles === 0) return 100;
    
    const baseScore = 100;
    const deductions = {
      maintainabilityIssues: 2, // -2 điểm cho mỗi vấn đề maintainability
      criticalIssues: 5,        // -5 điểm cho mỗi vấn đề nghiêm trọng
      errors: 3,                // -3 điểm cho mỗi lỗi
      warnings: 1               // -1 điểm cho mỗi cảnh báo
    };
    
    const totalDeduction = 
      (this.results.maintainabilityIssues * deductions.maintainabilityIssues) +
      (this.results.criticalIssues * deductions.criticalIssues) +
      (this.results.errors * deductions.errors) +
      (this.results.warnings * deductions.warnings);
    
    return Math.max(0, baseScore - totalDeduction);
  }

  /**
   * In ra các khuyến nghị
   */
  printRecommendations() {
    console.log('\n💡 KHUYẾN NGHỊ CẢI THIỆN MAINTAINABILITY:');
    console.log('==========================================');
    
    if (this.results.maintainabilityIssues > 0) {
      console.log('🔧 Vấn đề Maintainability:');
      console.log('   - Giảm độ phức tạp của functions (complexity < 10)');
      console.log('   - Giảm độ sâu của nested blocks (max-depth < 4)');
      console.log('   - Tách các function dài thành các function nhỏ hơn');
      console.log('   - Sử dụng const/let thay vì var');
      console.log('   - Ưu tiên arrow functions và destructuring');
    }
    
    if (this.results.criticalIssues > 0) {
      console.log('🚨 Vấn đề Nghiêm trọng:');
      console.log('   - Loại bỏ eval(), new Function()');
      console.log('   - Kiểm tra unreachable code');
      console.log('   - Sử dụng Error objects thay vì literals');
    }
    
    if (this.results.errors > 0) {
      console.log('❌ Lỗi cần sửa:');
      console.log('   - Sửa các lỗi syntax và undefined variables');
      console.log('   - Kiểm tra import/export statements');
    }
  }

  /**
   * In ra các lệnh fix nhanh
   */
  printQuickFixes() {
    console.log('\n⚡ LỆNH FIX NHANH:');
    console.log('==================');
    console.log('🔧 Tự động sửa các vấn đề có thể fix:');
    console.log('   npx eslint . --fix');
    console.log('');
    console.log('🔍 Chạy lại kiểm tra:');
    console.log('   npm run lint:maintainability');
    console.log('');
    console.log('📊 Xem báo cáo chi tiết:');
    console.log('   npx eslint . --format stylish');
  }

  /**
   * Gợi ý cài đặt nếu ESLint chưa có
   */
  suggestInstallation() {
    console.log('\n💡 Để sử dụng ESLint cho maintainability:');
    console.log('==========================================');
    console.log('1. Cài đặt ESLint:');
    console.log('   npm install --save-dev eslint @eslint/js eslint-plugin-node eslint-plugin-import');
    console.log('');
    console.log('2. Chạy lệnh này để kiểm tra:');
    console.log('   node scripts/eslint-maintainability.js');
  }
}

// Chạy script
const checker = new ESLintMaintainabilityChecker();
checker.runESLint().catch(error => {
  console.error('❌ Lỗi:', error.message);
  process.exit(1);
});

export default ESLintMaintainabilityChecker;
