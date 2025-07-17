#!/usr/bin/env node

/**
 * Find and fix all hardcoded URLs in the codebase
 * Replace them with proper environment variable usage
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Patterns to find hardcoded URLs
const urlPatterns = [
  /https:\/\/[a-zA-Z0-9-]+\.onrender\.com/g,
  /http:\/\/localhost:\d+/g,
  /https:\/\/backup-[a-zA-Z0-9]+\.onrender\.com/g,
  /https:\/\/api-gateway-[a-zA-Z0-9]+\.onrender\.com/g,
  /https:\/\/frontend-[a-zA-Z0-9]+\.onrender\.com/g,
  /https:\/\/[a-zA-Z0-9-]+-service-[a-zA-Z0-9]+\.onrender\.com/g
];

// Files to exclude from scanning
const excludePatterns = [
  'node_modules',
  '.git',
  'build',
  'dist',
  '.env',
  '.env.production',
  '.env.example',
  'package-lock.json',
  'yarn.lock'
];

// Files to scan
const includeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.yaml', '.yml', '.md'];

function shouldExcludeFile(filePath) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function shouldIncludeFile(filePath) {
  return includeExtensions.some(ext => filePath.endsWith(ext));
}

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !shouldExcludeFile(filePath)) {
      scanDirectory(filePath, results);
    } else if (stat.isFile() && shouldIncludeFile(filePath) && !shouldExcludeFile(filePath)) {
      results.push(filePath);
    }
  }
  
  return results;
}

function findHardcodedUrls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    
    for (const pattern of urlPatterns) {
      const found = content.match(pattern);
      if (found) {
        matches.push(...found);
      }
    }
    
    return [...new Set(matches)]; // Remove duplicates
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
    return [];
  }
}

function generateFixes() {
  console.log(chalk.blue.bold('🔍 Scanning codebase for hardcoded URLs...'));
  console.log(chalk.gray('=' .repeat(60)));
  
  const files = scanDirectory('.');
  const issues = [];
  
  for (const file of files) {
    const urls = findHardcodedUrls(file);
    if (urls.length > 0) {
      issues.push({ file, urls });
    }
  }
  
  if (issues.length === 0) {
    console.log(chalk.green('✅ No hardcoded URLs found!'));
    return;
  }
  
  console.log(chalk.red(`❌ Found hardcoded URLs in ${issues.length} files:`));
  console.log('');
  
  for (const issue of issues) {
    console.log(chalk.yellow(`📄 ${issue.file}`));
    for (const url of issue.urls) {
      console.log(chalk.red(`   ❌ ${url}`));
    }
    console.log('');
  }
  
  return issues;
}

function createFixScript(issues) {
  console.log(chalk.blue.bold('🔧 Generating fix recommendations...'));
  console.log(chalk.gray('=' .repeat(60)));
  
  const fixes = [];
  
  // Common URL replacements
  const replacements = {
    // API Gateway URLs
    'https://api-gateway-3lr5.onrender.com': 'process.env.REACT_APP_API_URL || process.env.API_GATEWAY_URL',
    'https://backup-zhhs.onrender.com': 'process.env.REACT_APP_API_URL || process.env.API_GATEWAY_URL',
    
    // Frontend URLs  
    'https://frontend-j8de.onrender.com': 'process.env.FRONTEND_URL',
    'https://client-21c1.onrender.com': 'process.env.FRONTEND_URL',
    
    // Service URLs
    'https://backup-r5zz.onrender.com': 'process.env.AUTH_SERVICE_URL',
    'https://community-service-n3ou.onrender.com': 'process.env.COMMUNITY_SERVICE_URL',
    'https://link-service-dtw1.onrender.com': 'process.env.LINK_SERVICE_URL',
    'https://chat-service-6993.onrender.com': 'process.env.CHAT_SERVICE_URL',
    'https://news-service-71ni.onrender.com': 'process.env.NEWS_SERVICE_URL',
    'https://admin-service-ttvm.onrender.com': 'process.env.ADMIN_SERVICE_URL',
    
    // Development URLs
    'http://localhost:8080': 'process.env.REACT_APP_API_URL || "http://localhost:8080"',
    'http://localhost:3000': 'process.env.FRONTEND_URL || "http://localhost:3000"'
  };
  
  for (const issue of issues) {
    console.log(chalk.yellow(`\n📄 Fixes for ${issue.file}:`));
    
    for (const url of issue.urls) {
      const replacement = replacements[url];
      if (replacement) {
        console.log(chalk.green(`   ✅ Replace: ${url}`));
        console.log(chalk.cyan(`      With: ${replacement}`));
        
        fixes.push({
          file: issue.file,
          search: url,
          replace: replacement
        });
      } else {
        console.log(chalk.red(`   ❌ Manual fix needed: ${url}`));
      }
    }
  }
  
  return fixes;
}

function createEnvironmentTemplate() {
  console.log(chalk.blue.bold('\n📋 Environment Variables Template'));
  console.log(chalk.gray('=' .repeat(60)));
  
  const envTemplate = `# Environment Variables for Render Deployment
# Copy these to your Render service environment variables

# Frontend Service Environment Variables
REACT_APP_API_URL=https://your-api-gateway.onrender.com
REACT_APP_FIREBASE_API_KEY=AIzaSyDszcx_S3Wm65ACIprlmJLDu5FPmDfX1nE
REACT_APP_FIREBASE_AUTH_DOMAIN=factcheck-1d6e8.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=factcheck-1d6e8
FRONTEND_URL=https://your-frontend.onrender.com
GENERATE_SOURCEMAP=false

# API Gateway Environment Variables
API_GATEWAY_URL=https://your-api-gateway.onrender.com
AUTH_SERVICE_URL=https://your-auth-service.onrender.com
COMMUNITY_SERVICE_URL=https://your-community-service.onrender.com
LINK_SERVICE_URL=https://your-link-service.onrender.com
CHAT_SERVICE_URL=https://your-chat-service.onrender.com
NEWS_SERVICE_URL=https://your-news-service.onrender.com
ADMIN_SERVICE_URL=https://your-admin-service.onrender.com
ALLOWED_ORIGINS=https://your-frontend.onrender.com

# Firebase Configuration (for backend services)
FIREBASE_PROJECT_ID=factcheck-1d6e8
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@factcheck-1d6e8.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----"

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
PORT=10000
`;

  fs.writeFileSync('render-environment-template.env', envTemplate);
  console.log(chalk.green('✅ Created render-environment-template.env'));
}

// Main execution
async function main() {
  console.log(chalk.blue.bold('🚀 Hardcoded URL Fixer'));
  console.log(chalk.gray('=' .repeat(50)));
  
  const issues = generateFixes();
  
  if (issues && issues.length > 0) {
    const fixes = createFixScript(issues);
    createEnvironmentTemplate();
    
    console.log(chalk.yellow('\n⚠️  Action Required:'));
    console.log('1. Review the hardcoded URLs found above');
    console.log('2. Replace them with environment variables');
    console.log('3. Set environment variables in Render Dashboard');
    console.log('4. Use render-environment-template.env as reference');
    
    console.log(chalk.blue('\n💡 Best Practices:'));
    console.log('• Never hardcode URLs in source code');
    console.log('• Always use environment variables');
    console.log('• Create fallbacks for development');
    console.log('• Use consistent naming conventions');
  }
  
  createEnvironmentTemplate();
}

main().catch(error => {
  console.error(chalk.red('Script failed:'), error.message);
  process.exit(1);
});
