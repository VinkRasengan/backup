/**
 * Event Bus Implementation using Redis Pub/Sub
 * Enables event-driven communication between microservices
 */

const Redis = require('redis');
const EventEmitter = require('events');
const KurrentEventStore = require('./kurrentEventStore');

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();

    // Support Redis Cloud URL format with fallback
    this.redisEnabled = false;
    this.mockMode = options.mockMode || false;

    if (process.env.REDIS_URL && !this.mockMode) {
      this.redisConfig = {
        url: process.env.REDIS_URL,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      };
      this.redisEnabled = true;
    } else if (!this.mockMode) {
      this.redisConfig = {
        host: options.host || process.env.REDIS_HOST || 'localhost',
        port: options.port || process.env.REDIS_PORT || 6379,
        password: options.password || process.env.REDIS_PASSWORD,
        username: options.username || process.env.REDIS_USERNAME || 'default',
        db: options.db || process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500)
        }
      };
      this.redisEnabled = true;
    }

    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.serviceName = options.serviceName || 'unknown-service';
    this.eventPrefix = options.eventPrefix || 'antifraud';

    // Initialize KurrentDB Event Store
    this.eventStore = new KurrentEventStore({
      database: `${this.serviceName}-events`
    });

    // Event patterns for different types
    this.eventPatterns = {
      USER: `${this.eventPrefix}:user:*`,
      AUTH: `${this.eventPrefix}:auth:*`,
      LINK: `${this.eventPrefix}:link:*`,
      COMMUNITY: `${this.eventPrefix}:community:*`,
      CHAT: `${this.eventPrefix}:chat:*`,
      NEWS: `${this.eventPrefix}:news:*`,
      ADMIN: `${this.eventPrefix}:admin:*`,
      SYSTEM: `${this.eventPrefix}:system:*`
    };

    // Mock event storage for fallback
    this.mockEventQueue = [];
    this.mockSubscriptions = new Map();

    this.connect();
  }

  /**
   * Connect to Redis with fallback to mock mode
   */
  async connect() {
    if (!this.redisEnabled) {
      // Mock mode - immediate connection
      this.isConnected = true;
      console.log(`EventBus connected for service: ${this.serviceName} (Mock Mode)`);
      this.emit('connected');
      return;
    }

    try {
      // Create publisher client
      this.publisher = Redis.createClient(this.redisConfig);
      this.publisher.on('error', (err) => {
        console.error('Redis Publisher Error:', err);
        this.fallbackToMockMode();
      });

      // Create subscriber client
      this.subscriber = Redis.createClient(this.redisConfig);
      this.subscriber.on('error', (err) => {
        console.error('Redis Subscriber Error:', err);
        this.fallbackToMockMode();
      });

      // Handle messages with proper error handling
      this.subscriber.on('message', (channel, message) => {
        try {
          this.handleMessage(channel, message);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

      this.subscriber.on('pmessage', (pattern, channel, message) => {
        try {
          this.handleMessage(channel, message, pattern);
        } catch (error) {
          console.error('Error handling pmessage:', error);
        }
      });

      await this.publisher.connect();
      await this.subscriber.connect();

      this.isConnected = true;
      console.log(`EventBus connected for service: ${this.serviceName}`);
      this.emit('connected');

    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.fallbackToMockMode();
    }
  }

  /**
   * Fallback to mock mode when Redis fails
   */
  fallbackToMockMode() {
    console.log(`EventBus falling back to mock mode for service: ${this.serviceName}`);
    this.redisEnabled = false;
    this.mockMode = true;
    this.isConnected = true;
    this.emit('connected');
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    try {
      if (this.publisher) {
        await this.publisher.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      this.isConnected = false;
      console.log(`EventBus disconnected for service: ${this.serviceName}`);
      this.emit('disconnected');
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }

  /**
   * Publish an event with fallback support
   */
  async publish(eventType, eventData, options = {}) {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }

    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: eventData,
      source: this.serviceName,
      timestamp: new Date().toISOString(),
      version: options.version || '1.0',
      correlationId: options.correlationId || null,
      metadata: options.metadata || {}
    };

    const channel = this.getChannelName(eventType);
    const message = JSON.stringify(event);

    try {
      // Store event in KurrentDB Event Store first
      await this.eventStore.appendEvent(event);

      if (this.redisEnabled && this.publisher) {
        // Publish to Redis pub/sub
        await this.publisher.publish(channel, message);
      } else {
        // Mock mode - store in memory queue
        this.mockEventQueue.push(event);

        // Process mock subscriptions
        this.processMockSubscriptions(event, channel);
      }

      // Log event chi tiết cho demo event sourcing
      console.log(`\x1b[36m[EVENT SOURCING]\x1b[0m ${event.type} | Data: ${JSON.stringify(event.data)} | Source: ${event.source} | Time: ${event.timestamp}`);
      this.emit('published', event);
      return event.id;
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Process mock subscriptions for testing
   */
  processMockSubscriptions(event, channel) {
    for (const [pattern, handlers] of this.mockSubscriptions) {
      if (this.matchesPattern(channel, pattern)) {
        handlers.forEach(handler => {
          try {
            // Use setTimeout to simulate async behavior
            setTimeout(() => handler(event, channel, pattern), 0);
          } catch (error) {
            console.error('Error in mock subscription handler:', error);
          }
        });
      }
    }
  }

  /**
   * Check if channel matches pattern
   */
  matchesPattern(channel, pattern) {
    if (pattern === channel) return true;
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(channel);
    }
    return false;
  }

  /**
   * Subscribe to events with fallback support
   */
  async subscribe(eventPattern, handler) {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }

    const channel = this.getChannelName(eventPattern);

    // Store handler for Redis mode
    if (!this.eventHandlers.has(channel)) {
      this.eventHandlers.set(channel, []);
    }
    this.eventHandlers.get(channel).push(handler);

    // Store handler for mock mode
    if (!this.mockSubscriptions.has(channel)) {
      this.mockSubscriptions.set(channel, []);
    }
    this.mockSubscriptions.get(channel).push(handler);

    try {
      if (this.redisEnabled && this.subscriber) {
        if (eventPattern.includes('*')) {
          await this.subscriber.pSubscribe(channel, (message, channel) => {
            this.handleMessage(channel, message);
          });
        } else {
          await this.subscriber.subscribe(channel, (message, channel) => {
            this.handleMessage(channel, message);
          });
        }
      }

      console.log(`Subscribed to: ${channel}`);
      this.emit('subscribed', { pattern: eventPattern, channel });
    } catch (error) {
      console.error('Failed to subscribe:', error);
      // Don't throw error in mock mode
      if (this.redisEnabled) {
        throw error;
      }
    }
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(eventPattern) {
    const channel = this.getChannelName(eventPattern);
    
    try {
      if (eventPattern.includes('*')) {
        await this.subscriber.pUnsubscribe(channel);
      } else {
        await this.subscriber.unsubscribe(channel);
      }
      
      this.eventHandlers.delete(channel);
      console.log(`Unsubscribed from: ${channel}`);
      this.emit('unsubscribed', { pattern: eventPattern, channel });
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(channel, message, pattern = null) {
    try {
      const event = JSON.parse(message);
      
      // Validate event structure
      if (!this.isValidEvent(event)) {
        console.warn('Invalid event received:', event);
        return;
      }

      // Don't process events from the same service (avoid loops)
      if (event.source === this.serviceName) {
        return;
      }

      console.log(`Event received: ${event.type} from ${event.source}`);
      
      // Get handlers for this channel
      const handlers = this.eventHandlers.get(channel) || [];
      
      // Execute handlers
      handlers.forEach(handler => {
        try {
          handler(event, channel, pattern);
        } catch (error) {
          console.error('Error in event handler:', error);
          this.emit('handlerError', { error, event, handler });
        }
      });

      this.emit('messageReceived', event);
    } catch (error) {
      console.error('Error parsing event message:', error);
    }
  }

  /**
   * Validate event structure
   */
  isValidEvent(event) {
    return event &&
           typeof event.id === 'string' &&
           typeof event.type === 'string' &&
           typeof event.source === 'string' &&
           typeof event.timestamp === 'string' &&
           event.data !== undefined;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get channel name for event type
   */
  getChannelName(eventType) {
    return `${this.eventPrefix}:${eventType}`;
  }

  /**
   * Publish user-related events
   */
  async publishUserEvent(action, userData, options = {}) {
    return this.publish(`user:${action}`, userData, options);
  }

  /**
   * Publish auth-related events
   */
  async publishAuthEvent(action, authData, options = {}) {
    return this.publish(`auth:${action}`, authData, options);
  }

  /**
   * Publish link-related events
   */
  async publishLinkEvent(action, linkData, options = {}) {
    return this.publish(`link:${action}`, linkData, options);
  }

  /**
   * Publish community-related events
   */
  async publishCommunityEvent(action, communityData, options = {}) {
    return this.publish(`community:${action}`, communityData, options);
  }

  /**
   * Publish system events
   */
  async publishSystemEvent(action, systemData, options = {}) {
    return this.publish(`system:${action}`, systemData, options);
  }

  /**
   * Subscribe to user events
   */
  async subscribeToUserEvents(handler) {
    return this.subscribe('user:*', handler);
  }

  /**
   * Subscribe to auth events
   */
  async subscribeToAuthEvents(handler) {
    return this.subscribe('auth:*', handler);
  }

  /**
   * Subscribe to link events
   */
  async subscribeToLinkEvents(handler) {
    return this.subscribe('link:*', handler);
  }

  /**
   * Subscribe to community events
   */
  async subscribeToCommunityEvents(handler) {
    return this.subscribe('community:*', handler);
  }

  /**
   * Subscribe to system events
   */
  async subscribeToSystemEvents(handler) {
    return this.subscribe('system:*', handler);
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      serviceName: this.serviceName,
      redisEnabled: this.redisEnabled,
      mockMode: this.mockMode,
      subscribedChannels: Array.from(this.eventHandlers.keys()),
      handlerCount: Array.from(this.eventHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      mockEventQueueSize: this.mockEventQueue.length,
      mockSubscriptionsCount: this.mockSubscriptions.size
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', reason: 'Not connected' };
      }

      if (this.redisEnabled && this.publisher) {
        // Test Redis connection
        await this.publisher.ping();
        return {
          status: 'healthy',
          mode: 'redis',
          connected: this.isConnected,
          subscribedChannels: this.eventHandlers.size,
          eventStore: this.eventStore.isConnected ? 'connected' : 'disconnected'
        };
      } else {
        // Mock mode
        return {
          status: 'healthy',
          mode: 'mock',
          connected: this.isConnected,
          mockEventQueueSize: this.mockEventQueue.length,
          eventStore: this.eventStore.isConnected ? 'connected' : 'disconnected'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error.message,
        mode: this.redisEnabled ? 'redis' : 'mock'
      };
    }
  }

  /**
   * Get mock events for testing
   */
  getMockEvents() {
    return this.mockEventQueue;
  }

  /**
   * Clear mock events
   */
  clearMockEvents() {
    this.mockEventQueue = [];
  }

  /**
   * Get all events from Event Store
   */
  async getAllEvents() {
    try {
      if (!this.eventStore || !this.eventStore.isConnected) {
        throw new Error('Event Store not connected');
      }
      return await this.eventStore.getAllEvents();
    } catch (error) {
      console.error('Failed to get all events:', error);
      throw error;
    }
  }

  /**
   * Get events by type from Event Store
   */
  async getEventsByType(eventType) {
    try {
      return await this.eventStore.getEventsByType(eventType);
    } catch (error) {
      console.error('Failed to get events by type:', error);
      throw error;
    }
  }

  /**
   * Get events by stream from Event Store
   */
  async getEventsByStream(streamName) {
    try {
      return await this.eventStore.getEventsByStream(streamName);
    } catch (error) {
      console.error('Failed to get events by stream:', error);
      throw error;
    }
  }
}

module.exports = EventBus;
