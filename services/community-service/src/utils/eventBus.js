/**
 * Enhanced Event Bus for community-service
 * Supports both EventStore persistence and Redis pub/sub
 */

const EventEmitter = require('events');
const redis = require('redis');
const logger = require('./logger');
const CommunityEventStore = require('../eventStore/eventStore');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

class EnhancedEventBus extends EventEmitter {
  constructor(serviceName = 'community-service') {
    super();
    this.serviceName = serviceName;
    this.events = []; // Local event storage
    this.isConnected = true;

    // Initialize EventStore
    this.eventStore = new CommunityEventStore();

    // Initialize Redis (optional)
    this.redisClient = null;
    this.redisSubscriber = null;
    this.redisEnabled = process.env.EVENT_BUS_REDIS_ENABLED === 'true';

    if (this.redisEnabled) {
      this.initializeRedis().catch(error => {
        logger.warn('Redis initialization failed, continuing without Redis', {
          error: error.message
        });
      });
    }
  }

  /**
   * Initialize Redis connections
   */
  async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://:antifraud123@localhost:6379';

      logger.info('Initializing Redis connections...', { url: redisUrl.replace(/:[^:@]*@/, ':***@') });

      // Publisher client
      this.redisClient = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            const delay = Math.min(retries * 100, 3000);
            logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
            return delay;
          },
          connectTimeout: 10000,
          lazyConnect: true
        }
      });

      this.redisClient.on('error', (error) => {
        logger.error('Redis client error', { error: error.message });
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.redisClient.on('ready', () => {
        logger.info('Redis client ready');
      });

      await this.redisClient.connect();

      // Subscriber client
      this.redisSubscriber = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 5) return new Error('Max reconnection attempts reached');
            return Math.min(retries * 100, 3000);
          },
          connectTimeout: 10000,
          lazyConnect: true
        }
      });

      this.redisSubscriber.on('error', (error) => {
        logger.error('Redis subscriber error', { error: error.message });
      });

      await this.redisSubscriber.connect();

      logger.info('✅ Redis connections established for EventBus');
    } catch (error) {
      logger.error('❌ Failed to initialize Redis', { error: error.message });
      this.redisEnabled = false;
    }
  }

  /**
   * Publish an event with EventStore persistence and Redis pub/sub
   */
  async publish(eventType, data, options = {}) {
    try {
      const event = {
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
        source: this.serviceName,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        correlationId: options.correlationId,
        causationId: options.causationId
      };

      // 1. Store in EventStore (persistent)
      const streamName = options.streamName || `${this.serviceName}-${eventType}`;
      const storeResult = await this.eventStore.appendEvent(
        streamName,
        eventType,
        data,
        {
          correlationId: event.correlationId,
          causationId: event.causationId,
          source: this.serviceName
        }
      );

      // 2. Store event locally for immediate access
      this.events.push({
        ...event,
        streamName,
        eventStoreResult: storeResult
      });

      // 3. Publish to Redis for cross-service communication
      if (this.redisEnabled && this.redisClient) {
        try {
          const channel = `events:${eventType}`;
          await this.redisClient.publish(channel, JSON.stringify(event));
          logger.debug('Event published to Redis', { channel, eventType });
        } catch (redisError) {
          logger.warn('Failed to publish to Redis, event still persisted', {
            eventType,
            error: redisError.message
          });
        }
      }

      // 4. Emit event locally
      this.emit('event', event);
      this.emit(eventType, event);

      logger.info('Event published successfully', {
        type: eventType,
        source: this.serviceName,
        eventId: event.id,
        persistent: storeResult.success,
        storeSource: storeResult.source
      });

      return {
        ...event,
        persistent: storeResult.success,
        storeResult
      };
    } catch (error) {
      logger.error('Failed to publish event', {
        error: error.message,
        type: eventType,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Subscribe to events (local and Redis)
   */
  async subscribe(eventPattern, handler) {
    try {
      // Local subscription
      this.on(eventPattern, handler);

      // Redis subscription for cross-service events
      if (this.redisEnabled && this.redisSubscriber) {
        const channel = `events:${eventPattern}`;
        await this.redisSubscriber.subscribe(channel, (message) => {
          try {
            const event = JSON.parse(message);
            // Only handle events from other services
            if (event.source !== this.serviceName) {
              handler(event);
              logger.debug('Cross-service event received', {
                eventType: event.type,
                source: event.source,
                handler: handler.name
              });
            }
          } catch (parseError) {
            logger.error('Failed to parse Redis event', {
              error: parseError.message,
              message
            });
          }
        });

        logger.info('Subscribed to events (local + Redis)', {
          pattern: eventPattern,
          channel
        });
      } else {
        logger.info('Subscribed to events (local only)', { pattern: eventPattern });
      }
    } catch (error) {
      logger.error('Failed to subscribe to events', {
        error: error.message,
        pattern: eventPattern
      });
    }
  }

  /**
   * Read events from EventStore
   */
  async readEvents(streamName, options = {}) {
    try {
      return await this.eventStore.readEvents(streamName, options);
    } catch (error) {
      logger.error('Failed to read events from EventStore', {
        streamName,
        error: error.message
      });
      return [];
    }
  }

  /**
   * Subscribe to EventStore stream
   */
  async subscribeToStream(streamName, handler, options = {}) {
    try {
      return await this.eventStore.subscribeToStream(streamName, handler, options);
    } catch (error) {
      logger.error('Failed to subscribe to EventStore stream', {
        streamName,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Create snapshot
   */
  async createSnapshot(streamName, aggregateId, snapshot, version) {
    try {
      return await this.eventStore.createSnapshot(streamName, aggregateId, snapshot, version);
    } catch (error) {
      logger.error('Failed to create snapshot', {
        streamName,
        aggregateId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(streamName, aggregateId) {
    try {
      return await this.eventStore.getLatestSnapshot(streamName, aggregateId);
    } catch (error) {
      logger.error('Failed to get snapshot', {
        streamName,
        aggregateId,
        error: error.message
      });
      return null;
    }
  }

  // Service-specific event publishers
  async publishAuthEvent(action, data) {
    return this.publish(`auth:${action}`, data);
  }

  async publishUserEvent(action, data) {
    return this.publish(`user:${action}`, data);
  }

  async publishCommunityEvent(action, data) {
    return this.publish(`community:${action}`, data);
  }

  async publishLinkEvent(action, data) {
    return this.publish(`link:${action}`, data);
  }

  async publishSystemEvent(action, data) {
    return this.publish(`system:${action}`, data);
  }

  // Service-specific event subscribers
  async subscribeToAuthEvents(handler) {
    return this.subscribe('auth:*', handler);
  }

  async subscribeToUserEvents(handler) {
    return this.subscribe('user:*', handler);
  }

  async subscribeToCommunityEvents(handler) {
    return this.subscribe('community:*', handler);
  }

  async subscribeToLinkEvents(handler) {
    return this.subscribe('link:*', handler);
  }

  async subscribeToSystemEvents(handler) {
    return this.subscribe('system:*', handler);
  }

  // Get stored events (for testing/monitoring)
  getEvents() {
    return this.events;
  }

  getMockEvents() {
    return this.events;
  }

  // Clear stored events
  clearEvents() {
    this.events = [];
  }

  /**
   * Get EventStore statistics
   */
  getEventStoreStats() {
    return this.eventStore.getStats();
  }

  /**
   * Health check
   */
  async healthCheck() {
    const eventStoreHealth = await this.eventStore.healthCheck();

    return {
      status: 'healthy',
      isConnected: this.isConnected,
      eventCount: this.events.length,
      serviceName: this.serviceName,
      eventStore: eventStoreHealth,
      redis: {
        enabled: this.redisEnabled,
        connected: this.redisClient?.isReady || false
      }
    };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      serviceName: this.serviceName,
      isConnected: this.isConnected,
      eventCount: this.events.length,
      lastEventTime: this.events.length > 0 ? this.events[this.events.length - 1].timestamp : null,
      eventStore: this.eventStore.getStats(),
      redis: {
        enabled: this.redisEnabled,
        connected: this.redisClient?.isReady || false
      }
    };
  }

  /**
   * Connection status
   */
  isEventBusConnected() {
    return this.isConnected;
  }

  /**
   * Disconnect (cleanup)
   */
  async disconnect() {
    try {
      // Disconnect Redis
      if (this.redisClient) {
        await this.redisClient.quit();
      }
      if (this.redisSubscriber) {
        await this.redisSubscriber.quit();
      }

      // Disconnect EventStore
      await this.eventStore.disconnect();

      // Clean up local state
      this.removeAllListeners();
      this.events = [];
      this.isConnected = false;

      logger.info('Enhanced Event bus disconnected', { serviceName: this.serviceName });
    } catch (error) {
      logger.error('Error during EventBus disconnect', {
        error: error.message,
        serviceName: this.serviceName
      });
    }
  }
}

module.exports = EnhancedEventBus;