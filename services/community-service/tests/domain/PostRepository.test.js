/**
 * PostRepository Tests
 * Test suite for Post aggregate repository
 */

const PostRepository = require('../../src/domain/repositories/PostRepository');
const PostAggregate = require('../../src/domain/aggregates/PostAggregate');
const { v4: uuidv4 } = require('uuid');

// Mock EventStoreClient
jest.mock('../../src/utils/eventStoreClient');
const EventStoreClient = require('../../src/utils/eventStoreClient');

describe('PostRepository', () => {
  let repository;
  let mockEventStoreClient;
  let postId, authorId;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock client
    mockEventStoreClient = {
      readStream: jest.fn(),
      appendEvent: jest.fn(),
      createSnapshot: jest.fn(),
      loadSnapshot: jest.fn(),
      healthCheck: jest.fn(),
      getClientStats: jest.fn()
    };
    
    EventStoreClient.mockImplementation(() => mockEventStoreClient);
    
    repository = new PostRepository({
      snapshotFrequency: 5, // Lower frequency for testing
      cacheTimeout: 1000 // 1 second for testing
    });
    
    postId = uuidv4();
    authorId = uuidv4();
  });

  afterEach(() => {
    repository.clearCache();
  });

  describe('Aggregate Loading', () => {
    test('should load aggregate from events', async () => {
      const events = [
        {
          type: 'PostCreated',
          data: {
            postId,
            authorId,
            title: 'Test Post',
            content: 'Test content',
            category: 'general',
            tags: [],
            url: null,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        },
        {
          type: 'PostVoted',
          data: {
            postId,
            userId: uuidv4(),
            voteType: 'up',
            votedAt: '2024-01-01T01:00:00.000Z'
          }
        }
      ];

      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: false,
        reason: 'Snapshot not found'
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events,
        streamName: `post-${postId}`,
        eventCount: 2
      });

      const aggregate = await repository.getById(postId);

      expect(aggregate).toBeInstanceOf(PostAggregate);
      expect(aggregate.id).toBe(postId);
      expect(aggregate.title).toBe('Test Post');
      expect(aggregate.upvotes).toBe(1);
      expect(aggregate.version).toBe(2);
      expect(mockEventStoreClient.readStream).toHaveBeenCalledWith(
        `post-${postId}`,
        {
          fromRevision: 'start',
          direction: 'forwards',
          maxCount: 1000,
          includeMetadata: true
        }
      );
    });

    test('should load aggregate from snapshot and events', async () => {
      const snapshotData = {
        id: postId,
        version: 3,
        title: 'Snapshot Post',
        content: 'Snapshot content',
        authorId,
        category: 'general',
        tags: [],
        url: null,
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        voteCount: 2,
        upvotes: 2,
        downvotes: 0,
        commentCount: 0,
        isDeleted: false
      };

      const eventsAfterSnapshot = [
        {
          type: 'PostVoted',
          data: {
            postId,
            userId: uuidv4(),
            voteType: 'up',
            votedAt: '2024-01-01T02:00:00.000Z'
          }
        }
      ];

      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: true,
        snapshot: snapshotData,
        version: 3
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events: eventsAfterSnapshot,
        streamName: `post-${postId}`,
        eventCount: 1
      });

      const aggregate = await repository.getById(postId);

      expect(aggregate.id).toBe(postId);
      expect(aggregate.title).toBe('Snapshot Post');
      expect(aggregate.upvotes).toBe(3); // 2 from snapshot + 1 from event
      expect(aggregate.version).toBe(4); // 3 from snapshot + 1 from event
      expect(mockEventStoreClient.readStream).toHaveBeenCalledWith(
        `post-${postId}`,
        {
          fromRevision: 4, // version + 1
          direction: 'forwards',
          maxCount: 1000,
          includeMetadata: true
        }
      );
    });

    test('should return null for non-existent aggregate', async () => {
      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: false,
        reason: 'Snapshot not found'
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events: [],
        streamName: `post-${postId}`,
        eventCount: 0
      });

      const aggregate = await repository.getById(postId);

      expect(aggregate).toBeNull();
    });

    test('should use cache for subsequent loads', async () => {
      const events = [
        {
          type: 'PostCreated',
          data: {
            postId,
            authorId,
            title: 'Cached Post',
            content: 'Cached content',
            category: 'general',
            tags: [],
            url: null,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        }
      ];

      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: false,
        reason: 'Snapshot not found'
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events,
        streamName: `post-${postId}`,
        eventCount: 1
      });

      // First load
      const aggregate1 = await repository.getById(postId);
      expect(aggregate1.title).toBe('Cached Post');
      expect(repository.stats.cacheMisses).toBe(1);
      expect(repository.stats.cacheHits).toBe(0);

      // Second load (should use cache)
      const aggregate2 = await repository.getById(postId);
      expect(aggregate2.title).toBe('Cached Post');
      expect(repository.stats.cacheMisses).toBe(1);
      expect(repository.stats.cacheHits).toBe(1);

      // Should only call event store once
      expect(mockEventStoreClient.readStream).toHaveBeenCalledTimes(1);
    });

    test('should handle event store errors', async () => {
      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: false,
        reason: 'Snapshot not found'
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: false,
        error: 'Connection failed'
      });

      await expect(repository.getById(postId)).rejects.toThrow('Failed to load events: Connection failed');
    });
  });

  describe('Aggregate Saving', () => {
    test('should save aggregate with uncommitted events', async () => {
      const aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
      aggregate.vote(uuidv4(), 'up');

      mockEventStoreClient.appendEvent.mockResolvedValue({
        success: true,
        eventId: uuidv4(),
        streamName: `post-${postId}`,
        eventType: 'PostCreated'
      });

      const result = await repository.save(aggregate);

      expect(result.success).toBe(true);
      expect(result.eventsAppended).toBe(2); // PostCreated + PostVoted
      expect(mockEventStoreClient.appendEvent).toHaveBeenCalledTimes(2);
      expect(aggregate.uncommittedEvents).toHaveLength(0);
    });

    test('should not save aggregate with no uncommitted events', async () => {
      const aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
      aggregate.markEventsAsCommitted();

      const result = await repository.save(aggregate);

      expect(result.success).toBe(true);
      expect(result.eventsAppended).toBe(0);
      expect(mockEventStoreClient.appendEvent).not.toHaveBeenCalled();
    });

    test('should create snapshot when needed', async () => {
      const aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
      aggregate.version = 5; // Trigger snapshot (frequency = 5)

      mockEventStoreClient.appendEvent.mockResolvedValue({
        success: true,
        eventId: uuidv4(),
        streamName: `post-${postId}`,
        eventType: 'PostCreated'
      });

      mockEventStoreClient.createSnapshot.mockResolvedValue({
        success: true,
        aggregateType: 'Post',
        aggregateId: postId,
        version: 5
      });

      await repository.save(aggregate);

      expect(mockEventStoreClient.createSnapshot).toHaveBeenCalledWith(
        'Post',
        postId,
        expect.any(Object),
        5
      );
    });

    test('should handle save errors', async () => {
      const aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');

      mockEventStoreClient.appendEvent.mockResolvedValue({
        success: false,
        error: 'Append failed'
      });

      await expect(repository.save(aggregate)).rejects.toThrow('Failed to append event: Append failed');
    });
  });

  describe('Snapshot Operations', () => {
    test('should create snapshot successfully', async () => {
      const aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');

      mockEventStoreClient.createSnapshot.mockResolvedValue({
        success: true,
        aggregateType: 'Post',
        aggregateId: postId,
        version: 1
      });

      const result = await repository.createSnapshot(aggregate);

      expect(result.success).toBe(true);
      expect(repository.stats.snapshotsCreated).toBe(1);
      expect(mockEventStoreClient.createSnapshot).toHaveBeenCalledWith(
        'Post',
        postId,
        expect.objectContaining({
          id: postId,
          title: 'Test Post',
          version: 1
        }),
        1
      );
    });

    test('should handle snapshot creation failure', async () => {
      const aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');

      mockEventStoreClient.createSnapshot.mockResolvedValue({
        success: false,
        error: 'Snapshot failed'
      });

      const result = await repository.createSnapshot(aggregate);

      expect(result.success).toBe(false);
      expect(repository.stats.snapshotsCreated).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    test('should check if aggregate exists', async () => {
      // Mock existing aggregate
      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: false,
        reason: 'Snapshot not found'
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events: [
          {
            type: 'PostCreated',
            data: {
              postId,
              authorId,
              title: 'Test Post',
              content: 'Test content',
              category: 'general',
              tags: [],
              url: null,
              createdAt: '2024-01-01T00:00:00.000Z'
            }
          }
        ],
        streamName: `post-${postId}`,
        eventCount: 1
      });

      const exists = await repository.exists(postId);
      expect(exists).toBe(true);

      // Mock non-existent aggregate
      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events: [],
        streamName: `post-${postId}`,
        eventCount: 0
      });

      const notExists = await repository.exists('non-existent-id');
      expect(notExists).toBe(false);
    });

    test('should get aggregate version', async () => {
      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: false,
        reason: 'Snapshot not found'
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events: [
          {
            type: 'PostCreated',
            data: {
              postId,
              authorId,
              title: 'Test Post',
              content: 'Test content',
              category: 'general',
              tags: [],
              url: null,
              createdAt: '2024-01-01T00:00:00.000Z'
            }
          }
        ],
        streamName: `post-${postId}`,
        eventCount: 1
      });

      const version = await repository.getVersion(postId);
      expect(version).toBe(1);
    });

    test('should return repository statistics', () => {
      const stats = repository.getStats();

      expect(stats).toHaveProperty('aggregatesLoaded');
      expect(stats).toHaveProperty('aggregatesSaved');
      expect(stats).toHaveProperty('snapshotsCreated');
      expect(stats).toHaveProperty('snapshotsLoaded');
      expect(stats).toHaveProperty('cacheHits');
      expect(stats).toHaveProperty('cacheMisses');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('eventStoreClient');
    });

    test('should perform health check', async () => {
      mockEventStoreClient.healthCheck.mockResolvedValue({
        success: true,
        status: 'healthy'
      });

      const health = await repository.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.eventStore.success).toBe(true);
      expect(health.repository).toHaveProperty('cacheSize');
      expect(health.repository).toHaveProperty('stats');
    });
  });

  describe('Cache Management', () => {
    test('should expire cache entries', async () => {
      const events = [
        {
          type: 'PostCreated',
          data: {
            postId,
            authorId,
            title: 'Test Post',
            content: 'Test content',
            category: 'general',
            tags: [],
            url: null,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        }
      ];

      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: false,
        reason: 'Snapshot not found'
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events,
        streamName: `post-${postId}`,
        eventCount: 1
      });

      // Load aggregate (should cache it)
      await repository.getById(postId);
      expect(repository.stats.cacheHits).toBe(0);
      expect(repository.stats.cacheMisses).toBe(1);

      // Wait for cache to expire (1 second timeout)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Load again (should miss cache due to expiration)
      await repository.getById(postId);
      expect(repository.stats.cacheHits).toBe(0);
      expect(repository.stats.cacheMisses).toBe(2);
    });

    test('should clear cache manually', async () => {
      const events = [
        {
          type: 'PostCreated',
          data: {
            postId,
            authorId,
            title: 'Test Post',
            content: 'Test content',
            category: 'general',
            tags: [],
            url: null,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        }
      ];

      mockEventStoreClient.loadSnapshot.mockResolvedValue({
        success: false,
        reason: 'Snapshot not found'
      });

      mockEventStoreClient.readStream.mockResolvedValue({
        success: true,
        events,
        streamName: `post-${postId}`,
        eventCount: 1
      });

      // Load and cache
      await repository.getById(postId);
      expect(repository.stats.cacheMisses).toBe(1);

      // Clear cache
      repository.clearCache();

      // Load again (should miss cache)
      await repository.getById(postId);
      expect(repository.stats.cacheMisses).toBe(2);
      expect(repository.stats.cacheHits).toBe(0);
    });
  });
});
