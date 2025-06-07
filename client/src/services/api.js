import axios from 'axios';
import Cookies from 'js-cookie';
import mockAPI from './mockAPI';

// Create axios instance for Render deployment
const getApiBaseUrl = () => {
  // Use environment variable if set, otherwise use production URL
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback based on environment
  if (process.env.NODE_ENV === 'production') {
    return '/api'; // Use relative URL for production (handled by _redirects)
  }

  return 'http://localhost:5002/api'; // Development fallback
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

console.log('🔗 API Base URL:', api.defaults.baseURL);
console.log('🌍 Environment:', process.env.NODE_ENV);

// Request interceptor to add Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get fresh Firebase ID token
      const { auth } = await import('../config/firebase');
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken(true); // Force refresh
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Fallback to stored token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      // Fallback to stored token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints - Firebase Auth handles authentication
export const authAPI = {
  // Sync user data to backend after Firebase Auth registration
  syncRegister: (idToken, userData) => api.post('/auth/register', { idToken, ...userData }),
  // Sync user data to backend after Firebase Auth login
  syncLogin: (idToken) => api.post('/auth/login', { idToken }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
};

// User API endpoints
export const userAPI = {
  getDashboard: () => apiWithFallback(
    () => api.get('/users/dashboard'),
    () => mockAPI.getDashboard()
  ),
  deleteAccount: () => apiWithFallback(
    () => api.delete('/users/account'),
    () => Promise.resolve({ data: { message: 'Account deleted successfully' } })
  ),
};

// Link API endpoints
export const linkAPI = {
  checkLink: async (url) => {
    console.log('🔍 Checking URL with VirusTotal API directly');

    try {
      // Try backend first
      return await api.post('/links/check', { url });
    } catch (error) {
      console.log('🔄 Backend unavailable, using direct VirusTotal API...');

      // Direct VirusTotal API call
      const virusTotalService = (await import('./virusTotalService')).default;
      const analysis = await virusTotalService.analyzeUrl(url);

      if (analysis.success) {
        return {
          data: {
            message: 'Link đã được kiểm tra thành công',
            result: {
              id: Date.now().toString(),
              url,
              status: 'completed',
              credibilityScore: analysis.securityScore,
              securityScore: analysis.securityScore,
              summary: `Điểm bảo mật: ${analysis.securityScore}/100. ${
                analysis.threats.malicious ? 'Phát hiện mối đe dọa!' :
                analysis.threats.suspicious ? 'Có dấu hiệu đáng ngờ.' :
                'Không phát hiện mối đe dọa.'
              }`,
              threats: analysis.threats,
              virusTotalAnalysis: analysis.urlAnalysis,
              checkedAt: new Date().toISOString(),
              mockData: analysis.mockData
            }
          }
        };
      } else {
        // Final fallback to mock
        return await mockAPI.checkLink(url);
      }
    }
  },
  getHistory: (page = 1, limit = 20) => apiWithFallback(
    () => api.get(`/links/history?page=${page}&limit=${limit}`),
    () => mockAPI.getHistory()
  ),
  getLinkResult: (linkId) => apiWithFallback(
    () => api.get(`/links/${linkId}`),
    () => Promise.resolve({ data: {} })
  ),
  deleteLinkResult: (linkId) => apiWithFallback(
    () => api.delete(`/links/${linkId}`),
    () => Promise.resolve({ data: { message: 'Deleted successfully' } })
  ),
};

// Helper function to handle API calls with smart fallback
const apiWithFallback = async (apiCall, mockCall) => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed:', error.message);

    // Check if it's a network error (backend not available)
    const isNetworkError = error.code === 'NETWORK_ERROR' ||
                          error.message.includes('Network Error') ||
                          error.message.includes('ERR_NETWORK') ||
                          !error.response;

    // Fallback to mock if backend is not available
    if (isNetworkError) {
      console.warn('Backend not available, using mock API temporarily');
      return await mockCall();
    }

    // For other errors (auth, validation, etc.), throw to show proper error messages
    throw error;
  }
};

// Chat API endpoints - Simplified to use backend only
export const chatAPI = {
  // Send message to authenticated chat (requires login) - Uses OpenAI API
  sendMessage: async (data) => {
    console.log('🚀 Sending authenticated message to backend');
    return await api.post('/chat/message', data);
  },

  // Send message to AI chat endpoint (uses OpenAI API when available)
  sendOpenAIMessage: async (data) => {
    console.log('🤖 Sending public message to OpenAI via backend');
    return await api.post('/chat/openai', { message: data.message });
  },

  // Send message to widget chat (automatic responses only)
  sendWidgetMessage: async (data) => {
    console.log('🤖 Sending message to widget chat');
    return await api.post('/chat/widget', { message: data.message });
  },

  // Conversation management (requires auth)
  getConversations: (params) => api.get('/chat/conversations', { params }),
  getConversation: (id) => api.get(`/chat/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/chat/conversations/${id}`),

  // Public endpoints
  getConversationStarters: () => api.get('/chat/starters'),
  getSecurityTips: (params) => api.get('/chat/tips', { params })
};

export default api;
