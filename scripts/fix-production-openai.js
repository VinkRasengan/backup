#!/usr/bin/env node

/**
 * Quick Fix for Production OpenAI
 * This script sets up OpenAI for Firebase production deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Quick Fix: OpenAI for Production\n');

async function main() {
  try {
    // 1. Read OpenAI key from server .env
    console.log('🔍 Reading OpenAI key from server/.env...');
    const serverEnvPath = path.join(__dirname, '../server/.env');
    
    if (!fs.existsSync(serverEnvPath)) {
      throw new Error('server/.env file not found');
    }
    
    const envContent = fs.readFileSync(serverEnvPath, 'utf8');
    const openaiKeyMatch = envContent.match(/OPENAI_API_KEY=(.+)/);
    
    if (!openaiKeyMatch) {
      throw new Error('OPENAI_API_KEY not found in server/.env');
    }
    
    const openaiKey = openaiKeyMatch[1].trim();
    console.log('✅ Found OpenAI key');
    
    // 2. Set Firebase Functions config
    console.log('🔑 Setting Firebase Functions config...');
    const command = `firebase functions:config:set openai.api_key="${openaiKey}"`;
    
    try {
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Firebase Functions config set successfully');
    } catch (error) {
      console.error('❌ Error setting config:', error.message);
      console.log('\n💡 Manual command:');
      console.log(`firebase functions:config:set openai.api_key="${openaiKey}"`);
      return;
    }
    
    // 3. Create client production env
    console.log('🌐 Creating client production environment...');
    const productionEnv = `# Production Environment Variables
REACT_APP_API_URL=https://us-central1-factcheck-1d6e8.cloudfunctions.net/api
REACT_APP_ENVIRONMENT=production
REACT_APP_USE_EMULATOR=false
GENERATE_SOURCEMAP=false
`;
    
    const clientEnvPath = path.join(__dirname, '../client/.env.production');
    fs.writeFileSync(clientEnvPath, productionEnv);
    console.log('✅ Created client/.env.production');
    
    // 4. Deploy functions
    console.log('🚀 Deploying Firebase Functions...');
    try {
      execSync('firebase deploy --only functions', { stdio: 'inherit' });
      console.log('✅ Functions deployed successfully');
    } catch (error) {
      console.error('❌ Error deploying functions:', error.message);
      console.log('\n💡 Manual deployment:');
      console.log('firebase deploy --only functions');
      return;
    }
    
    // 5. Build and deploy client
    console.log('🏗️  Building and deploying client...');
    try {
      execSync('cd client && npm run build', { stdio: 'inherit' });
      execSync('firebase deploy --only hosting', { stdio: 'inherit' });
      console.log('✅ Client deployed successfully');
    } catch (error) {
      console.error('❌ Error deploying client:', error.message);
      console.log('\n💡 Manual deployment:');
      console.log('cd client && npm run build');
      console.log('firebase deploy --only hosting');
      return;
    }
    
    // 6. Success message
    console.log('\n🎉 Production OpenAI Setup Complete!');
    console.log('\n🌐 Your app is now live at:');
    console.log('   https://factcheck-1d6e8.web.app/chat');
    console.log('\n🧪 Test the chat:');
    console.log('1. Visit the chat page');
    console.log('2. Login with your account');
    console.log('3. Send a message');
    console.log('4. You should get a response from OpenAI GPT');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    console.log('\n🔧 Manual Setup Steps:');
    console.log('1. Set Firebase Functions config:');
    console.log('   firebase functions:config:set openai.api_key="your-openai-key"');
    console.log('');
    console.log('2. Create client/.env.production:');
    console.log('   REACT_APP_API_URL=https://us-central1-factcheck-1d6e8.cloudfunctions.net/api');
    console.log('');
    console.log('3. Deploy:');
    console.log('   firebase deploy --only functions');
    console.log('   cd client && npm run build');
    console.log('   firebase deploy --only hosting');
    
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { main };
