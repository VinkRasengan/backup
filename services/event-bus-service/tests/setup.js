/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests
process.env.EVENT_STORE_ENABLED = 'false';
process.env.KURRENTDB_ENABLED = 'false';
process.env.REDIS_ENABLED = 'false';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  /**
   * Generate test UUID
   */
  generateId: () => require('uuid').v4(),
  
  /**
   * Create test event data
   */
  createTestEvent: (type = 'TestEvent', data = {}) => ({
    eventType: type,
    eventData: {
      timestamp: new Date().toISOString(),
      ...data
    },
    metadata: {
      correlationId: require('uuid').v4(),
      source: 'test'
    }
  }),
  
  /**
   * Create test aggregate data
   */
  createTestAggregate: (id, type = 'TestAggregate') => ({
    id,
    type,
    version: 1,
    state: {
      name: 'Test Aggregate',
      value: 42
    }
  }),
  
  /**
   * Wait for async operations
   */
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Create mock event store client
   */
  createMockEventStoreClient: () => ({
    readStream: jest.fn(),
    appendEvent: jest.fn(),
    createSnapshot: jest.fn(),
    loadSnapshot: jest.fn(),
    readAll: jest.fn(),
    healthCheck: jest.fn(),
    getClientStats: jest.fn()
  })
};

// Global test data
global.testData = {
  validStreamName: 'test-stream',
  validEventType: 'TestEvent',
  validEventData: { message: 'test', value: 123 },
  validMetadata: {
    correlationId: require('uuid').v4(),
    userId: 'test-user',
    source: 'test'
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Suppress specific warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('deprecated')) {
    return; // Suppress deprecation warnings
  }
  originalWarn.apply(console, args);
};
