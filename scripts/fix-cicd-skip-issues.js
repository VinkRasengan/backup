#!/usr/bin/env node

/**
 * Script để sửa vấn đề jobs bị skip trong CI/CD
 */

const fs = require('fs');

function fixSkipIssues() {
  console.log('🔧 Fixing CI/CD skip issues...\n');
  
  const workflowFile = '.github/workflows/microservices-ci.yml';
  
  if (!fs.existsSync(workflowFile)) {
    console.log('❌ Workflow file not found');
    return;
  }
  
  let content = fs.readFileSync(workflowFile, 'utf8');
  let changes = 0;
  
  console.log('📋 Analyzing current workflow...');
  
  // 1. Kiểm tra và sửa logic any-service
  if (content.includes('any-service:')) {
    console.log('✅ any-service logic found');
    
    // Kiểm tra xem logic có đúng không
    if (content.includes('steps.changes.outputs.api-gateway == \'true\'')) {
      console.log('✅ any-service logic looks correct');
    } else {
      console.log('⚠️ any-service logic may need fixing');
    }
  }
  
  // 2. Kiểm tra job conditions
  const jobsToCheck = [
    'test-and-build',
    'test-frontend', 
    'build-images',
    'build-frontend-image',
    'integration-tests',
    'deploy-staging',
    'deploy-render-production'
  ];
  
  console.log('\n🔍 Checking job conditions:');
  for (const job of jobsToCheck) {
    if (content.includes(`${job}:`)) {
      console.log(`✅ ${job} job found`);
      
      // Kiểm tra condition
      const jobSection = content.substring(content.indexOf(`${job}:`));
      const conditionMatch = jobSection.match(/if:\s*(.+?)(?:\n|$)/);
      if (conditionMatch) {
        console.log(`  Condition: ${conditionMatch[1]}`);
      } else {
        console.log(`  ⚠️ No condition found for ${job}`);
      }
    } else {
      console.log(`❌ ${job} job not found`);
    }
  }
  
  // 3. Thêm debug job nếu chưa có
  if (!content.includes('debug-changes:')) {
    console.log('\n➕ Adding debug job...');
    
    const debugJob = `
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

`;
    
    // Insert after validate-cicd job
    const insertPoint = content.indexOf('  # Test and build services');
    if (insertPoint !== -1) {
      content = content.slice(0, insertPoint) + debugJob + content.slice(insertPoint);
      changes++;
      console.log('✅ Added debug job');
    }
  } else {
    console.log('✅ Debug job already exists');
  }
  
  // 4. Sửa Slack notification
  if (content.includes('SLACK_BOT_TOKEN')) {
    console.log('\n🔧 Checking Slack notification...');
    
    if (content.includes('continue-on-error: true')) {
      console.log('✅ Slack notification has continue-on-error');
    } else {
      console.log('⚠️ Slack notification missing continue-on-error');
    }
  }
  
  // 5. Kiểm tra paths filter
  console.log('\n📁 Checking paths filter:');
  if (content.includes('dorny/paths-filter@v3')) {
    console.log('✅ Paths filter action found');
    
    // Kiểm tra filters
    const filters = [
      'services/api-gateway/**',
      'services/auth-service/**',
      'client/**'
    ];
    
    for (const filter of filters) {
      if (content.includes(filter)) {
        console.log(`✅ Filter found: ${filter}`);
      } else {
        console.log(`⚠️ Filter missing: ${filter}`);
      }
    }
  } else {
    console.log('❌ Paths filter action not found');
  }
  
  // Ghi file nếu có thay đổi
  if (changes > 0) {
    fs.writeFileSync(workflowFile, content, 'utf8');
    console.log(`\n✅ Applied ${changes} changes to workflow file`);
  } else {
    console.log('\n✅ No changes needed');
  }
  
  // Tổng kết
  console.log('\n📊 Summary:');
  console.log('1. Debug job added to help understand why jobs are skipped');
  console.log('2. Check the debug job output in the next workflow run');
  console.log('3. Verify that changed files match the paths filter');
  console.log('4. Ensure secrets are properly configured');
  
  console.log('\n🎯 Next steps:');
  console.log('1. Push a small change to trigger the workflow');
  console.log('2. Check the debug-changes job output');
  console.log('3. Verify any-service output is "true" when services are changed');
  console.log('4. Add SLACK_BOT_TOKEN to repository secrets if needed');
}

function main() {
  fixSkipIssues();
}

if (require.main === module) {
  main();
}

module.exports = {
  fixSkipIssues
}; 