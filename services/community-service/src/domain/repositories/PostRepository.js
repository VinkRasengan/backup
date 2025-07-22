/**
 * Post Aggregate Repository
 * Handles persistence and retrieval of Post aggregates using Event Sourcing
 */

const PostAggregate = require('../aggregates/PostAggregate');
const EventStoreClient = require('../../utils/eventStoreClient');
const logger = require('../../utils/logger');

class PostRepository {
  constructor(config = {}) {
    this.eventStoreClient = new EventStoreClient({
      serviceName: 'community-service',
      ...config
    });
    
    this.snapshotFrequency = config.snapshotFrequency || 100;
    this.aggregateCache = new Map(); // Simple in-memory cache
    this.cacheTimeout = config.cacheTimeout || 300000; // 5 minutes
    
    this.stats = {
      aggregatesLoaded: 0,
      aggregatesSaved: 0,
      snapshotsCreated: 0,
      snapshotsLoaded: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Get aggregate by ID
   */
  async getById(postId) {
    try {
      // Check cache first
      const cached = this.getCachedAggregate(postId);
      if (cached) {
        this.stats.cacheHits++;
        logger.debug('Post aggregate loaded from cache', { postId });
        return cached;
      }
      
      this.stats.cacheMisses++;
      
      // Try to load from snapshot first
      const snapshotResult = await this.loadFromSnapshot(postId);
      let aggregate = snapshotResult.aggregate;
      let fromVersion = snapshotResult.fromVersion;
      
      // Load events since snapshot (or from beginning if no snapshot)
      const streamName = `post-${postId}`;
      const eventsResult = await this.eventStoreClient.readStream(streamName, {
        fromRevision: fromVersion,
        direction: 'forwards',
        maxCount: 1000,
        includeMetadata: true
      });
      
      if (!eventsResult.success) {
        if (eventsResult.error.includes('not found') || eventsResult.events?.length === 0) {
          return null; // Aggregate doesn't exist
        }
        throw new Error(`Failed to load events: ${eventsResult.error}`);
      }
      
      // If no snapshot and no events, aggregate doesn't exist
      if (!aggregate && eventsResult.events.length === 0) {
        return null;
      }
      
      // Rebuild aggregate from events
      if (aggregate) {
        // Apply events since snapshot
        eventsResult.events.forEach(event => {
          aggregate.applyEvent(event, false);
        });
      } else {
        // Rebuild from all events
        aggregate = PostAggregate.fromHistory(eventsResult.events);
      }
      
      // Cache the aggregate
      this.cacheAggregate(postId, aggregate);
      
      this.stats.aggregatesLoaded++;
      logger.debug('Post aggregate loaded successfully', {
        postId,
        version: aggregate.version,
        eventsApplied: eventsResult.events.length,
        fromSnapshot: !!snapshotResult.aggregate
      });
      
      return aggregate;
      
    } catch (error) {
      logger.error('Failed to load post aggregate', {
        postId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Save aggregate
   */
  async save(aggregate) {
    try {
      const uncommittedEvents = aggregate.getUncommittedEvents();
      
      if (uncommittedEvents.length === 0) {
        logger.debug('No uncommitted events to save', { postId: aggregate.id });
        return { success: true, eventsAppended: 0 };
      }
      
      const streamName = `post-${aggregate.id}`;
      const results = [];
      
      // Append each event to the stream
      for (const event of uncommittedEvents) {
        const result = await this.eventStoreClient.appendEvent(
          streamName,
          event.type,
          event.data,
          {
            ...event.metadata,
            aggregateId: aggregate.id,
            aggregateType: 'Post',
            version: event.metadata.version
          }
        );
        
        if (!result.success) {
          throw new Error(`Failed to append event: ${result.error}`);
        }
        
        results.push(result);
      }
      
      // Mark events as committed
      aggregate.markEventsAsCommitted();
      
      // Create snapshot if needed
      if (aggregate.needsSnapshot(this.snapshotFrequency)) {
        await this.createSnapshot(aggregate);
      }
      
      // Update cache
      this.cacheAggregate(aggregate.id, aggregate);
      
      this.stats.aggregatesSaved++;
      logger.info('Post aggregate saved successfully', {
        postId: aggregate.id,
        version: aggregate.version,
        eventsAppended: uncommittedEvents.length
      });
      
      return {
        success: true,
        eventsAppended: uncommittedEvents.length,
        results
      };
      
    } catch (error) {
      logger.error('Failed to save post aggregate', {
        postId: aggregate.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create snapshot for aggregate
   */
  async createSnapshot(aggregate) {
    try {
      const snapshot = aggregate.getSnapshot();
      
      const result = await this.eventStoreClient.createSnapshot(
        'Post',
        aggregate.id,
        snapshot,
        aggregate.version
      );
      
      if (result.success) {
        this.stats.snapshotsCreated++;
        logger.info('Snapshot created for post aggregate', {
          postId: aggregate.id,
          version: aggregate.version
        });
      } else {
        logger.warn('Failed to create snapshot', {
          postId: aggregate.id,
          error: result.error
        });
      }
      
      return result;
      
    } catch (error) {
      logger.error('Error creating snapshot', {
        postId: aggregate.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Load aggregate from snapshot
   */
  async loadFromSnapshot(postId) {
    try {
      const result = await this.eventStoreClient.loadSnapshot('Post', postId);
      
      if (!result.success) {
        if (result.reason === 'Snapshot not found') {
          return { aggregate: null, fromVersion: 'start' };
        }
        throw new Error(`Failed to load snapshot: ${result.error}`);
      }
      
      // Reconstruct aggregate from snapshot
      const aggregate = new PostAggregate(postId);
      const snapshot = result.snapshot;
      
      // Apply snapshot state
      aggregate.id = snapshot.id;
      aggregate.version = snapshot.version;
      aggregate.title = snapshot.title;
      aggregate.content = snapshot.content;
      aggregate.authorId = snapshot.authorId;
      aggregate.category = snapshot.category;
      aggregate.tags = snapshot.tags;
      aggregate.url = snapshot.url;
      aggregate.status = snapshot.status;
      aggregate.createdAt = snapshot.createdAt;
      aggregate.updatedAt = snapshot.updatedAt;
      aggregate.voteCount = snapshot.voteCount;
      aggregate.upvotes = snapshot.upvotes;
      aggregate.downvotes = snapshot.downvotes;
      aggregate.commentCount = snapshot.commentCount;
      aggregate.isDeleted = snapshot.isDeleted;
      
      this.stats.snapshotsLoaded++;
      logger.debug('Aggregate loaded from snapshot', {
        postId,
        version: aggregate.version
      });
      
      return {
        aggregate,
        fromVersion: aggregate.version + 1
      };
      
    } catch (error) {
      logger.error('Error loading from snapshot', {
        postId,
        error: error.message
      });
      return { aggregate: null, fromVersion: 'start' };
    }
  }

  /**
   * Check if aggregate exists
   */
  async exists(postId) {
    try {
      const aggregate = await this.getById(postId);
      return aggregate !== null && !aggregate.isDeleted;
    } catch (error) {
      logger.error('Error checking if post exists', {
        postId,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get aggregate version
   */
  async getVersion(postId) {
    try {
      const aggregate = await this.getById(postId);
      return aggregate ? aggregate.version : 0;
    } catch (error) {
      logger.error('Error getting post version', {
        postId,
        error: error.message
      });
      return 0;
    }
  }

  /**
   * Get repository statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.aggregateCache.size,
      eventStoreClient: this.eventStoreClient.getClientStats()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const eventStoreHealth = await this.eventStoreClient.healthCheck();
      
      return {
        status: eventStoreHealth.success ? 'healthy' : 'unhealthy',
        eventStore: eventStoreHealth,
        repository: {
          cacheSize: this.aggregateCache.size,
          stats: this.stats
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Cache aggregate
   */
  cacheAggregate(postId, aggregate) {
    this.aggregateCache.set(postId, {
      aggregate: aggregate,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Get cached aggregate
   */
  getCachedAggregate(postId) {
    const cached = this.aggregateCache.get(postId);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache entry is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.aggregateCache.delete(postId);
      return null;
    }
    
    return cached.aggregate;
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    
    for (const [postId, cached] of this.aggregateCache.entries()) {
      if (now - cached.timestamp > this.cacheTimeout) {
        this.aggregateCache.delete(postId);
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.aggregateCache.clear();
    logger.info('Post repository cache cleared');
  }
}

module.exports = PostRepository;
