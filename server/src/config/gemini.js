const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cấu hình Gemini API
const geminiConfig = {
  // API key từ biến môi trường
  apiKey: process.env.GEMINI_API_KEY,
  
  // Model mặc định
  model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  
  // Cấu hình mặc định cho chat
  chatConfig: {
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7,
    topK: parseInt(process.env.GEMINI_TOP_K) || 40,
    topP: parseFloat(process.env.GEMINI_TOP_P) || 0.95,
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 2048,
  },

  // Cấu hình cho phân tích URL
  urlAnalysisConfig: {
    temperature: 0.3, // Thấp hơn để có kết quả chính xác hơn
    topK: 20,
    topP: 0.8,
    maxOutputTokens: 1024,
  },

  // Cấu hình cho phân tích bài viết cộng đồng
  communityAnalysisConfig: {
    temperature: 0.5,
    topK: 30,
    topP: 0.9,
    maxOutputTokens: 1536,
  }
};

// Khởi tạo Gemini client
const initGemini = () => {
  if (!geminiConfig.apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
    console.log('✅ Gemini API initialized successfully');
    return genAI;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini API:', error);
    return null;
  }
};

// Export các cấu hình và client
module.exports = {
  geminiConfig,
  initGemini,
  getGeminiClient: () => {
    const client = initGemini();
    if (!client) {
      throw new Error('Gemini API not initialized. Please check your API key.');
    }
    return client;
  }
}; 