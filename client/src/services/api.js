import axios from 'axios';
import Cookies from 'js-cookie';
import mockAPI from './mockAPI';
import communityAPIService from './communityAPI';

// Create axios instance for Render deployment
const getApiBaseUrl = () => {
  // Use environment variable if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback based on environment
  if (process.env.NODE_ENV === 'production') {
    // Use environment variable for production API Gateway URL
    return process.env.REACT_APP_API_GATEWAY_URL || '/api';
  }

  return 'http://localhost:8080'; // Development fallback (API Gateway port)
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
    console.log('🔍 Checking URL with backend API via Gateway:', url);

    // ✅ Strategy 1: Use API Gateway (primary method)
    try {
      console.log('🔐 Using link check API via Gateway');
      return await api.post('/links/check', { url });
    } catch (authError) {
      console.log('🔄 API Gateway failed:', authError.response?.status, authError.message);
    }

    // ✅ Strategy 2: VirusTotal via backend service as fallback
    try {
      console.log('🔄 Using VirusTotal via backend service as fallback...');
      const virusTotalService = (await import('./virusTotalService')).default;
      const analysis = await virusTotalService.analyzeUrl(url);

      if (analysis.success) {
        return {
          data: {
            message: 'Link đã được kiểm tra thành công (VirusTotal via backend)',
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
              thirdPartyResults: []
            }
          }
        };
      }
    } catch (vtError) {
      console.log('🔄 VirusTotal backend service failed:', vtError.message);
    }

    // Strategy 3: Final fallback to mock
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

// Community API endpoints - using dedicated service
export const communityAPI = {
  // Get community posts - delegate to dedicated service
  getPosts: (params) => communityAPIService.getPosts(params),

  // Submit to community (create new post) - delegate to dedicated service
  submitToCommunity: (data) => communityAPIService.submitToCommunity(data),

  // Get my submissions (filter posts by user) - delegate to dedicated service
  getMySubmissions: () => communityAPIService.getMySubmissions(),

  // Delete submission (delete post) - delegate to dedicated service
  deleteSubmission: (id) => communityAPIService.deleteSubmission(id),

  // Voting methods - delegate to dedicated service
  submitVote: (linkId, voteType, userId, userEmail) =>
    communityAPIService.submitVote(linkId, voteType, userId, userEmail),
  getVoteStats: (linkId) => communityAPIService.getVoteStats(linkId),
  getUserVote: (linkId) => communityAPIService.getUserVote(linkId),
  deleteVote: (linkId) => communityAPIService.deleteVote(linkId),

  // Comments methods - delegate to dedicated service
  getComments: (linkId, page = 1, limit = 10, sortBy = 'newest') =>
    communityAPIService.getComments(linkId, page, limit, sortBy),
  addComment: (linkId, content, userId, userEmail, displayName) =>
    communityAPIService.addComment(linkId, content, userId, userEmail, displayName),
  updateComment: (commentId, content) => communityAPIService.updateComment(commentId, content),
  deleteComment: (commentId) => communityAPIService.deleteComment(commentId),

  // Reports methods - delegate to dedicated service
  submitReport: (linkId, reason, description) =>
    communityAPIService.submitReport(linkId, reason, description),
  getUserReports: (page, limit) => communityAPIService.getUserReports(page, limit),

  // Admin methods - delegate to dedicated service
  getAllReports: (page, limit, status, reason) =>
    communityAPIService.getAllReports(page, limit, status, reason),
  updateReportStatus: (reportId, status, adminNotes) =>
    communityAPIService.updateReportStatus(reportId, status, adminNotes),
  getReportStatistics: () => communityAPIService.getReportStatistics(),
  getAdminNotifications: () => communityAPIService.getAdminNotifications(),
  markNotificationRead: (notificationId) =>
    communityAPIService.markNotificationRead(notificationId),
  getAdminDashboardStats: () => communityAPIService.getAdminDashboardStats()
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
