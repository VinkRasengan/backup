const redis = require('redis');
const logger = require('../utils/logger');

/**
 * Unified Cache Manager with Redis + In-Memory Fallback
 * Features:
 * - Redis as primary cache
 * - In-memory Map as fallback when Redis fails
 * - Auto-retry and recovery
 * - Graceful degradation
 */
class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 300; // 5 minutes default TTL
    this.memoryCache = new Map(); // Fallback in-memory cache
    this.memoryCacheTTL = new Map(); // TTL tracking for memory cache
    this.maxMemoryEntries = 1000; // Limit memory cache size
    this.retryAttempts = 0;
    this.maxRetryAttempts = 5;
    this.retryDelay = 5000; // 5 seconds
    this.cleanupInterval = null;
    
    // Stats tracking
    this.stats = {
      redisHits: 0,
      memoryHits: 0,
      misses: 0,
      errors: 0,
      operations: 0
    };
    
    this.initializeMemoryCleanup();
  }

  /**
   * Initialize Redis connection with improved configuration
   */
  async connect() {
    // Skip Redis connection if not available or disabled, use memory cache only
    if (!process.env.REDIS_URL || process.env.REDIS_DISABLED === 'true') {
      logger.info('Redis URL not configured or disabled, using memory cache only');
      this.isConnected = false;
      return;
    }

    // For Render deployment, skip Redis if localhost is configured
    if (process.env.REDIS_HOST === 'localhost' && process.env.NODE_ENV === 'production') {
      logger.info('Redis localhost detected in production, using memory cache only');
      this.isConnected = false;
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL;
      logger.info('Attempting Redis connection', { url: redisUrl.replace(/:[^:@]*@/, ':***@') });

      this.client = redis.createClient({
        url: redisUrl,
        // Improved retry strategy for Redis v4+
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) { // Reduced retries for faster fallback
              logger.error('Redis max reconnection attempts reached, falling back to memory cache');
              this.isConnected = false;
              return new Error('Max reconnection attempts reached');
            }
            const delay = Math.min(retries * 500, 2000);
            logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          },
          connectTimeout: 5000, // Reduced timeout for faster fallback
          lazyConnect: true
        }
      });

      // Event handlers
      this.client.on('error', (err) => {
        logger.error('Redis client error, falling back to memory cache', { error: err.message });
        this.isConnected = false;
        this.stats.errors++;
        // Gracefully fallback to memory cache
        this.client = null;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
        this.retryAttempts = 0;
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('Redis client connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      // Try to connect to Redis with timeout
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000);
      });

      await Promise.race([connectPromise, timeoutPromise]);
      logger.info('Cache manager initialized with Redis');

    } catch (error) {
      logger.error('Failed to connect to Redis, using memory cache only', {
        error: error.message
      });
      this.isConnected = false;
      // Don't schedule retry to avoid blocking service startup
    }
  }

  /**
   * Schedule retry connection to Redis
   */
  scheduleRetry() {
    if (this.retryAttempts >= this.maxRetryAttempts) {
      logger.warn('Max Redis retry attempts reached, using memory cache only');
      return;
    }

    this.retryAttempts++;
    const delay = this.retryDelay * this.retryAttempts;
    
    setTimeout(async () => {
      logger.info(`Attempting Redis reconnection (${this.retryAttempts}/${this.maxRetryAttempts})`);
      await this.connect();
    }, delay);
  }

  /**
   * Initialize memory cache cleanup interval
   */
  initializeMemoryCleanup() {
    // Skip cleanup interval in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => {
        this.cleanupMemoryCache();
      }, 60000); // Clean up every minute
    }
  }

  /**
   * Clean up expired entries in memory cache
   */
  cleanupMemoryCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, expiry] of this.memoryCacheTTL.entries()) {
      if (now > expiry) {
        this.memoryCache.delete(key);
        this.memoryCacheTTL.delete(key);
        cleanedCount++;
      }
    }

    // Limit memory cache size
    if (this.memoryCache.size > this.maxMemoryEntries) {
      const entries = Array.from(this.memoryCache.keys());
      const toDelete = entries.slice(0, this.memoryCache.size - this.maxMemoryEntries);
      toDelete.forEach(key => {
        this.memoryCache.delete(key);
        this.memoryCacheTTL.delete(key);
      });
      cleanedCount += toDelete.length;
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  async disconnect() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        logger.info('Redis cache manager disconnected');
      } catch (error) {
        logger.warn('Error disconnecting Redis', { error: error.message });
      }
    }
    
    this.isConnected = false;
    this.memoryCache.clear();
    this.memoryCacheTTL.clear();
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(namespace, key) {
    return `community:${namespace}:${key}`;
  }

  /**
   * Get cached data with Redis + Memory fallback
   */
  async get(namespace, key) {
    this.stats.operations++;
    const cacheKey = this.generateKey(namespace, key);

    // Try Redis first if connected
    if (this.isConnected && this.client) {
      try {
        const cached = await this.client.get(cacheKey);
        if (cached) {
          this.stats.redisHits++;
          logger.debug('Redis cache hit', { key: cacheKey });
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn('Redis get error, falling back to memory', { 
          error: error.message, 
          key: cacheKey 
        });
        this.stats.errors++;
      }
    }

    // Fallback to memory cache
    if (this.memoryCache.has(cacheKey)) {
      const expiry = this.memoryCacheTTL.get(cacheKey);
      if (Date.now() < expiry) {
        this.stats.memoryHits++;
        logger.debug('Memory cache hit', { key: cacheKey });
        return this.memoryCache.get(cacheKey);
      } else {
        // Expired, clean up
        this.memoryCache.delete(cacheKey);
        this.memoryCacheTTL.delete(cacheKey);
      }
    }

    this.stats.misses++;
    logger.debug('Cache miss', { key: cacheKey });
    return null;
  }

  /**
   * Set cached data in both Redis and Memory
   */
  async set(namespace, key, data, ttl = this.defaultTTL) {
    this.stats.operations++;
    const cacheKey = this.generateKey(namespace, key);

    // Always set in memory cache for fallback
    this.memoryCache.set(cacheKey, data);
    this.memoryCacheTTL.set(cacheKey, Date.now() + (ttl * 1000));

    // Try Redis if connected
    if (this.isConnected && this.client) {
      try {
        const serialized = JSON.stringify(data);
        await this.client.setEx(cacheKey, ttl, serialized);
        logger.debug('Cache set in Redis and Memory', { key: cacheKey, ttl });
        return true;
      } catch (error) {
        logger.warn('Redis set error, data saved in memory only', { 
          error: error.message, 
          key: cacheKey 
        });
        this.stats.errors++;
      }
    }

    logger.debug('Cache set in Memory only', { key: cacheKey, ttl });
    return true;
  }

  /**
   * Delete cached data
   */
  async del(namespace, key) {
    this.stats.operations++;
    const cacheKey = this.generateKey(namespace, key);

    // Delete from memory
    this.memoryCache.delete(cacheKey);
    this.memoryCacheTTL.delete(cacheKey);

    // Try Redis if connected
    if (this.isConnected && this.client) {
      try {
        await this.client.del(cacheKey);
        logger.debug('Cache deleted from Redis and Memory', { key: cacheKey });
        return true;
      } catch (error) {
        logger.warn('Redis delete error', { error: error.message, key: cacheKey });
        this.stats.errors++;
      }
    }

    logger.debug('Cache deleted from Memory only', { key: cacheKey });
    return true;
  }

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(namespace, pattern) {
    this.stats.operations++;
    const searchPattern = this.generateKey(namespace, pattern);

    // Delete from memory cache
    let memoryCount = 0;
    for (const key of this.memoryCache.keys()) {
      if (key.includes(searchPattern.replace('*', ''))) {
        this.memoryCache.delete(key);
        this.memoryCacheTTL.delete(key);
        memoryCount++;
      }
    }

    // Try Redis if connected
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(searchPattern);
        if (keys.length > 0) {
          await this.client.del(keys);
          logger.debug('Cache pattern deleted from Redis and Memory', { 
            pattern: searchPattern, 
            redisCount: keys.length,
            memoryCount 
          });
        }
        return true;
      } catch (error) {
        logger.warn('Redis pattern delete error', { 
          error: error.message, 
          pattern: searchPattern 
        });
        this.stats.errors++;
      }
    }

    logger.debug('Cache pattern deleted from Memory only', { 
      pattern: searchPattern, 
      memoryCount 
    });
    return true;
  }

  /**
   * Increment counter
   */
  async incr(namespace, key, ttl = this.defaultTTL) {
    this.stats.operations++;
    const cacheKey = this.generateKey(namespace, key);

    // Try Redis first if connected
    if (this.isConnected && this.client) {
      try {
        const value = await this.client.incr(cacheKey);
        if (value === 1) {
          await this.client.expire(cacheKey, ttl);
        }
        
        // Sync to memory cache
        this.memoryCache.set(cacheKey, value);
        this.memoryCacheTTL.set(cacheKey, Date.now() + (ttl * 1000));
        
        return value;
      } catch (error) {
        logger.warn('Redis incr error, using memory fallback', { 
          error: error.message, 
          key: cacheKey 
        });
        this.stats.errors++;
      }
    }

    // Memory fallback
    const current = this.memoryCache.get(cacheKey) || 0;
    const newValue = current + 1;
    this.memoryCache.set(cacheKey, newValue);
    this.memoryCacheTTL.set(cacheKey, Date.now() + (ttl * 1000));
    
    return newValue;
  }

  /**
   * Cache with automatic refresh
   */
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

  /**
   * Enhanced health check
   */
  async healthCheck() {
    // In test environment, always return healthy
    if (process.env.NODE_ENV === 'test') {
      return {
        redis: {
          connected: false,
          status: 'skipped',
          error: null,
          latency: null
        },
        memory: {
          entries: this.memoryCache.size,
          maxEntries: this.maxMemoryEntries,
          status: 'healthy'
        },
        stats: { ...this.stats },
        overall: 'healthy' // Always healthy in test
      };
    }

    const health = {
      redis: {
        connected: this.isConnected,
        status: 'disconnected',
        error: null,
        latency: null
      },
      memory: {
        entries: this.memoryCache.size,
        maxEntries: this.maxMemoryEntries,
        status: 'healthy'
      },
      stats: { ...this.stats },
      overall: 'degraded' // Default to degraded
    };

    // Test Redis if connected
    if (this.isConnected && this.client) {
      try {
        const start = Date.now();
        await this.client.ping();
        const latency = Date.now() - start;

        health.redis.status = 'connected';
        health.redis.latency = `${latency}ms`;
        health.overall = 'healthy';
      } catch (error) {
        health.redis.status = 'error';
        health.redis.error = error.message;
      }
    }

    // Memory cache is always available
    if (health.redis.status !== 'connected' && health.memory.entries >= 0) {
      health.overall = 'degraded'; // Using memory fallback
    }

    return health;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      redis: {
        connected: this.isConnected,
        retryAttempts: this.retryAttempts
      },
      memory: {
        entries: this.memoryCache.size,
        maxEntries: this.maxMemoryEntries,
        ttlEntries: this.memoryCacheTTL.size
      }
    };
  }

  /**
   * Clear all cache (Redis + Memory)
   */
  async clearAll() {
    this.stats.operations++;
    
    // Clear memory
    this.memoryCache.clear();
    this.memoryCacheTTL.clear();

    // Clear Redis if connected
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys('community:*');
        if (keys.length > 0) {
          await this.client.del(keys);
        }
        logger.info('All cache cleared (Redis + Memory)', { keysCleared: keys.length });
      } catch (error) {
        logger.warn('Redis clear error', { error: error.message });
        this.stats.errors++;
      }
    } else {
      logger.info('Memory cache cleared');
    }

    return true;
  }

  // Legacy methods for backward compatibility
  async invalidatePostsCache() {
    await this.delPattern('posts', '*');
    await this.delPattern('stats', 'posts:*');
    logger.info('Posts cache invalidated');
  }

  async invalidatePostCache(postId) {
    await this.del('posts', postId);
    await this.del('votes', `stats:${postId}`);
    await this.del('comments', `count:${postId}`);
    logger.info('Post cache invalidated', { postId });
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Enhanced cache middleware for Express routes
 */
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

/**
 * Simple in-memory cache for high-frequency data (like vote stats)
 */
class SimpleCache {
  constructor(defaultTTL = 30000) { // 30 seconds default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

module.exports = {
  cacheManager,
  cacheMiddleware,
  SimpleCache
};
