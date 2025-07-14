module.exports = {
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
  // Add polyfills for Node.js environment
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // Mock modules that might cause issues in test environment
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // Setup files
  setupFiles: ['<rootDir>/jest.setup.js'],
}; 