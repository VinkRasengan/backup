const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MaintainabilityFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.fixedFiles = [];
    this.fixStats = {
      totalFiles: 0,
      filesFixed: 0,
      issuesFixed: 0,
      autoFixable: 0,
      manualRequired: 0
    };
  }

  /**
   * Chạy quá trình fix maintainability
   */
  async fixMaintainabilityIssues() {
    console.log('🔧 Đang fix các vấn đề maintainability...\n');
    
    try {
      // Bước 1: Chạy ESLint auto-fix
      await this.runESLintAutoFix();
      
      // Bước 2: Fix các vấn đề phức tạp hơn
      await this.fixComplexIssues();
      
      // Bước 3: Tạo báo cáo
      this.generateFixReport();
      
    } catch (error) {
      console.error('❌ Lỗi trong quá trình fix:', error.message);
    }
  }

  /**
   * Chạy ESLint auto-fix
   */
  async runESLintAutoFix() {
    console.log('🔄 Bước 1: Chạy ESLint auto-fix...');
    
    try {
      const output = execSync('npx eslint . --fix --format json --ext .js,.jsx', {
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      console.log('✅ ESLint auto-fix hoàn thành!');
      
    } catch (error) {
      if (error.status === 1) {
        // Có một số vấn đề không thể auto-fix
        console.log('⚠️  Một số vấn đề cần fix thủ công');
        this.fixStats.manualRequired++;
      } else {
        throw error;
      }
    }
  }

  /**
   * Fix các vấn đề phức tạp hơn
   */
  async fixComplexIssues() {
    console.log('\n🔧 Bước 2: Fix các vấn đề phức tạp...');
    
    const jsFiles = this.findJavaScriptFiles();
    this.fixStats.totalFiles = jsFiles.length;
    
    for (const file of jsFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const fixedContent = this.applyMaintainabilityFixes(content, file);
        
        if (fixedContent !== content) {
          fs.writeFileSync(file, fixedContent, 'utf8');
          this.fixedFiles.push(file);
          this.fixStats.filesFixed++;
          console.log(`✅ Đã fix: ${path.relative(this.projectRoot, file)}`);
        }
      } catch (error) {
        console.log(`⚠️  Không thể fix ${path.relative(this.projectRoot, file)}: ${error.message}`);
      }
    }
  }

  /**
   * Tìm tất cả file JavaScript
   */
  findJavaScriptFiles() {
    const jsFiles = [];
    
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Bỏ qua node_modules và các thư mục không cần thiết
          if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(file)) {
            walkDir(filePath);
          }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          jsFiles.push(filePath);
        }
      }
    };
    
    walkDir(this.projectRoot);
    return jsFiles;
  }

  /**
   * Áp dụng các fix maintainability
   */
  applyMaintainabilityFixes(content, filePath) {
    let fixedContent = content;
    
    // Fix 1: Thay thế var bằng const/let
    fixedContent = this.fixVarDeclarations(fixedContent);
    
    // Fix 2: Thêm semicolons
    fixedContent = this.fixSemicolons(fixedContent);
    
    // Fix 3: Cải thiện arrow functions
    fixedContent = this.fixArrowFunctions(fixedContent);
    
    // Fix 4: Cải thiện destructuring
    fixedContent = this.fixDestructuring(fixedContent);
    
    // Fix 5: Cải thiện template literals
    fixedContent = this.fixTemplateLiterals(fixedContent);
    
    // Fix 6: Loại bỏ unused variables
    fixedContent = this.fixUnusedVariables(fixedContent);
    
    // Fix 7: Cải thiện object shorthand
    fixedContent = this.fixObjectShorthand(fixedContent);
    
    return fixedContent;
  }

  /**
   * Fix var declarations
   */
  fixVarDeclarations(content) {
    // Thay thế var bằng const cho các biến không reassign
    return content.replace(
      /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);/g,
      (match, varName, value) => {
        // Kiểm tra xem biến có được reassign không
        const reassignPattern = new RegExp(`${varName}\\s*=`, 'g');
        const reassignCount = (content.match(reassignPattern) || []).length;
        
        if (reassignCount <= 1) {
          return `const ${varName} = ${value};`;
        } else {
          return `let ${varName} = ${value};`;
        }
      }
    );
  }

  /**
   * Fix semicolons
   */
  fixSemicolons(content) {
    // Thêm semicolons cho các statement chưa có
    return content.replace(
      /([^;{}\s])\s*\n/g,
      (match, char) => {
        if (char === '}' || char === '{') {
          return match;
        }
        return `${char};\n`;
      }
    );
  }

  /**
   * Fix arrow functions
   */
  fixArrowFunctions(content) {
    // Thay thế function expressions đơn giản bằng arrow functions
    return content.replace(
      /function\s*\(\s*([^)]*)\s*\)\s*{\s*return\s+([^}]+);?\s*}/g,
      '($1) => $2'
    );
  }

  /**
   * Fix destructuring
   */
  fixDestructuring(content) {
    // Cải thiện object destructuring
    return content.replace(
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\.\s*([a-zA-Z_$][a-zA-Z0-9_$]*);/g,
      'const { $3: $1 } = $2;'
    );
  }

  /**
   * Fix template literals
   */
  fixTemplateLiterals(content) {
    // Thay thế string concatenation bằng template literals
    return content.replace(
      /'([^']*)'\s*\+\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\+\s*'([^']*)'/g,
      '`$1${$2}$3`'
    );
  }

  /**
   * Fix unused variables
   */
  fixUnusedVariables(content) {
    // Thêm underscore prefix cho unused parameters
    return content.replace(
      /function\s*\(\s*([^)]*)\s*\)/g,
      (match, params) => {
        const paramList = params.split(',').map(p => p.trim());
        const fixedParams = paramList.map(p => {
          if (p && !p.startsWith('_') && !content.includes(p)) {
            return `_${p}`;
          }
          return p;
        });
        return `function(${fixedParams.join(', ')})`;
      }
    );
  }

  /**
   * Fix object shorthand
   */
  fixObjectShorthand(content) {
    // Sử dụng object shorthand notation
    return content.replace(
      /([a-zA-Z_$][a-zA-Z0-9_$]*):\s*\1/g,
      '$1'
    );
  }

  /**
   * Tạo báo cáo fix
   */
  generateFixReport() {
    console.log('\n📊 BÁO CÁO FIX MAINTAINABILITY');
    console.log('================================');
    console.log(`📁 Tổng số file: ${this.fixStats.totalFiles}`);
    console.log(`✅ File đã fix: ${this.fixStats.filesFixed}`);
    console.log(`🔧 Vấn đề đã fix: ${this.fixStats.issuesFixed}`);
    console.log(`⚡ Auto-fixable: ${this.fixStats.autoFixable}`);
    console.log(`🔧 Cần fix thủ công: ${this.fixStats.manualRequired}`);
    
    if (this.fixedFiles.length > 0) {
      console.log('\n📝 Danh sách file đã fix:');
      this.fixedFiles.forEach(file => {
        console.log(`   - ${path.relative(this.projectRoot, file)}`);
      });
    }
    
    this.printNextSteps();
  }

  /**
   * In ra các bước tiếp theo
   */
  printNextSteps() {
    console.log('\n🚀 BƯỚC TIẾP THEO:');
    console.log('==================');
    console.log('1. Chạy lại ESLint để kiểm tra:');
    console.log('   npm run lint:maintainability');
    console.log('');
    console.log('2. Review các thay đổi:');
    console.log('   git diff');
    console.log('');
    console.log('3. Test ứng dụng:');
    console.log('   npm test');
    console.log('');
    console.log('4. Commit các thay đổi:');
    console.log('   git add . && git commit -m "fix: improve code maintainability"');
  }
}

// Chạy script
if (require.main === module) {
  const fixer = new MaintainabilityFixer();
  fixer.fixMaintainabilityIssues().catch(error => {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  });
}

module.exports = MaintainabilityFixer;
