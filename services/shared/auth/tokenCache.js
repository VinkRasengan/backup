/**
 * JWT Token Cache
 * Implements distributed token caching to reduce Auth Service dependencies
 */

const Redis = require('redis');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenCache {
  constructor(options = {}) {
    this.redisClient = null;
    this.localCache = new Map();
    this.maxLocalCacheSize = options.maxLocalCacheSize || 1000;
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET;
    this.enableLocalCache = options.enableLocalCache !== false;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      localHits: 0,
      redisHits: 0,
      sets: 0,
      deletes: 0
    };

    this.initializeRedis(options.redis);
    this.startCleanupTimer();
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis(redisConfig = {}) {
    try {
      this.redisClient = Redis.createClient({
        host: redisConfig.host || process.env.REDIS_HOST || 'localhost',
        port: redisConfig.port || process.env.REDIS_PORT || 6379,
        password: redisConfig.password || process.env.REDIS_PASSWORD,
        db: redisConfig.db || 2 // Use different DB for token cache
      });

      this.redisClient.on('error', (err) => {
        console.error('Redis error in TokenCache:', err);
      });

      await this.redisClient.connect();
      console.log('TokenCache connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis for token cache:', error);
    }
  }

  /**
   * Generate cache key for token
   */
  generateCacheKey(token) {
    return `token:${crypto.createHash('sha256').update(token).digest('hex')}`;
  }

  /**
   * Generate cache key for user
   */
  generateUserCacheKey(userId) {
    return `user:${userId}`;
  }

  /**
   * Cache token validation result
   */
  async cacheToken(token, userData, ttl = null) {
    try {
      const cacheKey = this.generateCacheKey(token);
      const userCacheKey = this.generateUserCacheKey(userData.id);
      const cacheTTL = ttl || this.defaultTTL;
      
      const cacheData = {
        userId: userData.id,
        email: userData.email,
        name: userData.name || userData.displayName,
        roles: userData.roles || ['user'],
        permissions: userData.permissions || [],
        emailVerified: userData.emailVerified || false,
        cachedAt: Date.now(),
        expiresAt: Date.now() + (cacheTTL * 1000)
      };

      // Cache in Redis
      if (this.redisClient) {
        await this.redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(cacheData));
        await this.redisClient.setEx(userCacheKey, cacheTTL, JSON.stringify(cacheData));
      }

      // Cache locally
      if (this.enableLocalCache) {
        this.setLocalCache(cacheKey, cacheData);
        this.setLocalCache(userCacheKey, cacheData);
      }

      this.cacheStats.sets++;
      console.log('Token cached successfully', { userId: userData.id, ttl: cacheTTL });
    } catch (error) {
      console.error('Error caching token:', error);
    }
  }

  /**
   * Get cached token data
   */
  async getCachedToken(token) {
    try {
      const cacheKey = this.generateCacheKey(token);
      
      // Try local cache first
      if (this.enableLocalCache) {
        const localData = this.getLocalCache(cacheKey);
        if (localData) {
          this.cacheStats.hits++;
          this.cacheStats.localHits++;
          return localData;
        }
      }

      // Try Redis cache
      if (this.redisClient) {
        const redisData = await this.redisClient.get(cacheKey);
        if (redisData) {
          const parsedData = JSON.parse(redisData);
          
          // Update local cache
          if (this.enableLocalCache) {
            this.setLocalCache(cacheKey, parsedData);
          }
          
          this.cacheStats.hits++;
          this.cacheStats.redisHits++;
          return parsedData;
        }
      }

      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error('Error getting cached token:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Get cached user data
   */
  async getCachedUser(userId) {
    try {
      const userCacheKey = this.generateUserCacheKey(userId);
      
      // Try local cache first
      if (this.enableLocalCache) {
        const localData = this.getLocalCache(userCacheKey);
        if (localData) {
          this.cacheStats.hits++;
          this.cacheStats.localHits++;
          return localData;
        }
      }

      // Try Redis cache
      if (this.redisClient) {
        const redisData = await this.redisClient.get(userCacheKey);
        if (redisData) {
          const parsedData = JSON.parse(redisData);
          
          // Update local cache
          if (this.enableLocalCache) {
            this.setLocalCache(userCacheKey, parsedData);
          }
          
          this.cacheStats.hits++;
          this.cacheStats.redisHits++;
          return parsedData;
        }
      }

      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error('Error getting cached user:', error);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Invalidate token cache
   */
  async invalidateToken(token) {
    try {
      const cacheKey = this.generateCacheKey(token);
      
      // Remove from Redis
      if (this.redisClient) {
        await this.redisClient.del(cacheKey);
      }

      // Remove from local cache
      if (this.enableLocalCache) {
        this.localCache.delete(cacheKey);
      }

      this.cacheStats.deletes++;
      console.log('Token invalidated from cache');
    } catch (error) {
      console.error('Error invalidating token:', error);
    }
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId) {
    try {
      const userCacheKey = this.generateUserCacheKey(userId);
      
      // Remove from Redis
      if (this.redisClient) {
        await this.redisClient.del(userCacheKey);
        
        // Also remove all tokens for this user
        const tokenKeys = await this.redisClient.keys(`token:*`);
        for (const tokenKey of tokenKeys) {
          const tokenData = await this.redisClient.get(tokenKey);
          if (tokenData) {
            const parsed = JSON.parse(tokenData);
            if (parsed.userId === userId) {
              await this.redisClient.del(tokenKey);
            }
          }
        }
      }

      // Remove from local cache
      if (this.enableLocalCache) {
        this.localCache.delete(userCacheKey);
        
        // Remove user's tokens from local cache
        for (const [key, value] of this.localCache) {
          if (value.userId === userId) {
            this.localCache.delete(key);
          }
        }
      }

      this.cacheStats.deletes++;
      console.log('User cache invalidated', { userId });
    } catch (error) {
      console.error('Error invalidating user cache:', error);
    }
  }

  /**
   * Validate JWT token locally
   */
  validateJWTLocally(token) {
    try {
      if (!this.jwtSecret) {
        return { valid: false, reason: 'JWT secret not configured' };
      }

      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Check expiration
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, reason: 'Token expired' };
      }

      return {
        valid: true,
        decoded,
        userId: decoded.sub || decoded.userId || decoded.id,
        email: decoded.email,
        roles: decoded.roles || ['user'],
        permissions: decoded.permissions || []
      };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Set local cache with size management
   */
  setLocalCache(key, data) {
    // Remove oldest entries if cache is full
    if (this.localCache.size >= this.maxLocalCacheSize) {
      const firstKey = this.localCache.keys().next().value;
      this.localCache.delete(firstKey);
    }

    this.localCache.set(key, {
      ...data,
      localCachedAt: Date.now()
    });
  }

  /**
   * Get from local cache with expiration check
   */
  getLocalCache(key) {
    const data = this.localCache.get(key);
    if (!data) return null;

    // Check if expired
    if (data.expiresAt && Date.now() > data.expiresAt) {
      this.localCache.delete(key);
      return null;
    }

    return data;
  }

  /**
   * Start cleanup timer for expired local cache entries
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupLocalCache();
    }, 60000); // Cleanup every minute
  }

  /**
   * Cleanup expired local cache entries
   */
  cleanupLocalCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, data] of this.localCache) {
      if (data.expiresAt && now > data.expiresAt) {
        this.localCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired local cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.cacheStats,
      hitRate: `${hitRate}%`,
      localCacheSize: this.localCache.size,
      maxLocalCacheSize: this.maxLocalCacheSize,
      redisConnected: !!this.redisClient
    };
  }

  /**
   * Clear all caches
   */
  async clearAll() {
    try {
      // Clear Redis
      if (this.redisClient) {
        const keys = await this.redisClient.keys('token:*');
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
        
        const userKeys = await this.redisClient.keys('user:*');
        if (userKeys.length > 0) {
          await this.redisClient.del(userKeys);
        }
      }

      // Clear local cache
      this.localCache.clear();

      console.log('All token caches cleared');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const health = {
        localCache: {
          status: 'healthy',
          size: this.localCache.size,
          maxSize: this.maxLocalCacheSize
        },
        redisCache: {
          status: 'unknown'
        },
        stats: this.getStats()
      };

      if (this.redisClient) {
        try {
          await this.redisClient.ping();
          health.redisCache.status = 'healthy';
        } catch (error) {
          health.redisCache.status = 'unhealthy';
          health.redisCache.error = error.message;
        }
      } else {
        health.redisCache.status = 'not_connected';
      }

      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Disconnect
   */
  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

module.exports = TokenCache;
