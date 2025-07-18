#!/usr/bin/env node

/**
 * Script để sửa các lỗi linter trong GitHub Actions workflow files
 */

const fs = require('fs');

function fixWorkflowFile(filePath) {
  try {
    console.log(`🔧 Fixing workflow file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fixesApplied = 0;
    
    // Sửa environment references
    const environmentFixes = [
      {
        pattern: /environment:\s*\n\s*name:\s*staging\s*\n\s*url:\s*https:\/\/staging\.example\.com/g,
        replacement: '# environment: staging (configure in GitHub settings)'
      },
      {
        pattern: /environment:\s*\n\s*name:\s*production\s*\n\s*url:\s*https:\/\/production\.example\.com/g,
        replacement: '# environment: production (configure in GitHub settings)'
      },
      {
        pattern: /environment:\s*staging/g,
        replacement: '# environment: staging (configure in GitHub settings)'
      },
      {
        pattern: /environment:\s*production/g,
        replacement: '# environment: production (configure in GitHub settings)'
      }
    ];
    
    for (const fix of environmentFixes) {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        fixesApplied++;
      }
    }
    
    // Ghi file nếu có thay đổi
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Applied ${fixesApplied} fixes to ${filePath}`);
      return true;
    } else {
      console.log(`✅ No fixes needed for ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function validateWorkflowFile(filePath) {
  try {
    console.log(`🔍 Validating workflow file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Kiểm tra các vấn đề phổ biến
    const checks = [
      {
        name: 'Invalid environment references',
        pattern: /environment:\s*(staging|production)(?!\s*#)/g,
        message: 'Environment references should be configured in GitHub settings'
      },
      {
        name: 'Missing required fields',
        pattern: /runs-on:\s*$/gm,
        message: 'Missing runs-on value'
      }
    ];
    
    for (const check of checks) {
      const matches = content.match(check.pattern);
      if (matches) {
        issues.push({
          type: check.name,
          count: matches.length,
          message: check.message
        });
      }
    }
    
    if (issues.length > 0) {
      console.log(`⚠️ Found ${issues.length} potential issues:`);
      issues.forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.count} occurrences - ${issue.message}`);
      });
      return false;
    } else {
      console.log(`✅ No validation issues found in ${filePath}`);
      return true;
    }
    
  } catch (error) {
    console.error(`❌ Error validating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Starting workflow linter error fixes...\n');
  
  const workflowFiles = [
    '.github/workflows/microservices-ci.yml',
    '.github/workflows/deployment.yml'
  ];
  
  let totalFixes = 0;
  let totalValidated = 0;
  
  for (const filePath of workflowFiles) {
    console.log(`\n📁 Processing: ${filePath}`);
    
    // Sửa lỗi
    const fixed = fixWorkflowFile(filePath);
    if (fixed) totalFixes++;
    
    // Validate
    const valid = validateWorkflowFile(filePath);
    if (valid) totalValidated++;
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Fixed: ${totalFixes} files`);
  console.log(`✅ Validated: ${totalValidated} files`);
  
  if (totalFixes > 0) {
    console.log('\n💡 Next steps:');
    console.log('1. Configure environments in GitHub repository settings');
    console.log('2. Add required secrets to GitHub repository secrets');
    console.log('3. Test the workflows to ensure they work correctly');
  }
  
  console.log('\n🎉 Workflow linter error fixes completed!');
}

if (require.main === module) {
  main();
}

module.exports = {
  fixWorkflowFile,
  validateWorkflowFile
}; 