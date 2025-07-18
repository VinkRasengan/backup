#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const services = [
  'auth-service',
  'link-service', 
  'community-service',
  'chat-service',
  'news-service',
  'admin-service',
  'phishtank-service',
  'api-gateway'
];

const jestConfig = `module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.js',
    '<rootDir>/src/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  forceExit: true,
  detectOpenHandles: true,
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};`;

const jestSetup = `// Polyfills for Node.js test environment
const { TextEncoder, TextDecoder } = require('util');
const { URL, URLSearchParams } = require('url');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.URL = URL;
global.URLSearchParams = URLSearchParams;

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn(),
    cert: jest.fn()
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn()
    }))
  }))
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn()
  }))
}));

// Mock Axios
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }))
}));

// Mock Winston logger
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    simple: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

// Mock Express
jest.mock('express', () => {
  const express = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn(),
    set: jest.fn()
  }));
  express.json = jest.fn();
  express.urlencoded = jest.fn();
  return express;
});

// Mock CORS
jest.mock('cors', () => jest.fn());

// Mock Helmet
jest.mock('helmet', () => jest.fn());

// Mock Morgan
jest.mock('morgan', () => jest.fn(() => (req, res, next) => next()));

// Mock Rate Limiter
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
  validate: jest.fn(() => true)
}));

// Mock Crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({ toString: jest.fn(() => 'test-random') })),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'test-hash')
    }))
  }))
}));

// Mock Node Cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    start: jest.fn(),
    stop: jest.fn()
  }))
}));

// Mock RSS Parser
jest.mock('rss-parser', () => jest.fn().mockImplementation(() => ({
  parseURL: jest.fn(),
  parseString: jest.fn()
})));

// Mock Prometheus Client
jest.mock('prom-client', () => ({
  Registry: jest.fn(() => ({
    registerMetric: jest.fn(),
    metrics: jest.fn(() => 'test-metrics'),
    contentType: 'text/plain'
  })),
  Counter: jest.fn(() => ({
    inc: jest.fn(),
    reset: jest.fn()
  })),
  Histogram: jest.fn(() => ({
    observe: jest.fn(),
    reset: jest.fn()
  })),
  Gauge: jest.fn(() => ({
    set: jest.fn(),
    inc: jest.fn(),
    dec: jest.fn(),
    reset: jest.fn()
  }))
}));

// Suppress console output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});`;

function setupServiceTestConfig(serviceName) {
  const servicePath = path.join(__dirname, '..', 'services', serviceName);
  
  if (!fs.existsSync(servicePath)) {
    console.log(`Service ${serviceName} not found, skipping...`);
    return;
  }

  console.log(`Setting up test config for ${serviceName}...`);

  // Create jest.config.js
  const jestConfigPath = path.join(servicePath, 'jest.config.js');
  if (!fs.existsSync(jestConfigPath)) {
    fs.writeFileSync(jestConfigPath, jestConfig);
    console.log(`Created jest.config.js for ${serviceName}`);
  }

  // Create jest.setup.js
  const jestSetupPath = path.join(servicePath, 'jest.setup.js');
  if (!fs.existsSync(jestSetupPath)) {
    fs.writeFileSync(jestSetupPath, jestSetup);
    console.log(`Created jest.setup.js for ${serviceName}`);
  }
}

// Setup test configs for all services
services.forEach(setupServiceTestConfig);

console.log('Test configuration setup complete!'); 