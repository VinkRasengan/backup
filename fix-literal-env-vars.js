#!/usr/bin/env node

/**
 * Fix literal environment variable strings in client files
 */

const fs = require('fs');
const chalk = require('chalk');

// Files and their fixes
const fixes = [
  {
    file: 'client/src/components/features/CommunityPreview.js',
    fixes: [
      {
        search: "return '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}/api';",
        replace: "const apiBaseUrl = process.env.REACT_APP_API_URL || \"http://localhost:8080\";\n    return `${apiBaseUrl}/api`;"
      }
    ]
  },
  {
    file: 'client/src/components/features/LatestNews.js',
    fixes: [
      {
        search: "return '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}/api';",
        replace: "const apiBaseUrl = process.env.REACT_APP_API_URL || \"http://localhost:8080\";\n    return `${apiBaseUrl}/api`;"
      }
    ]
  },
  {
    file: 'client/src/components/features/TrendingArticles.js',
    fixes: [
      {
        search: "return '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}/api';",
        replace: "const apiBaseUrl = process.env.REACT_APP_API_URL || \"http://localhost:8080\";\n    return `${apiBaseUrl}/api`;"
      }
    ]
  },
  {
    file: 'client/src/hooks/useBatchVotes.js',
    fixes: [
      {
        search: "const API_BASE_URL = process.env.REACT_APP_API_URL || '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}';",
        replace: "const API_BASE_URL = process.env.REACT_APP_API_URL || \"http://localhost:8080\";"
      }
    ]
  },
  {
    file: 'client/src/hooks/useCommunityData.js',
    fixes: [
      {
        search: "return '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}/api';",
        replace: "const apiBaseUrl = process.env.REACT_APP_API_URL || \"http://localhost:8080\";\n    return `${apiBaseUrl}/api`;"
      }
    ]
  },
  {
    file: 'client/src/pages/SubmitArticlePage.js',
    fixes: [
      {
        search: "const testResponse = await fetch(`${process.env.REACT_APP_API_URL || '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}'}/health`);",
        replace: "const apiBaseUrl = process.env.REACT_APP_API_URL || \"http://localhost:8080\";\n        const testResponse = await fetch(`${apiBaseUrl}/health`);"
      },
      {
        search: "const baseURL = process.env.REACT_APP_API_URL || '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}';",
        replace: "const baseURL = process.env.REACT_APP_API_URL || \"http://localhost:8080\";"
      }
    ]
  },
  {
    file: 'client/src/services/scamAdviserService.js',
    fixes: [
      {
        search: "this.apiUrl = process.env.REACT_APP_API_URL || '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}';",
        replace: "this.apiUrl = process.env.REACT_APP_API_URL || \"http://localhost:8080\";"
      }
    ]
  },
  {
    file: 'client/src/services/virusTotalService.js',
    fixes: [
      {
        search: "this.baseURL = process.env.REACT_APP_API_URL || '${process.env.REACT_APP_API_URL || \"http://localhost:8080\"}';",
        replace: "this.baseURL = process.env.REACT_APP_API_URL || \"http://localhost:8080\";"
      }
    ]
  }
];

function fixFile(fileConfig) {
  try {
    if (!fs.existsSync(fileConfig.file)) {
      console.log(chalk.yellow(`⚠️  File not found: ${fileConfig.file}`));
      return false;
    }
    
    let content = fs.readFileSync(fileConfig.file, 'utf8');
    let modified = false;
    
    console.log(chalk.blue(`🔧 Fixing: ${fileConfig.file}`));
    
    for (const fix of fileConfig.fixes) {
      if (content.includes(fix.search)) {
        content = content.replace(fix.search, fix.replace);
        modified = true;
        console.log(chalk.green(`   ✅ Fixed literal env var string`));
      }
    }
    
    if (modified) {
      fs.writeFileSync(fileConfig.file, content, 'utf8');
      console.log(chalk.green(`   ✅ Saved`));
      return true;
    } else {
      console.log(chalk.gray(`   ℹ️  No changes needed`));
      return false;
    }
    
  } catch (error) {
    console.log(chalk.red(`   ❌ Error: ${error.message}`));
    return false;
  }
}

async function main() {
  console.log(chalk.blue.bold('🚀 Fix Literal Environment Variable Strings'));
  console.log(chalk.gray('=' .repeat(60)));
  
  let fixedCount = 0;
  let totalCount = 0;
  
  for (const fileConfig of fixes) {
    totalCount++;
    if (fixFile(fileConfig)) {
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
  
  if (fixedCount > 0) {
    console.log(chalk.green('\n🎉 Literal environment variable strings fixed!'));
    console.log(chalk.blue('💡 Now environment variables will be properly evaluated'));
    
    console.log(chalk.yellow('\n⚠️  Next Steps:'));
    console.log('1. Set REACT_APP_API_URL in Render Dashboard');
    console.log('2. Redeploy frontend service');
    console.log('3. Test the application');
    
    console.log(chalk.blue('\n🔧 Environment Variable to Set:'));
    console.log('REACT_APP_API_URL=https://api-gateway-3lr5.onrender.com');
  } else {
    console.log(chalk.yellow('\n⚠️  No files were modified'));
  }
}

main().catch(error => {
  console.error(chalk.red('Fix failed:'), error.message);
  process.exit(1);
});
