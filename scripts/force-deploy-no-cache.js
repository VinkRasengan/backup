#!/usr/bin/env node

/**
 * Force Deploy Without Cache
 * This script forces a clean build and deploy without any cache
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Force Deploy - Clear All Cache...\n');

async function forceDeploy() {
  try {
    // 1. Clear all cache
    console.log('🗑️  Clearing all cache...');
    
    // Clear npm cache
    try {
      execSync('npm cache clean --force', { stdio: 'inherit' });
      console.log('✅ NPM cache cleared');
    } catch (error) {
      console.log('⚠️  NPM cache clear failed (this is OK)');
    }
    
    // Clear client build folder
    const buildPath = path.join(__dirname, '../client/build');
    if (fs.existsSync(buildPath)) {
      fs.rmSync(buildPath, { recursive: true, force: true });
      console.log('✅ Build folder cleared');
    }
    
    // Clear client node_modules
    const nodeModulesPath = path.join(__dirname, '../client/node_modules/.cache');
    if (fs.existsSync(nodeModulesPath)) {
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
      console.log('✅ Client cache cleared');
    }
    
    // 2. Update production environment to force no cache
    console.log('🔧 Updating production environment...');
    const productionEnv = `# Production Environment Variables - No Cache
REACT_APP_API_URL=https://us-central1-factcheck-1d6e8.cloudfunctions.net/api
REACT_APP_ENVIRONMENT=production
REACT_APP_USE_EMULATOR=false
REACT_APP_USE_MOCK_CHAT=false
REACT_APP_FORCE_API=true
REACT_APP_VERSION=${Date.now()}
GENERATE_SOURCEMAP=false
`;
    
    const clientEnvPath = path.join(__dirname, '../client/.env.production');
    fs.writeFileSync(clientEnvPath, productionEnv);
    console.log('✅ Updated production environment');
    
    // 3. Update ChatBot to force API usage
    console.log('🔄 Updating ChatBot to force API usage...');
    const chatBotPath = path.join(__dirname, '../client/src/components/ChatBot/ChatBot.js');
    let chatBotContent = fs.readFileSync(chatBotPath, 'utf8');
    
    // Replace the sendMessage function to always try API first
    const newSendMessageFunction = `    try {
      // Force API usage - no fallback to mock
      console.log('🚀 Forcing API call to:', process.env.REACT_APP_API_URL);
      const response = await chatAPI.sendMessage({
        message: text.trim()
      });
      
      console.log('✅ API Response:', response.data);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.data.response.content,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('❌ API Error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Show error message instead of fallback
      const errorMessage = {
        id: Date.now() + 1,
        text: \`❌ **Lỗi kết nối API**

Không thể kết nối đến server. Chi tiết lỗi:
\${error.response?.data?.error || error.message}

Vui lòng thử lại sau hoặc liên hệ admin.\`,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }`;
    
    // Replace the try-catch block in sendMessage
    chatBotContent = chatBotContent.replace(
      /try \{[\s\S]*?\} catch \(error\) \{[\s\S]*?\}/,
      newSendMessageFunction
    );
    
    fs.writeFileSync(chatBotPath, chatBotContent);
    console.log('✅ Updated ChatBot to force API usage');
    
    // 4. Clean build
    console.log('🏗️  Clean build...');
    execSync('cd client && npm run build', { stdio: 'inherit' });
    console.log('✅ Clean build completed');
    
    // 5. Deploy with cache busting
    console.log('🚀 Deploying with cache busting...');
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });
    console.log('✅ Deploy completed');
    
    // 6. Success message
    console.log('\n🎉 Force Deploy Completed!');
    console.log('\n🌐 Your app is now live at:');
    console.log('   https://factcheck-1d6e8.web.app/chat');
    console.log('\n🧹 Cache Clearing Instructions:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Right-click refresh button');
    console.log('3. Select "Empty Cache and Hard Reload"');
    console.log('4. Or use Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)');
    console.log('\n🔍 Debug Info:');
    console.log('- API URL: https://us-central1-factcheck-1d6e8.cloudfunctions.net/api');
    console.log('- Version:', Date.now());
    console.log('- Force API: true');
    
  } catch (error) {
    console.error('❌ Force deploy failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  forceDeploy()
    .then(() => {
      console.log('\n✨ Force deploy completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Force deploy failed:', error);
      process.exit(1);
    });
}

module.exports = { forceDeploy };
