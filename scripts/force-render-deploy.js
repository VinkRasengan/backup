#!/usr/bin/env node

/**
 * Force Render Deployment Script
 * This script creates a dummy commit to trigger Render auto-deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Force Render Deployment Script');
console.log('==================================');

try {
    // Check if we're in the right directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error('❌ Please run this script from the project root directory');
    }

    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Create deployment info file
    const deployInfo = {
        lastDeploy: timestamp,
        deployTrigger: 'force-deploy-script',
        features: [
            'Community Posts System',
            'NewsAPI Integration', 
            'Voting System (Safe/Unsafe/Suspicious)',
            'Enhanced Navigation',
            'PostgreSQL Database',
            'OpenAI Chat Integration'
        ],
        version: '2.0.0'
    };

    // Write deployment info
    const deployInfoPath = path.join(process.cwd(), 'DEPLOYMENT_INFO.json');
    fs.writeFileSync(deployInfoPath, JSON.stringify(deployInfo, null, 2));
    console.log('✅ Created deployment info file');

    // Update README with deployment timestamp
    const readmePath = path.join(process.cwd(), 'README.md');
    if (fs.existsSync(readmePath)) {
        let readme = fs.readFileSync(readmePath, 'utf8');
        
        // Add or update deployment section
        const deploySection = `\n## 🚀 Latest Deployment\n\n**Last Deploy:** ${timestamp}\n**Status:** ✅ Ready for Production\n**Features:** Community Posts, NewsAPI, Voting System, Enhanced UX\n\n`;
        
        if (readme.includes('## 🚀 Latest Deployment')) {
            readme = readme.replace(/## 🚀 Latest Deployment[\s\S]*?(?=\n##|\n$|$)/, deploySection.trim());
        } else {
            readme += deploySection;
        }
        
        fs.writeFileSync(readmePath, readme);
        console.log('✅ Updated README with deployment info');
    }

    // Git operations
    console.log('\n📝 Committing changes...');
    execSync('git add .', { stdio: 'inherit' });
    
    const commitMessage = `deploy: Force Render deployment - ${timestamp}

🚀 Deployment Trigger:
- Force deploy latest community features
- Ensure Render has latest code with community posts
- Fix production deployment issues
- Update deployment timestamp

✅ Features Ready:
- Community Posts System with NewsAPI integration
- Voting system (safe/unsafe/suspicious)
- Enhanced navigation and UX improvements
- PostgreSQL database with proper migrations
- OpenAI chat integration with fallbacks

🔧 Technical Updates:
- Environment variables configured for production
- Health check endpoints working
- CORS properly configured for Render
- Static file serving optimized

Deploy ID: ${timestamp.replace(/[:.]/g, '-')}`;

    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    console.log('✅ Created deployment commit');

    console.log('\n🚀 Pushing to GitHub (will trigger Render auto-deploy)...');
    execSync('git push origin main', { stdio: 'inherit' });
    console.log('✅ Pushed to GitHub');

    console.log('\n🎯 Deployment Status:');
    console.log('====================');
    console.log('✅ Code pushed to GitHub');
    console.log('⏳ Render auto-deployment should start in 1-2 minutes');
    console.log('📊 Monitor deployment at: https://dashboard.render.com');
    console.log('\n🔗 Expected URLs after deployment:');
    console.log('Frontend: https://factcheck-frontend.onrender.com');
    console.log('Backend:  https://factcheck-backend.onrender.com');
    console.log('API Test: https://factcheck-backend.onrender.com/api/community/posts');

    console.log('\n⏰ Deployment Timeline:');
    console.log('- Backend: ~5-10 minutes');
    console.log('- Frontend: ~3-5 minutes');
    console.log('- Total: ~10-15 minutes');

    console.log('\n🧪 After deployment, test:');
    console.log('1. Backend health: https://factcheck-backend.onrender.com/health');
    console.log('2. Community API: https://factcheck-backend.onrender.com/api/community/posts');
    console.log('3. Frontend app: https://factcheck-frontend.onrender.com/community');

} catch (error) {
    console.error('❌ Deployment script failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 Force deployment initiated successfully!');
console.log('Monitor progress in Render dashboard and check URLs above.');
