/**
 * Fallback Strategies for Microservices
 * Provides graceful degradation when services are unavailable
 */

const logger = require('../utils/logger');

class FallbackStrategies {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Auth Service Fallback
   * Returns cached user data or basic user info
   */
  authServiceFallback = (error, requestConfig) => {
    logger.warn('Auth service fallback triggered', { error: error.message });
    
    const endpoint = requestConfig.url;
    
    if (endpoint.includes('/verify')) {
      // For token verification, return a basic valid response
      return {
        data: {
          success: false,
          error: 'Auth service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          fallback: true
        },
        status: 503
      };
    }
    
    if (endpoint.includes('/profile') || endpoint.includes('/user')) {
      // Return cached user data if available
      const cachedUser = this.getCachedData('user_profile');
      if (cachedUser) {
        return {
          data: {
            ...cachedUser,
            fallback: true,
            message: 'Using cached user data'
          },
          status: 200
        };
      }
      
      // Return basic user structure
      return {
        data: {
          id: 'unknown',
          email: 'unknown@example.com',
          name: 'Unknown User',
          roles: ['user'],
          fallback: true,
          message: 'Auth service unavailable'
        },
        status: 200
      };
    }
    
    // Default auth fallback
    return {
      data: {
        error: 'Authentication service temporarily unavailable',
        code: 'AUTH_SERVICE_DOWN',
        fallback: true
      },
      status: 503
    };
  };

  /**
   * Link Service Fallback
   * Returns cached scan results or basic safety message
   */
  linkServiceFallback = (error, requestConfig) => {
    logger.warn('Link service fallback triggered', { error: error.message });
    
    const endpoint = requestConfig.url;
    
    if (endpoint.includes('/scan-url') || endpoint.includes('/links')) {
      return {
        data: {
          result: 'unknown',
          message: 'Link scanning service temporarily unavailable. Please try again later.',
          safety_score: 0,
          warnings: ['Service unavailable - cannot verify link safety'],
          fallback: true,
          timestamp: new Date().toISOString()
        },
        status: 503
      };
    }
    
    if (endpoint.includes('/scan-history')) {
      const cachedHistory = this.getCachedData('scan_history');
      if (cachedHistory) {
        return {
          data: {
            ...cachedHistory,
            fallback: true,
            message: 'Using cached scan history'
          },
          status: 200
        };
      }
      
      return {
        data: {
          scans: [],
          total: 0,
          fallback: true,
          message: 'Scan history temporarily unavailable'
        },
        status: 200
      };
    }
    
    return {
      data: {
        error: 'Link verification service temporarily unavailable',
        code: 'LINK_SERVICE_DOWN',
        fallback: true
      },
      status: 503
    };
  };

  /**
   * Community Service Fallback
   * Returns cached posts or empty community data
   */
  communityServiceFallback = (error, requestConfig) => {
    logger.warn('Community service fallback triggered', { error: error.message });
    
    const endpoint = requestConfig.url;
    
    if (endpoint.includes('/posts')) {
      const cachedPosts = this.getCachedData('community_posts');
      if (cachedPosts) {
        return {
          data: {
            ...cachedPosts,
            fallback: true,
            message: 'Using cached community posts'
          },
          status: 200
        };
      }
      
      return {
        data: {
          posts: [],
          total: 0,
          page: 1,
          fallback: true,
          message: 'Community posts temporarily unavailable'
        },
        status: 200
      };
    }
    
    if (endpoint.includes('/vote')) {
      return {
        data: {
          success: false,
          message: 'Voting temporarily unavailable. Please try again later.',
          fallback: true
        },
        status: 503
      };
    }
    
    return {
      data: {
        error: 'Community service temporarily unavailable',
        code: 'COMMUNITY_SERVICE_DOWN',
        fallback: true
      },
      status: 503
    };
  };

  /**
   * Chat Service Fallback
   * Returns basic chat unavailable message
   */
  chatServiceFallback = (error, requestConfig) => {
    logger.warn('Chat service fallback triggered', { error: error.message });
    
    return {
      data: {
        message: 'Chat service is temporarily unavailable. Please try again later.',
        type: 'system',
        timestamp: new Date().toISOString(),
        fallback: true
      },
      status: 503
    };
  };

  /**
   * News Service Fallback
   * Returns cached news or empty news data
   */
  newsServiceFallback = (error, requestConfig) => {
    logger.warn('News service fallback triggered', { error: error.message });
    
    const endpoint = requestConfig.url;
    
    if (endpoint.includes('/articles') || endpoint.includes('/news')) {
      const cachedNews = this.getCachedData('news_articles');
      if (cachedNews) {
        return {
          data: {
            ...cachedNews,
            fallback: true,
            message: 'Using cached news articles'
          },
          status: 200
        };
      }
      
      return {
        data: {
          articles: [],
          total: 0,
          fallback: true,
          message: 'News service temporarily unavailable'
        },
        status: 200
      };
    }
    
    return {
      data: {
        error: 'News service temporarily unavailable',
        code: 'NEWS_SERVICE_DOWN',
        fallback: true
      },
      status: 503
    };
  };

  /**
   * Admin Service Fallback
   * Returns basic admin unavailable message
   */
  adminServiceFallback = (error, requestConfig) => {
    logger.warn('Admin service fallback triggered', { error: error.message });
    
    return {
      data: {
        error: 'Admin service temporarily unavailable',
        message: 'Administrative functions are currently unavailable. Please try again later.',
        code: 'ADMIN_SERVICE_DOWN',
        fallback: true
      },
      status: 503
    };
  };

  /**
   * Cache data for fallback use
   */
  cacheData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached data if not expired
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Clear cache
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get all fallback strategies
   */
  getAllStrategies() {
    return {
      auth: this.authServiceFallback,
      link: this.linkServiceFallback,
      community: this.communityServiceFallback,
      chat: this.chatServiceFallback,
      news: this.newsServiceFallback,
      admin: this.adminServiceFallback
    };
  }

  /**
   * Generic fallback for unknown services
   */
  genericFallback = (error, requestConfig) => {
    logger.warn('Generic fallback triggered', { 
      error: error.message,
      url: requestConfig.url 
    });
    
    return {
      data: {
        error: 'Service temporarily unavailable',
        message: 'The requested service is currently unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
        fallback: true,
        timestamp: new Date().toISOString()
      },
      status: 503
    };
  };
}

module.exports = new FallbackStrategies();
