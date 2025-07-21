const request = require('supertest');

describe('PhishTank Service', () => {
  let app;
  let server;

  beforeAll(() => {
    // Set required environment variables
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3007';
    process.env.JWT_SECRET = 'test-secret';
    process.env.PHISHTANK_SERVICE_PORT = '3007';

    // Require app after setting env vars
    app = require('../app');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
  });

  afterAll(async () => {
    // Clean up any open handles
    if (server && server.close) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }

    // Give Jest time to clean up
    await new Promise(resolve => setTimeout(resolve, 100));
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
    test('GET /api/v1/phishtank/info should return service info', async () => {
      const response = await request(app)
        .get('/api/v1/phishtank/info')
        .expect(200);
      
      expect(response.body).toHaveProperty('service');
      expect(response.body.service).toBe('phishtank-service');
    });
  });
}); 