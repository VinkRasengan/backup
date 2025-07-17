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
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // Đổi từ moduleNameMapping sang moduleNameMapper để đúng với cấu hình của Jest
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\.js$': 'babel-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};