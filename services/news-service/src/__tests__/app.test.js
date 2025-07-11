const request = require('supertest');

describe('News Service', () => {
  let app;

  beforeAll(() => {
    // Set required environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3005';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.JWT_SECRET = 'test-secret';
    
    // Require app after setting env vars
    app = require('../app');
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
    test('GET /api/v1/news/info should return service info', async () => {
      const response = await request(app)
        .get('/api/v1/news/info')
        .expect(200);
      
      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toBe('news-service');
    });
  });
}); 