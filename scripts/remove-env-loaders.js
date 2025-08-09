import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
#!/usr/bin/env node

/**
 * Remove Env Loaders - Clean up all env loader dependencies
 * Replace with simple dotenv loading from root .env
 */

import fs from 'fs';
import path from 'path';

class EnvLoaderRemover {
  constructor() {
    this.rootDir = process.cwd();
    this.services = [
      'auth-service',
      'link-service', 
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'api-gateway',
      'phishtank-service',
      'criminalip-service'
    ];
    this.removedFiles = [];
    this.updatedFiles = [];
    this.errors = [];
  }

  /**
   * Main removal function
   */
  async remove() {
    console.log('🧹 Removing Env Loaders - Cleaning up and simplifying');
    console.log('=' .repeat(60));

    try {
      await this.removeEnvLoaderFiles();
      await this.updateServiceFiles();
      await this.removeConfigEnvLoader();
      this.showResults();
    } catch (error) {
      console.error('❌ Removal failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Remove env-loader files from services
   */
  async removeEnvLoaderFiles() {
    console.log('🗑️  Removing env-loader files...');

    for (const service of this.services) {
      const serviceDir = path.join(this.rootDir, 'services', service);
      
      // Remove env-loader files
      const envLoaderPaths = [
        path.join(serviceDir, 'src', 'utils', 'env-loader.js'),
        path.join(serviceDir, 'utils', 'env-loader.js'),
        path.join(serviceDir, 'env-loader.js')
      ];

      for (const envLoaderPath of envLoaderPaths) {
        if (fs.existsSync(envLoaderPath)) {
          try {
            fs.unlinkSync(envLoaderPath);
            const relativePath = path.relative(this.rootDir, envLoaderPath);
            this.removedFiles.push(relativePath);
            console.log(`  ✅ Removed ${relativePath}`);
          } catch (error) {
            this.errors.push({ file: envLoaderPath, error: error.message });
          }
        }
      }

      // Remove empty utils directories
      const utilsDirs = [
        path.join(serviceDir, 'src', 'utils'),
        path.join(serviceDir, 'utils')
      ];

      for (const utilsDir of utilsDirs) {
        if (fs.existsSync(utilsDir)) {
          try {
            const files = fs.readdirSync(utilsDir);
            if (files.length === 0) {
              fs.rmdirSync(utilsDir);
              const relativePath = path.relative(this.rootDir, utilsDir);
              this.removedFiles.push(relativePath + '/');
              console.log(`  ✅ Removed empty directory ${relativePath}`);
            }
          } catch (error) {
            // Directory might not be empty or have permission issues
          }
        }
      }
    }
  }

  /**
   * Update service files to use simple dotenv
   */
  async updateServiceFiles() {
    console.log('\n🔧 Updating service files...');

    for (const service of this.services) {
      await this.updateService(service);
    }
  }

  /**
   * Update individual service
   */
  async updateService(serviceName) {
    console.log(`  🔧 Updating ${serviceName}...`);
    
    const serviceDir = path.join(this.rootDir, 'services', serviceName);
    
    // Find files to update
    const filesToUpdate = [];
    
    // Common file locations
    const commonFiles = [
      'src/app.js',
      'src/config/firebase.js',
      'app.js',
      'index.js'
    ];

    for (const file of commonFiles) {
      const filePath = path.join(serviceDir, file);
      if (fs.existsSync(filePath)) {
        filesToUpdate.push(filePath);
      }
    }

    // Update each file
    for (const filePath of filesToUpdate) {
      await this.updateFile(filePath, serviceName);
    }
  }

  /**
   * Update individual file
   */
  async updateFile(filePath, serviceName) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      const originalContent = content;

      // Remove env-loader imports
      const importPatterns = [
        /const\s*{\s*[^}]*setupEnvironment[^}]*}\s*=\s*require\(['"`][^'"`]*env-loader['"`]\);?\s*\n?/g,
        /const\s*{\s*[^}]*quickSetup[^}]*}\s*=\s*require\(['"`][^'"`]*env-loader['"`]\);?\s*\n?/g,
        /require\(['"`][^'"`]*env-loader['"`]\);?\s*\n?/g
      ];

      for (const pattern of importPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, '');
          modified = true;
        }
      }

      // Remove env-loader function calls
      const callPatterns = [
        /setupEnvironment\s*\([^)]*\);?\s*\n?/g,
        /quickSetup\s*\([^)]*\);?\s*\n?/g,
        /const\s+envResult\s*=\s*[^;]+;?\s*\n?/g
      ];

      for (const pattern of callPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, '');
          modified = true;
        }
      }

      // Add simple dotenv loading at the top (after existing requires)
      if (modified || content.includes('env-loader')) {
        // Find the right place to insert dotenv
        const requiresRegex = /^((?:.*require\(['"`][^'"`]+['"`]\);?\s*\n)*)/m;
        const match = content.match(requiresRegex);
        
        if (match && !content.includes('require(\'dotenv\')') && !content.includes('dotenv.config')) {
          const insertPoint = match[0].length;
          const dotenvCode = `
// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
`;
          content = content.slice(0, insertPoint) + dotenvCode + content.slice(insertPoint);
          modified = true;
        }
      }

      // Write back if modified
      if (modified) {
        fs.writeFileSync(filePath, content);
        const relativePath = path.relative(this.rootDir, filePath);
        this.updatedFiles.push(relativePath);
        console.log(`    ✅ Updated ${relativePath}`);
      }

    } catch (error) {
      const relativePath = path.relative(this.rootDir, filePath);
      this.errors.push({ file: relativePath, error: error.message });
      console.error(`    ❌ Failed to update ${relativePath}: ${error.message}`);
    }
  }

  /**
   * Remove config/env-loader.js
   */
  async removeConfigEnvLoader() {
    console.log('\n🗑️  Removing config/env-loader.js...');
    
    const configEnvLoader = path.join(this.rootDir, 'config', 'env-loader.js');
    if (fs.existsSync(configEnvLoader)) {
      try {
        fs.unlinkSync(configEnvLoader);
        this.removedFiles.push('config/env-loader.js');
        console.log('  ✅ Removed config/env-loader.js');
      } catch (error) {
        this.errors.push({ file: 'config/env-loader.js', error: error.message });
      }
    } else {
      console.log('  ⚠️  config/env-loader.js not found');
    }
  }

  /**
   * Show results
   */
  showResults() {
    console.log('\n📋 Removal Results');
    console.log('=' .repeat(40));
    
    if (this.removedFiles.length > 0) {
      console.log(`\n🗑️  Removed ${this.removedFiles.length} files/directories:`);
      this.removedFiles.forEach(file => {
        console.log(`  📄 ${file}`);
      });
    }

    if (this.updatedFiles.length > 0) {
      console.log(`\n🔧 Updated ${this.updatedFiles.length} files:`);
      this.updatedFiles.forEach(file => {
        console.log(`  📄 ${file}`);
      });
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors in ${this.errors.length} files:`);
      this.errors.forEach(({ file, error }) => {
        console.log(`  📄 ${file}: ${error}`);
      });
    }

    console.log('\n🎉 Env loader removal completed!');
    console.log('💡 All services now use simple dotenv loading from root .env');
    console.log('💡 Run "npm start" to test the updated configuration');
  }
}

// Run the remover
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const remover = new EnvLoaderRemover();
  remover.remove().catch(console.error);
}

export default EnvLoaderRemover;
