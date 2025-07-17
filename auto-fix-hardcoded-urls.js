#!/usr/bin/env node

/**
 * Automatically fix hardcoded URLs in critical files
 * Focus on client-side files that affect production deployment
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Critical files to fix automatically
const criticalFiles = [
  // Client-side files (most important)
  'client/src/components/chat/ModernMessengerLayout.js',
  'client/src/components/features/CommunityPreview.js', 
  'client/src/components/features/LatestNews.js',
  'client/src/components/features/TrendingArticles.js',
  'client/src/hooks/useBatchVotes.js',
  'client/src/hooks/useCommunityData.js',
  'client/src/pages/SubmitArticlePage.js',
  'client/src/services/scamAdviserService.js',
  'client/src/services/virusTotalService.js',
  
  // API Gateway (critical for CORS)
  'services/api-gateway/app.js',
  
  // Service files
  'services/auth-service/src/app.js',
  'services/community-service/src/app.js',
  'services/chat-service/src/app.js',
  'services/link-service/src/app.js',
  'services/news-service/src/app.js',
  'services/admin-service/src/app.js',
  'services/phishtank-service/src/app.js'
];

// URL replacement patterns
const replacements = [
  // Frontend API URL
  {
    pattern: /http:\/\/localhost:8080/g,
    replacement: 'process.env.REACT_APP_API_URL || "http://localhost:8080"',
    context: 'client'
  },
  {
    pattern: /http:\/\/localhost:3000/g,
    replacement: 'process.env.FRONTEND_URL || "http://localhost:3000"',
    context: 'both'
  },
  
  // Current production URLs (these will change)
  {
    pattern: /https:\/\/api-gateway-3lr5\.onrender\.com/g,
    replacement: 'process.env.REACT_APP_API_URL || process.env.API_GATEWAY_URL',
    context: 'both'
  },
  {
    pattern: /https:\/\/frontend-j8de\.onrender\.com/g,
    replacement: 'process.env.FRONTEND_URL',
    context: 'both'
  },
  {
    pattern: /https:\/\/backup-r5zz\.onrender\.com/g,
    replacement: 'process.env.AUTH_SERVICE_URL',
    context: 'backend'
  },
  {
    pattern: /https:\/\/community-service-n3ou\.onrender\.com/g,
    replacement: 'process.env.COMMUNITY_SERVICE_URL',
    context: 'backend'
  },
  {
    pattern: /https:\/\/link-service-dtw1\.onrender\.com/g,
    replacement: 'process.env.LINK_SERVICE_URL',
    context: 'backend'
  },
  {
    pattern: /https:\/\/chat-service-6993\.onrender\.com/g,
    replacement: 'process.env.CHAT_SERVICE_URL',
    context: 'backend'
  },
  {
    pattern: /https:\/\/news-service-71ni\.onrender\.com/g,
    replacement: 'process.env.NEWS_SERVICE_URL',
    context: 'backend'
  },
  {
    pattern: /https:\/\/admin-service-ttvm\.onrender\.com/g,
    replacement: 'process.env.ADMIN_SERVICE_URL',
    context: 'backend'
  }
];

function getFileContext(filePath) {
  if (filePath.includes('client/')) return 'client';
  if (filePath.includes('services/')) return 'backend';
  return 'both';
}

function shouldApplyReplacement(replacement, fileContext) {
  return replacement.context === 'both' || replacement.context === fileContext;
}

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(chalk.yellow(`⚠️  File not found: ${filePath}`));
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const fileContext = getFileContext(filePath);
    
    console.log(chalk.blue(`🔧 Fixing: ${filePath}`));
    
    for (const replacement of replacements) {
      if (!shouldApplyReplacement(replacement, fileContext)) continue;
      
      const matches = content.match(replacement.pattern);
      if (matches) {
        console.log(chalk.cyan(`   Found ${matches.length} occurrence(s) of hardcoded URL`));
        
        // Special handling for string literals vs template literals
        if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
          // For JavaScript files, we need to handle string concatenation properly
          content = content.replace(replacement.pattern, (match) => {
            // Check if it's in a string literal
            const beforeMatch = content.substring(0, content.indexOf(match));
            const inStringLiteral = (beforeMatch.split('"').length - 1) % 2 === 1 || 
                                   (beforeMatch.split("'").length - 1) % 2 === 1 ||
                                   (beforeMatch.split('`').length - 1) % 2 === 1;
            
            if (inStringLiteral) {
              // Replace with template literal
              return '${' + replacement.replacement + '}';
            } else {
              // Direct replacement
              return replacement.replacement;
            }
          });
        } else {
          content = content.replace(replacement.pattern, replacement.replacement);
        }
        
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(chalk.green(`   ✅ Fixed and saved`));
      return true;
    } else {
      console.log(chalk.gray(`   ℹ️  No hardcoded URLs found`));
      return false;
    }
    
  } catch (error) {
    console.log(chalk.red(`   ❌ Error: ${error.message}`));
    return false;
  }
}

function createGetApiBaseUrlFunction() {
  const functionCode = `
// Get API base URL with environment variable support
const getApiBaseUrl = () => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback based on environment
  if (process.env.NODE_ENV === 'production') {
    // Use environment variable for production API Gateway URL
    return process.env.REACT_APP_API_GATEWAY_URL || '/api';
  }

  return 'http://localhost:8080'; // Development fallback (API Gateway port)
};
`;

  return functionCode.trim();
}

async function main() {
  console.log(chalk.blue.bold('🚀 Auto-Fix Hardcoded URLs'));
  console.log(chalk.gray('=' .repeat(50)));
  
  let fixedCount = 0;
  let totalCount = 0;
  
  console.log(chalk.yellow(`📋 Processing ${criticalFiles.length} critical files...`));
  console.log('');
  
  for (const filePath of criticalFiles) {
    totalCount++;
    if (fixFile(filePath)) {
      fixedCount++;
    }
    console.log('');
  }
  
  // Summary
  console.log(chalk.blue.bold('📊 Summary'));
  console.log(chalk.gray('=' .repeat(30)));
  console.log(chalk.green(`✅ Fixed: ${fixedCount} files`));
  console.log(chalk.gray(`📄 Total processed: ${totalCount} files`));
  console.log(chalk.cyan(`📈 Success rate: ${((fixedCount/totalCount)*100).toFixed(1)}%`));
  
  // Create utility function file
  const utilityFunctionPath = 'client/src/utils/apiConfig.js';
  const utilityFunction = createGetApiBaseUrlFunction();
  
  try {
    // Create utils directory if it doesn't exist
    const utilsDir = path.dirname(utilityFunctionPath);
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }
    
    fs.writeFileSync(utilityFunctionPath, utilityFunction);
    console.log(chalk.green(`\n✅ Created utility function: ${utilityFunctionPath}`));
  } catch (error) {
    console.log(chalk.red(`❌ Failed to create utility function: ${error.message}`));
  }
  
  console.log(chalk.yellow('\n⚠️  Next Steps:'));
  console.log('1. Review the fixed files to ensure correctness');
  console.log('2. Set environment variables in Render Dashboard:');
  console.log('   - REACT_APP_API_URL=https://your-api-gateway.onrender.com');
  console.log('   - FRONTEND_URL=https://your-frontend.onrender.com');
  console.log('   - AUTH_SERVICE_URL=https://your-auth-service.onrender.com');
  console.log('   - COMMUNITY_SERVICE_URL=https://your-community-service.onrender.com');
  console.log('3. Redeploy your services');
  console.log('4. Test the application');
  
  console.log(chalk.blue('\n💡 Benefits:'));
  console.log('• No more hardcoded URLs');
  console.log('• Easy to change URLs via environment variables');
  console.log('• Works across different deployment environments');
  console.log('• Proper fallbacks for development');
  
  if (fixedCount > 0) {
    console.log(chalk.green('\n🎉 Auto-fix completed successfully!'));
  } else {
    console.log(chalk.yellow('\n⚠️  No files were modified. Check if URLs are already using environment variables.'));
  }
}

main().catch(error => {
  console.error(chalk.red('Auto-fix failed:'), error.message);
  process.exit(1);
});
