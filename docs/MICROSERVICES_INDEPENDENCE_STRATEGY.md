# Microservices Independence Strategy
## Đảm bảo tính độc lập trong Event-Driven Architecture

---

## 🚨 **Vấn đề với Shared Libraries**

### **Hiện tại:**
```
services/
├── shared/           ❌ TIGHT COUPLING
│   ├── eventBus/
│   ├── eventStore/
│   └── utils/
├── auth-service/     ← Phụ thuộc shared
├── community-service/ ← Phụ thuộc shared
└── chat-service/     ← Phụ thuộc shared
```

### **Vấn đề:**
1. **Tight Coupling**: Services phụ thuộc vào shared code
2. **Deployment Hell**: Thay đổi shared → deploy lại tất cả
3. **Version Conflicts**: Khó quản lý version của shared libs
4. **Technology Lock-in**: Tất cả services phải dùng cùng tech stack

---

## ✅ **Giải pháp: Independent Services với Event Contracts**

### **Kiến trúc mới:**
```
services/
├── event-bus-service/     ← Dedicated Event Bus Service
├── auth-service/          ← Hoàn toàn độc lập
│   ├── src/
│   ├── lib/eventBus.js   ← Local implementation
│   └── contracts/        ← Event contracts
├── community-service/     ← Hoàn toàn độc lập
│   ├── src/
│   ├── lib/eventBus.js   ← Local implementation
│   └── contracts/
└── shared-contracts/      ← Chỉ chứa event schemas
    ├── events/
    └── schemas/
```

---

## 🎯 **Implementation Strategy**

### **1. Dedicated Event Bus Service**
```javascript
// services/event-bus-service/src/app.js
class EventBusService {
  constructor() {
    this.rabbitmq = new RabbitMQManager();
    this.eventStore = new EventStoreManager();
    this.redis = new RedisManager();
  }

  // REST API cho event publishing
  async publishEvent(req, res) {
    const { eventType, data, metadata } = req.body;
    
    // Validate event schema
    const isValid = await this.validateEventSchema(eventType, data);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid event schema' });
    }

    // Publish to all transports
    const results = await Promise.allSettled([
      this.rabbitmq.publish(eventType, data, metadata),
      this.eventStore.append(eventType, data, metadata),
      this.redis.publish(eventType, data, metadata)
    ]);

    res.json({ success: true, results });
  }
}
```

### **2. Service-Local Event Bus Implementation**
```javascript
// services/auth-service/lib/eventBus.js
class AuthServiceEventBus {
  constructor() {
    this.eventBusServiceUrl = process.env.EVENT_BUS_SERVICE_URL;
    this.httpClient = axios.create({
      baseURL: this.eventBusServiceUrl,
      timeout: 5000
    });
  }

  async publish(eventType, data, options = {}) {
    try {
      // Call Event Bus Service via HTTP
      const response = await this.httpClient.post('/events', {
        eventType,
        data,
        metadata: {
          source: 'auth-service',
          correlationId: options.correlationId,
          ...options.metadata
        }
      });

      return response.data;
    } catch (error) {
      // Fallback: Store locally and retry later
      await this.storeForRetry(eventType, data, options);
      throw error;
    }
  }

  async subscribe(eventPattern, handler) {
    // Subscribe via WebSocket or Server-Sent Events
    const ws = new WebSocket(`${this.eventBusServiceUrl}/subscribe`);
    
    ws.on('message', (message) => {
      const event = JSON.parse(message);
      if (this.matchesPattern(event.type, eventPattern)) {
        handler(event);
      }
    });
  }
}
```

### **3. Event Contracts (Schema-Only Sharing)**
```javascript
// shared-contracts/events/authEvents.js
const AUTH_EVENTS = {
  USER_REGISTERED: {
    type: 'auth.user.registered',
    version: '1.0.0',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string', format: 'email' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['userId', 'email', 'timestamp']
    }
  }
};

module.exports = AUTH_EVENTS;
```

---

## 🔧 **Alternative: NPM Package Strategy**

### **Publish Event Bus as NPM Package**
```json
// package.json for @factcheck/event-bus
{
  "name": "@factcheck/event-bus",
  "version": "2.0.0",
  "main": "dist/index.js",
  "peerDependencies": {
    "amqplib": "^0.10.0",
    "redis": "^4.6.0"
  }
}
```

### **Service sử dụng NPM package**
```javascript
// services/auth-service/package.json
{
  "dependencies": {
    "@factcheck/event-bus": "^2.0.0"
  }
}

// services/auth-service/src/eventBus.js
const { EventBus } = require('@factcheck/event-bus');

class AuthEventBus extends EventBus {
  constructor() {
    super('auth-service', {
      rabbitmq: { url: process.env.RABBITMQ_URL },
      redis: { url: process.env.REDIS_URL }
    });
  }
}
```

---

## 🏗️ **Recommended Architecture**

### **Option 1: Dedicated Event Bus Service (Recommended)**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │ Community Svc   │    │   Chat Service  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Local EventBus│ │    │ │Local EventBus│ │    │ │Local EventBus│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │ HTTP/WS              │ HTTP/WS              │ HTTP/WS
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Event Bus Svc   │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │  RabbitMQ   │ │
                    │ │  EventStore │ │
                    │ │   Redis     │ │
                    │ └─────────────┘ │
                    └─────────────────┘
```

### **Benefits:**
✅ **Complete Independence**: Mỗi service hoàn toàn độc lập
✅ **Technology Freedom**: Service có thể dùng bất kỳ tech stack nào
✅ **Easy Deployment**: Deploy từng service riêng biệt
✅ **Fault Isolation**: Lỗi ở một service không ảnh hưởng khác
✅ **Scalability**: Scale Event Bus Service riêng biệt

---

## 📋 **Implementation Plan**

### **Phase 1: Create Event Bus Service**
1. Tạo `services/event-bus-service/`
2. Implement REST API cho event publishing/subscribing
3. Integrate RabbitMQ, EventStore, Redis
4. Add WebSocket support cho real-time events

### **Phase 2: Migrate Services**
1. Tạo local event bus cho từng service
2. Remove dependencies từ `services/shared/`
3. Update services để call Event Bus Service
4. Test independence của từng service

### **Phase 3: Event Contracts**
1. Tạo `shared-contracts/` với chỉ event schemas
2. Implement schema validation
3. Version management cho event schemas
4. Documentation và examples

---

## 🔍 **Code Examples**

### **Event Bus Service API**
```javascript
// POST /events - Publish event
// GET /events/stream - Subscribe to events (SSE)
// WS /subscribe - Real-time subscription
// GET /health - Health check
// GET /stats - Event statistics
```

### **Service Local Implementation**
```javascript
// Mỗi service có implementation riêng
// Không share code, chỉ share event contracts
// Có thể dùng different languages/frameworks
```

Bạn muốn tôi implement cách nào? Dedicated Event Bus Service hay NPM Package strategy?
