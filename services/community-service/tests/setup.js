/**
 * Jest Test Setup for Community Service
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

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
   * Create test post data
   */
  createTestPost: (overrides = {}) => ({
    title: 'Test Post Title',
    content: 'This is test content for the post.',
    category: 'general',
    tags: ['test'],
    url: null,
    ...overrides
  }),
  
  /**
   * Create test user data
   */
  createTestUser: (overrides = {}) => ({
    id: require('uuid').v4(),
    email: 'test@example.com',
    name: 'Test User',
    ...overrides
  }),
  
  /**
   * Create test comment data
   */
  createTestComment: (overrides = {}) => ({
    id: require('uuid').v4(),
    content: 'This is a test comment.',
    authorId: require('uuid').v4(),
    ...overrides
  }),
  
  /**
   * Create test event data
   */
  createTestEvent: (type = 'TestEvent', data = {}) => ({
    type,
    data: {
      timestamp: new Date().toISOString(),
      ...data
    },
    metadata: {
      correlationId: require('uuid').v4(),
      source: 'test',
      version: '1.0.0'
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
    appendEvent: jest.fn().mockResolvedValue({
      success: true,
      eventId: require('uuid').v4(),
      streamName: 'test-stream',
      eventType: 'TestEvent',
      source: 'mock'
    }),
    readStream: jest.fn().mockResolvedValue({
      success: true,
      events: [],
      streamName: 'test-stream',
      eventCount: 0,
      source: 'mock'
    }),
    readAll: jest.fn().mockResolvedValue({
      success: true,
      events: [],
      eventCount: 0,
      source: 'mock'
    }),
    createSnapshot: jest.fn().mockResolvedValue({
      success: true,
      aggregateType: 'Test',
      aggregateId: require('uuid').v4(),
      version: 1
    }),
    loadSnapshot: jest.fn().mockResolvedValue({
      success: false,
      reason: 'Snapshot not found'
    }),
    healthCheck: jest.fn().mockResolvedValue({
      success: true,
      status: 'healthy'
    }),
    getClientStats: jest.fn().mockReturnValue({
      eventsAppended: 0,
      eventsRead: 0,
      errors: 0
    })
  })
};

// Global test data
global.testData = {
  validPost: {
    title: 'Valid Test Post',
    content: 'This is valid test content.',
    category: 'technology',
    tags: ['test', 'javascript'],
    url: 'https://example.com'
  },
  
  invalidPost: {
    title: '', // Invalid: empty title
    content: 'Content',
    category: 'general'
  },
  
  validUser: {
    id: require('uuid').v4(),
    email: 'valid@example.com',
    name: 'Valid User'
  },
  
  validComment: {
    content: 'This is a valid comment.',
    authorId: require('uuid').v4()
  }
};

// Mock external dependencies
jest.mock('axios');
jest.mock('firebase-admin');
jest.mock('redis');
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));
jest.mock('dotenv', () => ({ config: jest.fn() }));

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
  if (typeof message === 'string' && (
    message.includes('deprecated') ||
    message.includes('experimental')
  )) {
    return; // Suppress deprecation and experimental warnings
  }
  originalWarn.apply(console, args);
};
