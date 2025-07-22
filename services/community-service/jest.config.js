module.exports = {
  testEnvironment: 'node',
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.js',
    '<rootDir>/src/**/*.test.js',
    '<rootDir>/tests/**/*.test.js'
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
    '^.+\.js$': 'babel-jest',
  },
  // setupFiles: ['<rootDir>/jest.setup.js'],
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
};