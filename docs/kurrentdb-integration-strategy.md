# 🚀 Chiến lược áp dụng KurrentDB (Kurrent.io)

## 📊 **Phân tích kiến trúc hiện tại**

### **Kiến trúc hiện tại:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │  Microservices  │
│   (React)       │◄──►│   (Port 8082)   │◄──►│   (Port 3001-6) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │  Firebase DB    │
                       │   (Event Bus)   │    │   (CRUD)        │
                       └─────────────────┘    └─────────────────┘
```

### **Kiến trúc sau khi áp dụng KurrentDB:**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  API Gateway    │    │  Microservices  │
│   (React)       │◄──►│   (Port 8082)   │◄──►│   (Port 3001-6) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Cache   │    │  KurrentDB      │
                       │   (Event Bus)   │    │  (Event Store)  │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Materialized   │    │  Firebase DB    │
                       │     Views       │    │   (Read Models) │
                       └─────────────────┘    └─────────────────┘
```

## 🎯 **Chiến lược áp dụng theo tầng**

### **Tầng 1: Event Store Layer (KurrentDB)**

**Vị trí:** Thay thế một phần Firebase cho các hoạt động ghi sự kiện

**Mục đích:**
- Lưu trữ tất cả sự kiện bất biến
- Cung cấp khả năng replay events
- Đảm bảo tính nhất quán dữ liệu

**Triển khai:**

```javascript
// services/shared/eventStore/kurrentDB.js
const { KurrentClient } = require('kurrent-client');

class KurrentEventStore {
  constructor() {
    this.client = new KurrentClient({
      host: process.env.KURRENT_HOST || 'localhost',
      port: process.env.KURRENT_PORT || 8080
    });
  }

  async appendEvent(streamName, eventType, eventData) {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    return await this.client.appendToStream(streamName, event);
  }

  async readEvents(streamName, fromVersion = 0) {
    return await this.client.readStream(streamName, fromVersion);
  }

  async replayEvents(streamName, handler) {
    const events = await this.readEvents(streamName);
    for (const event of events) {
      await handler(event);
    }
  }
}
```

### **Tầng 2: CQRS Layer (Command/Query Separation)**

**Vị trí:** Tách biệt mô hình đọc và ghi

**Mục đích:**
- Tối ưu hóa hiệu suất đọc/ghi
- Tạo materialized views cho truy vấn
- Hỗ trợ eventual consistency

**Triển khai:**

```javascript
// services/shared/cqrs/commandBus.js
class CommandBus {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  async execute(command) {
    // Validate command
    // Apply business rules
    // Generate events
    // Store events
    // Publish events
  }
}

// services/shared/cqrs/queryBus.js
class QueryBus {
  constructor(readModels) {
    this.readModels = readModels;
  }

  async execute(query) {
    // Route to appropriate read model
    // Execute query
    // Return result
  }
}
```

### **Tầng 3: Materialized Views Layer**

**Vị trí:** Tạo các view được tối ưu hóa cho truy vấn

**Mục đích:**
- Cung cấp dữ liệu đọc nhanh
- Tối ưu hóa cho các use case cụ thể
- Hỗ trợ analytics và reporting

**Triển khai:**

```javascript
// services/shared/projections/userProjection.js
class UserProjection {
  constructor(eventStore, readModel) {
    this.eventStore = eventStore;
    this.readModel = readModel;
  }

  async handleUserCreated(event) {
    await this.readModel.users.create({
      id: event.data.userId,
      email: event.data.email,
      name: event.data.name,
      createdAt: event.timestamp
    });
  }

  async handleUserUpdated(event) {
    await this.readModel.users.update(event.data.userId, {
      email: event.data.email,
      name: event.data.name,
      updatedAt: event.timestamp
    });
  }
}
```

## 🏗️ **Kế hoạch triển khai từng bước**

### **Phase 1: Thiết lập cơ sở hạ tầng (Tuần 1-2)**

#### **Bước 1.1: Cài đặt KurrentDB**
```bash
# Docker deployment
docker run -d \
  --name kurrentdb \
  -p 8080:8080 \
  -p 2113:2113 \
  kurrent/kurrentdb:latest

# Hoặc Kubernetes
kubectl apply -f k8s/kurrentdb.yml
```

#### **Bước 1.2: Tạo shared Event Store service**
```javascript
// services/shared/eventStore/index.js
const KurrentEventStore = require('./kurrentDB');
const EventBus = require('../eventBus/eventBus');

class EventStoreService {
  constructor() {
    this.eventStore = new KurrentEventStore();
    this.eventBus = new EventBus();
  }

  async publishEvent(streamName, eventType, eventData) {
    // 1. Append to event store
    const eventId = await this.eventStore.appendEvent(streamName, eventType, eventData);
    
    // 2. Publish to event bus
    await this.eventBus.publish(eventType, eventData);
    
    return eventId;
  }
}
```

### **Phase 2: Migrate từng service (Tuần 3-6)**

#### **Bước 2.1: Auth Service Migration**
```javascript
// services/auth-service/src/events/authEventStore.js
const EventStoreService = require('../../../shared/eventStore');

class AuthEventStore {
  constructor() {
    this.eventStore = new EventStoreService();
  }

  async userCreated(userData) {
    return await this.eventStore.publishEvent(
      `user-${userData.id}`,
      'user:created',
      userData
    );
  }

  async userLoggedIn(userData) {
    return await this.eventStore.publishEvent(
      `user-${userData.id}`,
      'auth:login',
      userData
    );
  }
}
```

#### **Bước 2.2: Community Service Migration**
```javascript
// services/community-service/src/events/communityEventStore.js
class CommunityEventStore {
  async postCreated(postData) {
    return await this.eventStore.publishEvent(
      `post-${postData.id}`,
      'community:post_created',
      postData
    );
  }

  async postVoted(voteData) {
    return await this.eventStore.publishEvent(
      `post-${voteData.postId}`,
      'community:post_voted',
      voteData
    );
  }
}
```

### **Phase 3: Implement CQRS (Tuần 7-8)**

#### **Bước 3.1: Command Handlers**
```javascript
// services/community-service/src/commands/createPostCommand.js
class CreatePostCommand {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  async execute(command) {
    // Validate command
    if (!command.title || !command.content) {
      throw new Error('Title and content are required');
    }

    // Generate post ID
    const postId = generateId();

    // Create event
    const eventData = {
      postId,
      title: command.title,
      content: command.content,
      authorId: command.authorId,
      createdAt: new Date().toISOString()
    };

    // Publish event
    return await this.eventStore.publishEvent(
      `post-${postId}`,
      'community:post_created',
      eventData
    );
  }
}
```

#### **Bước 3.2: Query Handlers**
```javascript
// services/community-service/src/queries/getPostsQuery.js
class GetPostsQuery {
  constructor(readModel) {
    this.readModel = readModel;
  }

  async execute(query) {
    return await this.readModel.posts.find({
      type: query.type,
      category: query.category,
      limit: query.limit,
      offset: query.offset
    });
  }
}
```

### **Phase 4: Materialized Views (Tuần 9-10)**

#### **Bước 4.1: User Read Model**
```javascript
// services/shared/readModels/userReadModel.js
class UserReadModel {
  constructor(firebase) {
    this.db = firebase;
  }

  async handleUserCreated(event) {
    await this.db.collection('users').doc(event.data.userId).set({
      id: event.data.userId,
      email: event.data.email,
      name: event.data.name,
      createdAt: event.timestamp,
      status: 'active'
    });
  }

  async handleUserUpdated(event) {
    await this.db.collection('users').doc(event.data.userId).update({
      email: event.data.email,
      name: event.data.name,
      updatedAt: event.timestamp
    });
  }
}
```

#### **Bước 4.2: Post Read Model**
```javascript
// services/shared/readModels/postReadModel.js
class PostReadModel {
  async handlePostCreated(event) {
    await this.db.collection('posts').doc(event.data.postId).set({
      id: event.data.postId,
      title: event.data.title,
      content: event.data.content,
      authorId: event.data.authorId,
      createdAt: event.timestamp,
      voteScore: 0,
      commentCount: 0
    });
  }

  async handlePostVoted(event) {
    const postRef = this.db.collection('posts').doc(event.data.postId);
    await postRef.update({
      voteScore: admin.firestore.FieldValue.increment(event.data.voteValue)
    });
  }
}
```

## 📊 **Lợi ích của việc áp dụng KurrentDB**

### **1. Tính nhất quán dữ liệu**
- ✅ Giải quyết vấn đề "dual write"
- ✅ Đảm bảo tính nguyên tử của events
- ✅ Hỗ trợ distributed transactions

### **2. Khả năng mở rộng**
- ✅ Tách biệt mô hình đọc/ghi
- ✅ Tối ưu hóa hiệu suất cho từng loại operation
- ✅ Hỗ trợ horizontal scaling

### **3. Khả năng kiểm toán**
- ✅ Lưu trữ toàn bộ lịch sử thay đổi
- ✅ Khả năng replay events
- ✅ Time travel capability

### **4. Tính linh hoạt**
- ✅ Dễ dàng thêm features mới
- ✅ Hỗ trợ schema evolution
- ✅ Backward compatibility

## 🚨 **Thách thức và giải pháp**

### **Thách thức 1: Độ phức tạp tăng lên**
**Giải pháp:**
- Triển khai từng bước, không làm tất cả cùng lúc
- Tạo documentation chi tiết
- Training cho team

### **Thách thức 2: Performance overhead**
**Giải pháp:**
- Sử dụng materialized views cho read operations
- Implement caching strategy
- Monitor performance metrics

### **Thách thức 3: Data migration**
**Giải pháp:**
- Dual write strategy trong thời gian transition
- Gradual migration từng service
- Rollback plan

## 📈 **Kế hoạch monitoring và metrics**

### **Metrics cần theo dõi:**
- Event store performance
- Event replay time
- Materialized view update latency
- Command/Query response times
- Error rates

### **Alerts:**
- Event store unavailable
- High event replay time
- Materialized view sync failures
- Command/Query timeouts

## 🎯 **Kết luận**

Việc áp dụng KurrentDB sẽ chuyển đổi hệ thống từ kiến trúc CRUD truyền thống sang Event Sourcing hoàn chỉnh, mang lại:

1. **Tính nhất quán cao hơn** trong môi trường distributed
2. **Khả năng mở rộng tốt hơn** với CQRS pattern
3. **Khả năng kiểm toán hoàn hảo** với event log
4. **Tính linh hoạt cao hơn** cho việc phát triển features mới

Tuy nhiên, cần triển khai một cách cẩn thận và có kế hoạch để tránh các rủi ro về performance và complexity. 