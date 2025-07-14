# Event Sourcing trong Microservices Architecture
## Thuyết trình chi tiết

---

## Slide 1: Tổng quan
### Event Sourcing trong Project Microservices

**Mục tiêu:**
- Hiểu rõ Event Sourcing và ứng dụng trong hệ thống
- Phân tích hiện trạng và kế hoạch triển khai
- Demo tích hợp KurrentDB

**Thời gian:** 45 phút

---

## Slide 2: Định nghĩa Event Sourcing

### Event Sourcing là gì?

**Định nghĩa:**
- Pattern lưu trữ tất cả thay đổi dưới dạng events
- Thay vì lưu trạng thái hiện tại, lưu chuỗi events
- Có thể tái tạo trạng thái từ events

**Nguyên lý cơ bản:**
```
Event 1 → Event 2 → Event 3 → Current State
UserCreated → UserUpdated → UserDeleted → State
```

---

## Slide 3: Tại sao cần Event Sourcing?

### Lợi ích chính:

1. **Audit Trail hoàn chỉnh**
   - Mọi thay đổi đều được ghi lại
   - Không thể xóa hoặc sửa đổi lịch sử

2. **Temporal Queries**
   - Xem trạng thái tại bất kỳ thời điểm nào
   - Time travel debugging

3. **Scalability**
   - Events có thể được xử lý bất đồng bộ
   - Dễ dàng thêm consumers mới

4. **Data Consistency**
   - Eventual consistency
   - Saga pattern support

---

## Slide 4: Hiện trạng Project

### Đã triển khai:

✅ **Event Bus System**
```javascript
// services/shared/eventBus/eventBus.js
class EventBus {
  publish(event) { /* ... */ }
  subscribe(eventType, handler) { /* ... */ }
}
```

✅ **Saga Orchestrator**
```javascript
// services/shared/saga/sagaOrchestrator.js
class SagaOrchestrator {
  executeWorkflow(workflow) { /* ... */ }
  compensate(workflow) { /* ... */ }
}
```

✅ **Event Types**
```javascript
// services/shared/eventBus/eventTypes.js
const EVENT_TYPES = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  // ...
}
```

---

## Slide 5: Kiến trúc hiện tại

### Microservices Architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │  Chat Service   │    │ Community Svc   │
│                 │    │                 │    │                 │
│ - User Events   │    │ - Chat Events   │    │ - Post Events   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Event Bus     │
                    │                 │
                    │ - Event Store   │
                    │ - Saga Manager  │
                    └─────────────────┘
```

---

## Slide 6: Vấn đề hiện tại

### Những gì còn thiếu:

❌ **Event Store chuyên dụng**
- Events chỉ lưu trong memory
- Không có persistence layer

❌ **CQRS Pattern**
- Chưa tách biệt Command và Query
- Không có Materialized Views

❌ **Event Versioning**
- Không có schema evolution
- Không backward compatibility

❌ **Snapshot Management**
- Không có snapshot cho performance
- Phải replay toàn bộ events

---

## Slide 7: Giải pháp - KurrentDB Integration

### KurrentDB là gì?

**KurrentDB (Kurrent.io):**
- Event Store database chuyên dụng
- Hỗ trợ Event Sourcing native
- Built-in CQRS support
- Automatic snapshot management

**Tích hợp vào project:**
```javascript
// services/shared/eventStore/kurrentEventStore.js
class KurrentEventStore {
  async appendEvents(streamId, events) { /* ... */ }
  async getEvents(streamId) { /* ... */ }
  async createSnapshot(streamId) { /* ... */ }
}
```

---

## Slide 8: Kiến trúc mới với KurrentDB

### Enhanced Architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │  Chat Service   │    │ Community Svc   │
│                 │    │                 │    │                 │
│ - Commands      │    │ - Commands      │    │ - Commands      │
│ - Queries       │    │ - Queries       │    │ - Queries       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Event Bus     │
                    │                 │
                    │ - KurrentDB     │
                    │ - CQRS Layer    │
                    │ - Saga Manager  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Materialized    │
                    │ Views           │
                    │                 │
                    │ - User Views    │
                    │ - Chat Views    │
                    │ - Post Views    │
                    └─────────────────┘
```

---

## Slide 9: Implementation Plan

### Phase 1: Foundation (Tuần 1-2)
- [x] Setup KurrentDB Event Store
- [x] Create Command/Query Handlers
- [x] Implement Materialized Views
- [x] Basic Event Store operations

### Phase 2: Service Migration (Tuần 3-4)
- [ ] Migrate Auth Service
- [ ] Migrate Chat Service  
- [ ] Migrate Community Service
- [ ] Update Event Bus integration

### Phase 3: Advanced Features (Tuần 5-6)
- [ ] Snapshot Management
- [ ] Event Versioning
- [ ] Performance Optimization
- [ ] Monitoring & Alerting

---

## Slide 10: Code Examples

### Command Handler:
```javascript
// services/shared/commands/userCommands.js
class CreateUserCommand {
  constructor(userData) {
    this.userData = userData;
  }
}

class CreateUserHandler {
  async handle(command) {
    const event = new UserCreatedEvent(command.userData);
    await eventStore.appendEvents('users', [event]);
    await materializedViews.updateUserView(event);
  }
}
```

### Query Handler:
```javascript
// services/shared/queries/userQueries.js
class GetUserQuery {
  constructor(userId) {
    this.userId = userId;
  }
}

class GetUserHandler {
  async handle(query) {
    return await materializedViews.getUserById(query.userId);
  }
}
```

---

## Slide 11: Event Store Operations

### KurrentEventStore Implementation:

```javascript
class KurrentEventStore {
  async appendEvents(streamId, events) {
    // Append events to stream
    const stream = await this.getStream(streamId);
    stream.events.push(...events);
    await this.saveStream(stream);
  }

  async getEvents(streamId, fromVersion = 0) {
    // Get events from specific version
    const stream = await this.getStream(streamId);
    return stream.events.slice(fromVersion);
  }

  async createSnapshot(streamId, state) {
    // Create snapshot for performance
    await this.saveSnapshot(streamId, state);
  }
}
```

---

## Slide 12: Materialized Views

### View Management:

```javascript
class MaterializedViews {
  async updateUserView(event) {
    switch(event.type) {
      case 'UserCreated':
        await this.createUserRecord(event.data);
        break;
      case 'UserUpdated':
        await this.updateUserRecord(event.data);
        break;
      case 'UserDeleted':
        await this.deleteUserRecord(event.data.id);
        break;
    }
  }

  async getUserById(userId) {
    return await this.userView.findOne({ id: userId });
  }
}
```

---

## Slide 13: Testing Strategy

### Test Categories:

1. **Unit Tests**
   - Command/Query Handlers
   - Event Store operations
   - Materialized Views

2. **Integration Tests**
   - Service communication
   - Event flow
   - Saga workflows

3. **Performance Tests**
   - Event replay performance
   - Snapshot creation
   - Query response time

### Test Scripts Available:
- `scripts/simple-kurrentdb-test.js`
- `scripts/advanced-kurrentdb-test.js`
- `docs/TESTING_GUIDE.md`

---

## Slide 14: Demo - Live Testing

### Running Tests:

```bash
# Simple Test
node scripts/simple-kurrentdb-test.js

# Advanced Test  
node scripts/advanced-kurrentdb-test.js

# Expected Output:
# ✅ Event Store Operations
# ✅ Command/Query Handlers
# ✅ Materialized Views
# ✅ Saga Integration
# ✅ Performance Tests
```

---

## Slide 15: Benefits Achieved

### Sau khi triển khai:

✅ **Complete Audit Trail**
- Mọi thay đổi được ghi lại
- Không thể xóa lịch sử

✅ **Temporal Queries**
- Xem trạng thái tại bất kỳ thời điểm
- Time travel debugging

✅ **Scalability**
- Async event processing
- Easy to add new consumers

✅ **Data Consistency**
- Eventual consistency
- Saga pattern support

✅ **Performance**
- Snapshot management
- Materialized views

---

## Slide 16: Monitoring & Observability

### Metrics to Track:

1. **Event Store Metrics**
   - Events per second
   - Stream count
   - Snapshot frequency

2. **Performance Metrics**
   - Query response time
   - Event replay time
   - Memory usage

3. **Business Metrics**
   - User actions per day
   - Most active streams
   - Event type distribution

### Monitoring Tools:
- Prometheus + Grafana
- Custom dashboards
- Alert rules

---

## Slide 17: Future Roadmap

### Phase 4: Advanced Features (Tuần 7-8)
- [ ] Event Schema Evolution
- [ ] Multi-region Replication
- [ ] Advanced CQRS Patterns
- [ ] Event Sourcing Analytics

### Phase 5: Production Optimization (Tuần 9-10)
- [ ] Performance Tuning
- [ ] Security Hardening
- [ ] Disaster Recovery
- [ ] Documentation

### Phase 6: Team Training (Tuần 11-12)
- [ ] Developer Workshops
- [ ] Best Practices Guide
- [ ] Troubleshooting Guide
- [ ] Maintenance Procedures

---

## Slide 18: Lessons Learned

### Challenges Faced:

1. **Learning Curve**
   - Event Sourcing concepts mới
   - KurrentDB syntax khác biệt
   - CQRS pattern complexity

2. **Performance Considerations**
   - Event replay overhead
   - Snapshot management
   - Memory usage optimization

3. **Team Adoption**
   - Developer training needed
   - Documentation requirements
   - Testing strategies

### Solutions Applied:

1. **Incremental Migration**
   - Service by service approach
   - Backward compatibility
   - Rollback strategies

2. **Comprehensive Testing**
   - Unit, integration, performance tests
   - Automated test suites
   - Manual testing procedures

---

## Slide 19: Q&A Session

### Common Questions:

**Q: Event Sourcing có phù hợp với tất cả use cases?**
A: Không, phù hợp với domain có nhiều state changes và cần audit trail.

**Q: Performance impact như thế nào?**
A: Có overhead ban đầu, nhưng được bù đắp bằng scalability và flexibility.

**Q: Migration strategy như thế nào?**
A: Incremental approach, service by service, với backward compatibility.

**Q: Maintenance complexity?**
A: Cần training và documentation, nhưng long-term benefits lớn.

---

## Slide 20: Conclusion

### Tóm tắt:

✅ **Event Sourcing đã được triển khai thành công**
- Foundation layer hoàn thành
- Testing framework sẵn sàng
- Documentation đầy đủ

✅ **Kế hoạch triển khai rõ ràng**
- 6 phases, 12 tuần
- Incremental migration
- Risk mitigation

✅ **Team sẵn sàng**
- Training materials
- Testing procedures
- Monitoring setup

### Next Steps:
1. Begin Phase 2 - Service Migration
2. Setup monitoring dashboards
3. Conduct team training
4. Start production deployment

---

## Slide 21: Resources

### Documentation:
- `docs/EVENT_SOURCING_STRATEGY.md`
- `docs/KURRENTDB_INTEGRATION.md`
- `docs/TESTING_GUIDE.md`
- `docs/DEPLOYMENT_PLAN.md`

### Code Examples:
- `services/shared/eventStore/`
- `services/shared/commands/`
- `services/shared/queries/`
- `services/shared/materializedViews/`

### Test Scripts:
- `scripts/simple-kurrentdb-test.js`
- `scripts/advanced-kurrentdb-test.js`

### Contact:
- Technical Lead: [Your Name]
- Architecture Team: [Team Members]
- Support: [Contact Info]

---

## Slide 22: Thank You!

### Questions & Discussion

**Thời gian Q&A:** 15 phút

**Follow-up:**
- Schedule technical deep-dive sessions
- Plan implementation kickoff
- Setup regular progress reviews

**Contact:**
- Email: [your-email@company.com]
- Slack: #event-sourcing-project
- GitHub: [project-repo]

---

*End of Presentation* 