#!/usr/bin/env node

/**
 * Find literal environment variable strings that should be evaluated
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Patterns to find literal env var strings
const literalEnvPatterns = [
  /process\.env\.REACT_APP_API_URL\s*\|\|\s*"http:\/\/localhost:8080"/g,
  /process\.env\.REACT_APP_API_URL\s*\|\|\s*'http:\/\/localhost:8080'/g,
  /process\.env\.REACT_APP_API_URL\s*\|\|\s*`http:\/\/localhost:8080`/g,
  /'process\.env\.REACT_APP_API_URL\s*\|\|\s*"http:\/\/localhost:8080"'/g,
  /"process\.env\.REACT_APP_API_URL\s*\|\|\s*'http:\/\/localhost:8080'"/g,
  /`process\.env\.REACT_APP_API_URL\s*\|\|\s*"http:\/\/localhost:8080"`/g
];

function scanDirectory(dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
        scanDirectory(filePath, results);
      } else if (stat.isFile() && (filePath.endsWith('.js') || filePath.endsWith('.jsx'))) {
        results.push(filePath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan ${dir}: ${error.message}`);
  }
  
  return results;
}

function findLiteralEnvVars(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of literalEnvPatterns) {
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

function main() {
  console.log(chalk.blue.bold('🔍 Finding Literal Environment Variable Strings'));
  console.log(chalk.gray('=' .repeat(60)));
  
  const files = scanDirectory('client/src');
  const issues = [];
  
  for (const file of files) {
    const matches = findLiteralEnvVars(file);
    if (matches.length > 0) {
      issues.push({ file, matches });
    }
  }
  
  if (issues.length === 0) {
    console.log(chalk.green('✅ No literal environment variable strings found!'));
    return;
  }
  
  console.log(chalk.red(`❌ Found literal env var strings in ${issues.length} files:`));
  console.log('');
  
  for (const issue of issues) {
    console.log(chalk.yellow(`📄 ${issue.file}`));
    for (const match of issue.matches) {
      console.log(chalk.red(`   Line ${match.line}: ${match.content}`));
      for (const literal of match.matches) {
        console.log(chalk.cyan(`      → ${literal}`));
      }
    }
    console.log('');
  }
  
  console.log(chalk.blue.bold('🔧 How to Fix:'));
  console.log('These literal strings should be replaced with proper function calls or template literals.');
  console.log('');
  console.log(chalk.green('✅ Correct usage:'));
  console.log('  const apiUrl = getApiBaseUrl(); // Function call');
  console.log('  const url = `${getApiBaseUrl()}/api/endpoint`; // Template literal');
  console.log('');
  console.log(chalk.red('❌ Incorrect usage:'));
  console.log('  const url = "process.env.REACT_APP_API_URL || \\"http://localhost:8080\\""; // Literal string');
}

main();
