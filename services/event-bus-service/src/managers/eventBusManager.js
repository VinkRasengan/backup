/**
 * Event Bus Manager
 * Manages all event transport mechanisms (RabbitMQ, EventStore, Redis)
 */

const amqp = require('amqplib');
const redis = require('redis');
const { EventStoreDBClient, jsonEvent, FORWARDS, START } = require('@eventstore/db-client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

class EventBusManager {
  constructor() {
    this.connections = {
      rabbitmq: { connection: null, channel: null, connected: false },
      redis: { client: null, subscriber: null, connected: false },
      eventStore: { client: null, connected: false }
    };

    this.subscriptions = new Map();
    this.stats = {
      published: 0,
      consumed: 0,
      failed: 0,
      retries: 0
    };

    this.options = {
      rabbitmq: {
        url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
        exchange: process.env.RABBITMQ_EXCHANGE || 'factcheck.events',
        deadLetterExchange: process.env.RABBITMQ_DLX || 'factcheck.events.dlx'
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      },
      eventStore: {
        url: process.env.KURRENTDB_URL || 'esdb://localhost:2113?tls=false'
      }
    };
  }

  async initialize() {
    logger.info('Initializing Event Bus Manager...');

    // Check if we should run in standalone mode
    const standaloneMode = process.env.STANDALONE_MODE === 'true' ||
                          (!process.env.REDIS_URL && !process.env.RABBITMQ_URL && !process.env.KURRENTDB_URL);

    if (standaloneMode) {
      logger.info('Running in standalone mode - external services disabled');
      return this.initializeStandalone();
    }

    try {
      // Initialize EventStore (skip if disabled)
      if (process.env.DISABLE_EVENTSTORE !== 'true') {
        await this.initializeEventStore();
      } else {
        logger.info('EventStore disabled, skipping initialization');
        this.connections.eventStore.connected = false;
      }
      
      // Initialize RabbitMQ
      await this.initializeRabbitMQ();
      
      // Initialize Redis
      await this.initializeRedis();

      logger.info('✅ Event Bus Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Event Bus Manager', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async initializeEventStore() {
    try {
      this.connections.eventStore.client = EventStoreDBClient.connectionString(
        this.options.eventStore.url
      );

      // Test connection
      await this.connections.eventStore.client.readAll({
        direction: FORWARDS,
        fromPosition: START,
        maxCount: 1
      });

      this.connections.eventStore.connected = true;
      logger.info('✅ EventStore connection established');
    } catch (error) {
      logger.warn('EventStore connection failed, continuing without persistence', {
        error: error.message
      });
    }
  }

  async initializeRabbitMQ() {
    try {
      this.connections.rabbitmq.connection = await amqp.connect(this.options.rabbitmq.url);
      this.connections.rabbitmq.channel = await this.connections.rabbitmq.connection.createChannel();

      // Setup exchanges
      await this.setupRabbitMQExchanges();

      // Setup error handlers
      this.connections.rabbitmq.connection.on('error', (error) => {
        logger.error('RabbitMQ connection error', { error: error.message });
        this.connections.rabbitmq.connected = false;
      });

      this.connections.rabbitmq.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.connections.rabbitmq.connected = false;
        // Implement reconnection logic
        setTimeout(() => this.initializeRabbitMQ(), 5000);
      });

      this.connections.rabbitmq.connected = true;
      logger.info('✅ RabbitMQ connection established');
    } catch (error) {
      logger.warn('RabbitMQ connection failed, continuing without reliable messaging', {
        error: error.message
      });
    }
  }

  async initializeRedis() {
    try {
      // Publisher client
      this.connections.redis.client = redis.createClient({
        url: this.options.redis.url
      });

      // Subscriber client
      this.connections.redis.subscriber = redis.createClient({
        url: this.options.redis.url
      });

      await Promise.all([
        this.connections.redis.client.connect(),
        this.connections.redis.subscriber.connect()
      ]);

      this.connections.redis.connected = true;
      logger.info('✅ Redis connections established');
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis pub/sub', {
        error: error.message
      });
    }
  }

  async setupRabbitMQExchanges() {
    const channel = this.connections.rabbitmq.channel;

    // Main events exchange
    await channel.assertExchange(this.options.rabbitmq.exchange, 'topic', {
      durable: true
    });

    // Dead letter exchange
    await channel.assertExchange(this.options.rabbitmq.deadLetterExchange, 'topic', {
      durable: true
    });

    logger.info('RabbitMQ exchanges configured', {
      exchange: this.options.rabbitmq.exchange,
      deadLetterExchange: this.options.rabbitmq.deadLetterExchange
    });
  }

  async publishEvent(eventType, data, metadata = {}) {
    const event = {
      id: uuidv4(),
      type: eventType,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId: metadata.correlationId || uuidv4(),
        causationId: metadata.causationId,
        source: metadata.source || 'event-bus-service',
        version: metadata.version || '2.0.0',
        ...metadata
      }
    };

    const results = {
      eventId: event.id,
      eventType,
      published: [],
      failed: []
    };

    try {
      // 1. Store in EventStore (persistent)
      if (this.connections.eventStore.connected) {
        try {
          const streamName = metadata.streamName || 'all-events';
          const eventObject = jsonEvent({
            id: event.id,
            type: eventType,
            data,
            metadata: event.metadata
          });

          await this.connections.eventStore.client.appendToStream(streamName, eventObject);
          results.published.push('eventstore');
        } catch (error) {
          logger.error('Failed to store event in EventStore', { error: error.message });
          results.failed.push('eventstore');
        }
      }

      // 2. Publish to RabbitMQ (reliable)
      if (this.connections.rabbitmq.connected) {
        try {
          const routingKey = metadata.routingKey || `${metadata.source}.${eventType}`;
          await this.connections.rabbitmq.channel.publish(
            this.options.rabbitmq.exchange,
            routingKey,
            Buffer.from(JSON.stringify(event)),
            {
              persistent: true,
              messageId: event.id,
              timestamp: Date.now(),
              headers: {
                source: metadata.source,
                correlationId: event.metadata.correlationId
              }
            }
          );
          results.published.push('rabbitmq');
        } catch (error) {
          logger.error('Failed to publish to RabbitMQ', { error: error.message });
          results.failed.push('rabbitmq');
        }
      }

      // 3. Publish to Redis (fast)
      if (this.connections.redis.connected) {
        try {
          const channel = `events:${eventType}`;
          await this.connections.redis.client.publish(channel, JSON.stringify(event));
          results.published.push('redis');
        } catch (error) {
          logger.error('Failed to publish to Redis', { error: error.message });
          results.failed.push('redis');
        }
      }

      // 4. Notify local subscribers
      this.notifyLocalSubscribers(event);
      results.published.push('local');

      this.stats.published++;

      logger.info('Event published successfully', {
        eventId: event.id,
        type: eventType,
        source: metadata.source,
        published: results.published,
        failed: results.failed
      });

      return results;
    } catch (error) {
      this.stats.failed++;
      logger.error('Failed to publish event', {
        error: error.message,
        eventType,
        stack: error.stack
      });
      throw error;
    }
  }

  subscribe(eventPattern, handler) {
    const subscriptionId = uuidv4();
    
    this.subscriptions.set(subscriptionId, {
      pattern: eventPattern,
      handler,
      created: new Date().toISOString()
    });

    logger.info('New subscription created', {
      subscriptionId,
      pattern: eventPattern
    });

    return subscriptionId;
  }

  unsubscribe(subscriptionId) {
    if (this.subscriptions.has(subscriptionId)) {
      this.subscriptions.delete(subscriptionId);
      logger.info('Subscription removed', { subscriptionId });
      return true;
    }
    return false;
  }

  notifyLocalSubscribers(event) {
    this.subscriptions.forEach((subscription, subscriptionId) => {
      try {
        if (this.matchesPattern(event.type, subscription.pattern)) {
          subscription.handler(event);
          this.stats.consumed++;
        }
      } catch (error) {
        logger.error('Error in subscription handler', {
          subscriptionId,
          error: error.message,
          eventType: event.type
        });
        this.stats.failed++;
      }
    });
  }

  matchesPattern(eventType, pattern) {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    
    const patternRegex = new RegExp(pattern.replace(/\*/g, '.*'));
    return patternRegex.test(eventType);
  }

  async getEventHistory(streamName, fromVersion = 0, maxCount = 100) {
    if (!this.connections.eventStore.connected) {
      throw new Error('EventStore not connected');
    }

    try {
      const events = [];
      const eventStream = this.connections.eventStore.client.readStream(streamName, {
        direction: FORWARDS,
        fromRevision: fromVersion,
        maxCount
      });

      for await (const resolvedEvent of eventStream) {
        events.push({
          id: resolvedEvent.event.id,
          type: resolvedEvent.event.type,
          data: resolvedEvent.event.data,
          metadata: resolvedEvent.event.metadata,
          streamName: resolvedEvent.event.streamId,
          eventNumber: resolvedEvent.event.revision,
          created: resolvedEvent.event.created
        });
      }

      return events;
    } catch (error) {
      logger.error('Failed to get event history', {
        streamName,
        error: error.message
      });
      throw error;
    }
  }

  async getStats() {
    return {
      ...this.stats,
      connections: {
        rabbitmq: this.connections.rabbitmq.connected,
        redis: this.connections.redis.connected,
        eventStore: this.connections.eventStore.connected
      },
      subscriptions: this.subscriptions.size
    };
  }

  async close() {
    try {
      if (this.connections.redis.client) {
        await this.connections.redis.client.quit();
      }
      if (this.connections.redis.subscriber) {
        await this.connections.redis.subscriber.quit();
      }
      if (this.connections.rabbitmq.connection) {
        await this.connections.rabbitmq.connection.close();
      }
      if (this.connections.eventStore.client) {
        await this.connections.eventStore.client.dispose();
      }

      logger.info('Event Bus Manager connections closed');
    } catch (error) {
      logger.error('Error closing Event Bus Manager connections', { error: error.message });
    }
  }

  /**
   * Initialize in standalone mode (no external dependencies)
   */
  async initializeStandalone() {
    logger.info('Initializing Event Bus Manager in standalone mode...');

    // Mark all connections as disconnected but functional
    this.connections.eventStore.connected = false;
    this.connections.rabbitmq.connected = false;
    this.connections.redis.connected = false;

    logger.info('✅ Event Bus Manager initialized in standalone mode');
    logger.info('   - Events will be handled in-memory only');
    logger.info('   - No persistent storage or external messaging');

    return true;
  }
}

module.exports = EventBusManager;
