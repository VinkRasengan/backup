// Community API Service - Voting, Comments, Reports
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

const API_BASE_URL = getApiBaseUrl();

class CommunityAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage or Firebase
  async getAuthToken() {
    // First try localStorage
    const storedToken = localStorage.getItem('backendToken') || localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('firebaseToken');
    if (storedToken) {
      console.log('🔑 Getting stored auth token:', `${storedToken.substring(0, 30)}...`);
      return storedToken;
    }

    // Fallback to Firebase current user token
    try {
      const { auth } = await import('../config/firebase');
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        console.log('🔑 Getting Firebase auth token:', `${token.substring(0, 30)}...`);
        return token;
      }
    } catch (error) {
      console.error('🔑 Error getting Firebase token:', error);
    }

    console.log('🔑 No auth token found');
    return null;
  }

  // Common headers for authenticated requests
  async getAuthHeaders() {
    const token = await this.getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
    console.log('🔑 Auth headers:', headers);
    return headers;
  }

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    if (data.success !== undefined) {
      // New format with success flag
      if (data.success) {
        return data; // Return full response object to preserve success flag
      } else {
        throw new Error(data.error || 'Request failed');
      }
    }
    
    // Legacy format without success flag
    return data;
  }

  // LINKS ENDPOINTS
  // Get community links - use API Gateway routing
  async getPosts(params = {}) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 15000); // 15 second timeout

    try {
      const queryParams = new URLSearchParams(params);
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/links?${queryParams}`, {
        method: 'GET',
        headers: headers,
        signal: abortController.signal
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }

      console.error('Get links error:', error);
      throw error;
    }
  }

  // Submit to community (create new link) - use API Gateway routing
  async submitToCommunity(data) {
    // Create AbortController for request timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 30000); // 30 second timeout

    try {
      console.log('🌐 submitToCommunity called with data:', data);
      const url = `${this.baseURL}/api/links`;
      const headers = await this.getAuthHeaders();
      console.log('🌐 Request URL:', url);
      console.log('🌐 Request headers:', headers);
      console.log('🌐 Request body:', JSON.stringify(data));

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
        signal: abortController.signal // Add abort signal
      });

      console.log('🌐 Response status:', response.status);
      console.log('🌐 Response headers:', response.headers);

      clearTimeout(timeoutId); // Clear timeout on successful response
      return await this.handleResponse(response);
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error

      if (error.name === 'AbortError') {
        console.error('Submit to community request timed out');
        throw new Error('Request timed out. Please check your connection and try again.');
      }

      console.error('Submit to community error:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  // Get my submissions (filter links by user) - use API Gateway routing
  async getMySubmissions() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/links?userPostsOnly=true`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get my submissions error:', error);
      throw error;
    }
  }

  // Delete submission (delete link) - use API Gateway routing
  async deleteSubmission(id) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/links/${id}`, {
        method: 'DELETE',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete submission error:', error);
      throw error;
    }
  }

  // VOTING ENDPOINTS

  // Submit or update vote for a link
  async submitVote(linkId, voteType, userId = null, userEmail = null) {
    try {
      // Get user info from auth context if not provided
      const authToken = await this.getAuthToken();
      if (!userId && authToken) {
        // Try to extract user info from token or get from auth context
        userId = await this.getCurrentUserId();
        userEmail = await this.getCurrentUserEmail();
      }

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/votes/${linkId}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          voteType, // 'upvote', 'downvote' (Reddit-style)
          userId,
          userEmail
        })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Submit vote error:', error);
      throw error;
    }
  }

  // Get vote statistics for a link
  async getVoteStats(linkId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/votes/${linkId}/stats`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get vote stats error:', error);
      throw error;
    }
  }

  // Get user's vote for a specific link
  async getUserVote(linkId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/votes/${linkId}/user`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user vote error:', error);
      throw error;
    }
  }

  // Delete user's vote
  async deleteVote(linkId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/api/votes/${linkId}`, {
        method: 'DELETE',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete vote error:', error);
      throw error;
    }
  }

  // COMMENTS ENDPOINTS

  // Add comment to a link
  async addComment(linkId, content, userId = null, userEmail = null, displayName = null) {
    try {
      // Get user info from auth context if not provided
      if (!userId) {
        userId = await this.getCurrentUserId();
        userEmail = await this.getCurrentUserEmail();
        displayName = await this.getCurrentUserDisplayName();
      }

      // Check if user is authenticated
      if (!userId) {
        throw new Error('You must be logged in to add comments. Please sign in and try again.');
      }

      if (!linkId) {
        throw new Error('Link ID is required to add a comment.');
      }

      if (!content || content.trim().length === 0) {
        throw new Error('Comment content cannot be empty.');
      }

      console.log('🔄 Adding comment:', { linkId, userId, userEmail, displayName });

      const headers = await this.getAuthHeaders();

      const requestBody = {
        linkId: linkId,
        content: content.trim(),
        userId,
        userEmail,
        displayName: displayName || 'Anonymous User'
      };

      console.log('📤 Comment request body:', requestBody);

      const response = await fetch(`${this.baseURL}/api/comments`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Comment response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('📥 Comment response error:', errorData);
        
        // Provide more specific error messages
        if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid comment data. Please check all required fields.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (response.status === 403) {
          throw new Error('You are not authorized to add comments.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(errorData.error || `Comment failed with status ${response.status}`);
        }
      }

      const result = await response.json();
      console.log('✅ Comment added successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Add comment error:', error);
      throw error;
    }
  }

  // Get comments for a link with pagination
  async getComments(linkId, page = 1, limit = 10, sortBy = 'newest') {
    try {
      // Convert page to offset for backend compatibility
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({ limit, offset });

      console.log('🔍 Getting comments for linkId:', linkId, 'with params:', { limit, offset });

      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/comments/${linkId}?${params}`, {
        method: 'GET',
        headers: headers
      });

      const result = await this.handleResponse(response);
      console.log('📝 Comments response:', result);

      return result;
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  }

  // Update a comment
  async updateComment(commentId, content) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ content })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  }

  // Delete a comment
  async deleteComment(commentId) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  }

  // Get user's comments
  async getUserComments(page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({ page, limit });
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/comments/user/my-comments?${params}`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user comments error:', error);
      throw error;
    }
  }

  // REPORTS ENDPOINTS

  // Submit a report for a link
  async submitReport(linkId, reason, description, url = null) {
    try {
      const headers = await this.getAuthHeaders();

      const requestBody = { reason, description };
      if (url) {
        requestBody.url = url;
      }

      const response = await fetch(`${this.baseURL}/api/reports/${linkId}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Submit report error:', error);
      throw error;
    }
  }

  // Get user's reports
  async getUserReports(page = 1, limit = 10) {
    try {
      const params = new URLSearchParams({ page, limit });
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/reports/user/my-reports?${params}`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user reports error:', error);
      throw error;
    }
  }

  // ADMIN ENDPOINTS

  // Get all reports (admin only)
  async getAllReports(page = 1, limit = 20, status = null, reason = null) {
    try {
      const params = new URLSearchParams({ page, limit });
      if (status) params.append('status', status);
      if (reason) params.append('reason', reason);
      
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/reports?${params}`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get all reports error:', error);
      throw error;
    }
  }

  // Update report status (admin only)
  async updateReportStatus(reportId, status, adminNotes = null) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ status, adminNotes })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Update report status error:', error);
      throw error;
    }
  }

  // Get report statistics (admin only)
  async getReportStatistics() {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/reports/statistics`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get report statistics error:', error);
      throw error;
    }
  }

  // Get admin notifications
  async getAdminNotifications() {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/notifications`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get admin notifications error:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Mark notification read error:', error);
      throw error;
    }
  }

  // Get admin dashboard stats
  async getAdminDashboardStats() {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/api/admin/dashboard/stats`, {
        method: 'GET',
        headers: headers
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get admin dashboard stats error:', error);
      throw error;
    }
  }

  // UTILITY METHODS

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  // Get current user ID from auth context
  async getCurrentUserId() {
    try {
      // Try to get from Firebase auth (v9+ modular SDK)
      const { auth } = await import('../config/firebase');
      if (auth.currentUser) {
        return auth.currentUser.uid;
      }

      // Try to get from localStorage
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.uid || userData.id;
      }

      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  // Get current user email from auth context
  async getCurrentUserEmail() {
    try {
      // Try to get from Firebase auth (v9+ modular SDK)
      const { auth } = await import('../config/firebase');
      if (auth.currentUser) {
        return auth.currentUser.email;
      }

      // Try to get from localStorage
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.email;
      }

      return null;
    } catch (error) {
      console.error('Error getting current user email:', error);
      return null;
    }
  }

  // Get current user display name from auth context
  async getCurrentUserDisplayName() {
    try {
      // Try to get from Firebase auth (v9+ modular SDK)
      const { auth } = await import('../config/firebase');
      if (auth.currentUser) {
        const currentUser = auth.currentUser;
        return currentUser.displayName || currentUser.email?.split('@')[0] || null;
      }

      // Try to get from localStorage
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.displayName || userData.email?.split('@')[0] || null;
      }

      return null;
    } catch (error) {
      console.error('Error getting current user display name:', error);
      return null;
    }
  }

  // Get vote type display
  getVoteTypeDisplay(voteType) {
    const displays = {
      upvote: 'Upvote',
      downvote: 'Downvote',
      safe: 'An toàn',
      unsafe: 'Nguy hiểm',
      suspicious: 'Đáng ngờ'
    };
    return displays[voteType] || voteType;
  }

  // Get trust label display
  getTrustLabelDisplay(trustLabel) {
    const displays = {
      trusted: 'Đáng tin cậy',
      'likely-safe': 'Có thể an toàn',
      'mixed-reviews': 'Ý kiến trái chiều',
      suspicious: 'Đáng ngờ',
      'likely-dangerous': 'Có thể nguy hiểm',
      dangerous: 'Nguy hiểm',
      unrated: 'Chưa đánh giá'
    };
    return displays[trustLabel] || trustLabel;
  }

  // Get trust label color
  getTrustLabelColor(trustLabel) {
    const colors = {
      trusted: 'text-green-600',
      'likely-safe': 'text-green-400',
      'mixed-reviews': 'text-yellow-500',
      suspicious: 'text-orange-500',
      'likely-dangerous': 'text-red-400',
      dangerous: 'text-red-600',
      unrated: 'text-gray-500'
    };
    return colors[trustLabel] || 'text-gray-500';
  }

  // Get report reason display
  getReportReasonDisplay(reason) {
    const displays = {
      fake_news: 'Tin giả',
      scam: 'Lừa đảo',
      malicious_content: 'Nội dung độc hại',
      spam: 'Spam',
      inappropriate: 'Không phù hợp',
      other: 'Khác'
    };
    return displays[reason] || reason;
  }
}

const communityAPIInstance = new CommunityAPI();
export default communityAPIInstance;
