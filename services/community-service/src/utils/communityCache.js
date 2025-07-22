/**
 * Community-specific Redis Cache Manager
 * Optimized for community features: posts, comments, votes, users
 */

const { cacheManager } = require('./cache');
const logger = require('./logger');

class CommunityCache {
  constructor() {
    this.cache = cacheManager;
    
    // Cache TTL configurations (in seconds)
    this.TTL = {
      POSTS: 1800,        // 30 minutes
      COMMENTS: 900,      // 15 minutes
      USER_PROFILES: 3600, // 1 hour
      REPUTATION: 7200,   // 2 hours
      VOTE_STATS: 300,    // 5 minutes
      TRENDING: 600,      // 10 minutes
      SEARCH_RESULTS: 1800, // 30 minutes
      CATEGORIES: 86400,  // 24 hours
      LEADERBOARD: 3600   // 1 hour
    };

    // Cache namespaces
    this.NAMESPACE = {
      POSTS: 'posts',
      COMMENTS: 'comments',
      USERS: 'users',
      VOTES: 'votes',
      STATS: 'stats',
      TRENDING: 'trending',
      SEARCH: 'search',
      CATEGORIES: 'categories',
      LEADERBOARD: 'leaderboard'
    };
  }

  // ==================== POST CACHING ====================

  /**
   * Cache a single post
   */
  async cachePost(postId, postData) {
    try {
      await this.cache.set(this.NAMESPACE.POSTS, postId, postData, this.TTL.POSTS);
      logger.debug('Post cached', { postId });
    } catch (error) {
      logger.error('Failed to cache post', { postId, error: error.message });
    }
  }

  /**
   * Get cached post
   */
  async getPost(postId) {
    try {
      const post = await this.cache.get(this.NAMESPACE.POSTS, postId);
      if (post) {
        logger.debug('Post cache hit', { postId });
      }
      return post;
    } catch (error) {
      logger.error('Failed to get cached post', { postId, error: error.message });
      return null;
    }
  }

  /**
   * Cache posts list with pagination info
   */
  async cachePostsList(cacheKey, posts, pagination) {
    try {
      const data = {
        posts,
        pagination,
        cachedAt: new Date().toISOString()
      };
      await this.cache.set(this.NAMESPACE.POSTS, `list:${cacheKey}`, data, this.TTL.POSTS);
      logger.debug('Posts list cached', { cacheKey, count: posts.length });
    } catch (error) {
      logger.error('Failed to cache posts list', { cacheKey, error: error.message });
    }
  }

  /**
   * Get cached posts list
   */
  async getPostsList(cacheKey) {
    try {
      const data = await this.cache.get(this.NAMESPACE.POSTS, `list:${cacheKey}`);
      if (data) {
        logger.debug('Posts list cache hit', { cacheKey });
      }
      return data;
    } catch (error) {
      logger.error('Failed to get cached posts list', { cacheKey, error: error.message });
      return null;
    }
  }

  /**
   * Invalidate post cache
   */
  async invalidatePost(postId) {
    try {
      await this.cache.del(this.NAMESPACE.POSTS, postId);
      await this.cache.delPattern(this.NAMESPACE.POSTS, 'list:*'); // Invalidate all lists
      await this.cache.delPattern(this.NAMESPACE.TRENDING, '*'); // Invalidate trending
      logger.info('Post cache invalidated', { postId });
    } catch (error) {
      logger.error('Failed to invalidate post cache', { postId, error: error.message });
    }
  }

  // ==================== COMMENT CACHING ====================

  /**
   * Cache comments for a post
   */
  async cacheComments(postId, comments) {
    try {
      await this.cache.set(this.NAMESPACE.COMMENTS, `post:${postId}`, comments, this.TTL.COMMENTS);
      logger.debug('Comments cached', { postId, count: comments.length });
    } catch (error) {
      logger.error('Failed to cache comments', { postId, error: error.message });
    }
  }

  /**
   * Get cached comments
   */
  async getComments(postId) {
    try {
      const comments = await this.cache.get(this.NAMESPACE.COMMENTS, `post:${postId}`);
      if (comments) {
        logger.debug('Comments cache hit', { postId });
      }
      return comments;
    } catch (error) {
      logger.error('Failed to get cached comments', { postId, error: error.message });
      return null;
    }
  }

  /**
   * Cache comment count
   */
  async cacheCommentCount(postId, count) {
    try {
      await this.cache.set(this.NAMESPACE.COMMENTS, `count:${postId}`, count, this.TTL.COMMENTS);
    } catch (error) {
      logger.error('Failed to cache comment count', { postId, error: error.message });
    }
  }

  /**
   * Get cached comment count
   */
  async getCommentCount(postId) {
    try {
      return await this.cache.get(this.NAMESPACE.COMMENTS, `count:${postId}`);
    } catch (error) {
      logger.error('Failed to get cached comment count', { postId, error: error.message });
      return null;
    }
  }

  /**
   * Invalidate comments cache
   */
  async invalidateComments(postId) {
    try {
      await this.cache.del(this.NAMESPACE.COMMENTS, `post:${postId}`);
      await this.cache.del(this.NAMESPACE.COMMENTS, `count:${postId}`);
      logger.info('Comments cache invalidated', { postId });
    } catch (error) {
      logger.error('Failed to invalidate comments cache', { postId, error: error.message });
    }
  }

  // ==================== USER CACHING ====================

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, profile) {
    try {
      await this.cache.set(this.NAMESPACE.USERS, `profile:${userId}`, profile, this.TTL.USER_PROFILES);
      logger.debug('User profile cached', { userId });
    } catch (error) {
      logger.error('Failed to cache user profile', { userId, error: error.message });
    }
  }

  /**
   * Get cached user profile
   */
  async getUserProfile(userId) {
    try {
      const profile = await this.cache.get(this.NAMESPACE.USERS, `profile:${userId}`);
      if (profile) {
        logger.debug('User profile cache hit', { userId });
      }
      return profile;
    } catch (error) {
      logger.error('Failed to get cached user profile', { userId, error: error.message });
      return null;
    }
  }

  /**
   * Cache user reputation
   */
  async cacheUserReputation(userId, reputation) {
    try {
      await this.cache.set(this.NAMESPACE.USERS, `reputation:${userId}`, reputation, this.TTL.REPUTATION);
    } catch (error) {
      logger.error('Failed to cache user reputation', { userId, error: error.message });
    }
  }

  /**
   * Get cached user reputation
   */
  async getUserReputation(userId) {
    try {
      return await this.cache.get(this.NAMESPACE.USERS, `reputation:${userId}`);
    } catch (error) {
      logger.error('Failed to get cached user reputation', { userId, error: error.message });
      return null;
    }
  }

  // ==================== VOTE CACHING ====================

  /**
   * Cache vote statistics for a post
   */
  async cacheVoteStats(postId, stats) {
    try {
      await this.cache.set(this.NAMESPACE.VOTES, `stats:${postId}`, stats, this.TTL.VOTE_STATS);
    } catch (error) {
      logger.error('Failed to cache vote stats', { postId, error: error.message });
    }
  }

  /**
   * Get cached vote statistics
   */
  async getVoteStats(postId) {
    try {
      return await this.cache.get(this.NAMESPACE.VOTES, `stats:${postId}`);
    } catch (error) {
      logger.error('Failed to get cached vote stats', { postId, error: error.message });
      return null;
    }
  }

  /**
   * Cache user vote on a post
   */
  async cacheUserVote(userId, postId, voteType) {
    try {
      await this.cache.set(this.NAMESPACE.VOTES, `user:${userId}:${postId}`, voteType, this.TTL.VOTE_STATS);
    } catch (error) {
      logger.error('Failed to cache user vote', { userId, postId, error: error.message });
    }
  }

  /**
   * Get cached user vote
   */
  async getUserVote(userId, postId) {
    try {
      return await this.cache.get(this.NAMESPACE.VOTES, `user:${userId}:${postId}`);
    } catch (error) {
      logger.error('Failed to get cached user vote', { userId, postId, error: error.message });
      return null;
    }
  }

  /**
   * Invalidate vote cache
   */
  async invalidateVotes(postId) {
    try {
      await this.cache.del(this.NAMESPACE.VOTES, `stats:${postId}`);
      await this.cache.delPattern(this.NAMESPACE.VOTES, `user:*:${postId}`);
      logger.info('Vote cache invalidated', { postId });
    } catch (error) {
      logger.error('Failed to invalidate vote cache', { postId, error: error.message });
    }
  }

  // ==================== TRENDING & STATS CACHING ====================

  /**
   * Cache trending posts
   */
  async cacheTrendingPosts(posts, timeframe = '24h') {
    try {
      await this.cache.set(this.NAMESPACE.TRENDING, `posts:${timeframe}`, posts, this.TTL.TRENDING);
      logger.debug('Trending posts cached', { timeframe, count: posts.length });
    } catch (error) {
      logger.error('Failed to cache trending posts', { timeframe, error: error.message });
    }
  }

  /**
   * Get cached trending posts
   */
  async getTrendingPosts(timeframe = '24h') {
    try {
      const posts = await this.cache.get(this.NAMESPACE.TRENDING, `posts:${timeframe}`);
      if (posts) {
        logger.debug('Trending posts cache hit', { timeframe });
      }
      return posts;
    } catch (error) {
      logger.error('Failed to get cached trending posts', { timeframe, error: error.message });
      return null;
    }
  }

  /**
   * Cache community statistics
   */
  async cacheStats(stats) {
    try {
      await this.cache.set(this.NAMESPACE.STATS, 'community', stats, this.TTL.TRENDING);
      logger.debug('Community stats cached');
    } catch (error) {
      logger.error('Failed to cache community stats', { error: error.message });
    }
  }

  /**
   * Get cached community statistics
   */
  async getStats() {
    try {
      const stats = await this.cache.get(this.NAMESPACE.STATS, 'community');
      if (stats) {
        logger.debug('Community stats cache hit');
      }
      return stats;
    } catch (error) {
      logger.error('Failed to get cached community stats', { error: error.message });
      return null;
    }
  }

  // ==================== SEARCH CACHING ====================

  /**
   * Cache search results
   */
  async cacheSearchResults(query, results, filters = {}) {
    try {
      const cacheKey = this.generateSearchKey(query, filters);
      const data = {
        query,
        results,
        filters,
        cachedAt: new Date().toISOString(),
        count: results.length
      };
      await this.cache.set(this.NAMESPACE.SEARCH, cacheKey, data, this.TTL.SEARCH_RESULTS);
      logger.debug('Search results cached', { query, count: results.length });
    } catch (error) {
      logger.error('Failed to cache search results', { query, error: error.message });
    }
  }

  /**
   * Get cached search results
   */
  async getSearchResults(query, filters = {}) {
    try {
      const cacheKey = this.generateSearchKey(query, filters);
      const data = await this.cache.get(this.NAMESPACE.SEARCH, cacheKey);
      if (data) {
        logger.debug('Search results cache hit', { query });
      }
      return data;
    } catch (error) {
      logger.error('Failed to get cached search results', { query, error: error.message });
      return null;
    }
  }

  /**
   * Generate search cache key
   */
  generateSearchKey(query, filters) {
    const filterStr = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    return `${query}:${filterStr}`.toLowerCase().replace(/[^a-z0-9:|-]/g, '_');
  }

  // ==================== LEADERBOARD CACHING ====================

  /**
   * Cache leaderboard data
   */
  async cacheLeaderboard(type, data, timeframe = 'all') {
    try {
      const cacheKey = `${type}:${timeframe}`;
      await this.cache.set(this.NAMESPACE.LEADERBOARD, cacheKey, data, this.TTL.LEADERBOARD);
      logger.debug('Leaderboard cached', { type, timeframe, count: data.length });
    } catch (error) {
      logger.error('Failed to cache leaderboard', { type, timeframe, error: error.message });
    }
  }

  /**
   * Get cached leaderboard
   */
  async getLeaderboard(type, timeframe = 'all') {
    try {
      const cacheKey = `${type}:${timeframe}`;
      const data = await this.cache.get(this.NAMESPACE.LEADERBOARD, cacheKey);
      if (data) {
        logger.debug('Leaderboard cache hit', { type, timeframe });
      }
      return data;
    } catch (error) {
      logger.error('Failed to get cached leaderboard', { type, timeframe, error: error.message });
      return null;
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Cache multiple posts at once
   */
  async cachePosts(posts) {
    try {
      const promises = posts.map(post =>
        this.cache.set(this.NAMESPACE.POSTS, post.id, post, this.TTL.POSTS)
      );
      await Promise.all(promises);
      logger.debug('Bulk posts cached', { count: posts.length });
    } catch (error) {
      logger.error('Failed to bulk cache posts', { error: error.message });
    }
  }

  /**
   * Get multiple posts at once
   */
  async getPosts(postIds) {
    try {
      const promises = postIds.map(id => this.cache.get(this.NAMESPACE.POSTS, id));
      const results = await Promise.all(promises);
      const posts = results.filter(post => post !== null);
      logger.debug('Bulk posts retrieved', { requested: postIds.length, found: posts.length });
      return posts;
    } catch (error) {
      logger.error('Failed to bulk get posts', { error: error.message });
      return [];
    }
  }

  // ==================== ANALYTICS & MONITORING ====================

  /**
   * Get cache performance metrics
   */
  async getCacheMetrics() {
    try {
      const health = await this.cache.healthCheck();
      const stats = this.cache.getStats();

      return {
        health,
        stats,
        performance: {
          hitRate: stats.redisHits + stats.memoryHits > 0
            ? ((stats.redisHits + stats.memoryHits) / stats.operations * 100).toFixed(2) + '%'
            : '0%',
          redisHitRate: stats.operations > 0
            ? (stats.redisHits / stats.operations * 100).toFixed(2) + '%'
            : '0%',
          memoryHitRate: stats.operations > 0
            ? (stats.memoryHits / stats.operations * 100).toFixed(2) + '%'
            : '0%',
          errorRate: stats.operations > 0
            ? (stats.errors / stats.operations * 100).toFixed(2) + '%'
            : '0%'
        }
      };
    } catch (error) {
      logger.error('Failed to get cache metrics', { error: error.message });
      return null;
    }
  }

  /**
   * Warm up cache with popular content
   */
  async warmUpCache(popularPosts = [], popularUsers = []) {
    try {
      logger.info('Starting cache warm-up...');

      // Cache popular posts
      if (popularPosts.length > 0) {
        await this.cachePosts(popularPosts);
        logger.info(`Warmed up ${popularPosts.length} popular posts`);
      }

      // Cache popular user profiles
      const userPromises = popularUsers.map(user =>
        this.cacheUserProfile(user.id, user)
      );
      await Promise.all(userPromises);
      logger.info(`Warmed up ${popularUsers.length} popular user profiles`);

      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.error('Cache warm-up failed', { error: error.message });
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Clear all community cache
   */
  async clearAllCache() {
    try {
      await this.cache.clearAll();
      logger.info('All community cache cleared');
    } catch (error) {
      logger.error('Failed to clear all cache', { error: error.message });
    }
  }

  /**
   * Initialize cache connection
   */
  async initialize() {
    try {
      await this.cache.connect();
      logger.info('Community cache initialized');
    } catch (error) {
      logger.error('Failed to initialize community cache', { error: error.message });
    }
  }

  /**
   * Disconnect cache
   */
  async disconnect() {
    try {
      await this.cache.disconnect();
      logger.info('Community cache disconnected');
    } catch (error) {
      logger.error('Failed to disconnect community cache', { error: error.message });
    }
  }
}

// Create singleton instance
const communityCache = new CommunityCache();

module.exports = {
  communityCache,
  CommunityCache
};
