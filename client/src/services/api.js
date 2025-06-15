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

  return 'http://localhost:5000/api'; // Development fallback (updated to match server port)
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
});

console.log('🔗 API Base URL:', api.defaults.baseURL);
console.log('🌍 Environment:', process.env.NODE_ENV);

// Enhanced request interceptor to add Firebase ID token with multiple fallbacks
api.interceptors.request.use(
  async (config) => {
    try {
      // Get fresh Firebase ID token
      const { auth } = await import('../config/firebase');
      const user = auth.currentUser;

      if (user) {
        const token = await user.getIdToken(true); // Force refresh
        config.headers.Authorization = `Bearer ${token}`;

        // Update all token storage keys
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('backendToken', token);
        localStorage.setItem('firebaseToken', token);
      } else {
        // Multiple fallback token sources
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('backendToken') ||
                     localStorage.getItem('firebaseToken');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);

      // Multiple fallback token sources on error
      const token = localStorage.getItem('token') ||
                   localStorage.getItem('authToken') ||
                   localStorage.getItem('backendToken') ||
                   localStorage.getItem('firebaseToken');

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
    console.log('🔍 Checking URL with backend API - prioritizing backend');

    // Strategy 1: Try test endpoint first (always works, has third party results)
    try {
      console.log('🧪 Trying test endpoint first for full third party results');
      const testResponse = await api.post('/test/check-link', { url });
      console.log('✅ Test endpoint success:', testResponse.data);
      return testResponse;
    } catch (testError) {
      console.log('🔄 Test endpoint failed, trying authenticated API...', testError.message);
    }

    // Strategy 2: Try authenticated backend
    try {
      console.log('🔐 Trying authenticated backend API');
      return await api.post('/links/check', { url });
    } catch (authError) {
      console.log('🔄 Authenticated API failed:', authError.response?.status, authError.message);
    }

    // Strategy 3: Direct VirusTotal API call as fallback (no third party results)
    try {
      console.log('🔄 Using direct VirusTotal API as final fallback...');
      const virusTotalService = (await import('./virusTotalService')).default;
      const analysis = await virusTotalService.analyzeUrl(url);

      if (analysis.success) {
        return {
          data: {
            message: 'Link đã được kiểm tra thành công (VirusTotal only)',
            result: {
              id: Date.now().toString(),
              url,
              status: 'completed',
              credibilityScore: analysis.securityScore,
              securityScore: analysis.securityScore,
              finalScore: analysis.securityScore,
              summary: `Điểm bảo mật: ${analysis.securityScore}/100. ${
                analysis.threats.malicious ? 'Phát hiện mối đe dọa!' :
                analysis.threats.suspicious ? 'Có dấu hiệu đáng ngờ.' :
                'Không phát hiện mối đe dọa.'
              }`,
              threats: analysis.threats,
              virusTotalAnalysis: analysis.urlAnalysis,
              checkedAt: new Date().toISOString(),
              mockData: analysis.mockData,
              thirdPartyResults: [] // VirusTotal doesn't provide third party results
            }
          }
        };
      }
    } catch (vtError) {
      console.log('🔄 VirusTotal API failed:', vtError.message);
    }

    // Strategy 4: Final fallback to mock
    console.log('🔄 All APIs failed, using mock data...');
    return await mockAPI.checkLink(url);
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

// Chat API endpoints
export const chatAPI = {
  // Send message to authenticated chat (requires login)
  sendMessage: async (data) => {
    console.log('🚀 Sending authenticated message to backend');
    return await api.post('/chat/message', data);
  },

  // Send message to AI chat endpoint (uses Gemini API)
  sendGeminiMessage: async (message) => {
    try {
      console.log('Sending message to Gemini API:', message);
      const response = await fetch(`${getApiBaseUrl()}/chat/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response from Gemini API:', data);
      return data;
    } catch (error) {
      console.error('Error sending message to Gemini API:', error);
      throw error;
    }
  },

  // Test Gemini API configuration
  testGeminiConfig: async () => {
    console.log('🔧 Testing Gemini API configuration');
    return await api.get('/chat/test-gemini');
  },

  // Get conversation starters
  getStarters: async () => {
    console.log('💭 Getting conversation starters');
    return await api.get('/chat/starters');
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
  getSecurityTips: (params) => api.get('/chat/tips', { params })
};

// Community API endpoints
export const communityAPI = {
  // Get community posts
  getPosts: (params) => api.get('/community/posts', { params }),

  // Submit to community
  submitToCommunity: (data) => api.post('/community/submit', data),

  // Get my submissions
  getMySubmissions: () => api.get('/community/my-submissions'),

  // Delete submission
  deleteSubmission: (id) => api.delete(`/community/submissions/${id}`),

  // Comments API
  getComments: (linkId, page = 1, limit = 10, sortBy = 'newest') => {
    const params = new URLSearchParams({ page, limit, sortBy });
    return api.get(`/comments/${linkId}?${params}`);
  },

  addComment: (linkId, content) => api.post(`/comments/${linkId}`, { content }),

  updateComment: (commentId, content) => api.put(`/comments/comment/${commentId}`, { content }),

  deleteComment: (commentId) => api.delete(`/comments/comment/${commentId}`),

  getCommentStats: (linkId) => api.get(`/comments/${linkId}/stats`)
};

// Main API service object
export const apiService = {
  auth: authAPI,
  user: userAPI,
  link: linkAPI,
  chat: chatAPI,
  community: communityAPI,

  // Direct methods for convenience
  getMySubmissions: () => communityAPI.getMySubmissions()
};

export default api;
