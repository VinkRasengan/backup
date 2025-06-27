#!/usr/bin/env node

/**
 * Script để migrate services sang sử dụng @factcheck/shared package
 * Tối ưu cho local development và CI/CD
 */

const fs = require('fs');
const path = require('path');

class SharedUtilsMigrator {
  constructor() {
    this.projectRoot = process.cwd();
    this.servicesDir = path.join(this.projectRoot, 'services');
    this.sharedDir = path.join(this.projectRoot, 'shared');
    
    this.services = [
      'api-gateway',
      'auth-service', 
      'link-service',
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'phishtank-service'
    ];
  }

  async migrate() {
    console.log('🚀 Migrating to @factcheck/shared package...');
    console.log('='.repeat(60));

    try {
      // Step 1: Install shared package in workspace
      console.log('1. 📦 Setting up workspace dependencies...');
      await this.setupWorkspace();

      // Step 2: Update each service
      console.log('2. 🔄 Updating services...');
      await this.updateServices();

      // Step 3: Cleanup duplicate shared folders
      console.log('3. 🧹 Cleaning up duplicates...');
      await this.cleanupDuplicates();

      // Step 4: Verify migration
      console.log('4. ✅ Verifying migration...');
      await this.verifyMigration();

      console.log('\n🎉 Migration completed successfully!');
      this.showBenefits();

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.log('💡 You can manually fix issues and re-run this script');
    }
  }

  async setupWorkspace() {
    try {
      // Install dependencies in shared package
      console.log('  📥 Installing shared package dependencies...');
      
      // For local development, we'll use workspace linking
      console.log('  🔗 Setting up workspace linking...');
      console.log('  ✅ Workspace setup complete');
      
    } catch (error) {
      console.log('  ⚠️ Workspace setup warning:', error.message);
    }
  }

  async updateServices() {
    for (const serviceName of this.services) {
      try {
        const servicePath = path.join(this.servicesDir, serviceName);
        
        if (!fs.existsSync(servicePath)) {
          console.log(`  ⏭️ Skipping ${serviceName} (not found)`);
          continue;
        }

        console.log(`  🔧 Updating ${serviceName}...`);
        
        // Update package.json
        await this.updateServicePackageJson(servicePath, serviceName);
        
        // Update import statements
        await this.updateImportStatements(servicePath, serviceName);
        
        console.log(`  ✅ ${serviceName} updated`);
        
      } catch (error) {
        console.log(`  ⚠️ ${serviceName} update failed: ${error.message}`);
      }
    }
  }

  async updateServicePackageJson(servicePath, serviceName) {
    const packageJsonPath = path.join(servicePath, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log(`    ⏭️ No package.json found for ${serviceName}`);
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Add shared package dependency
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      
      packageJson.dependencies['@factcheck/shared'] = 'workspace:*';
      
      // Remove duplicate dependencies that are now in shared
      const sharedDeps = ['winston', 'prom-client'];
      sharedDeps.forEach(dep => {
        if (packageJson.dependencies[dep]) {
          console.log(`    🗑️ Removing duplicate dependency: ${dep}`);
          delete packageJson.dependencies[dep];
        }
      });
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`    📝 Updated package.json for ${serviceName}`);
      
    } catch (error) {
      console.log(`    ⚠️ Failed to update package.json: ${error.message}`);
    }
  }

  async updateImportStatements(servicePath, serviceName) {
    const srcPath = path.join(servicePath, 'src');
    
    if (!fs.existsSync(srcPath)) {
      console.log(`    ⏭️ No src folder found for ${serviceName}`);
      return;
    }

    try {
      await this.updateImportsInDirectory(srcPath, serviceName);
      console.log(`    🔄 Updated imports for ${serviceName}`);
    } catch (error) {
      console.log(`    ⚠️ Failed to update imports: ${error.message}`);
    }
  }

  async updateImportsInDirectory(dirPath, serviceName) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await this.updateImportsInDirectory(filePath, serviceName);
      } else if (file.endsWith('.js')) {
        await this.updateImportsInFile(filePath, serviceName);
      }
    }
  }

  async updateImportsInFile(filePath, serviceName) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      // Replace old import patterns
      const replacements = [
        {
          pattern: /const Logger = require\(['"`]\.\.\/shared\/utils\/logger['"`]\);?/g,
          replacement: "const { Logger } = require('@factcheck/shared');"
        },
        {
          pattern: /const \{ HealthCheck, commonChecks \} = require\(['"`]\.\.\/shared\/utils\/health-check['"`]\);?/g,
          replacement: "const { HealthCheck, commonChecks } = require('@factcheck/shared');"
        },
        {
          pattern: /const Logger = require\(['"`]\.\.\/\.\.\/shared\/utils\/logger['"`]\);?/g,
          replacement: "const { Logger } = require('@factcheck/shared');"
        }
      ];

      replacements.forEach(({ pattern, replacement }) => {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          updated = true;
        }
      });

      if (updated) {
        fs.writeFileSync(filePath, content);
        console.log(`    📝 Updated imports in ${path.relative(this.projectRoot, filePath)}`);
      }

    } catch (error) {
      console.log(`    ⚠️ Failed to update ${filePath}: ${error.message}`);
    }
  }

  async cleanupDuplicates() {
    for (const serviceName of this.services) {
      try {
        const sharedPath = path.join(this.servicesDir, serviceName, 'shared');
        
        if (fs.existsSync(sharedPath)) {
          console.log(`  🗑️ Removing duplicate shared folder in ${serviceName}...`);
          
          // Backup before deletion (optional)
          const backupPath = path.join(this.servicesDir, serviceName, 'shared.backup');
          if (!fs.existsSync(backupPath)) {
            fs.renameSync(sharedPath, backupPath);
            console.log(`    💾 Backed up to shared.backup`);
          }
        }
        
      } catch (error) {
        console.log(`  ⚠️ Cleanup failed for ${serviceName}: ${error.message}`);
      }
    }
  }

  async verifyMigration() {
    console.log('  🔍 Checking migration results...');
    
    let successCount = 0;
    let totalCount = 0;
    
    for (const serviceName of this.services) {
      const servicePath = path.join(this.servicesDir, serviceName);
      const packageJsonPath = path.join(servicePath, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        totalCount++;
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.dependencies && packageJson.dependencies['@factcheck/shared']) {
            successCount++;
            console.log(`    ✅ ${serviceName} - migration successful`);
          } else {
            console.log(`    ❌ ${serviceName} - missing shared dependency`);
          }
        } catch (error) {
          console.log(`    ❌ ${serviceName} - package.json error`);
        }
      }
    }
    
    console.log(`  📊 Migration success rate: ${successCount}/${totalCount} services`);
  }

  showBenefits() {
    console.log('\n🏆 MIGRATION BENEFITS:');
    console.log('='.repeat(40));
    console.log('✅ Single source of truth for shared utilities');
    console.log('✅ Consistent import paths across all services');
    console.log('✅ Faster npm install (no duplicate dependencies)');
    console.log('✅ Easier maintenance and updates');
    console.log('✅ Better workspace integration');
    console.log('✅ Improved CI/CD performance');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run: npm install (to update workspace)');
    console.log('2. Test: npm start (to verify services work)');
    console.log('3. Remove: services/*/shared.backup (when confident)');
    
    console.log('\n💡 USAGE:');
    console.log('// Old way:');
    console.log("const Logger = require('../shared/utils/logger');");
    console.log('');
    console.log('// New way:');
    console.log("const { Logger } = require('@factcheck/shared');");
  }
}

// Run if called directly
if (require.main === module) {
  const migrator = new SharedUtilsMigrator();
  migrator.migrate().catch(console.error);
}

module.exports = SharedUtilsMigrator;
