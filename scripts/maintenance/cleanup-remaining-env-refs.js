import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

/**
 * Cleanup Remaining Env References
 * Remove any remaining references to old env-loader system
 */

import fs from 'fs';
import path from 'path';

class EnvReferenceCleaner {
  constructor() {
    this.rootDir = process.cwd();
    this.fixedFiles = [];
    this.errors = [];
  }

  /**
   * Main cleanup function
   */
  async cleanup() {
    console.log('🧹 Cleaning up remaining env-loader references');
    console.log('=' .repeat(50));

    try {
      await this.findAndCleanFiles();
      this.showResults();
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Find and clean all files
   */
  async findAndCleanFiles() {
    const servicesDir = path.join(this.rootDir, 'services');
    const services = fs.readdirSync(servicesDir).filter(item => {
      return fs.statSync(path.join(servicesDir, item)).isDirectory();
    });

    for (const service of services) {
      await this.cleanService(service);
    }
  }

  /**
   * Clean individual service
   */
  async cleanService(serviceName) {
    console.log(`🔧 Cleaning ${serviceName}...`);
    
    const serviceDir = path.join(this.rootDir, 'services', serviceName);
    const filesToCheck = [];
    
    // Find all JS files
    this.findJSFiles(serviceDir, filesToCheck);
    
    for (const filePath of filesToCheck) {
      await this.cleanFile(filePath);
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
   * Clean individual file
   */
  async cleanFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      const originalContent = content;

      // Remove any remaining env-loader references
      const patterns = [
        // Remove old env-loader imports
        /const\s*{\s*[^}]*setupEnvironment[^}]*}\s*=\s*require\(['"`][^'"`]*env-loader[^'"`]*['"`]\);?\s*\n?/g,
        /const\s*{\s*[^}]*quickSetup[^}]*}\s*=\s*require\(['"`][^'"`]*env-loader[^'"`]*['"`]\);?\s*\n?/g,
        /require\(['"`][^'"`]*env-loader[^'"`]*['"`]\);?\s*\n?/g,
        
        // Remove function calls
        /setupEnvironment\s*\([^)]*\);?\s*\n?/g,
        /quickSetup\s*\([^)]*\);?\s*\n?/g,
        /const\s+envResult\s*=\s*quickSetup[^;]*;?\s*\n?/g,
        /const\s+envResult\s*=\s*setupEnvironment[^;]*;?\s*\n?/g,
        
        // Remove comments about env-loader
        /\/\/.*env-loader.*\n?/g,
        /\/\*.*env-loader.*\*\/\s*\n?/g
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, '');
          modified = true;
        }
      }

      // Ensure dotenv is properly loaded if not already
      if (content.includes('process.env.') && !content.includes('dotenv') && !content.includes('require(\'dotenv\')')) {
        // Add dotenv loading at the top
        const lines = content.split('\n');
        let insertIndex = 0;
        
        // Find the last require statement
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('require(') && !lines[i].includes('//')) {
            insertIndex = i + 1;
          }
        }
        
        const dotenvLine = "// Load environment variables from root .env\nrequire('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });";
        lines.splice(insertIndex, 0, '', dotenvLine);
        content = lines.join('\n');
        modified = true;
      }

      // Clean up multiple empty lines
      content = content.replace(/\n\n\n+/g, '\n\n');

      if (modified) {
        fs.writeFileSync(filePath, content);
        const relativePath = path.relative(this.rootDir, filePath);
        this.fixedFiles.push(relativePath);
        console.log(`  ✅ Cleaned ${relativePath}`);
      }

    } catch (error) {
      const relativePath = path.relative(this.rootDir, filePath);
      this.errors.push({ file: relativePath, error: error.message });
      console.error(`  ❌ Failed to clean ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Show results
   */
  showResults() {
    console.log('\n📋 Cleanup Results');
    console.log('=' .repeat(30));
    
    if (this.fixedFiles.length > 0) {
      console.log(`\n✅ Cleaned ${this.fixedFiles.length} files:`);
      this.fixedFiles.forEach(file => {
        console.log(`  📄 ${file}`);
      });
    } else {
      console.log('\n✅ No files needed cleaning');
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors in ${this.errors.length} files:`);
      this.errors.forEach(({ file, error }) => {
        console.log(`  📄 ${file}: ${error}`);
      });
    }

    console.log('\n🎉 Cleanup completed!');
    console.log('💡 All services now use simple dotenv from root .env');
  }
}

// Run the cleaner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cleaner = new EnvReferenceCleaner();
  cleaner.cleanup().catch(console.error);
}

export default EnvReferenceCleaner;
