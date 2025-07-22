/**
 * Event Store Tests
 * Test suite for KurrentDB Event Store implementation
 */

const KurrentEventStore = require('../src/eventStore/kurrentEventStore');
const { v4: uuidv4 } = require('uuid');

describe('KurrentEventStore', () => {
  let eventStore;
  
  beforeEach(() => {
    eventStore = new KurrentEventStore({
      serviceName: 'test-service',
      enabled: false // Use fallback mode for tests
    });
  });

  afterEach(async () => {
    if (eventStore) {
      eventStore.fallbackEvents.clear();
    }
  });

  describe('Initialization', () => {
    test('should initialize with fallback mode when disabled', async () => {
      const result = await eventStore.initialize();
      
      expect(result.success).toBe(true);
      expect(result.mode).toBe('fallback');
      expect(eventStore.isConnected).toBe(false);
    });

    test('should initialize with proper configuration', () => {
      const config = {
        serviceName: 'test-service',
        batchSize: 50,
        retryAttempts: 5
      };
      
      const store = new KurrentEventStore(config);
      
      expect(store.config.serviceName).toBe('test-service');
      expect(store.config.batchSize).toBe(50);
      expect(store.config.retryAttempts).toBe(5);
    });
  });

  describe('Event Operations', () => {
    beforeEach(async () => {
      await eventStore.initialize();
    });

    test('should append event to stream', async () => {
      const streamName = 'test-stream';
      const eventType = 'TestEvent';
      const eventData = { message: 'Hello World', timestamp: new Date().toISOString() };
      const metadata = { userId: 'user123', correlationId: uuidv4() };

      const result = await eventStore.appendEvent(streamName, eventType, eventData, metadata);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.streamName).toBe(streamName);
      expect(result.eventType).toBe(eventType);
      expect(result.source).toBe('fallback');
      expect(eventStore.stats.eventsAppended).toBe(1);
      expect(eventStore.stats.fallbackUsed).toBe(1);
    });

    test('should read events from stream', async () => {
      const streamName = 'test-stream-read';
      
      // Append some test events
      const events = [
        { type: 'Event1', data: { value: 1 } },
        { type: 'Event2', data: { value: 2 } },
        { type: 'Event3', data: { value: 3 } }
      ];

      for (const event of events) {
        await eventStore.appendEvent(streamName, event.type, event.data);
      }

      // Read events back
      const result = await eventStore.readStream(streamName);

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(3);
      expect(result.streamName).toBe(streamName);
      expect(result.source).toBe('fallback');
      
      // Check event order and content
      expect(result.events[0].type).toBe('Event1');
      expect(result.events[0].data.value).toBe(1);
      expect(result.events[1].type).toBe('Event2');
      expect(result.events[1].data.value).toBe(2);
      expect(result.events[2].type).toBe('Event3');
      expect(result.events[2].data.value).toBe(3);
    });

    test('should read events with pagination', async () => {
      const streamName = 'test-stream-pagination';
      
      // Append 5 events
      for (let i = 1; i <= 5; i++) {
        await eventStore.appendEvent(streamName, 'TestEvent', { value: i });
      }

      // Read with maxCount = 3
      const result = await eventStore.readStream(streamName, { maxCount: 3 });

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(3);
      expect(result.events[0].data.value).toBe(1);
      expect(result.events[2].data.value).toBe(3);
    });

    test('should read events in reverse order', async () => {
      const streamName = 'test-stream-reverse';
      
      // Append events
      await eventStore.appendEvent(streamName, 'Event1', { value: 1 });
      await eventStore.appendEvent(streamName, 'Event2', { value: 2 });
      await eventStore.appendEvent(streamName, 'Event3', { value: 3 });

      // Read in reverse
      const result = await eventStore.readStream(streamName, { direction: 'backwards' });

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(3);
      expect(result.events[0].data.value).toBe(3);
      expect(result.events[1].data.value).toBe(2);
      expect(result.events[2].data.value).toBe(1);
    });

    test('should read all events across streams', async () => {
      // Append events to different streams
      await eventStore.appendEvent('stream1', 'Event1', { stream: 1 });
      await eventStore.appendEvent('stream2', 'Event2', { stream: 2 });
      await eventStore.appendEvent('stream1', 'Event3', { stream: 1 });

      const result = await eventStore.readAll();

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(3);
      expect(result.source).toBe('fallback');
      
      // Events should be sorted by timestamp
      expect(result.events[0].data.stream).toBe(1);
      expect(result.events[1].data.stream).toBe(2);
      expect(result.events[2].data.stream).toBe(1);
    });

    test('should return empty array for non-existent stream', async () => {
      const result = await eventStore.readStream('non-existent-stream');

      expect(result.success).toBe(true);
      expect(result.events).toHaveLength(0);
      expect(result.streamName).toBe('non-existent-stream');
    });
  });

  describe('Snapshot Operations', () => {
    beforeEach(async () => {
      await eventStore.initialize();
    });

    test('should create snapshot', async () => {
      const aggregateId = uuidv4();
      const aggregateType = 'TestAggregate';
      const state = { value: 42, name: 'Test' };
      const version = 10;

      const result = await eventStore.createSnapshot(aggregateId, aggregateType, state, version);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(eventStore.stats.snapshotsTaken).toBe(1);
    });

    test('should load snapshot', async () => {
      const aggregateId = uuidv4();
      const aggregateType = 'TestAggregate';
      const state = { value: 42, name: 'Test' };
      const version = 10;

      // Create snapshot first
      await eventStore.createSnapshot(aggregateId, aggregateType, state, version);

      // Load snapshot
      const result = await eventStore.loadSnapshot(aggregateId, aggregateType);

      expect(result.success).toBe(true);
      expect(result.snapshot.aggregateId).toBe(aggregateId);
      expect(result.snapshot.aggregateType).toBe(aggregateType);
      expect(result.snapshot.state.value).toBe(42);
      expect(result.snapshot.version).toBe(version);
    });

    test('should return not found for non-existent snapshot', async () => {
      const result = await eventStore.loadSnapshot('non-existent', 'TestAggregate');

      expect(result.success).toBe(false);
      expect(result.reason).toBe('No snapshot found');
    });
  });

  describe('Statistics and Health', () => {
    beforeEach(async () => {
      await eventStore.initialize();
    });

    test('should track statistics correctly', async () => {
      const initialStats = eventStore.getStats();
      expect(initialStats.eventsAppended).toBe(0);
      expect(initialStats.eventsRead).toBe(0);

      // Append some events
      await eventStore.appendEvent('test-stream', 'Event1', { data: 1 });
      await eventStore.appendEvent('test-stream', 'Event2', { data: 2 });

      // Read events
      await eventStore.readStream('test-stream');

      const finalStats = eventStore.getStats();
      expect(finalStats.eventsAppended).toBe(2);
      expect(finalStats.eventsRead).toBe(2);
      expect(finalStats.fallbackUsed).toBe(2);
    });

    test('should return health status', async () => {
      const health = await eventStore.healthCheck();

      expect(health.status).toBe('degraded'); // Using fallback mode
      expect(health.mode).toBe('fallback');
      expect(health.stats).toBeDefined();
    });

    test('should return proper stats structure', () => {
      const stats = eventStore.getStats();

      expect(stats).toHaveProperty('eventsAppended');
      expect(stats).toHaveProperty('eventsRead');
      expect(stats).toHaveProperty('snapshotsTaken');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('fallbackUsed');
      expect(stats).toHaveProperty('isConnected');
      expect(stats).toHaveProperty('mode');
      expect(stats).toHaveProperty('fallbackStreams');
      expect(stats).toHaveProperty('config');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await eventStore.initialize();
    });

    test('should handle invalid stream name', async () => {
      await expect(eventStore.appendEvent('', 'TestEvent', {}))
        .rejects.toThrow('Invalid stream name');
      
      await expect(eventStore.readStream(''))
        .rejects.toThrow('Invalid stream name');
    });

    test('should handle null/undefined parameters', async () => {
      await expect(eventStore.appendEvent(null, 'TestEvent', {}))
        .rejects.toThrow('Invalid stream name');
      
      await expect(eventStore.readStream(undefined))
        .rejects.toThrow('Invalid stream name');
    });

    test('should create valid event structure', async () => {
      const streamName = 'test-stream';
      const eventType = 'TestEvent';
      const eventData = { test: true };
      const metadata = { userId: 'user123' };

      await eventStore.appendEvent(streamName, eventType, eventData, metadata);

      const result = await eventStore.readStream(streamName);
      const event = result.events[0];

      expect(event.id).toBeDefined();
      expect(event.type).toBe(eventType);
      expect(event.data).toEqual(eventData);
      expect(event.metadata.userId).toBe('user123');
      expect(event.metadata.timestamp).toBeDefined();
      expect(event.metadata.correlationId).toBeDefined();
      expect(event.metadata.source).toBe('test-service');
    });
  });

  describe('Event Metadata', () => {
    beforeEach(async () => {
      await eventStore.initialize();
    });

    test('should preserve custom metadata', async () => {
      const metadata = {
        userId: 'user123',
        correlationId: 'corr123',
        causationId: 'cause123',
        customField: 'customValue'
      };

      await eventStore.appendEvent('test-stream', 'TestEvent', { data: 1 }, metadata);
      const result = await eventStore.readStream('test-stream');
      const event = result.events[0];

      expect(event.metadata.userId).toBe('user123');
      expect(event.metadata.correlationId).toBe('corr123');
      expect(event.metadata.causationId).toBe('cause123');
      expect(event.metadata.customField).toBe('customValue');
    });

    test('should generate correlationId if not provided', async () => {
      await eventStore.appendEvent('test-stream', 'TestEvent', { data: 1 });
      const result = await eventStore.readStream('test-stream');
      const event = result.events[0];

      expect(event.metadata.correlationId).toBeDefined();
      expect(event.metadata.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    test('should set default version and source', async () => {
      await eventStore.appendEvent('test-stream', 'TestEvent', { data: 1 });
      const result = await eventStore.readStream('test-stream');
      const event = result.events[0];

      expect(event.metadata.version).toBe('1.0.0');
      expect(event.metadata.source).toBe('test-service');
    });
  });
});
