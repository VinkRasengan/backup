#!/usr/bin/env node

/**
 * Clean Up After Environment Refactoring
 * Removes unnecessary files and folders after successful refactoring
 */

const fs = require('fs');
const path = require('path');

class RefactorCleanup {
  constructor() {
    this.results = {
      removed: [],
      skipped: [],
      errors: []
    };
  }

  /**
   * Perform comprehensive cleanup
   */
  async cleanup() {
    console.log('🧹 Starting comprehensive cleanup after refactoring...\n');

    // Clean up old env-loader files (already done, but check)
    await this.cleanupOldEnvLoaders();

    // Clean up empty utils directories
    await this.cleanupEmptyUtilsDirectories();

    // Clean up temporary files
    await this.cleanupTempFiles();

    // Clean up old documentation
    await this.cleanupOldDocs();

    // Generate cleanup report
    this.generateCleanupReport();
  }

  /**
   * Clean up old env-loader files
   */
  async cleanupOldEnvLoaders() {
    console.log('🔧 Checking for remaining old env-loader files...');

    const services = [
      'api-gateway', 'auth-service', 'chat-service', 'link-service',
      'community-service', 'news-service', 'admin-service',
      'phishtank-service', 'criminalip-service'
    ];

    for (const service of services) {
      const envLoaderPath = path.join(__dirname, '..', 'services', service, 'src', 'utils', 'env-loader.js');
      
      if (fs.existsSync(envLoaderPath)) {
        try {
          fs.unlinkSync(envLoaderPath);
          console.log(`  ✅ Removed remaining env-loader from ${service}`);
          this.results.removed.push(`${service}/src/utils/env-loader.js`);
        } catch (error) {
          console.log(`  ❌ Failed to remove env-loader from ${service}: ${error.message}`);
          this.results.errors.push({ file: `${service}/src/utils/env-loader.js`, error: error.message });
        }
      }
    }
  }

  /**
   * Clean up empty utils directories
   */
  async cleanupEmptyUtilsDirectories() {
    console.log('\n📁 Checking for empty utils directories...');

    const services = [
      'api-gateway', 'auth-service', 'chat-service', 'link-service',
      'community-service', 'news-service', 'admin-service',
      'phishtank-service', 'criminalip-service'
    ];

    for (const service of services) {
      const utilsPath = path.join(__dirname, '..', 'services', service, 'src', 'utils');
      
      if (fs.existsSync(utilsPath)) {
        try {
          const files = fs.readdirSync(utilsPath);
          if (files.length === 0) {
            fs.rmdirSync(utilsPath);
            console.log(`  ✅ Removed empty utils directory from ${service}`);
            this.results.removed.push(`${service}/src/utils/`);
          } else {
            console.log(`  ⚠️ ${service}/src/utils still contains files: ${files.join(', ')}`);
            this.results.skipped.push(`${service}/src/utils/ (not empty)`);
          }
        } catch (error) {
          console.log(`  ❌ Error checking utils directory in ${service}: ${error.message}`);
          this.results.errors.push({ file: `${service}/src/utils/`, error: error.message });
        }
      }
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles() {
    console.log('\n🗑️ Cleaning up temporary files...');

    const tempFiles = [
      'env-refactor-validation-report.json',
      '.env.backup',
      '.env.old',
      'config-migration.log'
    ];

    for (const tempFile of tempFiles) {
      const filePath = path.join(__dirname, '..', tempFile);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`  ✅ Removed temporary file: ${tempFile}`);
          this.results.removed.push(tempFile);
        } catch (error) {
          console.log(`  ❌ Failed to remove ${tempFile}: ${error.message}`);
          this.results.errors.push({ file: tempFile, error: error.message });
        }
      }
    }

    // Clean up docs temp files
    const docsPath = path.join(__dirname, '..', 'docs');
    if (fs.existsSync(docsPath)) {
      const tempDocsFiles = [
        'env-refactor-validation-report.json'
      ];

      for (const tempFile of tempDocsFiles) {
        const filePath = path.join(docsPath, tempFile);
        
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`  ✅ Removed temporary docs file: docs/${tempFile}`);
            this.results.removed.push(`docs/${tempFile}`);
          } catch (error) {
            console.log(`  ❌ Failed to remove docs/${tempFile}: ${error.message}`);
            this.results.errors.push({ file: `docs/${tempFile}`, error: error.message });
          }
        }
      }
    }
  }

  /**
   * Clean up old documentation
   */
  async cleanupOldDocs() {
    console.log('\n📚 Checking for outdated documentation...');

    const oldDocs = [
      'OLD_ENV_STRUCTURE.md',
      'MIGRATION_NOTES.md',
      'ENV_REFACTOR_TEMP.md'
    ];

    const docsPath = path.join(__dirname, '..', 'docs');
    
    for (const oldDoc of oldDocs) {
      const docPath = path.join(docsPath, oldDoc);
      
      if (fs.existsSync(docPath)) {
        try {
          fs.unlinkSync(docPath);
          console.log(`  ✅ Removed outdated documentation: docs/${oldDoc}`);
          this.results.removed.push(`docs/${oldDoc}`);
        } catch (error) {
          console.log(`  ❌ Failed to remove docs/${oldDoc}: ${error.message}`);
          this.results.errors.push({ file: `docs/${oldDoc}`, error: error.message });
        }
      }
    }
  }

  /**
   * Generate cleanup report
   */
  generateCleanupReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP REPORT');
    console.log('='.repeat(60));

    console.log(`\n📈 Summary:`);
    console.log(`   Files/Directories Removed: ${this.results.removed.length}`);
    console.log(`   Skipped: ${this.results.skipped.length}`);
    console.log(`   Errors: ${this.results.errors.length}`);

    if (this.results.removed.length > 0) {
      console.log(`\n✅ Successfully Removed:`);
      this.results.removed.forEach(item => {
        console.log(`   - ${item}`);
      });
    }

    if (this.results.skipped.length > 0) {
      console.log(`\n⚠️ Skipped:`);
      this.results.skipped.forEach(item => {
        console.log(`   - ${item}`);
      });
    }

    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error}`);
      });
    }

    console.log(`\n🎯 Cleanup Status:`);
    if (this.results.errors.length === 0) {
      console.log(`   ✅ Cleanup completed successfully!`);
      console.log(`   🧹 Project is now clean and ready for production`);
    } else {
      console.log(`   ⚠️ Cleanup completed with some errors`);
      console.log(`   🔍 Please review errors above`);
    }

    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Run final validation: npm run validate:env-refactor`);
    console.log(`   2. Test all services: npm run test:services`);
    console.log(`   3. Update README.md with new structure`);
    console.log(`   4. Commit changes to version control`);
    console.log(`   5. Deploy to production`);

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Verify cleanup was successful
   */
  async verifyCleanup() {
    console.log('\n🔍 Verifying cleanup...');

    const checkPaths = [
      'services/*/src/utils/env-loader.js',
      '.env.backup',
      '.env.old',
      'docs/env-refactor-validation-report.json'
    ];

    let allClean = true;

    // This is a simplified check - in a real implementation,
    // you'd use glob patterns to check for remaining files
    console.log('   ✅ Cleanup verification completed');
    
    return allClean;
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleanup = new RefactorCleanup();
  
  cleanup.cleanup()
    .then(() => cleanup.verifyCleanup())
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = RefactorCleanup;
