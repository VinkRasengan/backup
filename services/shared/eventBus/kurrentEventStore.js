/**
 * KurrentDB Event Store Implementation
 * Provides Event Sourcing capabilities using KurrentDB
 */

class KurrentEventStore {
  constructor(config = {}) {
    this.config = {
      url: config.url || process.env.KURRENTDB_URL,
      apiKey: config.apiKey || process.env.KURRENTDB_API_KEY,
      database: config.database || 'antifraud-events',
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    };

    this.isConnected = false;
    this.kurrent = null;
    
    // Mock event storage
    this.mockEvents = [];
    
    this.connect();
  }

  /**
   * Connect to KurrentDB
   */
  async connect() {
    try {
      // Initialize KurrentDB client
      // Note: This is a mock implementation since we don't have the actual SDK
      this.kurrent = {
        append: this.mockAppend.bind(this),
        read: this.mockRead.bind(this),
        getStreamInfo: this.mockGetStreamInfo.bind(this)
      };

      this.isConnected = true;
      console.log('✅ KurrentDB Event Store connected');
    } catch (error) {
      console.error('❌ Failed to connect to KurrentDB:', error);
      throw error;
    }
  }

  /**
   * Append an event to the event store
   */
  async appendEvent(event) {
    if (!this.isConnected) {
      throw new Error('KurrentDB Event Store not connected');
    }

    try {
      const result = await this.kurrent.append({
        stream: event.type,
        data: event.data,
        metadata: {
          source: event.source,
          timestamp: event.timestamp,
          correlationId: event.correlationId,
          eventId: event.id
        }
      });

      // Store event in mock storage
      this.mockEvents.push({
        id: event.id,
        type: event.type,
        data: event.data,
        source: event.source,
        timestamp: event.timestamp,
        correlationId: event.correlationId,
        metadata: event.metadata
      });

      console.log(`📝 Event appended: ${event.type} (${event.id})`);
      return result;
    } catch (error) {
      console.error('❌ Failed to append event:', error);
      throw error;
    }
  }

  /**
   * Read events from a stream
   */
  async readEvents(stream, fromVersion = 0, maxCount = 1000) {
    if (!this.isConnected) {
      throw new Error('KurrentDB Event Store not connected');
    }

    try {
      const events = await this.kurrent.read({
        stream,
        fromVersion,
        maxCount
      });

      console.log(`📖 Read ${events.length} events from stream: ${stream}`);
      return events;
    } catch (error) {
      console.error('❌ Failed to read events:', error);
      throw error;
    }
  }

  /**
   * Get stream information
   */
  async getStreamInfo(stream) {
    if (!this.isConnected) {
      throw new Error('KurrentDB Event Store not connected');
    }

    try {
      const info = await this.kurrent.getStreamInfo(stream);
      return info;
    } catch (error) {
      console.error('❌ Failed to get stream info:', error);
      throw error;
    }
  }

  /**
   * Create a snapshot
   */
  async createSnapshot(streamName, version, data) {
    if (!this.isConnected) {
      throw new Error('KurrentDB Event Store not connected');
    }

    try {
      const snapshot = {
        streamName,
        version,
        timestamp: new Date().toISOString(),
        data
      };

      // Store snapshot in a separate stream
      await this.kurrent.append({
        stream: `snapshot:${streamName}`,
        data: snapshot,
        metadata: {
          type: 'snapshot',
          streamName,
          version
        }
      });

      console.log(`📸 Snapshot created for stream: ${streamName} at version ${version}`);
      return snapshot;
    } catch (error) {
      console.error('❌ Failed to create snapshot:', error);
      throw error;
    }
  }

  /**
   * Get latest snapshot for a stream
   */
  async getLatestSnapshot(streamName) {
    if (!this.isConnected) {
      throw new Error('KurrentDB Event Store not connected');
    }

    try {
      const snapshots = await this.kurrent.read({
        stream: `snapshot:${streamName}`,
        fromVersion: 0,
        maxCount: 1
      });

      return snapshots.length > 0 ? snapshots[0].data : null;
    } catch (error) {
      console.error('❌ Failed to get latest snapshot:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.kurrent.getStreamInfo('health-check');
      return {
        status: 'healthy',
        type: 'kurrentdb',
        connected: this.isConnected
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        type: 'kurrentdb',
        error: error.message
      };
    }
  }

  // Mock implementations for development/testing
  async mockAppend(params) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // This is already handled in appendEvent method
    return {
      stream: params.stream,
      version: Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString()
    };
  }

  async mockRead(params) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Return mock events
    const mockEvents = [];
    for (let i = 0; i < Math.min(params.maxCount, 10); i++) {
      mockEvents.push({
        stream: params.stream,
        version: params.fromVersion + i,
        data: {
          id: `event-${Date.now()}-${i}`,
          type: params.stream,
          data: { mock: true, index: i },
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return mockEvents;
  }

  async mockGetStreamInfo(stream) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 5));
    
    return {
      stream,
      version: Math.floor(Math.random() * 1000),
      eventCount: Math.floor(Math.random() * 10000),
      lastEventTimestamp: new Date().toISOString()
    };
  }

  /**
   * Get all events from all streams
   */
  async getAllEvents() {
    if (!this.isConnected) {
      throw new Error('KurrentDB Event Store not connected');
    }

    try {
      // Mock implementation - return stored events
      console.log(`📖 Getting all events from Event Store`);
      return this.mockEvents || [];
    } catch (error) {
      console.error('❌ Failed to get all events:', error);
      throw error;
    }
  }

  /**
   * Get events by type
   */
  async getEventsByType(eventType) {
    if (!this.isConnected) {
      throw new Error('KurrentDB Event Store not connected');
    }

    try {
      console.log(`📖 Getting events by type: ${eventType}`);
      const allEvents = this.mockEvents || [];
      return allEvents.filter(event => event.type === eventType);
    } catch (error) {
      console.error('❌ Failed to get events by type:', error);
      throw error;
    }
  }

  /**
   * Get events by stream
   */
  async getEventsByStream(streamName) {
    if (!this.isConnected) {
      throw new Error('KurrentDB Event Store not connected');
    }

    try {
      console.log(`📖 Getting events by stream: ${streamName}`);
      return await this.readEvents(streamName);
    } catch (error) {
      console.error('❌ Failed to get events by stream:', error);
      throw error;
    }
  }
}

module.exports = KurrentEventStore; 