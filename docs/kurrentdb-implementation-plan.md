# 🚀 Kế hoạch triển khai KurrentDB (Kurrent.io)

## 📊 **Phân tích kiến trúc hiện tại**

### **Hệ thống Microservices hiện tại:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │  Microservices  │
│   (React)       │◄──►│   (Port 8080)   │◄──►│   (Port 3001-6) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │  Firebase DB    │
                       │   (Event Bus)   │    │   (CRUD)        │
                       └─────────────────┘    └─────────────────┘
```

### **Các Service hiện có:**
1. **API Gateway** (Port 8080) - Entry point, routing, auth
2. **Auth Service** (Port 3001) - User authentication, JWT
3. **Link Service** (Port 3002) - Link verification, security scanning
4. **Community Service** (Port 3003) - Posts, comments, voting
5. **Chat Service** (Port 3004) - AI chatbot, conversations
6. **News Service** (Port 3005) - News aggregation
7. **Admin Service** (Port 3006) - Admin dashboard, monitoring

### **Event-Driven Architecture đã có:**
- ✅ **EventBus** (Redis Pub/Sub) - `services/shared/eventBus/`
- ✅ **Saga Orchestrator** - `services/shared/saga/`
- ✅ **Event Types** - `services/shared/eventBus/eventTypes.js`

## 🎯 **Chiến lược áp dụng KurrentDB**

### **Giai đoạn 1: Event Store Layer (Ưu tiên CAO)**

#### **1.1 Tích hợp KurrentDB vào Event Bus**
```javascript
// services/shared/eventBus/kurrentEventStore.js
const KurrentDB = require('@kurrent/kurrentdb');

class KurrentEventStore {
  constructor(config) {
    this.kurrent = new KurrentDB({
      url: process.env.KURRENTDB_URL,
      apiKey: process.env.KURRENTDB_API_KEY,
      database: 'antifraud-events'
    });
  }

  async appendEvent(event) {
    return await this.kurrent.append({
      stream: event.type,
      data: event.data,
      metadata: {
        source: event.source,
        timestamp: event.timestamp,
        correlationId: event.correlationId
      }
    });
  }

  async readEvents(stream, fromVersion = 0) {
    return await this.kurrent.read({
      stream,
      fromVersion,
      maxCount: 1000
    });
  }
}
```

#### **1.2 Cập nhật Event Bus để sử dụng KurrentDB**
```javascript
// services/shared/eventBus/eventBus.js
const KurrentEventStore = require('./kurrentEventStore');

class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    // ... existing code ...
    
    // Add KurrentDB Event Store
    this.eventStore = new KurrentEventStore(options.kurrentConfig);
  }

  async publish(eventType, eventData, options = {}) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: eventData,
      source: this.serviceName,
      timestamp: new Date().toISOString(),
      correlationId: options.correlationId || null
    };

    // Store in KurrentDB first
    await this.eventStore.appendEvent(event);
    
    // Then publish to Redis for real-time
    await this.publisher.publish(channel, JSON.stringify(event));
  }
}
```

### **Giai đoạn 2: CQRS Implementation (Ưu tiên CAO)**

#### **2.1 Tạo Command và Query Handlers**
```javascript
// services/shared/cqrs/commandHandlers.js
class CommandHandlers {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  async handleCreateUser(command) {
    const event = {
      type: 'user:created',
      data: {
        userId: command.userId,
        email: command.email,
        name: command.name
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, userId: command.userId };
  }

  async handleCreatePost(command) {
    const event = {
      type: 'community:post_created',
      data: {
        postId: command.postId,
        userId: command.userId,
        title: command.title,
        content: command.content
      }
    };
    
    await this.eventStore.appendEvent(event);
    return { success: true, postId: command.postId };
  }
}
```

```javascript
// services/shared/cqrs/queryHandlers.js
class QueryHandlers {
  constructor(materializedViews) {
    this.views = materializedViews;
  }

  async getUserProfile(userId) {
    return await this.views.users.get(userId);
  }

  async getPostWithComments(postId) {
    const post = await this.views.posts.get(postId);
    const comments = await this.views.comments.getByPostId(postId);
    return { ...post, comments };
  }

  async getLinkScanResults(linkId) {
    return await this.views.linkScans.get(linkId);
  }
}
```

#### **2.2 Materialized Views với KurrentDB**
```javascript
// services/shared/cqrs/materializedViews.js
class MaterializedViews {
  constructor(eventStore) {
    this.eventStore = eventStore;
    this.views = new Map();
    this.setupViews();
  }

  setupViews() {
    // User Profile View
    this.views.users = new Map();
    
    // Post View
    this.views.posts = new Map();
    
    // Link Scan View
    this.views.linkScans = new Map();
    
    // Comment View
    this.views.comments = new Map();
  }

  async rebuildViews() {
    // Read all events and rebuild views
    const events = await this.eventStore.readEvents('*', 0);
    
    for (const event of events) {
      await this.applyEvent(event);
    }
  }

  async applyEvent(event) {
    switch (event.type) {
      case 'user:created':
        this.views.users.set(event.data.userId, {
          ...event.data,
          createdAt: event.timestamp
        });
        break;
        
      case 'community:post_created':
        this.views.posts.set(event.data.postId, {
          ...event.data,
          createdAt: event.timestamp,
          comments: [],
          votes: { up: 0, down: 0 }
        });
        break;
        
      case 'community:comment_created':
        const post = this.views.posts.get(event.data.postId);
        if (post) {
          post.comments.push({
            ...event.data,
            createdAt: event.timestamp
          });
        }
        break;
    }
  }
}
```

### **Giai đoạn 3: Service Migration (Ưu tiên TRUNG BÌNH)**

#### **3.1 Auth Service Migration**
```javascript
// services/auth-service/src/controllers/authController.js
const { CommandHandlers } = require('../../../shared/cqrs/commandHandlers');
const { QueryHandlers } = require('../../../shared/cqrs/queryHandlers');

class AuthController {
  constructor(eventStore, materializedViews) {
    this.commandHandlers = new CommandHandlers(eventStore);
    this.queryHandlers = new QueryHandlers(materializedViews);
  }

  async register(req, res) {
    try {
      const command = {
        userId: generateUserId(),
        email: req.body.email,
        name: req.body.name,
        password: req.body.password
      };

      const result = await this.commandHandlers.handleCreateUser(command);
      
      res.json({
        success: true,
        userId: result.userId,
        message: 'User registered successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await this.queryHandlers.getUserProfile(userId);
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

#### **3.2 Community Service Migration**
```javascript
// services/community-service/src/controllers/communityController.js
class CommunityController {
  constructor(eventStore, materializedViews) {
    this.commandHandlers = new CommandHandlers(eventStore);
    this.queryHandlers = new QueryHandlers(materializedViews);
  }

  async createPost(req, res) {
    try {
      const command = {
        postId: generatePostId(),
        userId: req.user.id,
        title: req.body.title,
        content: req.body.content,
        category: req.body.category
      };

      const result = await this.commandHandlers.handleCreatePost(command);
      
      res.json({
        success: true,
        postId: result.postId,
        message: 'Post created successfully'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPost(req, res) {
    try {
      const postId = req.params.postId;
      const post = await this.queryHandlers.getPostWithComments(postId);
      
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
```

### **Giai đoạn 4: Snapshot và Performance Optimization (Ưu tiên THẤP)**

#### **4.1 Snapshot Implementation**
```javascript
// services/shared/snapshots/snapshotManager.js
class SnapshotManager {
  constructor(eventStore, materializedViews) {
    this.eventStore = eventStore;
    this.views = materializedViews;
    this.snapshotInterval = 1000; // Every 1000 events
  }

  async createSnapshot(streamName, version) {
    const snapshot = {
      streamName,
      version,
      timestamp: new Date().toISOString(),
      data: await this.views.getSnapshot(streamName)
    };

    await this.eventStore.storeSnapshot(snapshot);
    return snapshot;
  }

  async loadFromSnapshot(streamName) {
    const snapshot = await this.eventStore.getLatestSnapshot(streamName);
    if (snapshot) {
      await this.views.loadFromSnapshot(snapshot);
      return snapshot.version;
    }
    return 0;
  }
}
```

#### **4.2 Performance Monitoring**
```javascript
// services/shared/monitoring/eventSourcingMetrics.js
class EventSourcingMetrics {
  constructor() {
    this.metrics = {
      eventsPerSecond: 0,
      averageEventSize: 0,
      snapshotFrequency: 0,
      viewRebuildTime: 0
    };
  }

  recordEvent(event) {
    // Record metrics for monitoring
    this.metrics.eventsPerSecond++;
    this.metrics.averageEventSize = 
      (this.metrics.averageEventSize + JSON.stringify(event).length) / 2;
  }

  getMetrics() {
    return this.metrics;
  }
}
```

## 🔧 **Triển khai từng bước**

### **Bước 1: Setup KurrentDB (Tuần 1)**
```bash
# 1. Cài đặt KurrentDB SDK
npm install @kurrent/kurrentdb

# 2. Cấu hình environment variables
echo "KURRENTDB_URL=your-kurrentdb-url" >> .env
echo "KURRENTDB_API_KEY=your-api-key" >> .env

# 3. Tạo Event Store layer
mkdir -p services/shared/eventBus
touch services/shared/eventBus/kurrentEventStore.js
```

### **Bước 2: Migrate Event Bus (Tuần 2)**
```bash
# 1. Cập nhật Event Bus để sử dụng KurrentDB
# 2. Test với một service (Auth Service)
# 3. Verify event persistence
```

### **Bước 3: Implement CQRS (Tuần 3-4)**
```bash
# 1. Tạo Command/Query handlers
# 2. Implement Materialized Views
# 3. Migrate Auth Service first
# 4. Test performance improvements
```

### **Bước 4: Migrate Services (Tuần 5-8)**
```bash
# 1. Community Service
# 2. Link Service  
# 3. Chat Service
# 4. News Service
# 5. Admin Service
```

### **Bước 5: Optimization (Tuần 9-10)**
```bash
# 1. Implement Snapshots
# 2. Add Performance Monitoring
# 3. Optimize queries
# 4. Load testing
```

## 📈 **Lợi ích dự kiến**

### **Performance:**
- ✅ **Tăng tốc độ đọc**: Materialized views giảm 70% query time
- ✅ **Tăng tốc độ ghi**: Append-only events nhanh hơn 50%
- ✅ **Scalability**: Horizontal scaling cho read/write operations

### **Reliability:**
- ✅ **Data Consistency**: Event sourcing đảm bảo consistency
- ✅ **Audit Trail**: Complete history of all changes
- ✅ **Fault Tolerance**: Saga pattern với compensation

### **Developer Experience:**
- ✅ **Debugging**: Time travel debugging với event replay
- ✅ **Testing**: Event-driven testing dễ dàng hơn
- ✅ **Monitoring**: Real-time metrics và alerts

## 🚨 **Rủi ro và Mitigation**

### **Rủi ro:**
1. **Learning Curve**: Team cần học Event Sourcing
2. **Migration Complexity**: Migrate từ CRUD sang Event Sourcing
3. **Performance Overhead**: Event storage có thể chậm hơn

### **Mitigation:**
1. **Training**: Workshop về Event Sourcing cho team
2. **Gradual Migration**: Migrate từng service một
3. **Performance Testing**: Benchmark trước khi deploy
4. **Rollback Plan**: Có thể rollback về Firebase nếu cần

## 📋 **Checklist triển khai**

### **Phase 1: Foundation**
- [ ] Setup KurrentDB environment
- [ ] Implement Event Store layer
- [ ] Update Event Bus
- [ ] Test basic event persistence

### **Phase 2: CQRS**
- [ ] Implement Command Handlers
- [ ] Implement Query Handlers  
- [ ] Create Materialized Views
- [ ] Test CQRS pattern

### **Phase 3: Service Migration**
- [ ] Migrate Auth Service
- [ ] Migrate Community Service
- [ ] Migrate Link Service
- [ ] Migrate remaining services

### **Phase 4: Optimization**
- [ ] Implement Snapshots
- [ ] Add Performance Monitoring
- [ ] Load Testing
- [ ] Production Deployment

---

**Tổng thời gian dự kiến: 10 tuần**
**Team size: 3-4 developers**
**Budget: $5000-10000 cho KurrentDB licensing** 