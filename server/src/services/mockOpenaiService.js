// Mock OpenAI Service for testing when quota is exceeded
class MockOpenAIService {
  constructor() {
    this.model = 'mock-gpt-3.5-turbo';
    this.systemPrompt = `Bạn là một chuyên gia bảo mật mạng và phân tích mối đe dọa trực tuyến.`;
  }

  isConfigured() {
    return true; // Always return true for mock
  }

  async sendMessage(userMessage, conversationHistory = []) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock responses based on keywords
    let mockResponse = this.generateMockResponse(userMessage);

    return {
      success: true,
      message: mockResponse,
      usage: {
        prompt_tokens: 50,
        completion_tokens: 100,
        total_tokens: 150
      },
      model: this.model
    };
  }

  generateMockResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('phishing') || lowerMessage.includes('lừa đảo')) {
      const phishingResponses = [
        `🎣 **Cách nhận biết email phishing:**

1. **Kiểm tra địa chỉ gửi**: Email phishing thường sử dụng địa chỉ giả mạo hoặc tên miền tương tự các tổ chức uy tín.
2. **Nội dung khẩn cấp**: Thường tạo cảm giác cấp bách như "tài khoản sẽ bị khóa", "cần xác minh ngay".
3. **Liên kết đáng ngờ**: Hover chuột lên link để xem URL thực. Phishing thường dùng URL rút gọn hoặc tên miền giả.
4. **Yêu cầu thông tin cá nhân**: Ngân hàng, tổ chức uy tín không bao giờ yêu cầu mật khẩu qua email.
5. **Lỗi chính tả**: Email phishing thường có nhiều lỗi ngữ pháp, chính tả.

**Lời khuyên**: Luôn truy cập trực tiếp website chính thức thay vì click link trong email đáng ngờ.`,

        `🚨 **Dấu hiệu email lừa đảo phổ biến:**

• **Lỗi chính tả**: Nhiều lỗi ngữ pháp, chính tả trong nội dung
• **Địa chỉ giả mạo**: vd: "arnazon.com" thay vì "amazon.com"
• **Áp lực thời gian**: "Chỉ còn 2 giờ để xác nhận"
• **Quà tặng bất ngờ**: "Bạn đã trúng 1 tỷ đồng"
• **Yêu cầu cập nhật**: "Cập nhật thông tin tài khoản ngay"

**Cách xử lý**: Không click link, liên hệ trực tiếp với tổ chức qua kênh chính thức.`,

        `🔍 **Phân tích email phishing chi tiết:**

**Các thủ đoạn thường gặp:**
- Giả mạo logo, giao diện của ngân hàng/công ty uy tín
- Sử dụng tên miền tương tự: "vietcombank.com.vn" thay vì "vietcombank.com.vn"
- Tạo cảm giác khẩn cấp để người dùng không suy nghĩ kỹ
- Đính kèm file độc hại hoặc link dẫn đến trang web giả mạo

**Cách bảo vệ**: Luôn kiểm tra kỹ trước khi hành động, liên hệ trực tiếp qua hotline chính thức.`
      ];
      return phishingResponses[Math.floor(Math.random() * phishingResponses.length)];
    }

    if (lowerMessage.includes('mật khẩu') || lowerMessage.includes('password')) {
      const passwordResponses = [
        `🔐 **Cách tạo mật khẩu mạnh:**

1. **Độ dài**: Tối thiểu 12 ký tự, càng dài càng tốt.
2. **Kết hợp đa dạng**: Chữ hoa, chữ thường, số, ký tự đặc biệt
3. **Tránh thông tin cá nhân**: Không dùng tên, ngày sinh, số điện thoại
4. **Unique cho mỗi tài khoản**: Mỗi website/app một mật khẩu riêng
5. **Sử dụng Password Manager**: LastPass, 1Password, Bitwarden để quản lý

**Ví dụ**: MyC@t15Fluffy&Cute2024!
**Lời khuyên**: Bật 2FA cho tất cả tài khoản quan trọng.`,

        `🛡️ **Bí quyết mật khẩu an toàn:**

**Phương pháp Passphrase**: Kết hợp 4-5 từ ngẫu nhiên
- Ví dụ: "Coffee#Mountain$Blue!2024"
- Dễ nhớ nhưng khó đoán

**Quy tắc 3-2-1**:
- 3 loại ký tự khác nhau (chữ, số, ký hiệu)
- 2 chữ hoa ít nhất
- 1 ký tự đặc biệt

**Tránh**: Mật khẩu phổ biến như "123456", "password", "qwerty"`,

        `🔑 **Quản lý mật khẩu hiệu quả:**

**Password Manager tốt nhất 2024:**
• **Bitwarden**: Miễn phí, open-source
• **1Password**: Giao diện đẹp, tính năng gia đình
• **LastPass**: Phổ biến, đồng bộ đa thiết bị
• **Dashlane**: VPN tích hợp, dark web monitoring

**Lợi ích**: Tự động tạo mật khẩu mạnh, tự động điền, cảnh báo rò rỉ dữ liệu.`
      ];
      return passwordResponses[Math.floor(Math.random() * passwordResponses.length)];
    }

    if (lowerMessage.includes('malware') || lowerMessage.includes('virus')) {
      return `🦠 **Cách bảo vệ khỏi malware:**

1. **Antivirus**: Cài đặt phần mềm diệt virus uy tín (Windows Defender, Kaspersky, Bitdefender).

2. **Cập nhật hệ điều hành**: Luôn cài đặt bản vá bảo mật mới nhất.

3. **Tránh nguồn không tin cậy**:
   - Không tải phần mềm từ website lạ
   - Không mở file đính kèm đáng ngờ
   - Tránh USB/ổ cứng không rõ nguồn gốc

4. **Backup dữ liệu**: Sao lưu định kỳ để phòng ransomware.

5. **Firewall**: Bật tường lửa của hệ điều hành.

**Dấu hiệu nhiễm malware**: Máy chạy chậm, popup quảng cáo, file bị mã hóa, hoạt động mạng bất thường.

**Khuyên**: Scan định kỳ và giữ phần mềm luôn cập nhật.`;
    }

    if (lowerMessage.includes('wifi') || lowerMessage.includes('mạng')) {
      return `📶 **Bảo mật mạng WiFi:**

1. **Mã hóa WPA3**: Sử dụng chuẩn bảo mật mới nhất cho router.

2. **Mật khẩu WiFi mạnh**: Tối thiểu 15 ký tự, kết hợp chữ số ký tự.

3. **Đổi mật khẩu admin router**: Không dùng mật khẩu mặc định.

4. **Tắt WPS**: Tính năng này dễ bị tấn công.

5. **Ẩn tên mạng (SSID)**: Không broadcast tên WiFi.

6. **Cập nhật firmware router**: Thường xuyên cập nhật phần mềm router.

**Khi dùng WiFi công cộng**: Sử dụng VPN, tránh truy cập tài khoản ngân hàng, không tự động kết nối.

**Lời khuyên**: Thiết lập mạng Guest riêng cho khách và thiết bị IoT.`;
    }

    if (lowerMessage.includes('social') || lowerMessage.includes('mạng xã hội')) {
      return `📱 **Bảo mật mạng xã hội:**

1. **Cài đặt riêng tư**: Chỉ bạn bè mới xem được thông tin cá nhân.

2. **Kiểm soát thông tin chia sẻ**:
   - Không đăng địa chỉ nhà, số điện thoại
   - Tránh check-in vị trí thời gian thực
   - Cẩn thận với ảnh có thông tin nhạy cảm

3. **Xác thực 2 bước**: Bật 2FA cho tất cả tài khoản.

4. **Cẩn thận với lời mời kết bạn**: Chỉ kết bạn với người quen biết.

5. **Kiểm tra app permissions**: Xem lại quyền truy cập của các ứng dụng.

**Cảnh báo**: Tránh quiz, game yêu cầu quyền truy cập thông tin cá nhân.

**Lời khuyên**: Thường xuyên review và xóa bài đăng cũ có thông tin nhạy cảm.`;
    }

    // Default responses với tính năng đa dạng
    const defaultResponses = [
      `🛡️ **Chào bạn!**

Tôi là trợ lý AI chuyên về bảo mật mạng. Tôi có thể giúp bạn về:

• **Phishing & Lừa đảo**: Cách nhận biết và phòng tránh
• **Mật khẩu**: Tạo và quản lý mật khẩu an toàn
• **Malware**: Bảo vệ khỏi virus và phần mềm độc hại
• **Bảo mật WiFi**: Thiết lập mạng an toàn
• **Mạng xã hội**: Bảo vệ thông tin cá nhân
• **Phân tích URL**: Đánh giá tính an toàn của website

Bạn có câu hỏi cụ thể nào về bảo mật không? Tôi sẽ cung cấp lời khuyên chi tiết và thực tế.`,

      `🔐 **Xin chào! Tôi là chuyên gia bảo mật của bạn.**

Hôm nay bạn muốn tìm hiểu về vấn đề bảo mật nào?

🎯 **Chủ đề hot nhất:**
• Cách nhận biết tin nhắn lừa đảo qua Zalo/Telegram
• Bảo vệ tài khoản ngân hàng online
• Kiểm tra website có an toàn không
• Tạo mật khẩu không thể hack được

Hãy chia sẻ thắc mắc của bạn, tôi sẽ đưa ra lời khuyên cụ thể!`,

      `⚡ **FactCheck Security Assistant sẵn sàng hỗ trợ!**

Trong thời đại số, bảo mật là ưu tiên hàng đầu. Tôi có thể giúp bạn:

🔍 **Phân tích & Đánh giá**: URL, email, file đáng ngờ
🛡️ **Bảo vệ**: Tài khoản, thiết bị, dữ liệu cá nhân
📚 **Hướng dẫn**: Từ cơ bản đến nâng cao
🚨 **Cảnh báo**: Các mối đe dọa mới nhất

Bạn đang gặp vấn đề bảo mật nào cần giải quyết?`
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  async analyzeUrlSecurity(url, virusTotalData = null) {
    await new Promise(resolve => setTimeout(resolve, 800));

    let analysis = `🔍 **Phân tích bảo mật URL**: ${url}

**Đánh giá cấu trúc URL:**
- Protocol: ${url.startsWith('https') ? '✅ HTTPS (An toàn)' : '⚠️ HTTP (Không mã hóa)'}
- Domain: ${new URL(url).hostname}
- Cấu trúc: ${url.includes('suspicious') ? '⚠️ Có dấu hiệu đáng ngờ' : '✅ Bình thường'}

**Khuyến nghị:**
1. Luôn kiểm tra chính tả domain
2. Tránh click link rút gọn không rõ nguồn gốc
3. Sử dụng bookmark cho các trang quan trọng`;

    if (virusTotalData?.success) {
      analysis += `

**Thông tin từ VirusTotal:**
- Điểm bảo mật: ${virusTotalData.securityScore}/100
- Trạng thái: ${virusTotalData.threats.malicious ? '🚨 Phát hiện mối đe dọa' : '✅ Không phát hiện mối đe dọa'}`;
    }

    return {
      success: true,
      message: analysis
    };
  }

  async getSecurityTips(category = 'general') {
    await new Promise(resolve => setTimeout(resolve, 500));

    const tips = {
      general: `🛡️ **5 Lời khuyên bảo mật quan trọng:**

1. **Cập nhật thường xuyên**: Hệ điều hành, trình duyệt, ứng dụng
2. **Mật khẩu mạnh + 2FA**: Unique cho mỗi tài khoản
3. **Backup dữ liệu**: Sao lưu định kỳ, test khôi phục
4. **Cẩn thận với email**: Không click link/attachment đáng ngờ  
5. **Antivirus**: Cài đặt và cập nhật phần mềm bảo vệ`,

      phishing: `🎣 **Nhận biết Phishing:**

• Email khẩn cấp yêu cầu thông tin cá nhân
• URL giả mạo (vd: arnazon.com thay vì amazon.com)
• Lỗi chính tả, ngữ pháp nhiều
• Yêu cầu tải file đính kèm lạ
• Đe dọa khóa tài khoản nếu không hành động`,

      malware: `🦠 **Phòng chống Malware:**

• Chỉ tải phần mềm từ nguồn chính thức
• Scan file trước khi mở
• Tránh crack, keygen
• Backup dữ liệu định kỳ
• Cập nhật hệ điều hành và antivirus`
    };

    return {
      success: true,
      message: tips[category] || tips.general
    };
  }

  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Tin nhắn không hợp lệ' };
    }

    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length === 0) {
      return { valid: false, error: 'Tin nhắn không được để trống' };
    }

    if (trimmedMessage.length > 1000) {
      return { valid: false, error: 'Tin nhắn quá dài (tối đa 1000 ký tự)' };
    }

    return { valid: true, message: trimmedMessage };
  }

  getConversationStarters() {
    return [
      "Làm thế nào để nhận biết email lừa đảo?",
      "Cách tạo mật khẩu mạnh và an toàn?",
      "Phần mềm diệt virus nào tốt nhất?",
      "Cách bảo vệ thông tin cá nhân trên mạng?",
      "Dấu hiệu nhận biết website giả mạo?",
      "Cách bảo mật tài khoản mạng xã hội?",
      "Phải làm gì khi bị hack tài khoản?",
      "Cách kiểm tra link có an toàn không?"
    ];
  }
}

module.exports = new MockOpenAIService();
