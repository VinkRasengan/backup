/**
 * KurrentDB/EventStore DB Event Store Implementation
 * Centralized Event Store Service for Microservices Architecture
 */

const { EventStoreDBClient, jsonEvent, FORWARDS, START, BACKWARDS, END } = require('@eventstore/db-client');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class KurrentEventStore {
  constructor(config = {}) {
    this.config = {
      // EventStore DB / KurrentDB Configuration
      connectionString: process.env.KURRENTDB_URL || process.env.EVENTSTORE_URL || 'esdb://localhost:2113?tls=false',
      enabled: process.env.KURRENTDB_ENABLED === 'true' || process.env.EVENT_STORE_ENABLED === 'true',
      
      // Performance settings
      batchSize: parseInt(process.env.KURRENTDB_BATCH_SIZE) || 100,
      retryAttempts: parseInt(process.env.KURRENTDB_RETRY_ATTEMPTS) || 3,
      timeout: parseInt(process.env.KURRENTDB_TIMEOUT) || 10000,
      
      // Snapshot settings
      snapshotFrequency: parseInt(process.env.KURRENTDB_SNAPSHOT_FREQUENCY) || 100,
      
      // Service identification
      serviceName: config.serviceName || 'event-store-service',
      
      ...config
    };

    this.client = null;
    this.isConnected = false;
    this.fallbackEvents = new Map(); // Stream-based fallback
    
    this.stats = {
      eventsAppended: 0,
      eventsRead: 0,
      snapshotsTaken: 0,
      streamsCreated: 0,
      errors: 0,
      fallbackUsed: 0,
      connectionAttempts: 0,
      lastConnectionAttempt: null
    };

    // Event metadata validation schema
    this.eventMetadataSchema = {
      correlationId: 'string',
      causationId: 'string',
      userId: 'string',
      source: 'string',
      timestamp: 'string',
      version: 'string',
      aggregateId: 'string',
      aggregateType: 'string'
    };
  }

  /**
   * Initialize and connect to KurrentDB/EventStore DB
   */
  async initialize() {
    if (!this.config.enabled) {
      logger.info('Event Store disabled, using in-memory fallback');
      return { success: true, mode: 'fallback' };
    }

    try {
      this.stats.connectionAttempts++;
      this.stats.lastConnectionAttempt = new Date().toISOString();
      
      logger.info('Connecting to Event Store...', { 
        url: this.maskConnectionString(this.config.connectionString),
        attempt: this.stats.connectionAttempts,
        service: this.config.serviceName
      });
      
      // Create EventStore DB client (KurrentDB uses same client)
      this.client = EventStoreDBClient.connectionString(this.config.connectionString);
      
      // Test connection with a simple read
      const testStream = this.client.readAll({ 
        direction: FORWARDS, 
        fromPosition: START, 
        maxCount: 1 
      });
      
      // Consume the stream to test connection
      for await (const event of testStream) {
        break; // Just test the connection
      }
      
      this.isConnected = true;
      logger.info('✅ Event Store connected successfully', {
        connectionString: this.maskConnectionString(this.config.connectionString),
        service: this.config.serviceName
      });
      
      return { success: true, mode: 'eventstore' };
      
    } catch (error) {
      this.isConnected = false;
      this.stats.errors++;
      
      logger.warn('⚠️ Event Store connection failed, using fallback mode', { 
        error: error.message,
        attempt: this.stats.connectionAttempts,
        service: this.config.serviceName
      });
      
      return { success: false, mode: 'fallback', error: error.message };
    }
  }

  /**
   * Append event to stream with full event sourcing support
   */
  async appendEvent(streamName, eventType, eventData, metadata = {}) {
    const event = this.createEvent(eventType, eventData, metadata);
    
    // Validate stream name
    if (!streamName || typeof streamName !== 'string') {
      throw new Error('Invalid stream name');
    }

    // Try EventStore DB first
    if (this.isConnected && this.client) {
      try {
        const eventObject = jsonEvent({
          id: event.id,
          type: event.type,
          data: event.data,
          metadata: event.metadata
        });
        
        const result = await this.client.appendToStream(streamName, eventObject);
        
        this.stats.eventsAppended++;
        logger.debug('Event appended to Event Store', {
          streamName,
          eventType,
          eventId: event.id,
          commitPosition: result.commitPosition?.toString(),
          service: this.config.serviceName
        });

        return {
          eventId: event.id,
          streamName,
          eventType,
          commitPosition: result.commitPosition?.toString(),
          success: true,
          source: 'eventstore'
        };
        
      } catch (error) {
        this.stats.errors++;
        logger.error('Failed to append to Event Store, using fallback', {
          streamName,
          eventType,
          error: error.message,
          service: this.config.serviceName
        });
      }
    }

    // Fallback to in-memory storage
    return this.appendToFallback(streamName, event);
  }

  /**
   * Read events from stream with pagination support
   */
  async readStream(streamName, options = {}) {
    const {
      fromRevision = START,
      direction = FORWARDS,
      maxCount = 1000,
      includeMetadata = true
    } = options;

    // Validate stream name
    if (!streamName || typeof streamName !== 'string') {
      throw new Error('Invalid stream name');
    }

    // Try EventStore DB first
    if (this.isConnected && this.client) {
      try {
        const events = [];
        const stream = this.client.readStream(streamName, {
          fromRevision,
          direction,
          maxCount
        });

        for await (const resolvedEvent of stream) {
          const event = this.deserializeEvent(resolvedEvent, includeMetadata);
          events.push(event);
        }

        this.stats.eventsRead += events.length;
        logger.debug('Events read from Event Store', {
          streamName,
          eventCount: events.length,
          fromRevision: fromRevision.toString(),
          service: this.config.serviceName
        });

        return {
          events,
          streamName,
          success: true,
          source: 'eventstore'
        };

      } catch (error) {
        this.stats.errors++;
        logger.error('Failed to read from Event Store, using fallback', {
          streamName,
          error: error.message,
          service: this.config.serviceName
        });
      }
    }

    // Fallback to in-memory storage
    return this.readFromFallback(streamName, options);
  }

  /**
   * Read all events across all streams (for projections)
   */
  async readAll(options = {}) {
    const {
      fromPosition = START,
      direction = FORWARDS,
      maxCount = 1000,
      filter = null
    } = options;

    if (this.isConnected && this.client) {
      try {
        const events = [];
        const readOptions = {
          fromPosition,
          direction,
          maxCount
        };

        if (filter) {
          readOptions.filter = filter;
        }

        const stream = this.client.readAll(readOptions);

        for await (const resolvedEvent of stream) {
          const event = this.deserializeEvent(resolvedEvent, true);
          events.push(event);
        }

        this.stats.eventsRead += events.length;
        logger.debug('All events read from Event Store', {
          eventCount: events.length,
          service: this.config.serviceName
        });

        return {
          events,
          success: true,
          source: 'eventstore'
        };

      } catch (error) {
        this.stats.errors++;
        logger.error('Failed to read all events from Event Store', {
          error: error.message,
          service: this.config.serviceName
        });
      }
    }

    // Fallback: return all events from all streams
    const allEvents = [];
    for (const [streamName, events] of this.fallbackEvents) {
      allEvents.push(...events);
    }

    return {
      events: allEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
      success: true,
      source: 'fallback'
    };
  }

  /**
   * Create snapshot for aggregate
   */
  async createSnapshot(aggregateId, aggregateType, state, version) {
    const snapshotEvent = this.createEvent('__snapshot__', {
      aggregateId,
      aggregateType,
      state,
      version,
      snapshotTimestamp: new Date().toISOString()
    }, {
      isSnapshot: true,
      aggregateVersion: version,
      aggregateId,
      aggregateType
    });

    const streamName = `${aggregateType}-${aggregateId}-snapshots`;
    const result = await this.appendEvent(streamName, '__snapshot__', snapshotEvent.data, snapshotEvent.metadata);
    
    if (result.success) {
      this.stats.snapshotsTaken++;
      logger.info('Snapshot created', {
        aggregateId,
        aggregateType,
        version,
        streamName,
        service: this.config.serviceName
      });
    }

    return result;
  }

  /**
   * Load latest snapshot for aggregate
   */
  async loadSnapshot(aggregateId, aggregateType) {
    const streamName = `${aggregateType}-${aggregateId}-snapshots`;
    
    try {
      const result = await this.readStream(streamName, {
        direction: BACKWARDS,
        maxCount: 1
      });

      if (result.success && result.events.length > 0) {
        const snapshot = result.events[0];
        return {
          success: true,
          snapshot: snapshot.data,
          version: snapshot.metadata.aggregateVersion
        };
      }

      return { success: false, reason: 'No snapshot found' };

    } catch (error) {
      logger.error('Failed to load snapshot', {
        aggregateId,
        aggregateType,
        error: error.message,
        service: this.config.serviceName
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get event store statistics
   */
  getStats() {
    return {
      ...this.stats,
      isConnected: this.isConnected,
      mode: this.isConnected ? 'eventstore' : 'fallback',
      fallbackStreams: this.fallbackEvents.size,
      config: {
        enabled: this.config.enabled,
        connectionString: this.maskConnectionString(this.config.connectionString),
        serviceName: this.config.serviceName
      }
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (this.isConnected && this.client) {
        // Try to read a single event to test connection
        const testStream = this.client.readAll({ 
          direction: FORWARDS, 
          fromPosition: START, 
          maxCount: 1 
        });
        
        // Test the connection
        for await (const event of testStream) {
          break;
        }
        
        return {
          status: 'healthy',
          mode: 'eventstore',
          stats: this.getStats()
        };
      }

      return {
        status: 'degraded',
        mode: 'fallback',
        stats: this.getStats()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.getStats()
      };
    }
  }

  // ==================== PRIVATE METHODS ====================

  createEvent(eventType, eventData, metadata = {}) {
    return {
      id: uuidv4(),
      type: eventType,
      data: eventData,
      metadata: {
        timestamp: new Date().toISOString(),
        correlationId: metadata.correlationId || uuidv4(),
        causationId: metadata.causationId || null,
        userId: metadata.userId || null,
        source: metadata.source || this.config.serviceName,
        version: metadata.version || '1.0.0',
        aggregateId: metadata.aggregateId || null,
        aggregateType: metadata.aggregateType || null,
        ...metadata
      }
    };
  }

  deserializeEvent(resolvedEvent, includeMetadata = true) {
    const event = resolvedEvent.event;
    
    const deserializedEvent = {
      id: event.id,
      type: event.type,
      data: event.data,
      streamName: event.streamId,
      eventNumber: event.revision.toString(),
      timestamp: event.created
    };

    if (includeMetadata && event.metadata) {
      deserializedEvent.metadata = event.metadata;
    }

    return deserializedEvent;
  }

  appendToFallback(streamName, event) {
    if (!this.fallbackEvents.has(streamName)) {
      this.fallbackEvents.set(streamName, []);
      this.stats.streamsCreated++;
    }

    const streamEvents = this.fallbackEvents.get(streamName);
    const eventWithNumber = {
      ...event,
      streamName,
      eventNumber: streamEvents.length,
      created: new Date()
    };

    streamEvents.push(eventWithNumber);
    this.stats.fallbackUsed++;

    logger.debug('Event appended to fallback storage', {
      streamName,
      eventType: event.type,
      eventId: event.id,
      eventNumber: eventWithNumber.eventNumber,
      service: this.config.serviceName
    });

    return {
      eventId: event.id,
      streamName,
      eventType: event.type,
      eventNumber: eventWithNumber.eventNumber,
      success: true,
      source: 'fallback'
    };
  }

  readFromFallback(streamName, options = {}) {
    const { maxCount = 1000, direction = FORWARDS } = options;
    
    const streamEvents = this.fallbackEvents.get(streamName) || [];
    let events = [...streamEvents];

    if (direction === BACKWARDS) {
      events.reverse();
    }

    if (maxCount && events.length > maxCount) {
      events = events.slice(0, maxCount);
    }

    this.stats.eventsRead += events.length;

    return {
      events,
      streamName,
      success: true,
      source: 'fallback'
    };
  }

  maskConnectionString(connectionString) {
    if (!connectionString) return 'undefined';
    return connectionString.replace(/\/\/.*@/, '//***@');
  }
}

module.exports = KurrentEventStore;
