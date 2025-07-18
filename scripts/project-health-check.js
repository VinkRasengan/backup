#!/usr/bin/env node

/**
 * Project Health Check Script
 * Validates the cleaned-up project structure and dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 FactCheck Platform - Project Health Check\n');

// Check if essential files exist
const essentialFiles = [
    'package.json',
    'README.md',
    'docker-compose.yml',
    'render.yaml',
    'client/package.json',
    'services/api-gateway/package.json',
    'services/auth-service/package.json',
    'services/link-service/package.json',
    'services/community-service/package.json',
    'services/chat-service/package.json',
    'services/news-service/package.json',
    'services/admin-service/package.json'
];

// Check if cleanup was successful (these files should NOT exist)
const removedFiles = [
    'CRITICAL_FIXES_NEEDED.md',
    'DEPLOYMENT_SUMMARY.md',
    'IMMEDIATE_FIX_REQUIRED.md',
    'services/api-gateway/Dockerfile.dev',
    'services/api-gateway/Dockerfile.render',
    'client/Dockerfile.optimized',
    'start-all.cmd',
    'start-all.ps1'
];

// Check essential directories
const essentialDirs = [
    'client',
    'services',
    'scripts',
    'docs',
    'k8s',
    'monitoring'
];

let healthScore = 0;
let totalChecks = 0;

console.log('📁 Checking Essential Files...');
essentialFiles.forEach(file => {
    totalChecks++;
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
        healthScore++;
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
});

console.log('\n🗑️  Verifying Cleanup (these should be removed)...');
removedFiles.forEach(file => {
    totalChecks++;
    if (!fs.existsSync(file)) {
        console.log(`✅ ${file} - Removed`);
        healthScore++;
    } else {
        console.log(`❌ ${file} - Still exists`);
    }
});

console.log('\n📂 Checking Essential Directories...');
essentialDirs.forEach(dir => {
    totalChecks++;
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        console.log(`✅ ${dir}/`);
        healthScore++;
    } else {
        console.log(`❌ ${dir}/ - MISSING`);
    }
});

// Check package.json scripts organization
console.log('\n📜 Checking Package.json Scripts...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts;
    
    // Check for organized script categories
    const categories = [
        '// === CORE DEVELOPMENT ===',
        '// === SERVICE MANAGEMENT ===',
        '// === SETUP & INSTALLATION ===',
        '// === TESTING ===',
        '// === DEPLOYMENT ==='
    ];
    
    let categoriesFound = 0;
    categories.forEach(category => {
        if (scripts[category] !== undefined) {
            categoriesFound++;
        }
    });
    
    totalChecks++;
    if (categoriesFound >= 3) {
        console.log(`✅ Scripts organized into categories (${categoriesFound}/${categories.length})`);
        healthScore++;
    } else {
        console.log(`❌ Scripts not properly organized (${categoriesFound}/${categories.length})`);
    }
    
} catch (error) {
    console.log('❌ Could not read package.json');
}

// Check Docker setup
console.log('\n🐳 Checking Docker Setup...');
const dockerFiles = [
    'services/api-gateway/Dockerfile',
    'client/Dockerfile',
    'docker-compose.yml'
];

dockerFiles.forEach(file => {
    totalChecks++;
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
        healthScore++;
    } else {
        console.log(`❌ ${file} - MISSING`);
    }
});

// Check for new build scripts
console.log('\n🔧 Checking Build Scripts...');
const buildScripts = [
    'scripts/docker-build-all.sh',
    'scripts/docker-build-all.bat',
    'services/api-gateway/docker-build.sh'
];

buildScripts.forEach(script => {
    totalChecks++;
    if (fs.existsSync(script)) {
        console.log(`✅ ${script}`);
        healthScore++;
    } else {
        console.log(`❌ ${script} - MISSING`);
    }
});

// Calculate health percentage
const healthPercentage = Math.round((healthScore / totalChecks) * 100);

console.log('\n' + '='.repeat(50));
console.log(`🏥 PROJECT HEALTH SCORE: ${healthScore}/${totalChecks} (${healthPercentage}%)`);

if (healthPercentage >= 90) {
    console.log('🎉 EXCELLENT! Project is in great shape.');
} else if (healthPercentage >= 75) {
    console.log('👍 GOOD! Minor issues to address.');
} else if (healthPercentage >= 50) {
    console.log('⚠️  FAIR! Several issues need attention.');
} else {
    console.log('🚨 POOR! Major issues need immediate attention.');
}

console.log('\n📋 Next Steps:');
if (healthPercentage >= 90) {
    console.log('- Run `npm run setup:full` to test the setup');
    console.log('- Test Docker builds with `npm run docker`');
    console.log('- Verify all services start correctly');
} else {
    console.log('- Fix missing files and directories');
    console.log('- Re-run this health check');
    console.log('- Check the CLEANUP_SUMMARY.md for details');
}

console.log('\n🔗 Useful Commands:');
console.log('- npm run setup:full    # Complete project setup');
console.log('- npm start            # Start all services');
console.log('- npm run status       # Check service status');
console.log('- npm run docker       # Build and run with Docker');

process.exit(healthPercentage >= 75 ? 0 : 1);
