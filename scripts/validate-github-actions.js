#!/usr/bin/env node

/**
 * GitHub Actions Setup Validator
 * Kiểm tra và validate cấu hình GitHub Actions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating GitHub Actions Setup...\n');

// Kiểm tra workflows
function validateWorkflows() {
  console.log('📋 Checking workflows...');
  
  const workflowsDir = '.github/workflows';
  const requiredWorkflows = [
    'microservices-ci.yml',
    'test-pipeline.yml'
  ];
  
  if (!fs.existsSync(workflowsDir)) {
    console.log('❌ .github/workflows directory not found');
    return false;
  }
  
  const existingWorkflows = fs.readdirSync(workflowsDir);
  console.log(`✅ Found ${existingWorkflows.length} workflow(s):`, existingWorkflows);
  
  for (const workflow of requiredWorkflows) {
    const workflowPath = path.join(workflowsDir, workflow);
    if (fs.existsSync(workflowPath)) {
      console.log(`✅ ${workflow} exists`);
    } else {
      console.log(`❌ ${workflow} missing`);
    }
  }
  
  return true;
}

// Kiểm tra package.json scripts
function validatePackageScripts() {
  console.log('\n📦 Checking package.json scripts...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    const requiredScripts = [
      'test',  'start',
      'build'
    ];
    
    for (const script of requiredScripts) {
      if (scripts[script]) {
        console.log(`✅ ${script} script exists`);
      } else {
        console.log(`⚠️  ${script} script missing`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    return false;
  }
}

// Kiểm tra services
function validateServices() {
  console.log('\n🔧 Checking microservices...');
  
  const servicesDir = 'services';
  if (!fs.existsSync(servicesDir)) {
    console.log('❌ services directory not found');
    return false;
  }
  
  const services = fs.readdirSync(servicesDir).filter(dir => {
    return fs.statSync(path.join(servicesDir, dir)).isDirectory();
  });
  
  console.log(`✅ Found ${services.length} services:`, services);
  
  for (const service of services) {
    const servicePath = path.join(servicesDir, service);
    const packageJsonPath = path.join(servicePath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      console.log(`✅ ${service} has package.json`);
    } else {
      console.log(`❌ ${service} missing package.json`);
    }
  }
  
  return true;
}

// Kiểm tra client
function validateClient() {
  console.log('\n🎨 Checking client...');
  
  const clientDir = 'client';
  if (!fs.existsSync(clientDir)) {
    console.log('❌ client directory not found');
    return false;
  }
  
  const clientPackageJson = path.join(clientDir, 'package.json');
  if (fs.existsSync(clientPackageJson)) {
    console.log('✅ client has package.json');
  } else {
    console.log('❌ client missing package.json');
  }
  
  return true;
}

// Kiểm tra Docker files
function validateDockerFiles() {
  console.log('\n🐳 Checking Docker files...');
  
  const servicesDir = 'services';
  if (!fs.existsSync(servicesDir)) {
    return false;
  }
  
  const services = fs.readdirSync(servicesDir).filter(dir => {
    return fs.statSync(path.join(servicesDir, dir)).isDirectory();
  });
  
  for (const service of services) {
    const servicePath = path.join(servicesDir, service);
    const dockerfilePath = path.join(servicePath, 'Dockerfile');
    
    if (fs.existsSync(dockerfilePath)) {
      console.log(`✅ ${service} has Dockerfile`);
    } else {
      console.log(`⚠️  ${service} missing Dockerfile`);
    }
  }
  
  return true;
}

// Kiểm tra environment files
function validateEnvironmentFiles() {
  console.log('\n🔐 Checking environment files...'); 
  const envFiles = [
    '.env.example',   '.env.local',
    '.env.production'
  ];
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`✅ ${envFile} exists`);
    } else {
      console.log(`⚠️  ${envFile} missing`);
    }
  }
  
  return true;
}

// Tạo checklist cho GitHub Secrets
function generateSecretsChecklist() {
  console.log('\n🔑 Required GitHub Secrets Checklist:');
  console.log('Vào repository settings → Secrets and variables → Actions');
  console.log('Thêm các secrets sau:\n');
  
  const secrets =   'RENDER_API_KEY',
   'FIREBASE_PROJECT_ID',
   'FIREBASE_PRIVATE_KEY',
   'FIREBASE_CLIENT_EMAIL',   'JWT_SECRET',   'GEMINI_API_KEY', 'VIRUSTOTAL_API_KEY',
    'NEWSAPI_API_KEY'
  ];
  
  secrets.forEach(secret => {
    console.log(`- {secret}`);
  });
  
  console.log('\nOptional secrets:');
  const optionalSecrets =   'SNYK_TOKEN',
  'PACT_BROKER_URL',
    'PACT_BROKER_TOKEN',
   'SLACK_WEBHOOK'
  ];
  
  optionalSecrets.forEach(secret => {
    console.log(`- [ ] ${secret} (optional)`);
  });
}

// Tạo deployment checklist
function generateDeploymentChecklist() {
  console.log('\n🚀 Deployment Checklist:');
  console.log('-itHub Environments (staging, production)');
  console.log('- [ ] Configure branch protection rules');
  console.log('- [ ] Set up required status checks');
  console.log('- [ ] Configure deployment approvals');
  console.log('-  Test workflows on develop branch');
  console.log('- [ ] Verify all secrets are set');
  console.log('- [ ] Test deployment to staging');
  console.log('- [ ] Test deployment to production');
}

// Main validation
function main() {
  console.log('='.repeat(50));
  console.log('GitHub Actions Setup Validator');
  console.log('='.repeat(50));
  
  const results = {
    workflows: validateWorkflows(),
    scripts: validatePackageScripts(),
    services: validateServices(),
    client: validateClient(),
    docker: validateDockerFiles(),
    env: validateEnvironmentFiles()
  };
  
  console.log('\nValidation Results:');
  console.log('='.repeat(50));
  Object.entries(results).forEach(([key, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${key.padEnd(15)}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All validations passed!');
  } else {
    console.log('\n⚠️  Some validations failed. Please fix the issues above.');
  }
  
  generateSecretsChecklist();
  generateDeploymentChecklist();
  
  console.log('\n📚 Next steps:');
  console.log('1. Set up GitHub Secrets');
  console.log('2. Configure Environments');
  console.log('3. Test workflows');
  console.log('4. Deploy to staging');
  console.log('5. Deploy to production');
  
  console.log('\n📖 See docs/GITHUB_ACTIONS_SETUP.md for detailed instructions');
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = {
  validateWorkflows,
  validatePackageScripts,
  validateServices,
  validateClient,
  validateDockerFiles,
  validateEnvironmentFiles
}; 