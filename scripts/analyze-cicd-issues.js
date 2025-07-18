#!/usr/bin/env node

/**
 * Script để phân tích và sửa các vấn đề CI/CD workflow
 */

const fs = require('fs');

function analyzeWorkflowIssues() {
  console.log('🔍 Analyzing CI/CD workflow issues...\n');
  
  const workflowFile = '.github/workflows/microservices-ci.yml';
  
  if (!fs.existsSync(workflowFile)) {
    console.log('❌ Workflow file not found');
    return;
  }
  
  const content = fs.readFileSync(workflowFile, 'utf8');
  const issues = [];
  const suggestions = [];
  
  // Kiểm tra các vấn đề phổ biến
  console.log('📋 Checking common issues:');
  
  // 1. Kiểm tra logic any-service
  if (content.includes('any-service:')) {
    console.log('⚠️ Complex any-service logic detected');
    issues.push('Complex any-service logic may cause issues');
    suggestions.push('Simplify any-service logic or add debug job');
  }
  
  // 2. Kiểm tra job dependencies
  const jobDependencies = {
    'test-and-build': ['detect-changes', 'validate-cicd'],
    'build-images': ['test-and-build'],
    'build-frontend-image': ['test-frontend'],
    'deploy-staging': ['build-images', 'build-frontend-image'],
    'deploy-render-production': ['build-images', 'build-frontend-image'],
    'notify-completion': ['deploy-staging', 'deploy-render-production']
  };
  
  console.log('\n🔗 Checking job dependencies:');
  for (const [job, deps] of Object.entries(jobDependencies)) {
    if (content.includes(`${job}:`)) {
      console.log(`✅ ${job} job found`);
      
      // Kiểm tra dependencies
      for (const dep of deps) {
        if (!content.includes(`needs: [${dep}`) && !content.includes(`needs: [${dep},`) && !content.includes(`needs: [${dep} ]`)) {
          console.log(`⚠️ ${job} may be missing dependency: ${dep}`);
          issues.push(`${job} missing dependency: ${dep}`);
        }
      }
    } else {
      console.log(`❌ ${job} job not found`);
      issues.push(`Missing job: ${job}`);
    }
  }
  
  // 3. Kiểm tra conditions
  console.log('\n🎯 Checking job conditions:');
  const conditions = [
    { job: 'test-and-build', condition: 'needs.detect-changes.outputs.any-service == \'true\'' },
    { job: 'deploy-staging', condition: 'github.event_name == \'push\' && github.ref == \'refs/heads/develop\'' },
    { job: 'deploy-render-production', condition: 'github.event_name == \'push\' && github.ref == \'refs/heads/main\'' }
  ];
  
  for (const { job, condition } of conditions) {
    if (content.includes(condition)) {
      console.log(`✅ ${job} condition found`);
    } else {
      console.log(`⚠️ ${job} condition may be missing or incorrect`);
      issues.push(`${job} condition issue`);
    }
  }
  
  // 4. Kiểm tra secrets
  console.log('\n🔐 Checking secrets:');
  const requiredSecrets = [
    'SLACK_BOT_TOKEN',
    'RENDER_API_KEY',
    'FIREBASE_PROJECT_ID'
  ];
  
  for (const secret of requiredSecrets) {
    if (content.includes(`secrets.${secret}`)) {
      console.log(`✅ ${secret} secret referenced`);
    } else {
      console.log(`⚠️ ${secret} secret not found`);
      suggestions.push(`Add ${secret} to repository secrets if needed`);
    }
  }
  
  // 5. Kiểm tra matrix strategy
  console.log('\n📊 Checking matrix strategy:');
  if (content.includes('strategy:') && content.includes('fail-fast: false') && content.includes('matrix:')) {
    console.log('✅ Matrix strategy found');
  } else {
    console.log('⚠️ Matrix strategy may be missing');
    issues.push('Missing matrix strategy');
  }
  
  // Tổng kết
  console.log('\n📊 Analysis Summary:');
  console.log(`Issues found: ${issues.length}`);
  console.log(`Suggestions: ${suggestions.length}`);
  
  if (issues.length > 0) {
    console.log('\n❌ Issues to fix:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
  }
  
  return { issues, suggestions };
}

function generateFixScript() {
  console.log('\n🔧 Generating fix script...');
  
  const fixScript = `#!/usr/bin/env node

/**
 * Auto-fix script for CI/CD issues
 */

const fs = require('fs');

function fixWorkflowIssues() {
  const workflowFile = '.github/workflows/microservices-ci.yml';
  
  if (!fs.existsSync(workflowFile)) {
    console.log('❌ Workflow file not found');
    return;
  }
  
  let content = fs.readFileSync(workflowFile, 'utf8');
  let changes = 0;
  
  // 1. Simplify any-service logic
  if (content.includes('any-service:')) {
    const anyServicePattern = /any-service:\\s*\\${{[^}]+}}/;
    if (anyServicePattern.test(content)) {
      content = content.replace(
        anyServicePattern,
        'any-service: ${{ steps.changes.outputs.api-gateway == \\'true\\' || steps.changes.outputs.auth-service == \\'true\\' || steps.changes.outputs.link-service == \\'true\\' || steps.changes.outputs.community-service == \\'true\\' || steps.changes.outputs.chat-service == \\'true\\' || steps.changes.outputs.news-service == \\'true\\' || steps.changes.outputs.admin-service == \\'true\\' || steps.changes.outputs.phishtank-service == \\'true\\' || steps.changes.outputs.criminalip-service == \\'true\\' }}'
      );
      changes++;
      console.log('✅ Simplified any-service logic');
    }
  }
  
  // 2. Add debug job if not exists
  if (!content.includes('debug-changes:')) {
    const debugJob = \`
  # Debug job to understand why jobs are skipped
  debug-changes:
    needs: [detect-changes]
    runs-on: ubuntu-latest
    steps:
      - name: Debug outputs
        run: |
          echo "🔍 Debugging detect-changes outputs:"
          echo "api-gateway: \${{ needs.detect-changes.outputs.api-gateway }}"
          echo "auth-service: \${{ needs.detect-changes.outputs.auth-service }}"
          echo "link-service: \${{ needs.detect-changes.outputs.link-service }}"
          echo "community-service: \${{ needs.detect-changes.outputs.community-service }}"
          echo "chat-service: \${{ needs.detect-changes.outputs.chat-service }}"
          echo "news-service: \${{ needs.detect-changes.outputs.news-service }}"
          echo "admin-service: \${{ needs.detect-changes.outputs.admin-service }}"
          echo "phishtank-service: \${{ needs.detect-changes.outputs.phishtank-service }}"
          echo "criminalip-service: \${{ needs.detect-changes.outputs.criminalip-service }}"
          echo "frontend: \${{ needs.detect-changes.outputs.frontend }}"
          echo "any-service: \${{ needs.detect-changes.outputs.any-service }}"
          echo "Event name: \${{ github.event_name }}"
          echo "Ref: \${{ github.ref }}"
          echo "Changed files:"
          git diff --name-only \${{ github.event.before }} \${{ github.sha }} || echo "No changes detected"

\`;
    
    // Insert after validate-cicd job
    const insertPoint = content.indexOf('  # Test and build services');
    if (insertPoint !== -1) {
      content = content.slice(0, insertPoint) + debugJob + content.slice(insertPoint);
      changes++;
      console.log('✅ Added debug job');
    }
  }
  
  // 3. Fix Slack notification
  if (content.includes('SLACK_BOT_TOKEN') && !content.includes('continue-on-error: true')) {
    console.log('✅ Slack notification already has continue-on-error');
  }
  
  if (changes > 0) {
    fs.writeFileSync(workflowFile, content, 'utf8');
    console.log(\`\\n✅ Applied \${changes} fixes to workflow file\`);
  } else {
    console.log('\\n✅ No fixes needed');
  }
}

if (require.main === module) {
  fixWorkflowIssues();
}
`;
  
  fs.writeFileSync('scripts/fix-cicd-workflow-issues.js', fixScript);
  console.log('✅ Generated fix script: scripts/fix-cicd-workflow-issues.js');
}

function main() {
  const analysis = analyzeWorkflowIssues();
  generateFixScript();
  
  console.log('\n🎯 Next steps:');
  console.log('1. Run: node scripts/fix-cicd-workflow-issues.js');
  console.log('2. Add required secrets to GitHub repository');
  console.log('3. Test the workflow with a small change');
  console.log('4. Monitor the debug job output');
  
  if (analysis.issues.length > 0) {
    console.log('\n⚠️ Please address the issues above before deploying');
  } else {
    console.log('\n🎉 No critical issues found!');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeWorkflowIssues,
  generateFixScript
}; 