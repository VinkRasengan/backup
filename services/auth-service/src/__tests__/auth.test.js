const request = require('supertest');
const app = require('../app');

// Mock Firebase Admin
jest.mock('../config/firebase', () => ({
  auth: {
    verifyIdToken: jest.fn()
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }))
    }))
  },
  collections: {
    USERS: 'users'
  }
}));

describe('Auth Service', () => {
  describe('Health Checks', () => {
    test('GET /health should return service health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /health/live should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('status', 'alive');
    });

    test('GET /info should return service information', async () => {
      const response = await request(app)
        .get('/info')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'auth-service');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /auth/register', () => {
      test('should require idToken', async () => {
        const response = await request(app)
          .post('/auth/register')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('VALIDATION_ERROR');
      });

      test('should validate firstName length', async () => {
        const response = await request(app)
          .post('/auth/register')
          .send({
            idToken: 'valid-token',
            firstName: 'a'.repeat(51) // Too long
          })
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /auth/login', () => {
      test('should require idToken', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('POST /auth/verify-token', () => {
      test('should require token', async () => {
        const response = await request(app)
          .post('/auth/verify-token')
          .send({})
          .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Endpoint not found');
      expect(response.body).toHaveProperty('code', 'ENDPOINT_NOT_FOUND');
      expect(response.body).toHaveProperty('service', 'auth-service');
    });

    test('should include correlation ID in error responses', async () => {
      const correlationId = 'test-correlation-id';
      
      const response = await request(app)
        .get('/unknown-endpoint')
        .set('x-correlation-id', correlationId)
        .expect(404);

      expect(response.headers).toHaveProperty('x-correlation-id', correlationId);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('CORS', () => {
    test('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });
});
