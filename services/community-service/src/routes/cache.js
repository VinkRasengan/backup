/**
 * Cache Management Routes
 * Admin routes for cache monitoring and management
 */

const express = require('express');
const { communityCache } = require('../utils/communityCache');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Get cache health and statistics
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = await communityCache.getCacheMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get cache health', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get cache health'
    });
  }
});

/**
 * Get detailed cache statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = communityCache.cache.getStats();
    const health = await communityCache.cache.healthCheck();
    
    res.json({
      success: true,
      data: {
        stats,
        health,
        namespaces: Object.values(communityCache.NAMESPACE),
        ttlConfig: communityCache.TTL
      }
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    });
  }
});

/**
 * Clear specific cache namespace
 */
router.delete('/clear/:namespace', async (req, res) => {
  try {
    const { namespace } = req.params;
    const { pattern = '*' } = req.query;
    
    // Validate namespace
    if (!Object.values(communityCache.NAMESPACE).includes(namespace)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid namespace',
        validNamespaces: Object.values(communityCache.NAMESPACE)
      });
    }
    
    await communityCache.cache.delPattern(namespace, pattern);
    
    logger.info('Cache cleared', { namespace, pattern });
    
    res.json({
      success: true,
      message: `Cache cleared for namespace: ${namespace}`,
      namespace,
      pattern
    });
  } catch (error) {
    logger.error('Failed to clear cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

/**
 * Clear all cache
 */
router.delete('/clear-all', async (req, res) => {
  try {
    await communityCache.clearAllCache();
    
    logger.info('All cache cleared');
    
    res.json({
      success: true,
      message: 'All cache cleared successfully'
    });
  } catch (error) {
    logger.error('Failed to clear all cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to clear all cache'
    });
  }
});

/**
 * Warm up cache with popular content
 */
router.post('/warmup', async (req, res) => {
  try {
    const { posts = [], users = [] } = req.body;
    
    await communityCache.warmUpCache(posts, users);
    
    logger.info('Cache warmed up', { 
      postsCount: posts.length, 
      usersCount: users.length 
    });
    
    res.json({
      success: true,
      message: 'Cache warmed up successfully',
      warmedUp: {
        posts: posts.length,
        users: users.length
      }
    });
  } catch (error) {
    logger.error('Failed to warm up cache', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to warm up cache'
    });
  }
});

/**
 * Get cache key information
 */
router.get('/key/:namespace/:key', async (req, res) => {
  try {
    const { namespace, key } = req.params;
    
    // Validate namespace
    if (!Object.values(communityCache.NAMESPACE).includes(namespace)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid namespace',
        validNamespaces: Object.values(communityCache.NAMESPACE)
      });
    }
    
    const data = await communityCache.cache.get(namespace, key);
    
    res.json({
      success: true,
      data: {
        namespace,
        key,
        exists: data !== null,
        data: data,
        cachedAt: data?.cachedAt || null
      }
    });
  } catch (error) {
    logger.error('Failed to get cache key', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get cache key'
    });
  }
});

/**
 * Set cache key manually (for testing)
 */
router.post('/key/:namespace/:key', async (req, res) => {
  try {
    const { namespace, key } = req.params;
    const { data, ttl } = req.body;
    
    // Validate namespace
    if (!Object.values(communityCache.NAMESPACE).includes(namespace)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid namespace',
        validNamespaces: Object.values(communityCache.NAMESPACE)
      });
    }
    
    const cacheTTL = ttl || communityCache.TTL[namespace.toUpperCase()] || 300;
    await communityCache.cache.set(namespace, key, data, cacheTTL);
    
    logger.info('Cache key set manually', { namespace, key, ttl: cacheTTL });
    
    res.json({
      success: true,
      message: 'Cache key set successfully',
      namespace,
      key,
      ttl: cacheTTL
    });
  } catch (error) {
    logger.error('Failed to set cache key', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to set cache key'
    });
  }
});

/**
 * Delete specific cache key
 */
router.delete('/key/:namespace/:key', async (req, res) => {
  try {
    const { namespace, key } = req.params;
    
    // Validate namespace
    if (!Object.values(communityCache.NAMESPACE).includes(namespace)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid namespace',
        validNamespaces: Object.values(communityCache.NAMESPACE)
      });
    }
    
    await communityCache.cache.del(namespace, key);
    
    logger.info('Cache key deleted', { namespace, key });
    
    res.json({
      success: true,
      message: 'Cache key deleted successfully',
      namespace,
      key
    });
  } catch (error) {
    logger.error('Failed to delete cache key', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to delete cache key'
    });
  }
});

/**
 * Test Redis connection
 */
router.get('/test-connection', async (req, res) => {
  try {
    const health = await communityCache.cache.healthCheck();
    
    res.json({
      success: true,
      data: {
        connection: health,
        message: health.overall === 'healthy' 
          ? 'Redis connection is healthy' 
          : 'Redis connection has issues, using fallback'
      }
    });
  } catch (error) {
    logger.error('Failed to test Redis connection', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to test Redis connection'
    });
  }
});

module.exports = router;
