const request = require('supertest');

describe('News Service', () => {
  let app;
  let server;

  beforeAll(() => {
    // Set required environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3005';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.JWT_SECRET = 'test-secret';
    
    // Require app after setting env vars
    app = require('../app');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });
  });

  afterAll(async () => {
    // Cleanup server and intervals
    if (global.server) {
      await new Promise((resolve) => {
        global.server.close(resolve);
      });
    }
    
    // Clear all intervals
    const highestId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestId; i++) {
      clearInterval(i);
    }
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
    test('GET /api/v1/news should return service status', async () => {
      const response = await request(app)
        .get('/api/v1/news')
        .expect(200);
      
      expect(response.body).toHaveProperty('status');
    });
  });
}); 