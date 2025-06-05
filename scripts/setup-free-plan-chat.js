#!/usr/bin/env node

/**
 * Free Plan Chat Setup
 * This script sets up chat system for Firebase free plan using mock responses
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🆓 Setting up Chat for Firebase Free Plan...\n');

// Create a simplified chat system that works on free plan
async function setupFreePlanChat() {
  try {
    // 1. Create production environment for client
    console.log('🌐 Creating production environment...');
    const productionEnv = `# Production Environment Variables for Free Plan
REACT_APP_API_URL=https://us-central1-factcheck-1d6e8.cloudfunctions.net/api
REACT_APP_ENVIRONMENT=production
REACT_APP_USE_EMULATOR=false
REACT_APP_USE_MOCK_CHAT=true
GENERATE_SOURCEMAP=false
`;
    
    const clientEnvPath = path.join(__dirname, '../client/.env.production');
    fs.writeFileSync(clientEnvPath, productionEnv);
    console.log('✅ Created client/.env.production with mock chat enabled');
    
    // 2. Update functions to use fallback responses only
    console.log('🔧 Updating functions for free plan...');
    const functionsOpenAIPath = path.join(__dirname, '../functions/services/openaiService.js');
    
    let content = fs.readFileSync(functionsOpenAIPath, 'utf8');
    
    // Modify isConfigured to always return false for free plan
    content = content.replace(
      'isConfigured() {',
      `isConfigured() {
    // Force fallback mode for Firebase free plan
    if (process.env.FIREBASE_FREE_PLAN === 'true') {
      return false;
    }`
    );
    
    fs.writeFileSync(functionsOpenAIPath, content);
    console.log('✅ Updated OpenAI service for free plan');
    
    // 3. Create enhanced mock responses
    console.log('💬 Creating enhanced mock chat responses...');
    const enhancedMockPath = path.join(__dirname, '../client/src/services/enhancedMockChat.js');
    
    const enhancedMockContent = `// Enhanced Mock Chat for Production
export const enhancedMockChat = {
  getResponse: (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Security-related responses
    if (lowerMessage.includes('phishing') || lowerMessage.includes('lừa đảo')) {
      return \`🎣 **Cách nhận biết email phishing:**

1. **Kiểm tra địa chỉ gửi**: Email phishing thường sử dụng địa chỉ giả mạo
2. **Nội dung khẩn cấp**: Tạo cảm giác cấp bách như "tài khoản sẽ bị khóa"
3. **Liên kết đáng ngờ**: Hover chuột lên link để xem URL thực
4. **Yêu cầu thông tin**: Ngân hàng không bao giờ yêu cầu mật khẩu qua email
5. **Lỗi chính tả**: Email phishing thường có nhiều lỗi ngữ pháp

**Lời khuyên**: Luôn truy cập trực tiếp website chính thức thay vì click link trong email.\`;
    }
    
    if (lowerMessage.includes('mật khẩu') || lowerMessage.includes('password')) {
      return \`🔐 **Cách tạo mật khẩu mạnh:**

1. **Độ dài**: Tối thiểu 12 ký tự, càng dài càng tốt
2. **Kết hợp đa dạng**: Chữ hoa, chữ thường, số, ký tự đặc biệt
3. **Tránh thông tin cá nhân**: Không dùng tên, ngày sinh
4. **Unique cho mỗi tài khoản**: Mỗi website một mật khẩu riêng
5. **Password Manager**: LastPass, 1Password, Bitwarden

**Ví dụ**: MyC@t15Fluffy&Cute2024!

**Lời khuyên**: Bật 2FA cho tất cả tài khoản quan trọng.\`;
    }
    
    if (lowerMessage.includes('virus') || lowerMessage.includes('malware')) {
      return \`🦠 **Bảo vệ khỏi Malware:**

1. **Antivirus**: Sử dụng Windows Defender hoặc Kaspersky, Bitdefender
2. **Cập nhật**: Luôn cập nhật hệ điều hành và phần mềm
3. **Tải từ nguồn tin cậy**: Chỉ tải phần mềm từ website chính thức
4. **Email đáng ngờ**: Không mở file đính kèm từ người lạ
5. **USB**: Quét virus trước khi mở file từ USB

**Dấu hiệu nhiễm virus**: Máy chậm, popup quảng cáo, file bị mã hóa

**Khuyến nghị**: Backup dữ liệu thường xuyên.\`;
    }
    
    if (lowerMessage.includes('wifi') || lowerMessage.includes('mạng')) {
      return \`📶 **Bảo mật WiFi:**

1. **Mã hóa WPA3**: Sử dụng WPA3 hoặc WPA2 cho router
2. **Mật khẩu mạnh**: Đặt mật khẩu WiFi phức tạp
3. **Tên mạng**: Không để tên mạng tiết lộ thông tin cá nhân
4. **WiFi công cộng**: Tránh truy cập tài khoản quan trọng
5. **VPN**: Sử dụng VPN khi kết nối WiFi công cộng

**Lưu ý**: Tắt tính năng tự động kết nối WiFi trên điện thoại.\`;
    }
    
    if (lowerMessage.includes('mạng xã hội') || lowerMessage.includes('facebook') || lowerMessage.includes('social')) {
      return \`📱 **Bảo mật Mạng xã hội:**

1. **Cài đặt riêng tư**: Chỉ bạn bè mới xem được thông tin
2. **Thông tin cá nhân**: Không chia sẻ số điện thoại, địa chỉ
3. **Bạn bè**: Chỉ kết bạn với người quen
4. **Link đáng ngờ**: Không click link lạ trong tin nhắn
5. **2FA**: Bật xác thực 2 bước

**Cảnh báo**: Lừa đảo qua tin nhắn giả mạo bạn bè rất phổ biến.\`;
    }
    
    if (lowerMessage.includes('website') || lowerMessage.includes('link') || lowerMessage.includes('url')) {
      return \`🔗 **Kiểm tra Website an toàn:**

1. **HTTPS**: Kiểm tra có khóa xanh và https://
2. **Tên miền**: Chú ý chính tả, ký tự lạ trong domain
3. **Thiết kế**: Website giả thường có thiết kế kém
4. **Thông tin liên hệ**: Website uy tín có thông tin rõ ràng
5. **Reviews**: Tìm đánh giá từ người dùng khác

**Tools**: Sử dụng VirusTotal, Google Safe Browsing để kiểm tra

**Lưu ý**: Khi nghi ngờ, đừng nhập thông tin cá nhân.\`;
    }
    
    // Default response
    return \`🛡️ **Chào bạn!** 

Tôi là trợ lý AI chuyên về bảo mật mạng. Tôi có thể giúp bạn về:

• **Phishing & Lừa đảo**: Cách nhận biết và phòng tránh
• **Mật khẩu**: Tạo và quản lý mật khẩu an toàn  
• **Malware**: Bảo vệ khỏi virus và phần mềm độc hại
• **Bảo mật WiFi**: Thiết lập mạng an toàn
• **Mạng xã hội**: Bảo vệ thông tin cá nhân
• **Phân tích URL**: Đánh giá tính an toàn của website

Bạn có câu hỏi cụ thể nào về bảo mật không?

*Lưu ý: Đây là phiên bản demo với câu trả lời được lập trình sẵn. Phiên bản đầy đủ sẽ sử dụng AI thực.*\`;
  }
};

export default enhancedMockChat;
`;
    
    fs.writeFileSync(enhancedMockPath, enhancedMockContent);
    console.log('✅ Created enhanced mock chat responses');
    
    // 4. Update client to use enhanced mock in production
    console.log('🔄 Updating client chat service...');
    const chatServicePath = path.join(__dirname, '../client/src/services/chatbotService.js');
    
    if (fs.existsSync(chatServicePath)) {
      let chatContent = fs.readFileSync(chatServicePath, 'utf8');
      
      // Add import for enhanced mock
      if (!chatContent.includes('enhancedMockChat')) {
        chatContent = `import enhancedMockChat from './enhancedMockChat';\n` + chatContent;
        
        // Update getResponse method to use enhanced mock in production
        chatContent = chatContent.replace(
          'async getResponse(message) {',
          `async getResponse(message) {
    // Use enhanced mock responses in production
    if (process.env.REACT_APP_ENVIRONMENT === 'production') {
      return enhancedMockChat.getResponse(message);
    }`
        );
        
        fs.writeFileSync(chatServicePath, chatContent);
        console.log('✅ Updated chatbot service for production');
      }
    }
    
    // 5. Set environment variable for functions
    console.log('🔧 Setting free plan environment...');
    try {
      execSync('firebase functions:config:set firebase.free_plan="true"', { stdio: 'inherit' });
      console.log('✅ Set free plan config');
    } catch (error) {
      console.log('⚠️  Could not set functions config (this is OK for free plan)');
    }
    
    // 6. Deploy functions (should work on free plan now)
    console.log('🚀 Deploying functions for free plan...');
    try {
      execSync('firebase deploy --only functions', { stdio: 'inherit' });
      console.log('✅ Functions deployed successfully');
    } catch (error) {
      console.log('⚠️  Functions deployment failed, but chat will still work with client-side mock');
    }
    
    // 7. Build and deploy client
    console.log('🏗️  Building and deploying client...');
    try {
      execSync('cd client && npm run build', { stdio: 'inherit' });
      execSync('firebase deploy --only hosting', { stdio: 'inherit' });
      console.log('✅ Client deployed successfully');
    } catch (error) {
      console.error('❌ Error deploying client:', error.message);
      return;
    }
    
    // 8. Success message
    console.log('\n🎉 Free Plan Chat Setup Complete!');
    console.log('\n🌐 Your app is now live at:');
    console.log('   https://factcheck-1d6e8.web.app/chat');
    console.log('\n💬 Chat Features:');
    console.log('   ✅ Security advice and tips');
    console.log('   ✅ Phishing detection guidance');
    console.log('   ✅ Password security tips');
    console.log('   ✅ Malware protection advice');
    console.log('   ✅ WiFi security guidance');
    console.log('\n🔄 To upgrade to real AI:');
    console.log('   1. Upgrade Firebase to Blaze plan');
    console.log('   2. Run: npm run production:fix-openai');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  setupFreePlanChat()
    .then(() => {
      console.log('\n✨ Free plan setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupFreePlanChat };
