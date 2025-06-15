// Cấu hình Gemini API cho client
const geminiConfig = {
  // Endpoints
  endpoints: {
    chat: '/api/chat/gemini',
    test: '/api/chat/test-gemini',
    analyze: '/api/analyze/gemini'
  },

  // Cấu hình mặc định cho chat UI
  ui: {
    maxMessageLength: 2000,
    typingSpeed: 30, // ms per character
    retryAttempts: 3,
    retryDelay: 1000, // ms
  },

  // Các thông báo lỗi
  errorMessages: {
    apiKeyMissing: 'Gemini API key chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
    rateLimit: 'Đã vượt quá giới hạn yêu cầu. Vui lòng thử lại sau.',
    invalidResponse: 'Không thể xử lý phản hồi từ Gemini. Vui lòng thử lại.',
    networkError: 'Lỗi kết nối. Vui lòng kiểm tra kết nối mạng của bạn.',
  },

  // Các prompt mặc định
  defaultPrompts: {
    greeting: 'Xin chào! Tôi có thể giúp gì cho bạn về bảo mật và an toàn thông tin?',
    error: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
    thinking: 'Đang xử lý yêu cầu của bạn...',
    retry: 'Đang thử lại...',
  }
};

export default geminiConfig; 