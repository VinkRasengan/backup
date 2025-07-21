# Event-Driven Architecture - Mặc định trong Project

## 🎯 Tổng quan

Event-Driven Architecture (EDA) hiện đã được **tích hợp mặc định** vào FactCheck Platform. Khi bạn chạy `npm start`, toàn bộ hệ thống sẽ tự động khởi động với đầy đủ tính năng Event-Driven.

## 🚀 Khởi động hệ thống

```bash
# Khởi động toàn bộ hệ thống với Event-Driven Architecture
npm start

# Dừng toàn bộ hệ thống
npm stop

# Khởi động lại
npm restart
```

## 🏗️ Các thành phần được khởi động tự động

### Infrastructure Services
- **Redis** (port 6379) - Event pub/sub và caching
- **RabbitMQ** (port 5672, UI: 15672) - Message queues
- **Event Bus Service** (port 3009) - Central event management

### Application Services
- **Auth Service** (port 3001) - Authentication với event publishing
- **Link Service** (port 3002) - Link analysis với event handling
- **Community Service** (port 3003) - Community features với event sourcing
- **Chat Service** (port 3004) - Real-time chat với events
- **News Service** (port 3005) - News aggregation với events
- **Admin Service** (port 3006) - Admin panel với event monitoring
- **API Gateway** (port 8080) - Gateway với event routing
- **Frontend** (port 3000) - React client với real-time updates

## 🔄 Event Flow mặc định

```
User Action → Service → Event Bus → Other Services → Real-time Updates
```

### Ví dụ Event Flow:
1. **User đăng bài** → Community Service
2. **Event: `community.post.created`** → Event Bus
3. **Link Service** nhận event → Phân tích links trong bài
4. **Admin Service** nhận event → Kiểm tra nội dung
5. **Real-time updates** → Frontend

## 📊 Monitoring & Health Checks

### Health Check URLs:
- Event Bus: http://localhost:3009/health
- Auth Service: http://localhost:3001/health
- Community Service: http://localhost:3003/health
- Link Service: http://localhost:3002/health

### Metrics & Monitoring:
- Event Bus Metrics: http://localhost:3007/metrics
- RabbitMQ Management: http://localhost:15672 (factcheck/secure_password)

## 🛠️ Environment Variables (Tự động set)

Khi chạy `npm start`, các environment variables sau được tự động set:

```bash
ENABLE_EVENT_DRIVEN=true
EVENT_BUS_SERVICE_URL=http://localhost:3009
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://factcheck:secure_password@localhost:5672
```

## 🔧 Cấu hình Event-Driven

### Event Schemas
Tất cả event schemas được định nghĩa trong:
```
shared-contracts/events/
├── eventSchemas.js
├── user.events.json
├── community.events.json
└── link.events.json
```

### Event Handlers
Mỗi service có event handlers riêng:
```
services/[service-name]/src/events/
├── eventHandlers.js
└── eventSubscriptions.js
```

## 📝 Event Types được hỗ trợ

### Authentication Events
- `auth.user.registered`
- `auth.user.login`
- `auth.user.logout`

### Community Events
- `community.post.created`
- `community.comment.created`
- `community.vote.cast`

### Link Analysis Events
- `link.analysis.requested`
- `link.analysis.completed`
- `link.threat.detected`

### System Events
- `system.service.started`
- `system.service.health_changed`

## 🎛️ Advanced Features

### Event Sourcing
- Tất cả events được lưu trữ persistent
- Có thể replay events
- Audit trail hoàn chỉnh

### Circuit Breaker
- Tự động fallback khi Event Bus không available
- Graceful degradation

### Real-time Updates
- WebSocket connections cho real-time updates
- Server-Sent Events (SSE) support

## 🚨 Troubleshooting

### Nếu Event Bus không start:
```bash
# Kiểm tra Docker
docker --version

# Kiểm tra ports
netstat -an | grep 3007
netstat -an | grep 6379
netstat -an | grep 5672
```

### Nếu services không connect được Event Bus:
```bash
# Kiểm tra Event Bus health
curl http://localhost:3009/health

# Kiểm tra logs
npm run logs
```

### Fallback Mode:
Nếu Event Bus không available, services sẽ tự động chuyển sang standalone mode và vẫn hoạt động bình thường (không có event-driven features).

## 📚 Tài liệu thêm

- [Event Sourcing Implementation](./EVENT_SOURCING_PRESENTATION.md)
- [KurrentDB Integration](./KURRENTDB_IMPLEMENTATION_GUIDE.md)
- [Microservices Architecture](./MICROSERVICES_INDEPENDENCE_STRATEGY.md)

## 🎉 Kết luận

Event-Driven Architecture giờ đây là **core feature** của FactCheck Platform, mang lại:

✅ **Real-time communication** giữa các services
✅ **Scalability** và **resilience** cao
✅ **Event sourcing** và **audit trail**
✅ **Loose coupling** giữa các microservices
✅ **Easy monitoring** và **debugging**

Chỉ cần chạy `npm start` và bạn sẽ có một hệ thống Event-Driven hoàn chỉnh!
