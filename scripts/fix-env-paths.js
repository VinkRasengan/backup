import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

/**
 * Fix Env Paths - Correct .env path references in all services
 * Ensures all services can properly load root .env file
 */

import fs from 'fs';
import path from 'path';

class EnvPathFixer {
  constructor() {
    this.rootDir = process.cwd();
    this.fixedFiles = [];
    this.errors = [];
  }

  /**
   * Main fix function
   */
  async fix() {
    console.log('🔧 Fixing .env paths in all services');
    console.log('=' .repeat(50));

    try {
      await this.findAndFixFiles();
      this.showResults();
    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Find and fix all files with incorrect .env paths
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
    const filesToCheck = [];
    
    // Find all JS files that might load .env
    this.findJSFiles(serviceDir, filesToCheck);
    
    for (const filePath of filesToCheck) {
      await this.fixFile(filePath);
    }
  }

  /**
   * Recursively find JS files
   */
  findJSFiles(dir, fileList) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && file !== 'node_modules') {
        this.findJSFiles(fullPath, fileList);
      } else if (file.endsWith('.js')) {
        fileList.push(fullPath);
      }
    }
  }

  /**
   * Fix individual file
   */
  async fixFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Check if file contains dotenv.config with path
      if (content.includes('dotenv') && content.includes('.config')) {
        // Calculate correct path from this file to root .env
        const correctPath = this.calculateCorrectPath(filePath);
        
        // Patterns to fix
        const patterns = [
          // Pattern 1: require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })
          {
            regex: /require\('dotenv'\)\.config\(\{\s*path:\s*require\('path'\)\.join\(__dirname,\s*['"`]\.\.\/\.\.\/\.\.\/\.env['"`]\)\s*\}\)/g,
            replacement: `require('dotenv').config({ path: require('path').join(__dirname, '${correctPath}') })`
          },
          // Pattern 2: Other variations with different number of ../
          {
            regex: /require\('dotenv'\)\.config\(\{\s*path:\s*require\('path'\)\.join\(__dirname,\s*['"`]\.\.\/\.\.\/\.env['"`]\)\s*\}\)/g,
            replacement: `require('dotenv').config({ path: require('path').join(__dirname, '${correctPath}') })`
          },
          {
            regex: /require\('dotenv'\)\.config\(\{\s*path:\s*require\('path'\)\.join\(__dirname,\s*['"`]\.\.\/\.\.\/\.\.\/\.\.\/\.env['"`]\)\s*\}\)/g,
            replacement: `require('dotenv').config({ path: require('path').join(__dirname, '${correctPath}') })`
          },
          {
            regex: /require\('dotenv'\)\.config\(\{\s*path:\s*require\('path'\)\.join\(__dirname,\s*['"`]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.env['"`]\)\s*\}\)/g,
            replacement: `require('dotenv').config({ path: require('path').join(__dirname, '${correctPath}') })`
          }
        ];

        // Apply fixes
        for (const pattern of patterns) {
          if (pattern.regex.test(content)) {
            content = content.replace(pattern.regex, pattern.replacement);
            modified = true;
          }
        }
      }

      // Write back if modified
      if (modified) {
        fs.writeFileSync(filePath, content);
        const relativePath = path.relative(this.rootDir, filePath);
        this.fixedFiles.push(relativePath);
        console.log(`  ✅ Fixed ${relativePath}`);
      }

    } catch (error) {
      const relativePath = path.relative(this.rootDir, filePath);
      this.errors.push({ file: relativePath, error: error.message });
      console.error(`  ❌ Failed to fix ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Calculate correct relative path from file to root .env
   */
  calculateCorrectPath(filePath) {
    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(fileDir, path.join(this.rootDir, '.env'));
    
    // Convert Windows backslashes to forward slashes for consistency
    return relativePath.replace(/\\/g, '/');
  }

  /**
   * Show results
   */
  showResults() {
    console.log('\n📋 Fix Results');
    console.log('=' .repeat(30));
    
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

    console.log('\n🎉 .env path fixing completed!');
    console.log('💡 All services should now be able to load root .env correctly');
    console.log('💡 Run "npm start" to test the updated configuration');
  }
}

// Run the fixer
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fixer = new EnvPathFixer();
  fixer.fix().catch(console.error);
}

export default EnvPathFixer;
