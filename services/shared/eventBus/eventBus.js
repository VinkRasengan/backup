/**
 * Event Bus Implementation using Redis Pub/Sub
 * Enables event-driven communication between microservices
 */

const Redis = require('redis');
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.redisConfig = {
      host: options.host || process.env.REDIS_HOST || 'localhost',
      port: options.port || process.env.REDIS_PORT || 6379,
      password: options.password || process.env.REDIS_PASSWORD,
      db: options.db || process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3
    };

    this.publisher = null;
    this.subscriber = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.serviceName = options.serviceName || 'unknown-service';
    this.eventPrefix = options.eventPrefix || 'antifraud';
    
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

    this.connect();
  }

  /**
   * Connect to Redis
   */
  async connect() {
    try {
      // Create publisher client
      this.publisher = Redis.createClient(this.redisConfig);
      this.publisher.on('error', (err) => {
        console.error('Redis Publisher Error:', err);
        this.emit('error', err);
      });

      // Create subscriber client
      this.subscriber = Redis.createClient(this.redisConfig);
      this.subscriber.on('error', (err) => {
        console.error('Redis Subscriber Error:', err);
        this.emit('error', err);
      });

      // Handle messages
      this.subscriber.on('message', (channel, message) => {
        this.handleMessage(channel, message);
      });

      this.subscriber.on('pmessage', (pattern, channel, message) => {
        this.handleMessage(channel, message, pattern);
      });

      await this.publisher.connect();
      await this.subscriber.connect();

      this.isConnected = true;
      console.log(`EventBus connected for service: ${this.serviceName}`);
      this.emit('connected');

    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.emit('error', error);
    }
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
   * Publish an event
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
      await this.publisher.publish(channel, message);
      console.log(`Event published: ${eventType} from ${this.serviceName}`);
      this.emit('published', event);
      return event.id;
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  async subscribe(eventPattern, handler) {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }

    const channel = this.getChannelName(eventPattern);
    
    // Store handler
    if (!this.eventHandlers.has(channel)) {
      this.eventHandlers.set(channel, []);
    }
    this.eventHandlers.get(channel).push(handler);

    try {
      if (eventPattern.includes('*')) {
        await this.subscriber.pSubscribe(channel);
      } else {
        await this.subscriber.subscribe(channel);
      }
      
      console.log(`Subscribed to: ${channel}`);
      this.emit('subscribed', { pattern: eventPattern, channel });
    } catch (error) {
      console.error('Failed to subscribe:', error);
      throw error;
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
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
      subscribedChannels: Array.from(this.eventHandlers.keys()),
      handlerCount: Array.from(this.eventHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0)
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'unhealthy', reason: 'Not connected to Redis' };
      }

      // Test Redis connection
      await this.publisher.ping();
      
      return {
        status: 'healthy',
        connected: this.isConnected,
        subscribedChannels: this.eventHandlers.size
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error.message
      };
    }
  }
}

module.exports = EventBus;
