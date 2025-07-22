/**
 * Community Cache Middleware
 * Provides caching for community routes with smart invalidation
 */

const { communityCache } = require('../utils/communityCache');
const logger = require('../utils/logger');

/**
 * Generic cache middleware
 */
const cacheMiddleware = (options = {}) => {
  const {
    namespace = 'general',
    keyGenerator,
    ttl = 300,
    skipCache = false
  } = options;

  return async (req, res, next) => {
    // Skip caching in test environment or if explicitly disabled
    if (process.env.NODE_ENV === 'test' || skipCache) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = typeof keyGenerator === 'function' 
        ? keyGenerator(req) 
        : `${req.method}:${req.originalUrl}`;

      // Try to get from cache
      const cached = await communityCache.cache.get(namespace, cacheKey);
      
      if (cached) {
        logger.debug('Cache hit', { namespace, key: cacheKey });
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data && !data.error) {
          communityCache.cache.set(namespace, cacheKey, data, ttl)
            .catch(error => {
              logger.error('Failed to cache response', { 
                namespace, 
                key: cacheKey, 
                error: error.message 
              });
            });
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next(); // Continue without caching
    }
  };
};

/**
 * Posts list cache middleware
 */
const postsListCache = cacheMiddleware({
  namespace: 'posts',
  keyGenerator: (req) => {
    const { page = 1, limit = 20, category, sortBy = 'createdAt' } = req.query;
    return `list:${page}:${limit}:${category || 'all'}:${sortBy}`;
  },
  ttl: 1800 // 30 minutes
});

/**
 * Single post cache middleware
 */
const postCache = cacheMiddleware({
  namespace: 'posts',
  keyGenerator: (req) => req.params.id,
  ttl: 1800 // 30 minutes
});

/**
 * Comments cache middleware
 */
const commentsCache = cacheMiddleware({
  namespace: 'comments',
  keyGenerator: (req) => {
    const { page = 1, limit = 50 } = req.query;
    return `post:${req.params.postId}:${page}:${limit}`;
  },
  ttl: 900 // 15 minutes
});

/**
 * User profile cache middleware
 */
const userProfileCache = cacheMiddleware({
  namespace: 'users',
  keyGenerator: (req) => `profile:${req.params.userId}`,
  ttl: 3600 // 1 hour
});

/**
 * Vote stats cache middleware
 */
const voteStatsCache = cacheMiddleware({
  namespace: 'votes',
  keyGenerator: (req) => `stats:${req.params.postId}`,
  ttl: 300 // 5 minutes
});

/**
 * Trending posts cache middleware
 */
const trendingCache = cacheMiddleware({
  namespace: 'trending',
  keyGenerator: (req) => {
    const { timeframe = '24h', limit = 10 } = req.query;
    return `posts:${timeframe}:${limit}`;
  },
  ttl: 600 // 10 minutes
});

/**
 * Community stats cache middleware
 */
const statsCache = cacheMiddleware({
  namespace: 'stats',
  keyGenerator: () => 'community',
  ttl: 600 // 10 minutes
});

/**
 * Search results cache middleware
 */
const searchCache = cacheMiddleware({
  namespace: 'search',
  keyGenerator: (req) => {
    const { q, category, sortBy = 'relevance', page = 1 } = req.query;
    return `${q}:${category || 'all'}:${sortBy}:${page}`;
  },
  ttl: 1800 // 30 minutes
});

/**
 * Cache invalidation middleware
 * Use this after operations that modify data
 */
const invalidateCache = (options = {}) => {
  const { patterns = [] } = options;

  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to invalidate cache after successful response
    res.json = function(data) {
      // Only invalidate on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300 && data && !data.error) {
        // Invalidate cache patterns
        patterns.forEach(async (pattern) => {
          try {
            if (typeof pattern === 'function') {
              await pattern(req, data);
            } else {
              await communityCache.cache.delPattern(pattern.namespace, pattern.key);
            }
          } catch (error) {
            logger.error('Cache invalidation error', { 
              pattern, 
              error: error.message 
            });
          }
        });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Post creation/update invalidation
 */
const invalidatePostCache = invalidateCache({
  patterns: [
    { namespace: 'posts', key: 'list:*' },
    { namespace: 'trending', key: '*' },
    { namespace: 'stats', key: 'community' },
    async (req, data) => {
      if (req.params.id) {
        await communityCache.invalidatePost(req.params.id);
      }
    }
  ]
});

/**
 * Comment creation/update invalidation
 */
const invalidateCommentCache = invalidateCache({
  patterns: [
    async (req, data) => {
      const postId = req.params.postId || req.body.postId;
      if (postId) {
        await communityCache.invalidateComments(postId);
        await communityCache.cache.delPattern('posts', 'list:*'); // Invalidate posts lists
      }
    }
  ]
});

/**
 * Vote invalidation
 */
const invalidateVoteCache = invalidateCache({
  patterns: [
    async (req, data) => {
      const postId = req.params.postId || req.body.postId;
      if (postId) {
        await communityCache.invalidateVotes(postId);
        await communityCache.cache.delPattern('posts', 'list:*'); // Invalidate posts lists
        await communityCache.cache.delPattern('trending', '*'); // Invalidate trending
      }
    }
  ]
});

/**
 * User profile invalidation
 */
const invalidateUserCache = invalidateCache({
  patterns: [
    async (req, data) => {
      const userId = req.params.userId || req.user?.id;
      if (userId) {
        await communityCache.cache.del('users', `profile:${userId}`);
        await communityCache.cache.del('users', `reputation:${userId}`);
      }
    }
  ]
});

/**
 * Rate limiting with Redis
 */
const rateLimitCache = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    keyGenerator = (req) => req.ip
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const windowSeconds = Math.floor(windowMs / 1000);
      
      // Increment counter
      const current = await communityCache.cache.incr('ratelimit', key, windowSeconds);
      
      // Set headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - current),
        'X-RateLimit-Reset': new Date(Date.now() + windowMs)
      });
      
      // Check if limit exceeded
      if (current > max) {
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`
        });
      }
      
      next();
    } catch (error) {
      logger.error('Rate limit error', { error: error.message });
      next(); // Continue without rate limiting on error
    }
  };
};

module.exports = {
  cacheMiddleware,
  postsListCache,
  postCache,
  commentsCache,
  userProfileCache,
  voteStatsCache,
  trendingCache,
  statsCache,
  searchCache,
  invalidatePostCache,
  invalidateCommentCache,
  invalidateVoteCache,
  invalidateUserCache,
  rateLimitCache
};
