#!/usr/bin/env node

/**
 * Find ALL localhost URLs in the codebase
 * Focus on client-side code that affects production
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Localhost patterns to find
const localhostPatterns = [
  /http:\/\/localhost:\d+/g,
  /https:\/\/localhost:\d+/g,
  /'http:\/\/localhost:\d+'/g,
  /"http:\/\/localhost:\d+"/g,
  /`http:\/\/localhost:\d+`/g
];

// Files to exclude
const excludePatterns = [
  'node_modules',
  '.git',
  'build',
  'dist',
  'package-lock.json',
  'yarn.lock',
  '.env',
  '.env.example',
  'find-all-localhost.js',
  'fix-hardcoded-urls.js',
  'auto-fix-hardcoded-urls.js'
];

// Extensions to scan
const includeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];

function shouldExcludeFile(filePath) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function shouldIncludeFile(filePath) {
  return includeExtensions.some(ext => filePath.endsWith(ext));
}

function scanDirectory(dir, results = []) {
  try {
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
  } catch (error) {
    console.warn(`Warning: Could not scan ${dir}: ${error.message}`);
  }
  
  return results;
}

function findLocalhostUrls(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of localhostPatterns) {
        const found = line.match(pattern);
        if (found) {
          matches.push({
            line: i + 1,
            content: line.trim(),
            matches: found
          });
        }
      }
    }
    
    return matches;
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
    return [];
  }
}

function categorizeFile(filePath) {
  if (filePath.includes('client/src/')) return 'CLIENT_CRITICAL';
  if (filePath.includes('client/')) return 'CLIENT_OTHER';
  if (filePath.includes('services/')) return 'BACKEND';
  if (filePath.includes('scripts/')) return 'SCRIPTS';
  if (filePath.includes('docs/')) return 'DOCS';
  return 'OTHER';
}

function main() {
  console.log(chalk.blue.bold('🔍 Finding ALL localhost URLs in codebase'));
  console.log(chalk.gray('=' .repeat(60)));
  
  const files = scanDirectory('.');
  const issues = {};
  let totalMatches = 0;
  
  // Categorize issues
  const categories = {
    CLIENT_CRITICAL: [],
    CLIENT_OTHER: [],
    BACKEND: [],
    SCRIPTS: [],
    DOCS: [],
    OTHER: []
  };
  
  for (const file of files) {
    const matches = findLocalhostUrls(file);
    if (matches.length > 0) {
      const category = categorizeFile(file);
      categories[category].push({ file, matches });
      totalMatches += matches.length;
    }
  }
  
  // Report by category
  console.log(chalk.red(`❌ Found ${totalMatches} localhost URLs in ${Object.values(categories).flat().length} files\n`));
  
  // CLIENT_CRITICAL - These MUST be fixed
  if (categories.CLIENT_CRITICAL.length > 0) {
    console.log(chalk.red.bold('🚨 CLIENT CRITICAL (MUST FIX - Affects Production)'));
    console.log(chalk.gray('-' .repeat(60)));
    
    for (const issue of categories.CLIENT_CRITICAL) {
      console.log(chalk.yellow(`📄 ${issue.file}`));
      for (const match of issue.matches) {
        console.log(chalk.red(`   Line ${match.line}: ${match.content}`));
        for (const url of match.matches) {
          console.log(chalk.cyan(`      → ${url}`));
        }
      }
      console.log('');
    }
  }
  
  // CLIENT_OTHER - Should be fixed
  if (categories.CLIENT_OTHER.length > 0) {
    console.log(chalk.yellow.bold('⚠️  CLIENT OTHER (Should Fix)'));
    console.log(chalk.gray('-' .repeat(60)));
    
    for (const issue of categories.CLIENT_OTHER) {
      console.log(chalk.yellow(`📄 ${issue.file}`));
      for (const match of issue.matches) {
        console.log(chalk.yellow(`   Line ${match.line}: ${match.content.substring(0, 80)}...`));
      }
      console.log('');
    }
  }
  
  // BACKEND - May need fixing
  if (categories.BACKEND.length > 0) {
    console.log(chalk.blue.bold('🔧 BACKEND (Check if affects production)'));
    console.log(chalk.gray('-' .repeat(60)));
    
    for (const issue of categories.BACKEND) {
      console.log(chalk.blue(`📄 ${issue.file}`));
      console.log(chalk.gray(`   ${issue.matches.length} localhost references`));
    }
    console.log('');
  }
  
  // Summary and recommendations
  console.log(chalk.blue.bold('📊 Summary & Recommendations'));
  console.log(chalk.gray('=' .repeat(60)));
  
  const criticalCount = categories.CLIENT_CRITICAL.length;
  const clientCount = categories.CLIENT_OTHER.length;
  const backendCount = categories.BACKEND.length;
  
  console.log(chalk.red(`🚨 Critical (Client): ${criticalCount} files`));
  console.log(chalk.yellow(`⚠️  Should fix (Client): ${clientCount} files`));
  console.log(chalk.blue(`🔧 Check (Backend): ${backendCount} files`));
  console.log(chalk.gray(`📄 Other: ${categories.SCRIPTS.length + categories.DOCS.length + categories.OTHER.length} files`));
  
  if (criticalCount > 0) {
    console.log(chalk.red.bold('\n🚨 URGENT: Fix critical client files first!'));
    console.log('These files directly affect production frontend behavior.');
  }
  
  // Generate fix commands
  console.log(chalk.green.bold('\n🔧 Quick Fix Commands:'));
  console.log(chalk.gray('-' .repeat(30)));
  
  for (const issue of categories.CLIENT_CRITICAL) {
    console.log(chalk.cyan(`# Fix ${issue.file}`));
    for (const match of issue.matches) {
      for (const url of match.matches) {
        const port = url.match(/:(\d+)/)?.[1];
        let replacement = 'process.env.REACT_APP_API_URL';
        
        if (port === '3002') replacement = 'process.env.REACT_APP_API_URL + "/api/links"';
        else if (port === '3003') replacement = 'process.env.REACT_APP_API_URL + "/api/community"';
        else if (port === '8080') replacement = 'process.env.REACT_APP_API_URL';
        
        console.log(chalk.gray(`# Replace: ${url} → \${${replacement}}`));
      }
    }
    console.log('');
  }
  
  console.log(chalk.yellow('\n💡 Environment Variables Needed:'));
  console.log('REACT_APP_API_URL=https://api-gateway-3lr5.onrender.com');
  console.log('REACT_APP_LINK_SERVICE_URL=https://api-gateway-3lr5.onrender.com/api/links');
  console.log('REACT_APP_COMMUNITY_SERVICE_URL=https://api-gateway-3lr5.onrender.com/api/community');
  
  if (criticalCount === 0) {
    console.log(chalk.green('\n🎉 No critical localhost URLs found in client code!'));
  }
}

main();
