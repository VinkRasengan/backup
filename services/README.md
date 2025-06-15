# Microservices Directory Structure

This directory contains all microservices for the Anti-Fraud Platform.

## Services Overview

### 1. API Gateway (Port 8080)
- **Path**: `./api-gateway/`
- **Purpose**: Central entry point, routing, authentication, rate limiting
- **Dependencies**: All other services, Redis

### 2. Auth Service (Port 3001)
- **Path**: `./auth-service/`
- **Purpose**: User authentication, profile management, JWT validation
- **Dependencies**: Firebase Auth, Firestore

### 3. Link Service (Port 3002)
- **Path**: `./link-service/`
- **Purpose**: Link verification, security scanning, external APIs
- **Dependencies**: VirusTotal, ScamAdviser, other security APIs

### 4. Community Service (Port 3003)
- **Path**: `./community-service/`
- **Purpose**: Posts, comments, voting, reports, moderation
- **Dependencies**: Firestore, Redis, Auth Service

### 5. Chat Service (Port 3004)
- **Path**: `./chat-service/`
- **Purpose**: AI chatbot, conversations, Gemini AI integration
- **Dependencies**: Gemini AI API, Firestore, Auth Service

### 6. News Service (Port 3005)
- **Path**: `./news-service/`
- **Purpose**: News aggregation, content management, external news APIs
- **Dependencies**: NewsAPI, NewsData.io, Firestore

### 7. Admin Service (Port 3006)
- **Path**: `./admin-service/`
- **Purpose**: Admin dashboard, monitoring, user management
- **Dependencies**: All other services, Firestore

## Directory Structure

```
services/
├── api-gateway/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── app.js
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── auth-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── config/
│   │   └── app.js
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── link-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   └── app.js
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── community-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   └── app.js
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── chat-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   └── app.js
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── news-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   └── app.js
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── admin-service/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config/
│   │   └── app.js
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
└── shared/
    ├── middleware/
    ├── utils/
    ├── types/
    └── config/
```

## Development Guidelines

### 1. Service Independence
- Each service should be independently deployable
- Minimize dependencies between services
- Use async communication where possible

### 2. Database per Service
- Each service owns its data
- No direct database access between services
- Use APIs for data exchange

### 3. Error Handling
- Implement circuit breaker pattern
- Graceful degradation
- Proper error logging and monitoring

### 4. Security
- All inter-service communication through API Gateway
- Service-to-service authentication
- Input validation and sanitization

### 5. Testing
- Unit tests for each service
- Integration tests for service interactions
- Contract testing for API compatibility

## Getting Started

1. **Setup Environment**:
   ```bash
   cp .env.example .env
   # Configure environment variables
   ```

2. **Build Services**:
   ```bash
   docker-compose -f docker-compose.microservices.yml build
   ```

3. **Start Services**:
   ```bash
   docker-compose -f docker-compose.microservices.yml up
   ```

4. **Access Services**:
   - API Gateway: http://localhost:8080
   - Frontend: http://localhost:3000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - Jaeger: http://localhost:16686

## Migration from Monolith

Services will be extracted from the existing monolith in the following order:

1. **Auth Service** - Least dependencies
2. **Link Service** - Core functionality
3. **Community Service** - User interactions
4. **Chat Service** - AI features
5. **News Service** - Content management
6. **Admin Service** - Administrative features

Each service extraction will follow the Strangler Fig pattern to minimize disruption.

## Monitoring and Observability

- **Metrics**: Prometheus + Grafana
- **Tracing**: Jaeger
- **Logging**: Centralized logging with correlation IDs
- **Health Checks**: Each service exposes `/health` endpoint

## Deployment

- **Development**: Docker Compose
- **Production**: Kubernetes with Helm charts
- **CI/CD**: GitHub Actions with automated testing and deployment

---

For detailed information about each service, see the README.md file in each service directory.
