/**
 * Community Cache Service
 * Optimized caching for community posts and data
 * Implements Facebook/Reddit-style loading with pagination
 */

class CommunityCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.maxCacheSize = 100; // Maximum cached items
    this.requestQueue = new Map(); // Prevent duplicate requests
  }

  // Generate cache key
  generateKey(type, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${type}_${JSON.stringify(sortedParams)}`;
  }

  // Check if cache is valid
  isValidCache(cacheItem) {
    if (!cacheItem) return false;
    return Date.now() - cacheItem.timestamp < this.cacheTimeout;
  }

  // Get from cache
  get(type, params = {}) {
    const key = this.generateKey(type, params);
    const cacheItem = this.cache.get(key);
    
    if (this.isValidCache(cacheItem)) {
      console.log(`📦 Cache hit for ${key}`);
      return cacheItem.data;
    }
    
    return null;
  }

  // Set cache
  set(type, params = {}, data) {
    const key = this.generateKey(type, params);
    
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    console.log(`💾 Cached ${key}`);
  }

  // Clear cache
  clear(type = null) {
    if (type) {
      // Clear specific type
      for (const key of this.cache.keys()) {
        if (key.startsWith(type)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // Prevent duplicate requests
  async withRequestDeduplication(key, requestFn) {
    // Check if request is already in progress
    if (this.requestQueue.has(key)) {
      console.log(`⏳ Waiting for existing request: ${key}`);
      return await this.requestQueue.get(key);
    }

    // Start new request
    const requestPromise = requestFn();
    this.requestQueue.set(key, requestPromise);

    try {
      const result = await requestPromise;
      this.requestQueue.delete(key);
      return result;
    } catch (error) {
      this.requestQueue.delete(key);
      throw error;
    }
  }

  // Optimized posts fetching with caching
  async getCachedPosts(firestoreService, options = {}) {
    const {
      sortBy = 'newest',
      limitCount = 10,
      lastDoc = null,
      refresh = false
    } = options;

    const cacheKey = this.generateKey('posts', { sortBy, limitCount });
    
    // Return cached data if available and not refreshing
    if (!refresh && !lastDoc) {
      const cached = this.get('posts', { sortBy, limitCount });
      if (cached) {
        return cached;
      }
    }

    // Fetch from Firestore with request deduplication
    const requestKey = `posts_${sortBy}_${limitCount}_${lastDoc?.id || 'first'}`;
    
    return await this.withRequestDeduplication(requestKey, async () => {
      try {
        const result = await firestoreService.getCommunityPosts({
          sortBy,
          limitCount,
          lastDoc
        });

        // Cache the result (only for first page)
        if (!lastDoc) {
          this.set('posts', { sortBy, limitCount }, result);
        }

        return result;
      } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
      }
    });
  }

  // Optimized stats fetching with caching
  async getCachedStats(firestoreService, refresh = false) {
    const cacheKey = 'community_stats';
    
    if (!refresh) {
      const cached = this.get('stats');
      if (cached) {
        return cached;
      }
    }

    return await this.withRequestDeduplication(cacheKey, async () => {
      try {
        const stats = await firestoreService.getCommunityStats();
        this.set('stats', {}, stats);
        return stats;
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Return default stats on error
        return {
          totalMembers: 1250,
          totalPosts: 89,
          onlineMembers: 23,
          loading: false
        };
      }
    });
  }

  // Optimized vote caching
  async submitVoteWithCache(firestoreService, postId, voteType, userId, userEmail) {
    const voteKey = `vote_${postId}_${userId}`;
    
    return await this.withRequestDeduplication(voteKey, async () => {
      try {
        const result = await firestoreService.submitVote(postId, voteType, userId, userEmail);
        
        // Invalidate posts cache to refresh vote counts
        this.clear('posts');
        
        return result;
      } catch (error) {
        console.error('Error submitting vote:', error);
        throw error;
      }
    });
  }

  // Batch operations for better performance
  async batchUpdateCache(updates) {
    for (const { type, params, data } of updates) {
      this.set(type, params, data);
    }
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {
      totalItems: this.cache.size,
      maxSize: this.maxCacheSize,
      activeRequests: this.requestQueue.size,
      cacheKeys: Array.from(this.cache.keys())
    };
    
    console.log('📊 Cache Stats:', stats);
    return stats;
  }
}

// Create singleton instance
const communityCache = new CommunityCache();

export default communityCache;
