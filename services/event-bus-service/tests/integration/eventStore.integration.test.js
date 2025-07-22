/**
 * Event Store Integration Tests
 * End-to-end tests for Event Store Service
 */

const request = require('supertest');
const EventBusService = require('../../src/app');
const { v4: uuidv4 } = require('uuid');

describe('Event Store Integration Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.EVENT_STORE_ENABLED = 'false'; // Use fallback mode
    process.env.KURRENTDB_ENABLED = 'false';
    process.env.PORT = '0'; // Use random port

    // Create app instance
    const eventBusService = new EventBusService();
    app = eventBusService.app;
    
    // Initialize without starting server
    await eventBusService.eventStore.initialize();
    
    // Start server on random port
    server = app.listen(0);
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/eventstore/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('degraded'); // Using fallback mode
      expect(response.body.data.mode).toBe('fallback');
      expect(response.body.data.stats).toBeDefined();
    });
  });

  describe('Event Operations', () => {
    const streamName = `test-stream-${uuidv4()}`;
    const serviceName = 'integration-test-service';

    test('should append event to stream', async () => {
      const eventData = {
        eventType: 'TestEvent',
        eventData: {
          message: 'Hello from integration test',
          timestamp: new Date().toISOString(),
          value: 42
        },
        metadata: {
          userId: uuidv4(),
          correlationId: uuidv4()
        }
      };

      const response = await request(app)
        .post(`/api/eventstore/events/${streamName}`)
        .set('x-service-name', serviceName)
        .set('x-correlation-id', eventData.metadata.correlationId)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.eventId).toBeDefined();
      expect(response.body.data.streamName).toBe(streamName);
      expect(response.body.data.eventType).toBe('TestEvent');
      expect(response.body.data.source).toBe('fallback');
    });

    test('should read events from stream', async () => {
      // First append some events
      const events = [
        { type: 'Event1', data: { value: 1 } },
        { type: 'Event2', data: { value: 2 } },
        { type: 'Event3', data: { value: 3 } }
      ];

      for (const event of events) {
        await request(app)
          .post(`/api/eventstore/events/${streamName}`)
          .set('x-service-name', serviceName)
          .send({
            eventType: event.type,
            eventData: event.data,
            metadata: {}
          });
      }

      // Read events back
      const response = await request(app)
        .get(`/api/eventstore/events/${streamName}`)
        .set('x-service-name', serviceName)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streamName).toBe(streamName);
      expect(response.body.data.events.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data.source).toBe('fallback');

      // Check event order and content
      const readEvents = response.body.data.events;
      const lastThreeEvents = readEvents.slice(-3);
      
      expect(lastThreeEvents[0].type).toBe('Event1');
      expect(lastThreeEvents[0].data.value).toBe(1);
      expect(lastThreeEvents[1].type).toBe('Event2');
      expect(lastThreeEvents[1].data.value).toBe(2);
      expect(lastThreeEvents[2].type).toBe('Event3');
      expect(lastThreeEvents[2].data.value).toBe(3);
    });

    test('should read events with query parameters', async () => {
      const response = await request(app)
        .get(`/api/eventstore/events/${streamName}`)
        .query({
          maxCount: 2,
          direction: 'backwards',
          includeMetadata: 'true'
        })
        .set('x-service-name', serviceName)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeLessThanOrEqual(2);
      
      // Should include metadata
      if (response.body.data.events.length > 0) {
        expect(response.body.data.events[0].metadata).toBeDefined();
      }
    });

    test('should read all events', async () => {
      const response = await request(app)
        .get('/api/eventstore/events')
        .query({ maxCount: 10 })
        .set('x-service-name', serviceName)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(response.body.data.eventCount).toBeDefined();
      expect(response.body.data.source).toBe('fallback');
    });

    test('should return empty array for non-existent stream', async () => {
      const nonExistentStream = `non-existent-${uuidv4()}`;
      
      const response = await request(app)
        .get(`/api/eventstore/events/${nonExistentStream}`)
        .set('x-service-name', serviceName)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(0);
      expect(response.body.data.streamName).toBe(nonExistentStream);
    });
  });

  describe('Snapshot Operations', () => {
    const aggregateType = 'TestAggregate';
    const aggregateId = uuidv4();
    const serviceName = 'integration-test-service';

    test('should create snapshot', async () => {
      const snapshotData = {
        state: {
          id: aggregateId,
          name: 'Test Aggregate',
          value: 100,
          items: ['item1', 'item2']
        },
        version: 5
      };

      const response = await request(app)
        .post(`/api/eventstore/snapshots/${aggregateType}/${aggregateId}`)
        .set('x-service-name', serviceName)
        .send(snapshotData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.eventId).toBeDefined();
    });

    test('should load snapshot', async () => {
      const response = await request(app)
        .get(`/api/eventstore/snapshots/${aggregateType}/${aggregateId}`)
        .set('x-service-name', serviceName)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.snapshot.aggregateId).toBe(aggregateId);
      expect(response.body.data.snapshot.aggregateType).toBe(aggregateType);
      expect(response.body.data.snapshot.state.name).toBe('Test Aggregate');
      expect(response.body.data.snapshot.version).toBe(5);
    });

    test('should return 404 for non-existent snapshot', async () => {
      const nonExistentId = uuidv4();
      
      const response = await request(app)
        .get(`/api/eventstore/snapshots/${aggregateType}/${nonExistentId}`)
        .set('x-service-name', serviceName)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('Statistics', () => {
    test('should return event store statistics', async () => {
      const response = await request(app)
        .get('/api/eventstore/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.eventsAppended).toBeGreaterThan(0);
      expect(response.body.data.mode).toBe('fallback');
      expect(response.body.data.isConnected).toBe(false);
      expect(response.body.data.config).toBeDefined();
    });
  });

  describe('Validation', () => {
    const serviceName = 'integration-test-service';

    test('should validate stream name', async () => {
      const invalidStreamNames = ['', ' ', 'stream with spaces', 'stream/with/slashes'];

      for (const invalidName of invalidStreamNames) {
        const response = await request(app)
          .post(`/api/eventstore/events/${invalidName}`)
          .set('x-service-name', serviceName)
          .send({
            eventType: 'TestEvent',
            eventData: { test: true },
            metadata: {}
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid stream name');
      }
    });

    test('should validate event data', async () => {
      const streamName = `validation-test-${uuidv4()}`;

      // Missing eventType
      await request(app)
        .post(`/api/eventstore/events/${streamName}`)
        .set('x-service-name', serviceName)
        .send({
          eventData: { test: true },
          metadata: {}
        })
        .expect(400);

      // Missing eventData
      await request(app)
        .post(`/api/eventstore/events/${streamName}`)
        .set('x-service-name', serviceName)
        .send({
          eventType: 'TestEvent',
          metadata: {}
        })
        .expect(400);

      // Invalid eventType
      await request(app)
        .post(`/api/eventstore/events/${streamName}`)
        .set('x-service-name', serviceName)
        .send({
          eventType: 'Invalid Event Type!',
          eventData: { test: true },
          metadata: {}
        })
        .expect(400);
    });

    test('should validate snapshot data', async () => {
      const aggregateType = 'TestAggregate';
      const aggregateId = uuidv4();

      // Missing state
      await request(app)
        .post(`/api/eventstore/snapshots/${aggregateType}/${aggregateId}`)
        .set('x-service-name', serviceName)
        .send({
          version: 1
        })
        .expect(400);

      // Missing version
      await request(app)
        .post(`/api/eventstore/snapshots/${aggregateType}/${aggregateId}`)
        .set('x-service-name', serviceName)
        .send({
          state: { test: true }
        })
        .expect(400);

      // Invalid version
      await request(app)
        .post(`/api/eventstore/snapshots/${aggregateType}/${aggregateId}`)
        .set('x-service-name', serviceName)
        .send({
          state: { test: true },
          version: -1
        })
        .expect(400);
    });

    test('should validate query parameters', async () => {
      const streamName = `query-validation-${uuidv4()}`;

      // Invalid maxCount
      await request(app)
        .get(`/api/eventstore/events/${streamName}`)
        .query({ maxCount: 2000 }) // Exceeds limit
        .set('x-service-name', serviceName)
        .expect(400);

      // Invalid direction
      await request(app)
        .get(`/api/eventstore/events/${streamName}`)
        .query({ direction: 'invalid' })
        .set('x-service-name', serviceName)
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing service name header', async () => {
      const streamName = `error-test-${uuidv4()}`;

      const response = await request(app)
        .post(`/api/eventstore/events/${streamName}`)
        .send({
          eventType: 'TestEvent',
          eventData: { test: true },
          metadata: {}
        })
        .expect(200); // Should still work, just use 'unknown' as service name

      expect(response.body.success).toBe(true);
    });

    test('should handle malformed JSON', async () => {
      const streamName = `error-test-${uuidv4()}`;

      await request(app)
        .post(`/api/eventstore/events/${streamName}`)
        .set('Content-Type', 'application/json')
        .set('x-service-name', 'test-service')
        .send('{ invalid json }')
        .expect(400);
    });

    test('should handle 404 routes', async () => {
      await request(app)
        .get('/api/eventstore/nonexistent')
        .expect(404);
    });
  });

  describe('CORS and Headers', () => {
    test('should include correlation ID in response', async () => {
      const correlationId = uuidv4();
      
      const response = await request(app)
        .get('/api/eventstore/health')
        .set('x-correlation-id', correlationId);

      expect(response.headers['x-correlation-id']).toBe(correlationId);
    });

    test('should generate correlation ID if not provided', async () => {
      const response = await request(app)
        .get('/api/eventstore/health');

      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(response.headers['x-correlation-id']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });
});
