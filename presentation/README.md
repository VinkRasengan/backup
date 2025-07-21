# 🎬 Event-Driven Architecture Presentation

## 📋 Overview

Presentation materials for demonstrating Event-Driven Architecture implementation in the FactCheck Platform. This includes slides, demo scripts, and interactive examples.

## 📁 Files Structure

```
presentation/
├── index.html                 # Interactive HTML presentation
├── event-driven-architecture-slides.md  # Markdown slides
├── demo-script.md            # Detailed demo script
├── demo-events.js            # Event samples for demo
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Start the System
```bash
# Navigate to project root
cd C:/Project/backup

# Start all services
npm run deploy:local
```

### 2. Open Presentation
```bash
# Open HTML presentation in browser
start presentation/index.html

# Or serve locally
npx http-server presentation/
```

### 3. Run Demo
```bash
# Run full demo sequence
node presentation/demo-events.js

# Or run specific event
node presentation/demo-events.js simple
node presentation/demo-events.js userRegistration
```

## 🎯 Presentation Flow

### Slide 1: Title & Introduction (2 min)
- Welcome and overview
- Agenda introduction

### Slide 2: Event-Driven Architecture Concepts (3 min)
- Core principles
- Benefits overview
- Architecture patterns

### Slide 3: FactCheck Platform Architecture (3 min)
- System overview
- 9 microservices
- Infrastructure components

### Slide 4: Event Bus Service Details (2 min)
- Core components
- Validation system
- Multi-channel publishing

### Slide 5: Live Demo (4 min)
- System startup
- Event publishing
- Monitoring & metrics

### Slide 6: Results & Benefits (1 min)
- Performance metrics
- Success indicators
- Business value

## 🎬 Demo Commands

### System Management
```bash
# Start system
npm run deploy:local

# Check status
docker ps

# Stop system
npm run deploy:fast:stop
```

### Health Checks
```bash
# Event Bus health
curl http://localhost:3009/health

# API Gateway health
curl http://localhost:8080/health

# Individual services
curl http://localhost:3001/health  # Auth
curl http://localhost:3003/health  # Community
```

### Event Publishing
```bash
# Simple test event
node test-event-simple.js

# Full demo sequence
node presentation/demo-events.js

# Specific event types
node presentation/demo-events.js simple
node presentation/demo-events.js userRegistration
node presentation/demo-events.js postCreated
```

### Monitoring
```bash
# Metrics endpoint
curl http://localhost:3009/metrics

# Event Bus logs
docker logs factcheck-event-bus-fast --tail 20

# RabbitMQ Management UI
# http://localhost:15672 (guest/guest)
```

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React client |
| API Gateway | http://localhost:8080 | Main API endpoint |
| Event Bus | http://localhost:3009 | Event publishing |
| RabbitMQ UI | http://localhost:15672 | Queue management |
| Auth Service | http://localhost:3001 | Authentication |
| Community | http://localhost:3003 | Social features |

## 📊 Demo Event Types

### Available Events
- `simple` - Basic test event
- `userRegistration` - User signup event
- `userLogin` - User authentication event
- `postCreated` - Community post creation
- `commentCreated` - Comment on post
- `linkAnalysisRequest` - Link analysis request
- `linkAnalysisCompleted` - Analysis results

### Event Structure
```json
{
  "type": "event.type.name",
  "data": {
    "field1": "value1",
    "field2": "value2"
  },
  "metadata": {
    "timestamp": "2025-07-21T13:40:28.222Z",
    "source": "service-name",
    "correlationId": "uuid-here",
    "version": "1.0.0"
  }
}
```

## 🔧 Troubleshooting

### Common Issues

**Services not starting:**
```bash
# Check Docker
docker ps -a

# Restart specific service
docker compose -f docker-compose.fast.yml up --build -d event-bus-service
```

**Event publishing fails:**
```bash
# Check Event Bus logs
docker logs factcheck-event-bus-fast --tail 50

# Verify Event Bus health
curl http://localhost:3009/health
```

**RabbitMQ connection issues:**
```bash
# Restart RabbitMQ
docker compose -f docker-compose.fast.yml restart rabbitmq

# Check RabbitMQ logs
docker logs factcheck-rabbitmq-fast --tail 20
```

### Debug Commands
```bash
# Check all container status
docker ps

# View service logs
docker logs <container-name> --tail 50

# Check network connectivity
docker network ls
docker network inspect backup_factcheck-network
```

## 📈 Performance Metrics

### Expected Results
- **Build Time**: ~5 seconds
- **Event Latency**: <100ms
- **Success Rate**: 100%
- **Services Running**: 11/11 containers
- **Health Status**: All services healthy

### Monitoring Points
- Event publishing success rate
- Queue depths in RabbitMQ
- Response times for health checks
- Memory and CPU usage
- Network connectivity

## 🎤 Presentation Tips

### Before Demo
- [ ] Test all commands beforehand
- [ ] Verify system is clean (no running containers)
- [ ] Prepare backup slides in case of issues
- [ ] Have troubleshooting commands ready

### During Demo
- [ ] Explain each step clearly
- [ ] Show actual outputs, not just commands
- [ ] Highlight key metrics and results
- [ ] Be prepared for questions

### After Demo
- [ ] Provide access to repository
- [ ] Share documentation links
- [ ] Schedule follow-up sessions
- [ ] Collect feedback

## 📚 Additional Resources

### Documentation
- [Event-Driven Architecture Patterns](https://microservices.io/patterns/data/event-driven-architecture.html)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Redis Pub/Sub](https://redis.io/topics/pubsub)

### Tools
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Postman](https://www.postman.com/) - API testing
- [RabbitMQ Management](http://localhost:15672) - Queue monitoring

## 🤝 Support

For questions or issues:
1. Check troubleshooting section
2. Review logs for error messages
3. Verify all prerequisites are met
4. Contact development team

---

**Happy Presenting! 🎉**
