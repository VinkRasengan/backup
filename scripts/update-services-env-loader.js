#!/usr/bin/env node

/**
 * Update Services to Use New Environment Loader
 * Migrates all services from old utils/env-loader to new config/env-loader
 */

const fs = require('fs');
const path = require('path');

class ServiceEnvLoaderUpdater {
  constructor() {
    this.services = [
      'api-gateway',
      'auth-service',
      'chat-service',
      'link-service',
      'community-service',
      'news-service',
      'admin-service',
      'phishtank-service',
      'criminalip-service'
    ];
    this.results = {
      updated: [],
      skipped: [],
      errors: []
    };
  }

  /**
   * Update all services
   */
  async updateAll() {
    console.log('🔄 Updating services to use new env-loader...\n');

    for (const service of this.services) {
      await this.updateService(service);
    }

    this.generateReport();
  }

  /**
   * Update individual service
   */
  async updateService(serviceName) {
    console.log(`🔧 Updating ${serviceName}...`);

    const serviceDir = path.join(__dirname, '..', 'services', serviceName);
    const appJsPath = path.join(serviceDir, 'src', 'app.js');

    // Check if app.js exists
    if (!fs.existsSync(appJsPath)) {
      console.log(`⚠️ ${serviceName}: app.js not found, skipping`);
      this.results.skipped.push(serviceName);
      return;
    }

    try {
      let content = fs.readFileSync(appJsPath, 'utf8');
      let updated = false;

      // Update import statement
      const oldImport = /const\s*{\s*setupEnvironment[^}]*}\s*=\s*require\(['"`]\.\/utils\/env-loader['"`]\);?/g;
      const newImport = "const { quickSetup } = require('../../config/env-loader');";

      if (oldImport.test(content)) {
        content = content.replace(oldImport, newImport);
        updated = true;
        console.log(`  ✅ Updated import statement`);
      }

      // Update setupEnvironment calls to quickSetup
      const oldSetupPattern = /setupEnvironment\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*[^)]+)?\s*\)/g;
      content = content.replace(oldSetupPattern, (match, serviceName) => {
        updated = true;
        console.log(`  ✅ Updated setupEnvironment call`);
        return `quickSetup('${serviceName}')`;
      });

      // Update variable declarations
      const oldEnvResult = /const\s+envResult\s*=\s*setupEnvironment\s*\([^)]+\)/g;
      content = content.replace(oldEnvResult, (match) => {
        updated = true;
        console.log(`  ✅ Updated envResult declaration`);
        return `const envResult = quickSetup('${serviceName}')`;
      });

      // Remove requiredVars array if it exists (now handled automatically)
      const requiredVarsPattern = /const\s+requiredVars\s*=\s*\[[^\]]*\];?\s*\n/g;
      if (requiredVarsPattern.test(content)) {
        content = content.replace(requiredVarsPattern, '');
        updated = true;
        console.log(`  ✅ Removed requiredVars array (now automatic)`);
      }

      if (updated) {
        fs.writeFileSync(appJsPath, content);
        console.log(`✅ ${serviceName}: Successfully updated`);
        this.results.updated.push(serviceName);
      } else {
        console.log(`⚠️ ${serviceName}: No changes needed`);
        this.results.skipped.push(serviceName);
      }

    } catch (error) {
      console.error(`❌ ${serviceName}: Error updating - ${error.message}`);
      this.results.errors.push({ service: serviceName, error: error.message });
    }
  }

  /**
   * Generate update report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SERVICE ENV-LOADER UPDATE REPORT');
    console.log('='.repeat(60));

    console.log(`\n📈 Summary:`);
    console.log(`   Total Services: ${this.services.length}`);
    console.log(`   ✅ Updated: ${this.results.updated.length}`);
    console.log(`   ⚠️ Skipped: ${this.results.skipped.length}`);
    console.log(`   ❌ Errors: ${this.results.errors.length}`);

    if (this.results.updated.length > 0) {
      console.log(`\n✅ Successfully Updated:`);
      this.results.updated.forEach(service => {
        console.log(`   - ${service}`);
      });
    }

    if (this.results.skipped.length > 0) {
      console.log(`\n⚠️ Skipped:`);
      this.results.skipped.forEach(service => {
        console.log(`   - ${service}`);
      });
    }

    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.results.errors.forEach(({ service, error }) => {
        console.log(`   - ${service}: ${error}`);
      });
    }

    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Test updated services: npm run validate:env-refactor`);
    console.log(`   2. Remove old env-loader files: npm run cleanup:old-env-loaders`);
    console.log(`   3. Update documentation if needed`);

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Clean up old env-loader files
   */
  async cleanupOldEnvLoaders() {
    console.log('\n🧹 Cleaning up old env-loader files...\n');

    for (const service of this.services) {
      const oldEnvLoaderPath = path.join(__dirname, '..', 'services', service, 'src', 'utils', 'env-loader.js');
      
      if (fs.existsSync(oldEnvLoaderPath)) {
        try {
          fs.unlinkSync(oldEnvLoaderPath);
          console.log(`✅ Removed old env-loader from ${service}`);
        } catch (error) {
          console.error(`❌ Failed to remove env-loader from ${service}: ${error.message}`);
        }
      } else {
        console.log(`⚠️ ${service}: Old env-loader not found (already removed?)`);
      }
    }

    console.log('\n✅ Cleanup completed!');
  }
}

// Run if called directly
if (require.main === module) {
  const updater = new ServiceEnvLoaderUpdater();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    updater.cleanupOldEnvLoaders()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
      });
  } else {
    updater.updateAll()
      .then(() => {
        const hasErrors = updater.results.errors.length > 0;
        process.exit(hasErrors ? 1 : 0);
      })
      .catch(error => {
        console.error('❌ Update failed:', error);
        process.exit(1);
      });
  }
}

module.exports = ServiceEnvLoaderUpdater;
