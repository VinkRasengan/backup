// Community API Service - Voting, Comments, Reports
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace('/api', ''); // Remove /api suffix if present
  }

  if (process.env.NODE_ENV === 'production') {
    return ''; // Use relative URL for production
  }

  return 'http://localhost:8080'; // Development fallback (API Gateway)
};

const API_BASE_URL = getApiBaseUrl();

class CommunityAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('backendToken') || localStorage.getItem('authToken');
  }

  // Common headers for authenticated requests
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // VOTING ENDPOINTS
  
  // Submit or update vote for a link
  async submitVote(linkId, voteType) {
    try {
      const response = await fetch(`${this.baseURL}/api/votes/${linkId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ voteType }) // 'safe', 'unsafe', 'suspicious'
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
      const response = await fetch(`${this.baseURL}/api/votes/${linkId}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
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
      const response = await fetch(`${this.baseURL}/api/votes/${linkId}/user`, {
        method: 'GET',
        headers: this.getAuthHeaders()
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
      const response = await fetch(`${this.baseURL}/api/votes/${linkId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Delete vote error:', error);
      throw error;
    }
  }

  // COMMENTS ENDPOINTS

  // Add comment to a link
  async addComment(linkId, content) {
    try {
      const response = await fetch(`${this.baseURL}/api/comments/${linkId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ content })
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }

  // Get comments for a link with pagination
  async getComments(linkId, page = 1, limit = 10, sortBy = 'newest') {
    try {
      const params = new URLSearchParams({ page, limit, sortBy });
      const response = await fetch(`${this.baseURL}/api/comments/${linkId}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  }

  // Update a comment
  async updateComment(commentId, content) {
    try {
      const response = await fetch(`${this.baseURL}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
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
      const response = await fetch(`${this.baseURL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
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
      const response = await fetch(`${this.baseURL}/api/comments/user/my-comments?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Get user comments error:', error);
      throw error;
    }
  }

  // REPORTS ENDPOINTS

  // Submit a report for a link
  async submitReport(linkId, reason, description) {
    try {
      const response = await fetch(`${this.baseURL}/api/reports/${linkId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ reason, description })
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
      const response = await fetch(`${this.baseURL}/api/reports/user/my-reports?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
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
      
      const response = await fetch(`${this.baseURL}/api/admin/reports?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
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
      const response = await fetch(`${this.baseURL}/api/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
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
      const response = await fetch(`${this.baseURL}/api/admin/reports/statistics`, {
        method: 'GET',
        headers: this.getAuthHeaders()
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
      const response = await fetch(`${this.baseURL}/api/admin/notifications`, {
        method: 'GET',
        headers: this.getAuthHeaders()
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
      const response = await fetch(`${this.baseURL}/api/admin/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
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
      const response = await fetch(`${this.baseURL}/api/admin/dashboard/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
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

  // Get vote type display name
  getVoteTypeDisplay(voteType) {
    const displays = {
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

export default new CommunityAPI();
