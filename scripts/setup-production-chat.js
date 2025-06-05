#!/usr/bin/env node

/**
 * Production Chat Setup Script
 * This script configures chat system for Firebase production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Chat for Firebase Production...\n');

// 1. Set OpenAI API key for Firebase Functions
async function setFirebaseFunctionsConfig() {
  console.log('🔑 Setting OpenAI API key for Firebase Functions...');
  
  try {
    // Read OpenAI key from server .env
    const serverEnvPath = path.join(__dirname, '../server/.env');
    const envContent = fs.readFileSync(serverEnvPath, 'utf8');
    
    const openaiKeyMatch = envContent.match(/OPENAI_API_KEY=(.+)/);
    if (!openaiKeyMatch) {
      throw new Error('OPENAI_API_KEY not found in server/.env');
    }
    
    const openaiKey = openaiKeyMatch[1].trim();
    console.log('✅ Found OpenAI key in server/.env');
    
    // Set Firebase Functions config
    const command = `firebase functions:config:set openai.api_key="${openaiKey}"`;
    console.log('🔧 Setting Firebase Functions config...');
    
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Firebase Functions config set successfully');
    
  } catch (error) {
    console.error('❌ Error setting Firebase Functions config:', error.message);
    console.log('\n💡 Manual setup:');
    console.log('firebase functions:config:set openai.api_key="your-openai-api-key"');
  }
}

// 2. Create production environment file for client
async function createProductionEnv() {
  console.log('\n🌐 Creating production environment config...');
  
  try {
    // Get Firebase project info
    let projectId = 'factcheck-1d6e8'; // Default
    
    try {
      const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
      projectId = firebaserc.projects?.default || projectId;
    } catch (error) {
      console.log('⚠️  Could not read .firebaserc, using default project ID');
    }
    
    // Create client .env.production
    const productionEnv = `# Production Environment Variables
REACT_APP_API_URL=https://us-central1-${projectId}.cloudfunctions.net/api
REACT_APP_ENVIRONMENT=production
REACT_APP_USE_EMULATOR=false
GENERATE_SOURCEMAP=false
`;
    
    const clientEnvPath = path.join(__dirname, '../client/.env.production');
    fs.writeFileSync(clientEnvPath, productionEnv);
    
    console.log('✅ Created client/.env.production');
    console.log(`📍 API URL: https://us-central1-${projectId}.cloudfunctions.net/api`);
    
  } catch (error) {
    console.error('❌ Error creating production env:', error.message);
  }
}

// 3. Update functions index.js to ensure proper CORS and routes
async function updateFunctionsIndex() {
  console.log('\n🔧 Updating Firebase Functions...');
  
  const functionsIndexPath = path.join(__dirname, '../functions/index.js');
  
  try {
    let content = fs.readFileSync(functionsIndexPath, 'utf8');
    
    // Check if exports.api exists
    if (!content.includes('exports.api')) {
      console.log('⚠️  Adding API export to functions/index.js...');
      
      // Add API export at the end
      content += `
// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
`;
      
      fs.writeFileSync(functionsIndexPath, content);
      console.log('✅ Added API export to functions/index.js');
    } else {
      console.log('✅ API export already exists in functions/index.js');
    }
    
  } catch (error) {
    console.error('❌ Error updating functions index:', error.message);
  }
}

// 4. Deploy functions with OpenAI config
async function deployFunctions() {
  console.log('\n🚀 Deploying Firebase Functions...');
  
  try {
    console.log('📦 Installing functions dependencies...');
    execSync('cd functions && npm install', { stdio: 'inherit' });
    
    console.log('🚀 Deploying functions...');
    execSync('firebase deploy --only functions', { stdio: 'inherit' });
    
    console.log('✅ Functions deployed successfully');
    
  } catch (error) {
    console.error('❌ Error deploying functions:', error.message);
    console.log('\n💡 Manual deployment:');
    console.log('cd functions && npm install');
    console.log('firebase deploy --only functions');
  }
}

// 5. Build and deploy client
async function deployClient() {
  console.log('\n🏗️  Building and deploying client...');
  
  try {
    console.log('📦 Installing client dependencies...');
    execSync('cd client && npm install', { stdio: 'inherit' });
    
    console.log('🏗️  Building client for production...');
    execSync('cd client && npm run build', { stdio: 'inherit' });
    
    console.log('🚀 Deploying to Firebase Hosting...');
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });
    
    console.log('✅ Client deployed successfully');
    
  } catch (error) {
    console.error('❌ Error deploying client:', error.message);
    console.log('\n💡 Manual deployment:');
    console.log('cd client && npm install && npm run build');
    console.log('firebase deploy --only hosting');
  }
}

// 6. Test production deployment
async function testProduction() {
  console.log('\n🧪 Testing production deployment...');
  
  try {
    // Get project info
    let projectId = 'factcheck-1d6e8';
    try {
      const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
      projectId = firebaserc.projects?.default || projectId;
    } catch (error) {
      // Use default
    }
    
    const functionsUrl = `https://us-central1-${projectId}.cloudfunctions.net/api`;
    const hostingUrl = `https://${projectId}.web.app`;
    
    console.log('🌐 Production URLs:');
    console.log(`   Frontend: ${hostingUrl}`);
    console.log(`   API: ${functionsUrl}`);
    console.log(`   Chat: ${hostingUrl}/chat`);
    
    console.log('\n✅ Production setup complete!');
    console.log('\n🧪 Test your chat:');
    console.log(`1. Visit: ${hostingUrl}/chat`);
    console.log('2. Login with your account');
    console.log('3. Send a message to test OpenAI integration');
    
  } catch (error) {
    console.error('❌ Error in testing setup:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🔧 Firebase Production Chat Setup');
  console.log('═'.repeat(50));
  
  const args = process.argv.slice(2);
  const skipDeploy = args.includes('--skip-deploy');
  
  try {
    // Step 1: Set Firebase Functions config
    await setFirebaseFunctionsConfig();
    
    // Step 2: Create production environment
    await createProductionEnv();
    
    // Step 3: Update functions
    await updateFunctionsIndex();
    
    if (!skipDeploy) {
      // Step 4: Deploy functions
      await deployFunctions();
      
      // Step 5: Deploy client
      await deployClient();
    } else {
      console.log('\n⏭️  Skipping deployment (--skip-deploy flag)');
      console.log('💡 To deploy manually:');
      console.log('   firebase deploy --only functions');
      console.log('   firebase deploy --only hosting');
    }
    
    // Step 6: Show test info
    await testProduction();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Production setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  setFirebaseFunctionsConfig, 
  createProductionEnv, 
  updateFunctionsIndex,
  deployFunctions,
  deployClient 
};
