/**
 * Database Query Optimization Utility
 * Provides optimized query patterns and performance monitoring for Firestore
 */

const Logger = require('./logger');

class QueryOptimizer {
  constructor(serviceName = 'unknown') {
    this.serviceName = serviceName;
    this.logger = new Logger(serviceName);
    this.queryMetrics = new Map();
  }

  /**
   * Create an optimized paginated query
   * @param {Object} collection - Firestore collection reference
   * @param {Object} options - Query options
   * @returns {Object} Query result with pagination info
   */
  async paginatedQuery(collection, options = {}) {
    const {
      filters = [],
      orderBy = [],
      limit = 20,
      startAfter = null,
      maxLimit = 100
    } = options;

    const startTime = Date.now();
    const queryId = this.generateQueryId(collection.path, filters, orderBy);

    try {
      // Enforce maximum limit for performance
      const safeLimit = Math.min(limit, maxLimit);

      // Build query
      let query = collection;

      // Apply filters
      filters.forEach(filter => {
        const { field, operator, value } = filter;
        if (value !== undefined && value !== null && value !== '') {
          query = query.where(field, operator, value);
        }
      });

      // Apply ordering
      orderBy.forEach(order => {
        const { field, direction = 'asc' } = order;
        query = query.orderBy(field, direction);
      });

      // Apply pagination
      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      query = query.limit(safeLimit);

      // Execute query
      const snapshot = await query.get();
      const duration = Date.now() - startTime;

      // Log performance metrics
      this.recordQueryMetrics(queryId, duration, snapshot.size);

      // Process results
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Determine if there are more results
      const hasMore = items.length === safeLimit;
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        items,
        pagination: {
          hasMore,
          lastDoc,
          count: items.length,
          limit: safeLimit
        },
        performance: {
          duration,
          queryId
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Paginated query failed', {
        queryId,
        duration,
        error: error.message,
        collection: collection.path
      });
      throw error;
    }
  }

  /**
   * Execute a batch read operation
   * @param {Array} docRefs - Array of document references
   * @returns {Array} Array of document data
   */
  async batchRead(docRefs) {
    const startTime = Date.now();
    const batchSize = 500; // Firestore batch limit

    try {
      const results = [];
      
      // Process in batches
      for (let i = 0; i < docRefs.length; i += batchSize) {
        const batch = docRefs.slice(i, i + batchSize);
        const batchPromises = batch.map(ref => ref.get());
        const batchResults = await Promise.all(batchPromises);
        
        const batchData = batchResults
          .filter(doc => doc.exists)
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        
        results.push(...batchData);
      }

      const duration = Date.now() - startTime;
      this.logger.info('Batch read completed', {
        totalDocs: docRefs.length,
        resultCount: results.length,
        duration
      });

      return results;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Batch read failed', {
        totalDocs: docRefs.length,
        duration,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute an optimized count query
   * @param {Object} collection - Firestore collection reference
   * @param {Array} filters - Array of filter objects
   * @returns {number} Document count
   */
  async countDocuments(collection, filters = []) {
    const startTime = Date.now();

    try {
      let query = collection;

      // Apply filters
      filters.forEach(filter => {
        const { field, operator, value } = filter;
        if (value !== undefined && value !== null && value !== '') {
          query = query.where(field, operator, value);
        }
      });

      // Use count() if available (Firestore v9+), otherwise estimate
      if (query.count) {
        const countSnapshot = await query.count().get();
        const count = countSnapshot.data().count;
        
        const duration = Date.now() - startTime;
        this.logger.debug('Count query completed', { count, duration });
        
        return count;
      } else {
        // Fallback: get documents and count (less efficient)
        const snapshot = await query.get();
        const count = snapshot.size;
        
        const duration = Date.now() - startTime;
        this.logger.warn('Using fallback count method', { count, duration });
        
        return count;
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Count query failed', {
        duration,
        error: error.message,
        collection: collection.path
      });
      throw error;
    }
  }

  /**
   * Execute a transaction with retry logic
   * @param {Object} db - Firestore database instance
   * @param {Function} updateFunction - Transaction update function
   * @param {Object} options - Transaction options
   * @returns {*} Transaction result
   */
  async executeTransaction(db, updateFunction, options = {}) {
    const { maxRetries = 3, retryDelay = 100 } = options;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await db.runTransaction(updateFunction);
        const duration = Date.now() - startTime;
        
        this.logger.info('Transaction completed', {
          attempt,
          duration,
          success: true
        });
        
        return result;

      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (attempt === maxRetries) {
          this.logger.error('Transaction failed after all retries', {
            attempts: maxRetries,
            duration,
            error: error.message
          });
          throw error;
        }

        this.logger.warn('Transaction attempt failed, retrying', {
          attempt,
          error: error.message,
          nextRetryIn: retryDelay * attempt
        });

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  /**
   * Generate a unique query ID for metrics tracking
   * @param {string} collectionPath - Collection path
   * @param {Array} filters - Query filters
   * @param {Array} orderBy - Order by clauses
   * @returns {string} Query ID
   */
  generateQueryId(collectionPath, filters, orderBy) {
    const filterStr = filters.map(f => `${f.field}${f.operator}${f.value}`).join('|');
    const orderStr = orderBy.map(o => `${o.field}:${o.direction}`).join('|');
    return `${collectionPath}:${filterStr}:${orderStr}`;
  }

  /**
   * Record query performance metrics
   * @param {string} queryId - Query identifier
   * @param {number} duration - Query duration in ms
   * @param {number} resultCount - Number of results returned
   */
  recordQueryMetrics(queryId, duration, resultCount) {
    if (!this.queryMetrics.has(queryId)) {
      this.queryMetrics.set(queryId, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        totalResults: 0
      });
    }

    const metrics = this.queryMetrics.get(queryId);
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.avgDuration = metrics.totalDuration / metrics.count;
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.totalResults += resultCount;

    // Log slow queries
    if (duration > 1000) {
      this.logger.warn('Slow query detected', {
        queryId,
        duration,
        resultCount,
        avgDuration: metrics.avgDuration
      });
    }
  }

  /**
   * Get query performance metrics
   * @returns {Object} Performance metrics
   */
  getQueryMetrics() {
    const metrics = {};
    for (const [queryId, data] of this.queryMetrics.entries()) {
      metrics[queryId] = { ...data };
    }
    return metrics;
  }

  /**
   * Clear query metrics
   */
  clearMetrics() {
    this.queryMetrics.clear();
    this.logger.info('Query metrics cleared');
  }
}

module.exports = QueryOptimizer;
