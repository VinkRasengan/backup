/**
 * Query Handlers for CQRS Pattern
 * Handles read operations using materialized views
 */

class QueryHandlers {
  constructor(materializedViews) {
    this.views = materializedViews;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const user = await this.views.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId) {
    try {
      const user = await this.views.users.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's posts
      const userPosts = await this.views.posts.getByUserId(userId);
      
      // Get user's comments
      const userComments = await this.views.comments.getByUserId(userId);
      
      // Get user's votes
      const userVotes = await this.views.votes.getByUserId(userId);

      return {
        userId,
        postsCount: userPosts.length,
        commentsCount: userComments.length,
        votesCount: userVotes.length,
        joinDate: user.createdAt,
        lastActivity: user.lastActivity || user.createdAt
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }

  /**
   * Get post with comments
   */
  async getPostWithComments(postId) {
    try {
      const post = await this.views.posts.get(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const comments = await this.views.comments.getByPostId(postId);
      const votes = await this.views.votes.getByPostId(postId);

      return {
        ...post,
        comments,
        votes: {
          up: votes.filter(v => v.voteType === 'up').length,
          down: votes.filter(v => v.voteType === 'down').length,
          total: votes.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to get post: ${error.message}`);
    }
  }

  /**
   * Get posts by category
   */
  async getPostsByCategory(category, limit = 20, offset = 0) {
    try {
      const posts = await this.views.posts.getByCategory(category, limit, offset);
      return posts.map(post => ({
        ...post,
        commentCount: post.comments ? post.comments.length : 0
      }));
    } catch (error) {
      throw new Error(`Failed to get posts by category: ${error.message}`);
    }
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(limit = 10) {
    try {
      const posts = await this.views.posts.getTrending(limit);
      return posts;
    } catch (error) {
      throw new Error(`Failed to get trending posts: ${error.message}`);
    }
  }

  /**
   * Get link scan results
   */
  async getLinkScanResults(linkId) {
    try {
      const scanResult = await this.views.linkScans.get(linkId);
      if (!scanResult) {
        throw new Error('Link scan result not found');
      }
      return scanResult;
    } catch (error) {
      throw new Error(`Failed to get link scan results: ${error.message}`);
    }
  }

  /**
   * Get link scan history
   */
  async getLinkScanHistory(url, limit = 10) {
    try {
      const history = await this.views.linkScans.getHistoryByUrl(url, limit);
      return history;
    } catch (error) {
      throw new Error(`Failed to get link scan history: ${error.message}`);
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(conversationId, limit = 50, offset = 0) {
    try {
      const messages = await this.views.messages.getByConversationId(conversationId, limit, offset);
      return messages;
    } catch (error) {
      throw new Error(`Failed to get conversation messages: ${error.message}`);
    }
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId, limit = 20) {
    try {
      const conversations = await this.views.conversations.getByUserId(userId, limit);
      return conversations;
    } catch (error) {
      throw new Error(`Failed to get user conversations: ${error.message}`);
    }
  }

  /**
   * Get news articles
   */
  async getNewsArticles(category = null, limit = 20, offset = 0) {
    try {
      let articles;
      if (category) {
        articles = await this.views.news.getByCategory(category, limit, offset);
      } else {
        articles = await this.views.news.getLatest(limit, offset);
      }
      return articles;
    } catch (error) {
      throw new Error(`Failed to get news articles: ${error.message}`);
    }
  }

  /**
   * Get trending news
   */
  async getTrendingNews(limit = 10) {
    try {
      const articles = await this.views.news.getTrending(limit);
      return articles;
    } catch (error) {
      throw new Error(`Failed to get trending news: ${error.message}`);
    }
  }

  /**
   * Search posts
   */
  async searchPosts(query, limit = 20, offset = 0) {
    try {
      const posts = await this.views.posts.search(query, limit, offset);
      return posts;
    } catch (error) {
      throw new Error(`Failed to search posts: ${error.message}`);
    }
  }

  /**
   * Search users
   */
  async searchUsers(query, limit = 20, offset = 0) {
    try {
      const users = await this.views.users.search(query, limit, offset);
      return users;
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      const stats = {
        totalUsers: await this.views.users.getCount(),
        totalPosts: await this.views.posts.getCount(),
        totalComments: await this.views.comments.getCount(),
        totalLinks: await this.views.linkScans.getCount(),
        totalConversations: await this.views.conversations.getCount(),
        totalArticles: await this.views.news.getCount(),
        activeUsers: await this.views.users.getActiveCount(),
        systemHealth: await this.getSystemHealth()
      };
      return stats;
    } catch (error) {
      throw new Error(`Failed to get system stats: ${error.message}`);
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth() {
    try {
      const health = {
        database: 'healthy',
        eventStore: 'healthy',
        materializedViews: 'healthy',
        lastUpdate: new Date().toISOString()
      };
      return health;
    } catch (error) {
      return {
        database: 'unhealthy',
        eventStore: 'unhealthy',
        materializedViews: 'unhealthy',
        error: error.message,
        lastUpdate: new Date().toISOString()
      };
    }
  }

  /**
   * Get admin dashboard data
   */
  async getAdminDashboard() {
    try {
      const dashboard = {
        recentUsers: await this.views.users.getRecent(10),
        recentPosts: await this.views.posts.getRecent(10),
        recentAlerts: await this.views.alerts.getRecent(10),
        systemMetrics: await this.getSystemMetrics(),
        topCategories: await this.views.posts.getTopCategories(5)
      };
      return dashboard;
    } catch (error) {
      throw new Error(`Failed to get admin dashboard: ${error.message}`);
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    try {
      const metrics = {
        eventsPerSecond: 0,
        averageResponseTime: 0,
        errorRate: 0,
        activeConnections: 0
      };
      return metrics;
    } catch (error) {
      throw new Error(`Failed to get system metrics: ${error.message}`);
    }
  }

  /**
   * Get audit log
   */
  async getAuditLog(filters = {}, limit = 100, offset = 0) {
    try {
      const logs = await this.views.auditLog.getFiltered(filters, limit, offset);
      return logs;
    } catch (error) {
      throw new Error(`Failed to get audit log: ${error.message}`);
    }
  }

  /**
   * Generic query handler
   */
  async handleQuery(queryType, params = {}) {
    const handlerMap = {
      'getUserProfile': this.getUserProfile.bind(this),
      'getUserStats': this.getUserStats.bind(this),
      'getPostWithComments': this.getPostWithComments.bind(this),
      'getPostsByCategory': this.getPostsByCategory.bind(this),
      'getTrendingPosts': this.getTrendingPosts.bind(this),
      'getLinkScanResults': this.getLinkScanResults.bind(this),
      'getLinkScanHistory': this.getLinkScanHistory.bind(this),
      'getConversationMessages': this.getConversationMessages.bind(this),
      'getUserConversations': this.getUserConversations.bind(this),
      'getNewsArticles': this.getNewsArticles.bind(this),
      'getTrendingNews': this.getTrendingNews.bind(this),
      'searchPosts': this.searchPosts.bind(this),
      'searchUsers': this.searchUsers.bind(this),
      'getSystemStats': this.getSystemStats.bind(this),
      'getSystemHealth': this.getSystemHealth.bind(this),
      'getAdminDashboard': this.getAdminDashboard.bind(this),
      'getSystemMetrics': this.getSystemMetrics.bind(this),
      'getAuditLog': this.getAuditLog.bind(this)
    };

    const handler = handlerMap[queryType];
    if (!handler) {
      throw new Error(`Unknown query type: ${queryType}`);
    }

    return await handler(params);
  }
}

module.exports = QueryHandlers; 