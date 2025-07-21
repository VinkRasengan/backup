# 🎬 Event-Driven Architecture Demo Script

## 📋 Pre-Demo Checklist

### Chuẩn bị trước demo:
- [ ] Mở terminal tại `C:/Project/backup`
- [ ] Mở browser với các tabs:
  - http://localhost:3000 (Frontend)
  - http://localhost:8080/health (API Gateway)
  - http://localhost:3009/health (Event Bus)
  - http://localhost:15672 (RabbitMQ Management)
- [ ] Chuẩn bị file `test-event-simple.js`
- [ ] Kiểm tra Docker Desktop running

---

## 🎯 Demo Flow (15 phút)

### **Phần 1: Giới thiệu hệ thống (3 phút)**

**Script:**
> "Chào mọi người! Hôm nay tôi sẽ demo Event-Driven Architecture trên FactCheck Platform. 
> Đây là hệ thống microservices với 9 services giao tiếp qua events."

**Actions:**
1. Mở slide đầu tiên
2. Giải thích kiến trúc tổng quan
3. Chỉ ra các components chính

---

### **Phần 2: Khởi động hệ thống (4 phút)**

**Script:**
> "Bây giờ chúng ta sẽ khởi động toàn bộ hệ thống với 1 command duy nhất."

**Commands:**
```bash
# Terminal 1: Start system
npm run deploy:local
```

**Explain while waiting:**
- Docker Compose sẽ build và start 11 containers
- Event Bus Service là trung tâm của hệ thống
- Redis và RabbitMQ là infrastructure services

**Show results:**
```bash
# Check running containers
docker ps

# Expected output: 11 containers running
```

---

### **Phần 3: Kiểm tra Health Status (2 phút)**

**Script:**
> "Hệ thống đã khởi động. Hãy kiểm tra health status của các services."

**Commands:**
```bash
# Check Event Bus health
curl http://localhost:3009/health

# Check API Gateway health  
curl http://localhost:8080/health

# Check individual services
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3003/health  # Community Service
```

**Browser Demo:**
- Mở http://localhost:3000 → Frontend working
- Mở http://localhost:15672 → RabbitMQ Management UI
  - Username: `guest`, Password: `guest`

---

### **Phần 4: Event Publishing Demo (4 phút)**

**Script:**
> "Bây giờ là phần chính - demo Event-Driven Architecture. 
> Chúng ta sẽ publish một event và xem nó được phân phối như thế nào."

**Show test event file:**
```javascript
// test-event-simple.js
const event = {
  type: 'test.simple',
  data: {
    message: 'Hello Event-Driven Architecture!',
    timestamp: new Date().toISOString()
  },
  metadata: {
    timestamp: new Date().toISOString(),
    source: 'test-client',
    version: '1.0.0'
  }
};
```

**Execute:**
```bash
# Publish event
node test-event-simple.js
```

**Expected Output:**
```json
{
  "success": true,
  "eventId": "uuid-here",
  "published": ["rabbitmq", "redis", "local"],
  "failed": []
}
```

**Explain:**
- Event được validate bởi Joi schema
- Phân phối đồng thời qua 3 channels: RabbitMQ, Redis, Local
- Tự động generate correlation ID

---

### **Phần 5: Monitoring và Metrics (2 phút)**

**Script:**
> "Hệ thống cung cấp comprehensive monitoring và metrics."

**Commands:**
```bash
# Check metrics
curl http://localhost:3009/metrics

# Check event logs
docker logs factcheck-event-bus-fast --tail 20
```

**RabbitMQ Management UI:**
- Mở http://localhost:15672
- Vào Queues tab → Xem messages
- Vào Exchanges tab → Xem routing

**Show metrics:**
- Event throughput
- Processing latency  
- Success/failure rates
- Queue depths

---

## 🎯 Advanced Demo Scenarios

### **Scenario 1: Real User Event**
```bash
# Simulate user registration event
curl -X POST http://localhost:3009/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "auth.user.registered",
    "data": {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "email": "demo@factcheck.com",
      "name": "Demo User",
      "roles": ["user"],
      "provider": "email",
      "emailVerified": false
    },
    "metadata": {
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
      "source": "auth-service",
      "version": "1.0.0"
    }
  }'
```

### **Scenario 2: Community Post Event**
```bash
# Simulate post creation
curl -X POST http://localhost:3009/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "community.post.created", 
    "data": {
      "postId": "456e7890-e89b-12d3-a456-426614174001",
      "authorId": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Breaking: New Fact-Check Results",
      "content": "This is a sample fact-check post...",
      "tags": ["politics", "fact-check"],
      "links": ["https://example.com/source"]
    },
    "metadata": {
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
      "source": "community-service",
      "version": "1.0.0"
    }
  }'
```

---

## 🔧 Troubleshooting Commands

### **If services fail:**
```bash
# Restart specific service
docker compose -f docker-compose.fast.yml up --build -d event-bus-service

# Check logs
docker logs factcheck-event-bus-fast --tail 50

# Check container status
docker ps -a
```

### **If RabbitMQ issues:**
```bash
# Restart RabbitMQ
docker compose -f docker-compose.fast.yml restart rabbitmq

# Check RabbitMQ logs
docker logs factcheck-rabbitmq-fast --tail 20
```

### **If Redis issues:**
```bash
# Check Redis connection
docker exec -it factcheck-redis-fast redis-cli ping

# Should return: PONG
```

---

## 📊 Demo Talking Points

### **Architecture Benefits:**
- **Loose Coupling**: Services don't know about each other
- **Scalability**: Each service can scale independently  
- **Reliability**: Failure in one service doesn't affect others
- **Real-time**: Instant event processing

### **Technical Highlights:**
- **Multi-channel Publishing**: RabbitMQ + Redis + Local
- **Event Validation**: Joi schemas ensure data quality
- **Correlation Tracking**: Full request tracing
- **Health Monitoring**: Comprehensive health checks

### **Business Value:**
- **Faster Development**: Independent service deployment
- **Better UX**: Real-time updates and notifications
- **Cost Efficiency**: Resource optimization
- **High Availability**: 99.9% uptime

---

## 🎤 Q&A Preparation

### **Common Questions:**

**Q: "Tại sao không dùng REST API?"**
A: "REST tốt cho synchronous requests, nhưng EDA cho phép asynchronous processing, real-time updates, và better scalability."

**Q: "Làm sao handle event failures?"**
A: "Chúng ta có dead letter queues, retry mechanisms, và circuit breakers. RabbitMQ đảm bảo message persistence."

**Q: "Performance impact như thế nào?"**
A: "Có thêm network latency nhưng tăng overall throughput và scalability. Trade-off đáng giá."

**Q: "Data consistency?"**
A: "Eventually consistent model. Cho strong consistency, chúng ta có thể implement event sourcing."

---

## 🎯 Demo Success Criteria

### **Must Show:**
- [ ] All 9 services running healthy
- [ ] Event publishing working
- [ ] Multi-channel distribution
- [ ] RabbitMQ Management UI
- [ ] Metrics endpoint
- [ ] Real-time processing

### **Nice to Have:**
- [ ] Event validation demo
- [ ] Error handling
- [ ] Service restart resilience
- [ ] Load testing results

---

## 📝 Post-Demo Actions

### **Cleanup:**
```bash
# Stop all services
npm run deploy:fast:stop

# Clean up containers
docker system prune -f
```

### **Follow-up:**
- Share repository access
- Provide documentation links
- Schedule technical deep-dive session
- Collect feedback and questions
