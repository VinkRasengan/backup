#!/usr/bin/env node

/**
 * Fix Render Deployment Issues
 * Fixes the getRequiredVarsForService function call issues that are causing deployment failures
 */

const fs = require('fs');
const path = require('path');

class RenderDeploymentFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.fixed = [];
    this.errors = [];
  }

  async fixAllIssues() {
    console.log('🔧 Fixing Render Deployment Issues');
    console.log('='.repeat(50));
    console.log('Fixing getRequiredVarsForService function call issues...\n');

    try {
      // Fix all services that have the problematic function calls
      await this.fixAllServices();
      
      // Generate report
      this.generateReport();
      
      return this.errors.length === 0;

    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      return false;
    }
  }

  async fixAllServices() {
    const serviceFixes = [
      {
        service: 'api-gateway',
        file: 'app.js',
        requiredVars: ['NODE_ENV', 'AUTH_SERVICE_URL', 'LINK_SERVICE_URL', 'COMMUNITY_SERVICE_URL', 'CHAT_SERVICE_URL', 'NEWS_SERVICE_URL', 'ADMIN_SERVICE_URL']
      },
      {
        service: 'auth-service',
        file: 'src/config/firebase.js',
        requiredVars: ['NODE_ENV', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET']
      },
      {
        service: 'chat-service',
        file: 'src/app.js',
        requiredVars: ['NODE_ENV', 'FIREBASE_PROJECT_ID', 'GEMINI_API_KEY', 'JWT_SECRET']
      },
      {
        service: 'admin-service',
        file: 'src/app.js',
        requiredVars: ['NODE_ENV', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET']
      },
      {
        service: 'community-service',
        file: 'src/app.js',
        requiredVars: ['NODE_ENV', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET']
      },
      {
        service: 'link-service',
        file: 'src/app.js',
        requiredVars: ['NODE_ENV', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET']
      },
      {
        service: 'news-service',
        file: 'src/app.js',
        requiredVars: ['NODE_ENV', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'NEWSAPI_API_KEY']
      }
    ];

    for (const fix of serviceFixes) {
      await this.fixService(fix);
    }
  }

  async fixService(fix) {
    const servicePath = path.join(this.projectRoot, 'services', fix.service);
    const filePath = path.join(servicePath, fix.file);

    if (!fs.existsSync(filePath)) {
      this.errors.push(`❌ File not found: ${fix.service}/${fix.file}`);
      return;
    }

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Check if file has the problematic function call
      if (content.includes('getRequiredVarsForService')) {
        console.log(`🔧 Fixing ${fix.service}/${fix.file}...`);

        // Remove getRequiredVarsForService from imports
        content = content.replace(
          /const\s*{\s*setupEnvironment,\s*getRequiredVarsForService\s*}\s*=/,
          'const { setupEnvironment } ='
        );

        // Replace the function call with direct array
        const requiredVarsArray = `[\n  '${fix.requiredVars.join("',\n  '")}'\n]`;
        
        // Pattern to match the setupEnvironment call with getRequiredVarsForService
        const setupPattern = /setupEnvironment\([^,]+,\s*getRequiredVarsForService\([^)]+\)/;
        
        if (setupPattern.test(content)) {
          // Add the requiredVars array before the setupEnvironment call
          content = content.replace(
            /(\s*)(const\s+envResult\s*=\s*setupEnvironment\([^,]+,)\s*getRequiredVarsForService\([^)]+\)/,
            `$1const requiredVars = ${requiredVarsArray};\n$1$2 requiredVars`
          );
          modified = true;
        }

        if (modified) {
          fs.writeFileSync(filePath, content);
          this.fixed.push(`✅ Fixed ${fix.service}/${fix.file}`);
        } else {
          this.errors.push(`❌ Could not fix pattern in ${fix.service}/${fix.file}`);
        }
      } else {
        this.fixed.push(`✅ ${fix.service}/${fix.file} already fixed`);
      }

    } catch (error) {
      this.errors.push(`❌ Error fixing ${fix.service}/${fix.file}: ${error.message}`);
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RENDER DEPLOYMENT FIX REPORT');
    console.log('='.repeat(50));

    if (this.fixed.length > 0) {
      console.log('\n✅ FIXED:');
      this.fixed.forEach(fix => console.log(`   ${fix}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📈 Summary: ${this.fixed.length} fixed, ${this.errors.length} errors`);

    if (this.errors.length === 0) {
      console.log('🎉 All Render deployment issues fixed!');
      console.log('\n💡 Next steps:');
      console.log('   1. Commit and push changes to GitHub');
      console.log('   2. Redeploy services on Render');
      console.log('   3. Check service logs for successful startup');
      console.log('\n🔗 Your Render services:');
      console.log('   • API Gateway: https://api-gateway-3lr5.onrender.com');
      console.log('   • Auth Service: https://backup-r5zz.onrender.com');
      console.log('   • Chat Service: https://chat-service-6993.onrender.com');
      console.log('   • Admin Service: https://admin-service-ttvm.onrender.com');
    } else {
      console.log('❌ Some issues could not be fixed automatically');
      console.log('💡 Please review the errors above and fix manually');
    }
  }
}

// Run fixer if called directly
if (require.main === module) {
  const fixer = new RenderDeploymentFixer();
  fixer.fixAllIssues().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Render deployment fixer failed:', error);
    process.exit(1);
  });
}

module.exports = RenderDeploymentFixer;
