// Mock API service for production when backend is not available
class MockAPIService {
  constructor() {
    this.conversations = JSON.parse(localStorage.getItem('mock_conversations') || '[]');
    this.messages = JSON.parse(localStorage.getItem('mock_messages') || '[]');
  }

  // Save data to localStorage
  saveData() {
    localStorage.setItem('mock_conversations', JSON.stringify(this.conversations));
    localStorage.setItem('mock_messages', JSON.stringify(this.messages));
  }

  // Simulate API delay
  delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Chat API
  async getConversationStarters() {
    await this.delay(200);

    // Show notification that we're using mock API
    if (typeof window !== 'undefined' && window.toast) {
      window.toast.info('Đang sử dụng chế độ offline tạm thời do backend chưa sẵn sàng', {
        duration: 3000,
        id: 'mock-api-notice'
      });
    }

    return {
      data: {
        starters: [
          "Làm thế nào để nhận biết email lừa đảo?",
          "Cách tạo mật khẩu mạnh và an toàn?",
          "Phần mềm diệt virus nào tốt nhất?",
          "Cách bảo vệ thông tin cá nhân trên mạng?",
          "Dấu hiệu nhận biết website giả mạo?",
          "Cách bảo mật tài khoản mạng xã hội?",
          "Phải làm gì khi bị hack tài khoản?",
          "Cách kiểm tra link có an toàn không?"
        ]
      }
    };
  }

  async getConversations(params = {}) {
    await this.delay(300);
    return {
      data: {
        conversations: this.conversations,
        pagination: {
          currentPage: 1,
          totalCount: this.conversations.length,
          hasNext: false,
          hasPrev: false
        }
      }
    };
  }

  async sendMessage(data) {
    await this.delay(800);
    
    const { message, conversationId } = data;
    const userId = 'mock-user-id';
    
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = this.conversations.find(c => c.id === conversationId);
    } else {
      // Create new conversation
      conversation = {
        id: 'conv-' + Date.now(),
        userId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0
      };
      this.conversations.unshift(conversation);
    }

    // Generate AI response
    const aiResponse = this.generateMockResponse(message);

    // Save user message
    const userMessage = {
      id: 'msg-' + Date.now() + '-user',
      conversationId: conversation.id,
      userId,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString()
    };
    this.messages.push(userMessage);

    // Save AI response
    const assistantMessage = {
      id: 'msg-' + Date.now() + '-ai',
      conversationId: conversation.id,
      userId,
      role: 'assistant',
      content: aiResponse,
      createdAt: new Date().toISOString()
    };
    this.messages.push(assistantMessage);

    // Update conversation
    conversation.updatedAt = new Date().toISOString();
    conversation.messageCount += 2;
    conversation.lastMessage = message;

    this.saveData();

    return {
      data: {
        message: 'Tin nhắn đã được gửi thành công',
        conversation: {
          id: conversation.id,
          title: conversation.title
        },
        response: {
          content: aiResponse,
          createdAt: assistantMessage.createdAt
        }
      }
    };
  }

  generateMockResponse(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('phishing') || lowerMessage.includes('lừa đảo')) {
      return `🎣 **Cách nhận biết email phishing:**

1. **Kiểm tra địa chỉ gửi**: Email phishing thường sử dụng địa chỉ giả mạo hoặc tên miền tương tự các tổ chức uy tín.

2. **Nội dung khẩn cấp**: Thường tạo cảm giác cấp bách như "tài khoản sẽ bị khóa", "cần xác minh ngay".

3. **Liên kết đáng ngờ**: Hover chuột lên link để xem URL thực. Phishing thường dùng URL rút gọn hoặc tên miền giả.

4. **Yêu cầu thông tin cá nhân**: Ngân hàng, tổ chức uy tín không bao giờ yêu cầu mật khẩu qua email.

**Lời khuyên**: Luôn truy cập trực tiếp website chính thức thay vì click link trong email đáng ngờ.`;
    }

    if (lowerMessage.includes('mật khẩu') || lowerMessage.includes('password')) {
      return `🔐 **Cách tạo mật khẩu mạnh:**

1. **Độ dài**: Tối thiểu 12 ký tự, càng dài càng tốt.
2. **Kết hợp đa dạng**: Chữ hoa, chữ thường, số và ký tự đặc biệt.
3. **Tránh thông tin cá nhân**: Không dùng tên, ngày sinh, số điện thoại.
4. **Unique cho mỗi tài khoản**: Mỗi website/app một mật khẩu riêng.
5. **Sử dụng Password Manager**: LastPass, 1Password, Bitwarden.

**Lời khuyên**: Bật 2FA (xác thực 2 bước) cho tất cả tài khoản quan trọng.`;
    }

    if (lowerMessage.includes('malware') || lowerMessage.includes('virus')) {
      return `🦠 **Cách bảo vệ khỏi malware:**

1. **Antivirus**: Cài đặt phần mềm diệt virus uy tín (Windows Defender, Kaspersky, Bitdefender).
2. **Cập nhật hệ điều hành**: Luôn cài đặt bản vá bảo mật mới nhất.
3. **Tránh nguồn không tin cậy**: Không tải phần mềm từ website lạ, không mở file đính kèm đáng ngờ.
4. **Backup dữ liệu**: Sao lưu định kỳ để phòng ransomware.

**Lời khuyên**: Scan định kỳ và giữ phần mềm luôn cập nhật.`;
    }

    // Default response
    return `🛡️ **Chào bạn!** 

Tôi là trợ lý AI chuyên về bảo mật mạng. Tôi có thể giúp bạn về:

• **Phishing & Lừa đảo**: Cách nhận biết và phòng tránh
• **Mật khẩu**: Tạo và quản lý mật khẩu an toàn  
• **Malware**: Bảo vệ khỏi virus và phần mềm độc hại
• **Bảo mật WiFi**: Thiết lập mạng an toàn
• **Mạng xã hội**: Bảo vệ thông tin cá nhân

Bạn có câu hỏi cụ thể nào về bảo mật không?

*Lưu ý: Đây là phiên bản demo offline. Dữ liệu được lưu trong trình duyệt.*`;
  }

  // Link API
  async checkLink(url) {
    await this.delay(1000);
    
    return {
      data: {
        id: 'link-' + Date.now(),
        url,
        status: 'completed',
        result: {
          finalScore: Math.floor(Math.random() * 100),
          riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          summary: 'Đây là kết quả demo. Trong thực tế sẽ có phân tích chi tiết về tính an toàn của website.',
          checkedAt: new Date().toISOString()
        }
      }
    };
  }

  async getHistory() {
    await this.delay(300);
    
    return {
      data: {
        links: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0
        }
      }
    };
  }

  // User API
  async getProfile() {
    await this.delay(200);
    
    return {
      data: {
        id: 'mock-user-id',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        isVerified: true
      }
    };
  }

  async getDashboard() {
    await this.delay(300);
    
    return {
      data: {
        stats: {
          linksChecked: this.conversations.length,
          chatMessages: this.messages.filter(m => m.role === 'user').length
        },
        recentLinks: []
      }
    };
  }
}

export default new MockAPIService();
