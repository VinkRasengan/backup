import enhancedMockChat from './enhancedMockChat';
// Chatbot service để xử lý logic trả lời
class ChatbotService {
  constructor() {
    this.responses = {
      // Chào hỏi
      greetings: [
        'Xin chào! Tôi có thể giúp gì cho bạn?',
        'Chào bạn! Bạn cần hỗ trợ gì về FactCheck?',
        'Xin chào! Tôi sẵn sàng hỗ trợ bạn.'
      ],
      
      // Hướng dẫn sử dụng
      howToUse: [
        'Để sử dụng FactCheck, bạn có thể:\n\n1. Truy cập trang "Kiểm tra" từ menu\n2. Dán link bài viết cần kiểm tra\n3. Nhấn "Kiểm tra ngay"\n4. Xem kết quả phân tích độ tin cậy\n\nBạn cần đăng ký tài khoản để sử dụng đầy đủ tính năng.',
        'Cách sử dụng FactCheck rất đơn giản:\n\n• Đăng ký/Đăng nhập tài khoản\n• Vào mục "Kiểm tra"\n• Nhập URL bài viết\n• Nhận kết quả phân tích ngay lập tức\n\nHệ thống sẽ đánh giá độ tin cậy và cung cấp thông tin chi tiết.'
      ],
      
      // Về FactCheck
      aboutFactCheck: [
        'FactCheck là nền tảng kiểm tra thông tin và chống tin giả hàng đầu. Chúng tôi sử dụng AI và các nguồn đáng tin cậy để phân tích độ tin cậy của tin tức và bài viết.',
        'FactCheck giúp bạn xác minh độ tin cậy của thông tin trực tuyến. Nền tảng của chúng tôi phân tích nội dung, nguồn tin và đưa ra điểm số độ tin cậy chi tiết.',
        'Chúng tôi là nền tảng chống thông tin sai lệch, giúp người dùng nhận biết tin giả và thông tin không chính xác thông qua hệ thống AI tiên tiến.'
      ],
      
      // Tính năng
      features: [
        'Các tính năng chính của FactCheck:\n\n✓ Kiểm tra độ tin cậy link/bài viết\n✓ Phân tích nguồn tin\n✓ Chấm điểm độ tin cậy\n✓ Dashboard cá nhân\n✓ Lịch sử kiểm tra\n✓ Thống kê chi tiết',
        'FactCheck cung cấp:\n\n• Kiểm tra link nhanh chóng\n• Phân tích AI chính xác\n• Báo cáo chi tiết\n• Theo dõi lịch sử\n• Cảnh báo tin giả\n• Cộng đồng kiểm chứng'
      ],
      
      // Đăng ký/Đăng nhập
      account: [
        'Để tạo tài khoản:\n\n1. Nhấn "Đăng ký" trên trang chủ\n2. Điền thông tin cá nhân\n3. Xác thực email\n4. Hoàn tất đăng ký\n\nSau khi đăng ký, bạn có thể sử dụng đầy đủ tính năng của FactCheck.',
        'Bạn cần tài khoản để:\n\n• Kiểm tra link không giới hạn\n• Lưu lịch sử kiểm tra\n• Xem thống kê cá nhân\n• Nhận thông báo\n\nViệc đăng ký hoàn toàn miễn phí!'
      ],
      
      // Hỗ trợ
      support: [
        'Nếu bạn gặp vấn đề, hãy:\n\n• Kiểm tra FAQ trên website\n• Liên hệ qua email hỗ trợ\n• Báo cáo lỗi qua form liên hệ\n• Tham gia cộng đồng người dùng\n\nChúng tôi luôn sẵn sàng hỗ trợ bạn!',
        'Để được hỗ trợ tốt nhất:\n\n1. Mô tả chi tiết vấn đề\n2. Cung cấp ảnh chụp màn hình\n3. Cho biết trình duyệt đang dùng\n4. Liên hệ qua kênh chính thức\n\nĐội ngũ hỗ trợ sẽ phản hồi trong 24h.'
      ],
      
      // Mặc định
      default: [
        'Tôi hiểu bạn đang hỏi về FactCheck. Bạn có thể hỏi tôi về:\n\n• Cách sử dụng nền tảng\n• Tính năng của FactCheck\n• Cách đăng ký tài khoản\n• Hỗ trợ kỹ thuật\n\nHãy hỏi cụ thể hơn để tôi có thể hỗ trợ bạn tốt hơn!',
        'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Tôi có thể giúp bạn về:\n\n✓ Hướng dẫn sử dụng\n✓ Thông tin về FactCheck\n✓ Tạo tài khoản\n✓ Giải đáp thắc mắc\n\nBạn có thể hỏi lại với từ khóa rõ ràng hơn không?',
        'Tôi là trợ lý ảo của FactCheck, chuyên hỗ trợ về:\n\n• Kiểm tra thông tin\n• Sử dụng nền tảng\n• Tính năng sản phẩm\n• Hỗ trợ người dùng\n\nBạn muốn biết điều gì cụ thể?'
      ],

      // Cảm ơn
      thanks: [
        'Rất vui được giúp đỡ bạn! Nếu có thêm câu hỏi nào khác, đừng ngần ngại hỏi tôi nhé! 😊',
        'Không có gì! Tôi luôn sẵn sàng hỗ trợ bạn sử dụng FactCheck hiệu quả nhất. 🙂',
        'Cảm ơn bạn đã sử dụng FactCheck! Chúc bạn có trải nghiệm tuyệt vời với nền tảng của chúng tôi! ✨'
      ]
    };

    this.keywords = {
      greetings: ['xin chào', 'chào', 'hello', 'hi', 'hey'],
      howToUse: ['cách sử dụng', 'hướng dẫn', 'làm thế nào', 'sử dụng như thế nào', 'dùng sao'],
      aboutFactCheck: ['factcheck là gì', 'về factcheck', 'giới thiệu', 'factcheck'],
      features: ['tính năng', 'chức năng', 'có gì', 'làm được gì'],
      account: ['đăng ký', 'tạo tài khoản', 'đăng nhập', 'account', 'tài khoản'],
      support: ['hỗ trợ', 'giúp đỡ', 'liên hệ', 'báo lỗi', 'support'],
      thanks: ['cảm ơn', 'thanks', 'thank you', 'cám ơn', 'tks']
    };
  }

  // Phân tích intent từ tin nhắn người dùng
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(this.keywords)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          return intent;
        }
      }
    }
    
    return 'default';
  }

  // Lấy phản hồi ngẫu nhiên từ danh sách
  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Xử lý và trả về phản hồi
  async getResponse(message) {
    // Always use enhanced mock responses for now (since we can't use OpenAI on free plan)
    // This provides better security-focused responses than basic chatbot
    return enhancedMockChat.getResponse(message);
  }
}

// Export singleton instance
export const chatbotService = new ChatbotService();
