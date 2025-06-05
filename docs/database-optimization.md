# Database Optimization for Sprint 2

## Current State: Firebase Firestore
✅ **Recommendation: Continue with Firestore**

## Optimization Strategies

### 1. Data Structure Optimization

#### Community Stats Denormalization
```javascript
// links collection - embed community stats
{
  id: "link123",
  url: "https://example.com",
  userId: "user123",
  credibilityScore: 85,
  communityStats: {
    votes: {
      trusted: 45,
      suspicious: 12,
      untrusted: 8
    },
    totalVotes: 65,
    totalComments: 23,
    totalReports: 2,
    consensus: {
      type: "trusted", // trusted, suspicious, untrusted, unknown
      percentage: 69
    },
    lastVoteAt: "2024-01-15T10:30:00Z",
    lastCommentAt: "2024-01-15T11:45:00Z",
    lastReportAt: "2024-01-14T09:20:00Z"
  }
}
```

### 2. Query Optimization

#### Composite Indexes for Sprint 2
```json
{
  "indexes": [
    // Votes queries
    {
      "collectionGroup": "votes",
      "fields": [
        {"fieldPath": "linkId", "order": "ASCENDING"},
        {"fieldPath": "userId", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "votes", 
      "fields": [
        {"fieldPath": "linkId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    // Comments queries
    {
      "collectionGroup": "comments",
      "fields": [
        {"fieldPath": "linkId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    // Reports queries
    {
      "collectionGroup": "reports",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "reports",
      "fields": [
        {"fieldPath": "category", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

### 3. Batch Operations

#### Atomic Updates for Community Features
```javascript
// Example: Vote submission with batch
const batch = db.batch();

// Update vote document
batch.set(voteRef, voteData);

// Update link community stats
batch.update(linkRef, {
  'communityStats.votes.trusted': admin.firestore.FieldValue.increment(1),
  'communityStats.totalVotes': admin.firestore.FieldValue.increment(1),
  'communityStats.lastVoteAt': new Date().toISOString()
});

await batch.commit();
```

### 4. Caching Strategy

#### Client-side Caching
- Use React Query for API response caching
- Cache vote statistics for 5 minutes
- Cache comments for 2 minutes
- Real-time updates override cache

#### Server-side Caching
- Redis for frequently accessed data
- Cache community stats aggregations
- Cache admin dashboard statistics

### 5. Real-time Optimization

#### Selective Real-time Subscriptions
```javascript
// Only subscribe to critical real-time data
const unsubscribe = db.collection('admin_notifications')
  .where('isRead', '==', false)
  .onSnapshot(snapshot => {
    // Update admin notifications in real-time
  });
```

### 6. Cost Optimization

#### Read Reduction Strategies
1. **Pagination with cursors** instead of offset
2. **Aggregate data** in parent documents
3. **Limit real-time listeners** to essential data
4. **Use cached results** when possible

#### Write Optimization
1. **Batch related writes** together
2. **Debounce frequent updates** (like vote counts)
3. **Use transactions** for consistency

### 7. Performance Monitoring

#### Key Metrics to Track
- Read/Write operations per day
- Query performance (latency)
- Real-time connection count
- Cache hit rates
- Cost per feature

#### Firestore Usage Patterns
```javascript
// Monitor expensive queries
const expensiveQuery = db.collection('reports')
  .where('status', '==', 'pending')
  .orderBy('createdAt', 'desc')
  .limit(50);

// Consider denormalizing if this runs frequently
```

### 8. Future Considerations

#### When to Consider Migration
- **Monthly cost > $500** for database operations
- **Complex analytical queries** needed
- **Heavy reporting requirements**
- **Multi-tenant architecture** needed

#### Alternative Options
1. **PostgreSQL** - For complex queries and reporting
2. **MongoDB** - For flexible document structure
3. **Hybrid approach** - Firestore + PostgreSQL for analytics

### 9. Implementation Priority

#### Phase 1 (Immediate)
- [ ] Add composite indexes for Sprint 2
- [ ] Implement batch operations
- [ ] Setup client-side caching

#### Phase 2 (Next Sprint)
- [ ] Add Redis caching layer
- [ ] Implement query optimization
- [ ] Setup performance monitoring

#### Phase 3 (Future)
- [ ] Evaluate cost vs performance
- [ ] Consider hybrid architecture
- [ ] Plan migration strategy if needed

## Conclusion

**Firestore is the right choice** for current needs:
- ✅ Mature infrastructure
- ✅ Real-time capabilities
- ✅ Good for community features
- ✅ Integrated with existing auth

Focus on **optimization rather than migration** for Sprint 2.
