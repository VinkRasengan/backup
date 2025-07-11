const request = require('supertest');

describe('API Gateway', () => {
  let app;

  beforeAll(() => {
    // Set required environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8080';
    process.env.JWT_SECRET = 'test-secret';
    
    // Require app after setting env vars
    try {
      app = require('../../app');
    } catch (error) {
      app = require('../app');
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
    test('GET /api/v1/gateway/info should return service info', async () => {
      const response = await request(app)
        .get('/api/v1/gateway/info')
        .expect(200);
      
      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toBe('api-gateway');
    });
  });
}); 