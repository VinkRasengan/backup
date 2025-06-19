# Anti-Fraud Platform - Enhanced Microservices Architecture

## 🚀 Quick Start

```bash
# Start development environment
npm run start

# Start with Docker
npm run docker:up

# Deploy to Kubernetes
npm run deploy:k8s

# Run tests
npm run test
```

## 🏗️ Architecture

This platform now includes advanced microservices patterns:

- **Circuit Breaker Pattern**: Prevents cascade failures
- **Event-Driven Architecture**: Async communication via Redis
- **Saga Pattern**: Distributed transaction management
- **Service Authentication**: Individual service keys with rotation
- **Auth Service Redundancy**: Multiple auth instances with failover
- **Contract Testing**: Pact-based consumer-driven contracts
- **Integration Testing**: Complete E2E testing pipeline
- **Service Mesh**: Optional Istio or Consul Connect

## 📦 Services

- **API Gateway** (8080): Main entry point with circuit breakers
- **Auth Service** (3001): Authentication with redundancy
- **Link Service** (3002): URL scanning and analysis
- **Community Service** (3003): User posts and discussions
- **Chat Service** (3004): AI-powered chat functionality
- **News Service** (3005): Security news aggregation
- **Admin Service** (3006): Administrative operations

## 🔧 Tech Stack

### Core Technologies
- **Node.js 18+**: Runtime environment
- **Express.js**: Web framework
- **Redis**: Event bus and caching
- **Firebase**: Database and authentication
- **Docker**: Containerization
- **Kubernetes**: Orchestration

### Enhanced Features
- **Opossum**: Circuit breaker implementation
- **Pact**: Contract testing framework
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **Istio/Consul**: Service mesh options

## 📋 Available Scripts

### Development
- `npm run start` - Start all services locally
- `npm run dev` - Start in development mode
- `npm run stop` - Stop all services

### Deployment
- `npm run deploy:local` - Local deployment
- `npm run deploy:docker` - Docker deployment
- `npm run deploy:k8s` - Kubernetes deployment
- `npm run deploy:k8s:istio` - K8s with Istio service mesh

### Testing
- `npm run test` - Run all tests
- `npm run test:contracts` - Contract testing
- `npm run test:integration` - Integration testing
- `npm run test:e2e` - End-to-end testing

### Monitoring
- `npm run security:status` - Security status
- `npm run circuit-breaker:status` - Circuit breaker status
- `npm run auth:redundancy` - Auth redundancy status
- `npm run monitoring:start` - Start monitoring stack

### Utilities
- `npm run kill:all` - Stop all processes
- `npm run fix:ports` - Fix port conflicts
- `npm run clean` - Clean up resources

## 🔒 Security Features

- Individual service authentication keys
- Automatic key rotation (24-hour cycle)
- Mutual TLS between services
- Rate limiting per service
- Authorization policies
- Security monitoring and alerting

## 📊 Monitoring

Access monitoring dashboards:
- **Application**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

## 🧪 Testing

The platform includes comprehensive testing:
- **Unit Tests**: Individual component testing
- **Contract Tests**: Service interface validation
- **Integration Tests**: End-to-end workflow testing
- **Security Tests**: Vulnerability scanning

## 🚀 Deployment Options

### Local Development
```bash
npm run start
```

### Docker Compose
```bash
npm run docker:up
```

### Kubernetes
```bash
npm run deploy:k8s
```

### Kubernetes with Service Mesh
```bash
# With Istio
npm run deploy:k8s:istio

# With Consul Connect
npm run deploy:k8s:consul
```

## 📖 Documentation

- [Service Mesh Guide](docs/service-mesh-guide.md)
- [Circuit Breaker Documentation](services/api-gateway/README.md)
- [Event Bus Documentation](services/shared/eventBus/README.md)
- [Testing Guide](scripts/README.md)

## 🤝 Contributing

1. Follow the microservices patterns
2. Write contract tests for new services
3. Update documentation
4. Run the complete test suite

## 📄 License

MIT License - see LICENSE file for details.
