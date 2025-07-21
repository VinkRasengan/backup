/**
 * Community Service Event Store
 * Handles event persistence using EventStore DB
 */

const { EventStoreDBClient, jsonEvent } = require('@eventstore/db-client');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class CommunityEventStore {
  constructor() {
    this.config = {
      connectionString: process.env.KURRENTDB_URL || 'esdb://localhost:2113?tls=false',
      enabled: process.env.EVENT_STORE_ENABLED === 'true' || process.env.KURRENTDB_ENABLED === 'true',
      batchSize: parseInt(process.env.EVENT_STORE_BATCH_SIZE) || 100,
      retryAttempts: parseInt(process.env.EVENT_STORE_RETRY_ATTEMPTS) || 3,
      timeout: parseInt(process.env.EVENT_STORE_TIMEOUT) || 5000
    };

    this.client = null;
    this.isConnected = false;
    this.fallbackEvents = []; // In-memory fallback
    this.stats = {
      eventsAppended: 0,
      eventsRead: 0,
      errors: 0,
      fallbackUsed: 0
    };

    // Initialize if enabled
    if (this.config.enabled) {
      this.connect().catch(error => {
        logger.error('Failed to initialize EventStore, using fallback', { error: error.message });
      });
    } else {
      logger.info('EventStore disabled, using in-memory fallback mode');
    }
  }

  /**
   * Connect to EventStore
   */
  async connect() {
    if (!this.config.enabled) {
      logger.info('EventStore disabled, using in-memory fallback');
      return;
    }

    try {
      logger.info('Connecting to EventStore...', { url: this.config.connectionString });
      
      this.client = EventStoreDBClient.connectionString(this.config.connectionString);
      
      // Test connection
      await this.client.readAll({ 
        direction: 'forwards', 
        fromPosition: 'start', 
        maxCount: 1 
      });
      
      this.isConnected = true;
      logger.info('✅ EventStore connected successfully');
      
    } catch (error) {
      this.isConnected = false;
      this.stats.errors++;
      logger.warn('⚠️ EventStore connection failed, using fallback', { 
        error: error.message 
      });
    }
  }

  /**
   * Append event to stream
   */
  async appendEvent(streamName, eventType, eventData, metadata = {}) {
    const event = {
      id: uuidv4(),
      type: eventType,
      data: eventData,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'community-service',
        correlationId: metadata.correlationId || uuidv4(),
        causationId: metadata.causationId || null,
        version: '1.0.0',
        ...metadata
      }
    };

    // Try EventStore first
    if (this.isConnected && this.client) {
      try {
        const eventObject = jsonEvent(event);
        const result = await this.client.appendToStream(streamName, eventObject);
        
        this.stats.eventsAppended++;
        logger.info('Event appended to EventStore', {
          streamName,
          eventType,
          eventId: event.id,
          commitPosition: result.commitPosition
        });

        return {
          eventId: event.id,
          streamName,
          eventType,
          commitPosition: result.commitPosition,
          success: true,
          source: 'eventstore'
        };
      } catch (error) {
        logger.error('Failed to append to EventStore, using fallback', {
          streamName,
          eventType,
          error: error.message
        });
      }
    }

    // Fallback to in-memory storage
    this.fallbackEvents.push({
      ...event,
      streamName,
      eventNumber: this.fallbackEvents.length,
      created: new Date()
    });

    this.stats.fallbackUsed++;
    logger.debug('Event stored in fallback', {
      streamName,
      eventType,
      eventId: event.id
    });

    return {
      eventId: event.id,
      streamName,
      eventType,
      eventNumber: this.fallbackEvents.length - 1,
      success: true,
      source: 'fallback'
    };
  }

  /**
   * Read events from stream
   */
  async readEvents(streamName, options = {}) {
    const {
      fromRevision = 'start',
      maxCount = this.config.batchSize,
      direction = 'forwards'
    } = options;

    // Try EventStore first
    if (this.isConnected && this.client) {
      try {
        const events = [];
        const readStream = this.client.readStream(streamName, {
          direction,
          fromRevision,
          maxCount
        });

        for await (const resolvedEvent of readStream) {
          events.push({
            eventId: resolvedEvent.event.id,
            eventType: resolvedEvent.event.type,
            data: resolvedEvent.event.data,
            metadata: resolvedEvent.event.metadata,
            streamName: resolvedEvent.event.streamId,
            eventNumber: resolvedEvent.event.revision,
            created: resolvedEvent.event.created
          });
        }

        this.stats.eventsRead += events.length;
        logger.debug('Events read from EventStore', {
          streamName,
          eventCount: events.length
        });

        return events;
      } catch (error) {
        logger.error('Failed to read from EventStore, using fallback', {
          streamName,
          error: error.message
        });
      }
    }

    // Fallback to in-memory storage
    const events = this.fallbackEvents
      .filter(event => event.streamName === streamName)
      .slice(0, maxCount);

    this.stats.fallbackUsed++;
    logger.debug('Events read from fallback', {
      streamName,
      eventCount: events.length
    });

    return events;
  }

  /**
   * Subscribe to stream events
   */
  async subscribeToStream(streamName, eventHandler, options = {}) {
    if (this.isConnected && this.client) {
      try {
        const subscription = this.client.subscribeToStream(streamName, {
          fromRevision: options.fromRevision || 'start'
        });

        subscription.on('data', (resolvedEvent) => {
          const event = {
            eventId: resolvedEvent.event.id,
            eventType: resolvedEvent.event.type,
            data: resolvedEvent.event.data,
            metadata: resolvedEvent.event.metadata,
            streamName: resolvedEvent.event.streamId,
            eventNumber: resolvedEvent.event.revision,
            created: resolvedEvent.event.created
          };

          eventHandler(event);
        });

        subscription.on('error', (error) => {
          logger.error('Stream subscription error', {
            streamName,
            error: error.message
          });
        });

        logger.info('Subscribed to stream', { streamName });
        return subscription;
      } catch (error) {
        logger.error('Failed to subscribe to stream', {
          streamName,
          error: error.message
        });
      }
    }

    // For fallback, we can't provide real-time subscriptions
    logger.warn('Stream subscription not available in fallback mode', { streamName });
    return null;
  }

  /**
   * Create snapshot
   */
  async createSnapshot(streamName, aggregateId, snapshot, version) {
    const snapshotStreamName = `${streamName}-snapshots`;
    
    return await this.appendEvent(snapshotStreamName, 'snapshot', {
      aggregateId,
      snapshot,
      version,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot(streamName, aggregateId) {
    const snapshotStreamName = `${streamName}-snapshots`;
    
    try {
      const events = await this.readEvents(snapshotStreamName, {
        direction: 'backwards',
        maxCount: 1
      });

      if (events.length > 0) {
        const snapshotEvent = events[0];
        if (snapshotEvent.data.aggregateId === aggregateId) {
          return {
            snapshot: snapshotEvent.data.snapshot,
            version: snapshotEvent.data.version,
            createdAt: snapshotEvent.data.createdAt
          };
        }
      }

      return null;
    } catch (error) {
      logger.warn('Failed to get snapshot', {
        streamName,
        aggregateId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      fallbackEventsCount: this.fallbackEvents.length,
      config: {
        enabled: this.config.enabled,
        batchSize: this.config.batchSize,
        retryAttempts: this.config.retryAttempts
      }
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.config.enabled) {
      return {
        status: 'disabled',
        fallbackActive: true,
        stats: this.getStats()
      };
    }

    try {
      if (this.isConnected && this.client) {
        await this.client.readAll({ 
          direction: 'forwards', 
          fromPosition: 'start', 
          maxCount: 1 
        });

        return {
          status: 'healthy',
          isConnected: true,
          stats: this.getStats()
        };
      } else {
        return {
          status: 'fallback',
          isConnected: false,
          fallbackActive: true,
          stats: this.getStats()
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        isConnected: false,
        error: error.message,
        fallbackActive: true,
        stats: this.getStats()
      };
    }
  }

  /**
   * Disconnect
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.dispose();
        this.isConnected = false;
        logger.info('EventStore disconnected');
      } catch (error) {
        logger.error('Error disconnecting EventStore', {
          error: error.message
        });
      }
    }
  }
}

module.exports = CommunityEventStore;
