#!/usr/bin/env node

/**
 * Fix Jest Configuration Issues
 * Standardizes Jest configurations across all services
 */

const fs = require('fs');
const path = require('path');

class JestConfigFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.services = [
      'api-gateway',
      'auth-service',
      'link-service',
      'community-service',
      'chat-service',
      'news-service',
      'admin-service',
      'phishtank-service',
      'criminalip-service'
    ];
    this.fixed = [];
    this.errors = [];
  }

  async fixAllConfigs() {
    console.log('🔧 Fixing Jest Configurations Across Services');
    console.log('='.repeat(50));

    // Fix service Jest configs
    for (const service of this.services) {
      await this.fixServiceJestConfig(service);
    }

    // Fix client Jest config
    await this.fixClientJestConfig();

    // Generate report
    this.generateReport();

    return this.errors.length === 0;
  }

  async fixServiceJestConfig(serviceName) {
    const servicePath = path.join(this.projectRoot, 'services', serviceName);
    const jestConfigPath = path.join(servicePath, 'jest.config.js');
    const jestSetupPath = path.join(servicePath, 'jest.setup.js');

    if (!fs.existsSync(servicePath)) {
      this.errors.push(`❌ Service directory not found: ${serviceName}`);
      return;
    }

    try {
      // Create standardized Jest config
      const jestConfig = this.generateStandardJestConfig();
      fs.writeFileSync(jestConfigPath, jestConfig);

      // Create standardized Jest setup
      const jestSetup = this.generateStandardJestSetup(serviceName);
      fs.writeFileSync(jestSetupPath, jestSetup);

      this.fixed.push(`✅ Fixed Jest config for ${serviceName}`);

    } catch (error) {
      this.errors.push(`❌ Failed to fix ${serviceName}: ${error.message}`);
    }
  }

  async fixClientJestConfig() {
    const clientPath = path.join(this.projectRoot, 'client');
    const setupTestsPath = path.join(clientPath, 'src', 'setupTests.js');

    if (!fs.existsSync(clientPath)) {
      this.errors.push('❌ Client directory not found');
      return;
    }

    try {
      // Ensure setupTests.js exists and is properly configured
      if (fs.existsSync(setupTestsPath)) {
        const content = fs.readFileSync(setupTestsPath, 'utf8');
        
        // Check if it has proper polyfills
        if (!content.includes('TextEncoder') || !content.includes('jest-dom')) {
          const improvedSetupTests = this.generateImprovedSetupTests();
          fs.writeFileSync(setupTestsPath, improvedSetupTests);
          this.fixed.push('✅ Fixed client setupTests.js');
        } else {
          this.fixed.push('✅ Client setupTests.js already properly configured');
        }
      } else {
        const setupTests = this.generateImprovedSetupTests();
        fs.writeFileSync(setupTestsPath, setupTests);
        this.fixed.push('✅ Created client setupTests.js');
      }

    } catch (error) {
      this.errors.push(`❌ Failed to fix client Jest config: ${error.message}`);
    }
  }

  generateStandardJestConfig() {
    return `module.exports = {
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
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Ignore node_modules except for ES modules that need transformation
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@google-cloud|firebase-admin)/)'
  ],
  // Mock external dependencies
  moduleNameMapper: {
    '^axios$': '<rootDir>/__mocks__/axios.js',
    '^firebase-admin$': '<rootDir>/__mocks__/firebase-admin.js',
    '^redis$': '<rootDir>/__mocks__/redis.js'
  }
};`;
  }

  generateStandardJestSetup(serviceName) {
    return `// Jest setup for ${serviceName}
// Polyfills for Node.js test environment
const { TextEncoder, TextDecoder } = require('util');
const { URL, URLSearchParams } = require('url');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.URL = URL;
global.URLSearchParams = URLSearchParams;

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.TEST_MODE = 'true';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-minimum-32-characters';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

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
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
        set: jest.fn(() => Promise.resolve()),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve())
      })),
      add: jest.fn(() => Promise.resolve({ id: 'test-id' })),
      where: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ docs: [] }))
      }))
    })),
    doc: jest.fn(),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(() => Promise.resolve())
    }))
  }))
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve()),
    del: jest.fn(() => Promise.resolve()),
    exists: jest.fn(() => Promise.resolve(0)),
    expire: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn(() => Promise.resolve())
  }))
}));

// Mock Axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ data: {} })),
      post: jest.fn(() => Promise.resolve({ data: {} })),
      put: jest.fn(() => Promise.resolve({ data: {} })),
      delete: jest.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    })),
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} }))
  },
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}));

// Mock Express
jest.mock('express', () => {
  const mockExpress = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn((port, callback) => {
      if (callback) callback();
      return { close: jest.fn() };
    })
  }));
  
  mockExpress.json = jest.fn();
  mockExpress.urlencoded = jest.fn();
  mockExpress.static = jest.fn();
  mockExpress.Router = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }));
  
  return mockExpress;
});

// Mock common middleware
jest.mock('cors', () => jest.fn(() => (req, res, next) => next()));
jest.mock('helmet', () => jest.fn(() => (req, res, next) => next()));
jest.mock('morgan', () => jest.fn(() => (req, res, next) => next()));
jest.mock('express-rate-limit', () => jest.fn(() => (req, res, next) => next()));

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
  validate: jest.fn(() => true)
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({ toString: jest.fn(() => 'test-random') })),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'test-hash')
    }))
  }))
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Suppress console logs in tests unless explicitly needed
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);`;
  }

  generateImprovedSetupTests() {
    return `// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfills for Node.js test environment
if (typeof global !== 'undefined') {
  // TextEncoder/TextDecoder polyfills
  if (!global.TextEncoder) {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  }

  // URL polyfills
  if (!global.URL) {
    const { URL, URLSearchParams } = require('url');
    global.URL = URL;
    global.URLSearchParams = URLSearchParams;
  }

  // Web API polyfills
  if (!global.fetch) {
    global.fetch = require('node-fetch');
  }

  // Mock window object
  if (!global.window) {
    global.window = {
      location: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: ''
      },
      localStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      sessionStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };
  }
}

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn()
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({})
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    form: 'form',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    option: 'option',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    p: 'p',
    a: 'a',
    img: 'img',
    ul: 'ul',
    li: 'li'
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  })
}));

// Suppress console warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: componentWillReceiveProps'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});`;
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Jest Configuration Fix Report');
    console.log('='.repeat(50));

    if (this.fixed.length > 0) {
      console.log('\n✅ FIXED:');
      this.fixed.forEach(fix => console.log(`   ${fix}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(error => console.log(`   ${error}`));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`📈 Summary: ${this.fixed.length} fixed, ${this.errors.length} errors`);

    if (this.errors.length === 0) {
      console.log('🎉 All Jest configurations fixed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Run tests: npm run test:services');
      console.log('   2. Run client tests: cd client && npm test');
      console.log('   3. Check coverage: npm run test:coverage');
    } else {
      console.log('❌ Some configurations could not be fixed');
      console.log('💡 Please review the errors above and fix manually');
    }
  }
}

// Run fixer if called directly
if (require.main === module) {
  const fixer = new JestConfigFixer();
  fixer.fixAllConfigs().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Jest config fixer failed:', error);
    process.exit(1);
  });
}

module.exports = JestConfigFixer;
