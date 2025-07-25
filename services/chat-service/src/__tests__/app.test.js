const request = require('supertest');

// Mock the app before requiring it
jest.mock('../config/firebase.js', () => ({
  initializeApp: jest.fn(),
  getFirestore: jest.fn(),
  FieldValue: {
    serverTimestamp: jest.fn()
  }
}));

describe('Chat Service', () => {
  let app;

  beforeAll(() => {
    // Set required environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3004';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.JWT_SECRET = 'test-secret';

    // Require app after setting env vars
    const chatService = require('../app');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });
    app = chatService.app;
  });

  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
    });
  });

  describe('Service Info', () => {
    test('GET /api/v1/chat/info should return service info', async () => {
      const response = await request(app)
        .get('/api/v1/chat/info')
        .expect(200);
      
      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toBe('chat-service');
    });
  });
}); 