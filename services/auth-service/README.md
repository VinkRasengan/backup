# Auth Service

User Authentication Service for the Anti-Fraud Platform microservices architecture.

## Overview

The Auth Service handles user authentication, authorization, and user management. It integrates with Firebase Auth for authentication and provides JWT tokens for service-to-service communication.

## Features

- **Firebase Auth Integration**: Leverages Firebase for secure authentication
- **JWT Token Management**: Issues and validates JWT tokens for microservices
- **User Profile Management**: Handles user data and preferences
- **Role-Based Access Control**: Supports user roles (user, admin, moderator)
- **Health Checks**: Comprehensive health monitoring
- **Structured Logging**: Centralized logging with correlation IDs
- **Input Validation**: Robust request validation
- **Error Handling**: Standardized error responses

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/verify-token` - Verify JWT token (service-to-service)
- `POST /auth/verify-email` - Email verification info

### User Management

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/stats` - Get user statistics
- `PUT /users/:userId/roles` - Update user roles (admin only)
- `DELETE /users/account` - Delete user account
- `GET /users` - List users (admin only)

### Health & Monitoring

- `GET /health` - Service health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /info` - Service information

## Environment Variables

```bash
# Service Configuration
PORT=3001
NODE_ENV=development
SERVICE_NAME=auth-service

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# JWT Configuration
JWT_SECRET=your-jwt-secret

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Logging
LOG_LEVEL=info
```

## Development

### Prerequisites

- Node.js 18+
- Firebase project with Firestore
- Firebase service account credentials

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Run tests**:
   ```bash
   npm test
   npm run test:watch
   npm run test:coverage
   ```

5. **Lint code**:
   ```bash
   npm run lint
   npm run lint:fix
   ```

### Docker Development

1. **Build image**:
   ```bash
   docker build -t auth-service .
   ```

2. **Run container**:
   ```bash
   docker run -p 3001:3001 --env-file .env auth-service
   ```

## Production Deployment

### Docker

```bash
# Build production image
docker build --target production -t auth-service:latest .

# Run with production configuration
docker run -d \
  --name auth-service \
  -p 3001:3001 \
  --env-file .env.production \
  --restart unless-stopped \
  auth-service:latest
```

### Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/auth-service.yml
```

## API Documentation

### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "idToken": "firebase-id-token",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "userId": "user-id",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["user"]
  }
}
```

### Login User

```http
POST /auth/login
Content-Type: application/json

{
  "idToken": "firebase-id-token"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Verify Token (Service-to-Service)

```http
POST /auth/verify-token
Content-Type: application/json

{
  "token": "jwt-token"
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "roles": ["user"]
  }
}
```

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "correlationId": "correlation-id",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "details": "Additional error details"
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `INVALID_TOKEN` - Invalid JWT or Firebase token
- `TOKEN_EXPIRED` - Token has expired
- `USER_NOT_FOUND` - User does not exist
- `USER_EXISTS` - User already exists
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `AUTH_ERROR` - Firebase authentication error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable

## Monitoring

### Health Checks

- **Liveness**: `/health/live` - Service is running
- **Readiness**: `/health/ready` - Service is ready to handle requests
- **Health**: `/health` - Comprehensive health check

### Metrics

The service exposes metrics for:
- Request count and duration
- Error rates
- Database connection status
- Memory usage
- Active user sessions

### Logging

Structured JSON logs with correlation IDs for request tracing:

```json
{
  "timestamp": "2023-12-01T10:00:00.000Z",
  "level": "info",
  "service": "auth-service",
  "correlationId": "req-123",
  "message": "User login attempt",
  "userId": "user-id",
  "email": "user@example.com"
}
```

## Security

- **Input Validation**: All inputs validated with Joi schemas
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable allowed origins
- **Security Headers**: Helmet.js security headers
- **JWT Tokens**: Secure token generation and validation
- **Firebase Integration**: Leverages Firebase security features

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run integration tests
npm run test:integration
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow semantic commit messages

## License

MIT License - see LICENSE file for details.
