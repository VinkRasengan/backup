const redis = require('redis');
const Logger = require('../../../../shared/utils/logger');

const logger = new Logger('community-service');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            logger.warn('Redis connection refused, retrying...');
            return Math.min(options.attempt * 100, 3000);
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            logger.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            logger.error('Redis max retry attempts reached');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('Redis client connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('Cache manager initialized');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Cache manager disconnected');
    }
  }

  // Generate cache key with namespace
  generateKey(namespace, key) {
    return `community:${namespace}:${key}`;
  }

  // Get cached data
  async get(namespace, key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        logger.debug('Cache hit', { key: cacheKey });
        return JSON.parse(cached);
      }
      
      logger.debug('Cache miss', { key: cacheKey });
      return null;
    } catch (error) {
      logger.error('Cache get error', { error: error.message, namespace, key });
      return null;
    }
  }

  // Set cached data
  async set(namespace, key, data, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const serialized = JSON.stringify(data);
      
      await this.client.setEx(cacheKey, ttl, serialized);
      logger.debug('Cache set', { key: cacheKey, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error', { error: error.message, namespace, key });
      return false;
    }
  }

  // Delete cached data
  async del(namespace, key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      await this.client.del(cacheKey);
      logger.debug('Cache deleted', { key: cacheKey });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { error: error.message, namespace, key });
      return false;
    }
  }

  // Delete multiple keys by pattern
  async delPattern(namespace, pattern) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const searchPattern = this.generateKey(namespace, pattern);
      const keys = await this.client.keys(searchPattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug('Cache pattern deleted', { pattern: searchPattern, count: keys.length });
      }
      
      return true;
    } catch (error) {
      logger.error('Cache pattern delete error', { error: error.message, namespace, pattern });
      return false;
    }
  }

  // Increment counter
  async incr(namespace, key, ttl = this.defaultTTL) {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const cacheKey = this.generateKey(namespace, key);
      const value = await this.client.incr(cacheKey);
      
      if (value === 1) {
        // Set TTL only for new keys
        await this.client.expire(cacheKey, ttl);
      }
      
      return value;
    } catch (error) {
      logger.error('Cache increment error', { error: error.message, namespace, key });
      return 0;
    }
  }

  // Cache with automatic refresh
  async getOrSet(namespace, key, fetchFunction, ttl = this.defaultTTL) {
    // Try to get from cache first
    const cached = await this.get(namespace, key);
    if (cached !== null) {
      return cached;
    }

    try {
      // Fetch fresh data
      const freshData = await fetchFunction();
      
      // Cache the result
      await this.set(namespace, key, freshData, ttl);
      
      return freshData;
    } catch (error) {
      logger.error('Cache getOrSet error', { error: error.message, namespace, key });
      throw error;
    }
  }

  // Invalidate cache for posts (when new post is created or updated)
  async invalidatePostsCache() {
    await this.delPattern('posts', '*');
    await this.delPattern('stats', 'posts:*');
    logger.info('Posts cache invalidated');
  }

  // Invalidate cache for specific post
  async invalidatePostCache(postId) {
    await this.del('posts', postId);
    await this.del('votes', `stats:${postId}`);
    await this.del('comments', `count:${postId}`);
    logger.info('Post cache invalidated', { postId });
  }

  // Health check
  async healthCheck() {
    if (!this.isConnected || !this.client) {
      return { status: 'disconnected', error: 'Redis client not connected' };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'connected',
        latency: `${latency}ms`,
        connected: this.isConnected
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        connected: false
      };
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Cache middleware for Express routes
const cacheMiddleware = (namespace, keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    try {
      const key = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;
      const cached = await cacheManager.get(namespace, key);
      
      if (cached) {
        logger.debug('Serving from cache', { namespace, key });
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        // Cache successful responses only
        if (res.statusCode === 200 && data.success !== false) {
          cacheManager.set(namespace, key, data, ttl).catch(error => {
            logger.error('Failed to cache response', { error: error.message });
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

module.exports = {
  cacheManager,
  cacheMiddleware
};
