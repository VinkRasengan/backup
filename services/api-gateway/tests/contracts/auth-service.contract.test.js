/**
 * Contract Tests for Auth Service
 * Tests the contract between API Gateway (consumer) and Auth Service (provider)
 */

const { Pact } = require('@pact-foundation/pact');
const axios = require('axios');
const path = require('path');

describe('API Gateway -> Auth Service Contract', () => {
  let provider;
  const mockPort = 1234;
  const mockBaseUrl = `http://localhost:${mockPort}`;

  beforeAll(async () => {
    provider = new Pact({
      consumer: 'api-gateway',
      provider: 'auth-service',
      port: mockPort,
      log: path.join(__dirname, '../../logs/pact/auth-service.log'),
      dir: path.join(__dirname, '../../pacts'),
      logLevel: 'INFO',
      spec: 2
    });

    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  afterEach(async () => {
    await provider.verify();
  });

  describe('Token Verification', () => {
    test('should verify valid JWT token', async () => {
      // Arrange
      const expectedRequest = {
        method: 'POST',
        path: '/auth/verify',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token'
        }
      };

      const expectedResponse = {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
            roles: ['user'],
            emailVerified: true
          }
        }
      };

      await provider.addInteraction({
        description: 'Verify valid JWT token',
        providerState: 'valid token exists',
        uponReceiving: 'a request to verify token',
        withRequest: expectedRequest,
        willRespondWith: expectedResponse
      });

      // Act
      const response = await axios.post(`${mockBaseUrl}/auth/verify`, {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.user.id).toBe('123');
      expect(response.data.user.email).toBe('user@example.com');
      expect(response.data.user.roles).toContain('user');
    });

    test('should reject invalid JWT token', async () => {
      // Arrange
      const expectedRequest = {
        method: 'POST',
        path: '/auth/verify',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          token: 'invalid.jwt.token'
        }
      };

      const expectedResponse = {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        }
      };

      await provider.addInteraction({
        description: 'Reject invalid JWT token',
        providerState: 'invalid token provided',
        uponReceiving: 'a request to verify invalid token',
        withRequest: expectedRequest,
        willRespondWith: expectedResponse
      });

      // Act & Assert
      try {
        await axios.post(`${mockBaseUrl}/auth/verify`, {
          token: 'invalid.jwt.token'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.code).toBe('INVALID_TOKEN');
      }
    });
  });

  describe('User Profile', () => {
    test('should get user profile with valid token', async () => {
      // Arrange
      const expectedRequest = {
        method: 'GET',
        path: '/users/123',
        headers: {
          'Authorization': 'Bearer valid.jwt.token'
        }
      };

      const expectedResponse = {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
          roles: ['user'],
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          lastLogin: '2024-01-01T12:00:00Z'
        }
      };

      await provider.addInteraction({
        description: 'Get user profile',
        providerState: 'user exists and token is valid',
        uponReceiving: 'a request for user profile',
        withRequest: expectedRequest,
        willRespondWith: expectedResponse
      });

      // Act
      const response = await axios.get(`${mockBaseUrl}/users/123`, {
        headers: {
          'Authorization': 'Bearer valid.jwt.token'
        }
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data.id).toBe('123');
      expect(response.data.email).toBe('user@example.com');
      expect(response.data.emailVerified).toBe(true);
    });

    test('should return 404 for non-existent user', async () => {
      // Arrange
      const expectedRequest = {
        method: 'GET',
        path: '/users/999',
        headers: {
          'Authorization': 'Bearer valid.jwt.token'
        }
      };

      const expectedResponse = {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        }
      };

      await provider.addInteraction({
        description: 'User not found',
        providerState: 'user does not exist',
        uponReceiving: 'a request for non-existent user',
        withRequest: expectedRequest,
        willRespondWith: expectedResponse
      });

      // Act & Assert
      try {
        await axios.get(`${mockBaseUrl}/users/999`, {
          headers: {
            'Authorization': 'Bearer valid.jwt.token'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.code).toBe('USER_NOT_FOUND');
      }
    });
  });

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      // Arrange
      const expectedRequest = {
        method: 'POST',
        path: '/auth/register',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: 'newuser@example.com',
          password: 'securePassword123',
          name: 'New User'
        }
      };

      const expectedResponse = {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: true,
          user: {
            id: '456',
            email: 'newuser@example.com',
            name: 'New User',
            roles: ['user'],
            emailVerified: false
          },
          token: 'new.jwt.token'
        }
      };

      await provider.addInteraction({
        description: 'Register new user',
        providerState: 'email is available',
        uponReceiving: 'a request to register new user',
        withRequest: expectedRequest,
        willRespondWith: expectedResponse
      });

      // Act
      const response = await axios.post(`${mockBaseUrl}/auth/register`, {
        email: 'newuser@example.com',
        password: 'securePassword123',
        name: 'New User'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Assert
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.user.email).toBe('newuser@example.com');
      expect(response.data.token).toBeDefined();
    });

    test('should reject registration with existing email', async () => {
      // Arrange
      const expectedRequest = {
        method: 'POST',
        path: '/auth/register',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: 'existing@example.com',
          password: 'securePassword123',
          name: 'Existing User'
        }
      };

      const expectedResponse = {
        status: 409,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: false,
          error: 'Email already exists',
          code: 'EMAIL_EXISTS'
        }
      };

      await provider.addInteraction({
        description: 'Email already exists',
        providerState: 'email is already registered',
        uponReceiving: 'a request to register with existing email',
        withRequest: expectedRequest,
        willRespondWith: expectedResponse
      });

      // Act & Assert
      try {
        await axios.post(`${mockBaseUrl}/auth/register`, {
          email: 'existing@example.com',
          password: 'securePassword123',
          name: 'Existing User'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.code).toBe('EMAIL_EXISTS');
      }
    });
  });

  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      // Arrange
      const expectedRequest = {
        method: 'POST',
        path: '/auth/login',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: 'user@example.com',
          password: 'correctPassword'
        }
      };

      const expectedResponse = {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: true,
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'Test User',
            roles: ['user']
          },
          token: 'login.jwt.token',
          refreshToken: 'refresh.token'
        }
      };

      await provider.addInteraction({
        description: 'Login with valid credentials',
        providerState: 'user exists with correct password',
        uponReceiving: 'a request to login',
        withRequest: expectedRequest,
        willRespondWith: expectedResponse
      });

      // Act
      const response = await axios.post(`${mockBaseUrl}/auth/login`, {
        email: 'user@example.com',
        password: 'correctPassword'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.token).toBeDefined();
      expect(response.data.refreshToken).toBeDefined();
    });
  });
});
