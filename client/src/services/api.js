import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  getDashboard: () => api.get('/users/dashboard'),
  deleteAccount: () => api.delete('/users/account'),
};

// Link API endpoints
export const linkAPI = {
  checkLink: (url) => api.post('/links/check', { url }),
  getHistory: (page = 1, limit = 20) => api.get(`/links/history?page=${page}&limit=${limit}`),
  getLinkResult: (linkId) => api.get(`/links/${linkId}`),
  deleteLinkResult: (linkId) => api.delete(`/links/${linkId}`),
};

export default api;
