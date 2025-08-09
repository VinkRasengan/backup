import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

/**
 * Fix Env Loader Paths - Fix incorrect env-loader import paths
 * Updates all services to use the correct path to config/env-loader.js
 */

import fs from 'fs';
import path from 'path';

class EnvLoaderPathFixer {
  constructor() {
    this.rootDir = process.cwd();
    this.fixedFiles = [];
    this.errors = [];
  }

  /**
   * Main fix function
   */
  async fix() {
    console.log('🔧 Fixing Env Loader Paths - Updating import paths');
    console.log('=' .repeat(60));

    try {
      await this.findAndFixFiles();
      this.showResults();
    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Find and fix all files with incorrect env-loader paths
   */
  async findAndFixFiles() {
    const servicesDir = path.join(this.rootDir, 'services');
    const services = fs.readdirSync(servicesDir).filter(item => {
      return fs.statSync(path.join(servicesDir, item)).isDirectory();
    });

    for (const service of services) {
      await this.fixServiceFiles(service);
    }
  }

  /**
   * Fix files in a specific service
   */
  async fixServiceFiles(serviceName) {
    console.log(`🔧 Fixing ${serviceName}...`);
    
    const serviceDir = path.join(this.rootDir, 'services', serviceName);
    
    // Find all JS files that might import env-loader
    const filesToCheck = [];
    
    // Check common locations
    const commonPaths = [
      'src/app.js',
      'src/config/firebase.js',
      'app.js',
      'index.js'
    ];

    for (const filePath of commonPaths) {
      const fullPath = path.join(serviceDir, filePath);
      if (fs.existsSync(fullPath)) {
        filesToCheck.push(fullPath);
      }
    }

    // Also recursively find JS files in src directory
    const srcDir = path.join(serviceDir, 'src');
    if (fs.existsSync(srcDir)) {
      this.findJSFiles(srcDir, filesToCheck);
    }

    // Fix each file
    for (const filePath of filesToCheck) {
      await this.fixFile(filePath, serviceName);
    }
  }

  /**
   * Recursively find JS files
   */
  findJSFiles(dir, fileList) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.findJSFiles(fullPath, fileList);
      } else if (file.endsWith('.js')) {
        fileList.push(fullPath);
      }
    }
  }

  /**
   * Fix individual file
   */
  async fixFile(filePath, serviceName) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      const originalContent = content;

      // Calculate correct relative path to config/env-loader.js
      const relativePath = path.relative(path.dirname(filePath), path.join(this.rootDir, 'config', 'env-loader.js'));
      const correctPath = relativePath.replace(/\\/g, '/'); // Use forward slashes

      // Patterns to fix
      const patterns = [
        // Pattern 1: require('../utils/env-loader')
        {
          regex: /require\(['"`]\.\.\/utils\/env-loader['"`]\)/g,
          replacement: `require('${correctPath}')`
        },
        // Pattern 2: require('./utils/env-loader')
        {
          regex: /require\(['"`]\.\/utils\/env-loader['"`]\)/g,
          replacement: `require('${correctPath}')`
        },
        // Pattern 3: require('../../../config/env-loader') - might be wrong depth
        {
          regex: /require\(['"`]\.\.\/\.\.\/\.\.\/config\/env-loader['"`]\)/g,
          replacement: `require('${correctPath}')`
        },
        // Pattern 4: require(path.join(...)) patterns
        {
          regex: /require\(path\.join\(__dirname,\s*['"`]\.\.\/\.\.\/\.\.\/\.\.\/config\/env-loader['"`]\)\)/g,
          replacement: `require('${correctPath}')`
        },
        // Pattern 5: Other variations
        {
          regex: /require\(['"`]\.\.\/\.\.\/\.\.\/\.\.\/config\/env-loader['"`]\)/g,
          replacement: `require('${correctPath}')`
        }
      ];

      // Apply fixes
      for (const pattern of patterns) {
        if (pattern.regex.test(content)) {
          content = content.replace(pattern.regex, pattern.replacement);
          modified = true;
        }
      }

      // Special case: fix setupEnvironment imports that should be quickSetup
      if (content.includes('setupEnvironment') && !content.includes('quickSetup')) {
        // Check if this is an import line
        const setupImportRegex = /const\s*{\s*setupEnvironment\s*}\s*=\s*require\(['"`][^'"`]+['"`]\);?/g;
        if (setupImportRegex.test(content)) {
          content = content.replace(setupImportRegex, `const { quickSetup } = require('${correctPath}');`);
          
          // Also replace setupEnvironment calls with quickSetup
          content = content.replace(/setupEnvironment\s*\(/g, 'quickSetup(');
          modified = true;
        }
      }

      // Write back if modified
      if (modified) {
        fs.writeFileSync(filePath, content);
        const relativeFilePath = path.relative(this.rootDir, filePath);
        this.fixedFiles.push(relativeFilePath);
        console.log(`  ✅ Fixed ${relativeFilePath}`);
      }

    } catch (error) {
      const relativeFilePath = path.relative(this.rootDir, filePath);
      this.errors.push({ file: relativeFilePath, error: error.message });
      console.error(`  ❌ Failed to fix ${relativeFilePath}: ${error.message}`);
    }
  }

  /**
   * Show results
   */
  showResults() {
    console.log('\n📋 Fix Results');
    console.log('=' .repeat(40));
    
    if (this.fixedFiles.length > 0) {
      console.log(`\n✅ Fixed ${this.fixedFiles.length} files:`);
      this.fixedFiles.forEach(file => {
        console.log(`  📄 ${file}`);
      });
    } else {
      console.log('\n✅ No files needed fixing (all paths already correct)');
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors in ${this.errors.length} files:`);
      this.errors.forEach(({ file, error }) => {
        console.log(`  📄 ${file}: ${error}`);
      });
    }

    console.log('\n🎉 Env loader path fixing completed!');
    console.log('💡 You can now run "npm start" to test the deployment');
  }
}

// Run the fixer
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fixer = new EnvLoaderPathFixer();
  fixer.fix().catch(console.error);
}

export default EnvLoaderPathFixer;
