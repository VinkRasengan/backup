/**
 * Event Store Client for Microservices
 * HTTP client to interact with centralized Event Store Service
 */

const axios = require('axios');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

class EventStoreClient {
  constructor(config = {}) {
    this.config = {
      baseURL: process.env.EVENT_BUS_SERVICE_URL || 'http://localhost:3007',
      serviceName: config.serviceName || 'unknown-service',
      timeout: parseInt(process.env.EVENT_STORE_TIMEOUT) || 10000,
      retryAttempts: parseInt(process.env.EVENT_STORE_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.EVENT_STORE_RETRY_DELAY) || 1000,
      ...config
    };

    this.client = axios.create({
      baseURL: `${this.config.baseURL}/api/eventstore`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-service-name': this.config.serviceName
      }
    });

    this.stats = {
      eventsAppended: 0,
      eventsRead: 0,
      snapshotsTaken: 0,
      snapshotsLoaded: 0,
      errors: 0,
      retries: 0
    };

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID if not present
        if (!config.headers['x-correlation-id']) {
          config.headers['x-correlation-id'] = uuidv4();
        }
        
        logger.debug('Event Store request', {
          method: config.method,
          url: config.url,
          correlationId: config.headers['x-correlation-id']
        });
        
        return config;
      },
      (error) => {
        logger.error('Event Store request error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Event Store response', {
          status: response.status,
          url: response.config.url,
          correlationId: response.config.headers['x-correlation-id']
        });
        
        return response;
      },
      (error) => {
        this.stats.errors++;
        
        logger.error('Event Store response error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
          correlationId: error.config?.headers['x-correlation-id']
        });
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Append event to stream with retry logic
   */
  async appendEvent(streamName, eventType, eventData, metadata = {}) {
    const enrichedMetadata = {
      ...metadata,
      source: this.config.serviceName,
      timestamp: new Date().toISOString()
    };

    const payload = {
      eventType,
      eventData,
      metadata: enrichedMetadata
    };

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.post(`/events/${streamName}`, payload);
      });

      this.stats.eventsAppended++;
      
      logger.info('Event appended successfully', {
        streamName,
        eventType,
        eventId: response.data.data.eventId,
        service: this.config.serviceName
      });

      return {
        success: true,
        eventId: response.data.data.eventId,
        streamName,
        eventType,
        source: response.data.data.source
      };

    } catch (error) {
      logger.error('Failed to append event', {
        streamName,
        eventType,
        error: error.message,
        service: this.config.serviceName
      });

      return {
        success: false,
        error: error.message,
        streamName,
        eventType
      };
    }
  }

  /**
   * Read events from stream
   */
  async readStream(streamName, options = {}) {
    const params = {
      fromRevision: options.fromRevision || 'start',
      direction: options.direction || 'forwards',
      maxCount: Math.min(options.maxCount || 100, 1000),
      includeMetadata: options.includeMetadata !== false ? 'true' : 'false'
    };

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.get(`/events/${streamName}`, { params });
      });

      this.stats.eventsRead += response.data.data.events.length;
      
      logger.debug('Events read successfully', {
        streamName,
        eventCount: response.data.data.events.length,
        service: this.config.serviceName
      });

      return {
        success: true,
        events: response.data.data.events,
        streamName: response.data.data.streamName,
        eventCount: response.data.data.eventCount,
        source: response.data.data.source
      };

    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: true,
          events: [],
          streamName,
          eventCount: 0,
          source: 'not-found'
        };
      }

      logger.error('Failed to read events', {
        streamName,
        error: error.message,
        service: this.config.serviceName
      });

      return {
        success: false,
        error: error.message,
        streamName
      };
    }
  }

  /**
   * Read all events (for projections)
   */
  async readAll(options = {}) {
    const params = {
      fromPosition: options.fromPosition || 'start',
      direction: options.direction || 'forwards',
      maxCount: Math.min(options.maxCount || 100, 1000)
    };

    if (options.streamPrefix) {
      params.streamPrefix = options.streamPrefix;
    }

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.get('/events', { params });
      });

      this.stats.eventsRead += response.data.data.events.length;
      
      logger.debug('All events read successfully', {
        eventCount: response.data.data.events.length,
        service: this.config.serviceName
      });

      return {
        success: true,
        events: response.data.data.events,
        eventCount: response.data.data.eventCount,
        source: response.data.data.source
      };

    } catch (error) {
      logger.error('Failed to read all events', {
        error: error.message,
        service: this.config.serviceName
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create snapshot for aggregate
   */
  async createSnapshot(aggregateType, aggregateId, state, version) {
    const payload = {
      state,
      version
    };

    try {
      const response = await this.retryOperation(async () => {
        return await this.client.post(`/snapshots/${aggregateType}/${aggregateId}`, payload);
      });

      this.stats.snapshotsTaken++;
      
      logger.info('Snapshot created successfully', {
        aggregateType,
        aggregateId,
        version,
        service: this.config.serviceName
      });

      return {
        success: true,
        aggregateType,
        aggregateId,
        version,
        eventId: response.data.data.eventId
      };

    } catch (error) {
      logger.error('Failed to create snapshot', {
        aggregateType,
        aggregateId,
        version,
        error: error.message,
        service: this.config.serviceName
      });

      return {
        success: false,
        error: error.message,
        aggregateType,
        aggregateId
      };
    }
  }

  /**
   * Load latest snapshot for aggregate
   */
  async loadSnapshot(aggregateType, aggregateId) {
    try {
      const response = await this.retryOperation(async () => {
        return await this.client.get(`/snapshots/${aggregateType}/${aggregateId}`);
      });

      this.stats.snapshotsLoaded++;
      
      logger.debug('Snapshot loaded successfully', {
        aggregateType,
        aggregateId,
        version: response.data.data.version,
        service: this.config.serviceName
      });

      return {
        success: true,
        snapshot: response.data.data.snapshot,
        version: response.data.data.version,
        aggregateType,
        aggregateId
      };

    } catch (error) {
      if (error.response?.status === 404) {
        return {
          success: false,
          reason: 'Snapshot not found',
          aggregateType,
          aggregateId
        };
      }

      logger.error('Failed to load snapshot', {
        aggregateType,
        aggregateId,
        error: error.message,
        service: this.config.serviceName
      });

      return {
        success: false,
        error: error.message,
        aggregateType,
        aggregateId
      };
    }
  }

  /**
   * Get event store statistics
   */
  async getStats() {
    try {
      const response = await this.client.get('/stats');
      
      return {
        success: true,
        eventStore: response.data.data,
        client: this.stats
      };

    } catch (error) {
      logger.error('Failed to get event store stats', {
        error: error.message,
        service: this.config.serviceName
      });

      return {
        success: false,
        error: error.message,
        client: this.stats
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      
      return {
        success: true,
        status: response.data.data.status,
        eventStore: response.data.data
      };

    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation(operation) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.stats.retries++;
        
        if (attempt === this.config.retryAttempts) {
          break;
        }
        
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        logger.warn(`Event Store operation failed, retrying in ${delay}ms`, {
          attempt,
          maxAttempts: this.config.retryAttempts,
          error: error.message,
          service: this.config.serviceName
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Get client statistics
   */
  getClientStats() {
    return {
      ...this.stats,
      config: {
        baseURL: this.config.baseURL,
        serviceName: this.config.serviceName,
        timeout: this.config.timeout,
        retryAttempts: this.config.retryAttempts
      }
    };
  }
}

module.exports = EventStoreClient;
