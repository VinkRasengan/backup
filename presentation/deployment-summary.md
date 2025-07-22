# Event-Driven Architecture Deployment Summary

## 🎯 Overview

Event-Driven Architecture trong FactCheck Platform được deploy theo mô hình hybrid:
- **Development**: Docker Compose với local infrastructure
- **Production**: Render platform với managed services

## 🏗️ Architecture Components

### Core Event Bus Service
- **Location**: `services/event-bus-service/`
- **Port**: 3009 (dev), 10000 (prod)
- **Responsibilities**:
  - Event validation và publishing
  - Multi-channel distribution
  - Health monitoring
  - Metrics collection

### Event Storage & Messaging

#### Development Environment
```yaml
Infrastructure:
  - RabbitMQ: localhost:5672 (Management UI: 15672)
  - Redis: localhost:6379
  - EventStore: localhost:2113
  - KurrentDB: Docker container

Event Flow:
  1. Event validation (Joi schemas)
  2. Store in EventStore (persistent)
  3. Publish to RabbitMQ (reliable)
  4. Publish to Redis (fast)
  5. Notify local subscribers
```

#### Production Environment
```yaml
Infrastructure:
  - Redis Cloud: redis-15249.c258.us-east-1-4.ec2.redns.redis-cloud.com:15249
  - EventStore Cloud: Managed EventStore instance
  - Render Platform: Container orchestration

Event Flow:
  1. Event validation
  2. Store in EventStore Cloud (persistent)
  3. Publish to Redis Cloud (fast pub/sub)
  4. Notify subscribers via HTTP webhooks
```

## 🚀 Deployment Strategy

### Development Deployment
```bash
# Quick start
npm run deploy:local

# Manual setup
docker-compose up -d
npm run setup:full
npm start

# Test events
node presentation/demo-events.js
```

### Production Deployment (Render)

#### 1. Event Bus Service
```yaml
# docs/deployment/render-event-bus.yaml
services:
  - type: web
    name: factcheck-event-bus
    env: node
    plan: free
    region: singapore
    rootDir: services/event-bus-service
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
```

#### 2. Environment Variables
```bash
# Core Configuration
NODE_ENV=production
PORT=10000
EVENT_STORE_ENABLED=true
CQRS_ENABLED=true

# Redis Cloud
REDIS_URL=redis://default:password@redis-cloud-host:15249
REDIS_HOST=redis-15249.c258.us-east-1-4.ec2.redns.redis-cloud.com
REDIS_PORT=15249
REDIS_PASSWORD=<secret>

# EventStore Cloud
EVENTSTORE_CLOUD_URL=<secret>
EVENTSTORE_CLOUD_USERNAME=admin
EVENTSTORE_CLOUD_PASSWORD=<secret>

# Event Bus Configuration
ENABLE_EVENT_DRIVEN=true
EVENT_BUS_REDIS_ENABLED=true
STANDALONE_MODE=false
```

#### 3. Service Dependencies
```yaml
Service Communication:
  - Auth Service → Event Bus: User events
  - Link Service → Event Bus: Analysis events
  - Community Service → Event Bus: Social events
  - Chat Service → Event Bus: Conversation events
  - News Service → Event Bus: Content events
  - Admin Service → Event Bus: System events
```

## 📊 Monitoring & Observability

### Health Checks
```bash
# Development
curl http://localhost:3009/health
curl http://localhost:3009/api/eventstore/stats

# Production
curl https://factcheck-event-bus.onrender.com/health
curl https://factcheck-event-bus.onrender.com/api/eventstore/stats
```

### Key Metrics
- **Event Throughput**: Events published per second
- **Processing Latency**: Time from publish to consume
- **Error Rates**: Failed events percentage
- **Queue Depths**: Pending messages count
- **Connection Health**: Redis/EventStore connectivity

### Correlation IDs
```javascript
// Every event includes correlation tracking
{
  "id": "event-uuid",
  "type": "USER.CREATED",
  "data": { ... },
  "metadata": {
    "correlationId": "req-uuid",
    "source": "auth-service",
    "timestamp": "2025-07-22T10:30:00Z"
  }
}
```

## 🔧 Production Considerations

### Reliability Features
- **Retry Logic**: 5 attempts with exponential backoff
- **Dead Letter Queues**: Failed event handling
- **Circuit Breakers**: Prevent cascade failures
- **Snapshots**: Every 100 events for performance

### Scaling Strategy
- **Horizontal Scaling**: Multiple event bus instances
- **Load Balancing**: Render's built-in load balancer
- **Auto-scaling**: Based on CPU/memory usage
- **Regional Distribution**: Singapore region for low latency

### Security
- **HTTPS Only**: All production endpoints
- **API Keys**: Secure service-to-service communication
- **CORS Configuration**: Restricted origins
- **Rate Limiting**: Prevent abuse

## 🎯 Benefits Achieved

### Development Experience
- **Fast Setup**: `npm run deploy:local` → 5 seconds
- **Hot Reload**: Real-time code changes
- **Comprehensive Logging**: Detailed event traces
- **Easy Testing**: Demo scripts available

### Production Benefits
- **High Availability**: 99.9% uptime target
- **Low Latency**: <100ms event processing
- **Scalability**: Handle 1000+ events/second
- **Cost Effective**: Render free tier for MVP

### Business Impact
- **Real-time Features**: Instant notifications
- **Audit Trail**: Complete event history
- **System Reliability**: Fault-tolerant architecture
- **Developer Productivity**: Independent service development

## 🔮 Future Enhancements

### Planned Features
- **Event Replay**: Replay events for debugging
- **Saga Pattern**: Distributed transaction support
- **Event Versioning**: Schema evolution support
- **Multi-region**: Geographic distribution

### Monitoring Improvements
- **Prometheus Integration**: Advanced metrics
- **Grafana Dashboards**: Visual monitoring
- **Alerting**: Slack/email notifications
- **Performance Profiling**: Bottleneck identification

## 📚 Resources

### Documentation
- [Event Bus Service README](../services/event-bus-service/README.md)
- [Deployment Guide](../docs/deployment/render-deploy-guide.md)
- [Docker Deployment](../docs/DOCKER_DEPLOYMENT_GUIDE.md)

### Demo & Testing
- [Presentation Demo](./demo-events.js)
- [Event Samples](./demo-script.md)
- [Health Check Scripts](../scripts/health-check.js)

### Production URLs
- Event Bus: https://factcheck-event-bus.onrender.com
- Auth Service: https://factcheck-auth.onrender.com
- Link Service: https://factcheck-link.onrender.com
- Community Service: https://factcheck-community.onrender.com

---

**Last Updated**: July 22, 2025
**Presenter**: Development Team
**Duration**: 15 minutes presentation + 5 minutes Q&A
