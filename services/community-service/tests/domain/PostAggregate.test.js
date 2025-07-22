/**
 * PostAggregate Tests
 * Test suite for Post domain aggregate
 */

const PostAggregate = require('../../src/domain/aggregates/PostAggregate');
const { v4: uuidv4 } = require('uuid');

describe('PostAggregate', () => {
  let postId, authorId;

  beforeEach(() => {
    postId = uuidv4();
    authorId = uuidv4();
  });

  describe('Creation', () => {
    test('should create new post aggregate', () => {
      const title = 'Test Post Title';
      const content = 'This is test content for the post.';
      const options = {
        category: 'technology',
        tags: ['test', 'javascript'],
        url: 'https://example.com'
      };

      const aggregate = PostAggregate.create(postId, authorId, title, content, options);

      expect(aggregate.id).toBe(postId);
      expect(aggregate.title).toBe(title);
      expect(aggregate.content).toBe(content);
      expect(aggregate.authorId).toBe(authorId);
      expect(aggregate.category).toBe('technology');
      expect(aggregate.tags).toEqual(['test', 'javascript']);
      expect(aggregate.url).toBe('https://example.com');
      expect(aggregate.status).toBe('active');
      expect(aggregate.version).toBe(1);
      expect(aggregate.voteCount).toBe(0);
      expect(aggregate.commentCount).toBe(0);
      expect(aggregate.isDeleted).toBe(false);
      expect(aggregate.uncommittedEvents).toHaveLength(1);
    });

    test('should create post with default options', () => {
      const title = 'Test Post';
      const content = 'Test content';

      const aggregate = PostAggregate.create(postId, authorId, title, content);

      expect(aggregate.category).toBe('general');
      expect(aggregate.tags).toEqual([]);
      expect(aggregate.url).toBeNull();
    });

    test('should validate required fields on creation', () => {
      expect(() => {
        PostAggregate.create(postId, '', 'Title', 'Content');
      }).toThrow('Author ID is required');

      expect(() => {
        PostAggregate.create(postId, authorId, '', 'Content');
      }).toThrow('Title is required');

      expect(() => {
        PostAggregate.create(postId, authorId, 'Title', '');
      }).toThrow('Content is required');
    });

    test('should validate field lengths on creation', () => {
      const longTitle = 'a'.repeat(201);
      const longContent = 'a'.repeat(10001);

      expect(() => {
        PostAggregate.create(postId, authorId, longTitle, 'Content');
      }).toThrow('Title must be 200 characters or less');

      expect(() => {
        PostAggregate.create(postId, authorId, 'Title', longContent);
      }).toThrow('Content must be 10000 characters or less');
    });
  });

  describe('Event Sourcing', () => {
    test('should rebuild from event history', () => {
      const events = [
        {
          type: 'PostCreated',
          data: {
            postId,
            authorId,
            title: 'Original Title',
            content: 'Original content',
            category: 'tech',
            tags: ['test'],
            url: null,
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        },
        {
          type: 'PostUpdated',
          data: {
            postId,
            title: 'Updated Title',
            content: 'Updated content',
            category: 'tech',
            tags: ['test', 'updated'],
            url: 'https://example.com',
            updatedAt: '2024-01-02T00:00:00.000Z'
          }
        },
        {
          type: 'PostVoted',
          data: {
            postId,
            userId: uuidv4(),
            voteType: 'up',
            votedAt: '2024-01-03T00:00:00.000Z'
          }
        }
      ];

      const aggregate = PostAggregate.fromHistory(events);

      expect(aggregate.id).toBe(postId);
      expect(aggregate.title).toBe('Updated Title');
      expect(aggregate.content).toBe('Updated content');
      expect(aggregate.tags).toEqual(['test', 'updated']);
      expect(aggregate.url).toBe('https://example.com');
      expect(aggregate.upvotes).toBe(1);
      expect(aggregate.voteCount).toBe(1);
      expect(aggregate.version).toBe(3);
      expect(aggregate.uncommittedEvents).toHaveLength(0);
    });

    test('should handle empty event history', () => {
      expect(() => {
        PostAggregate.fromHistory([]);
      }).toThrow('Cannot rebuild aggregate from empty event history');

      expect(() => {
        PostAggregate.fromHistory(null);
      }).toThrow('Cannot rebuild aggregate from empty event history');
    });

    test('should handle invalid event history', () => {
      const invalidEvents = [
        {
          type: 'PostCreated',
          data: {
            // Missing postId
            authorId,
            title: 'Title',
            content: 'Content'
          }
        }
      ];

      expect(() => {
        PostAggregate.fromHistory(invalidEvents);
      }).toThrow('Invalid event history: missing postId');
    });
  });

  describe('Post Updates', () => {
    let aggregate;

    beforeEach(() => {
      aggregate = PostAggregate.create(postId, authorId, 'Original Title', 'Original content');
      aggregate.markEventsAsCommitted(); // Clear uncommitted events
    });

    test('should update post content', () => {
      const newTitle = 'Updated Title';
      const newContent = 'Updated content';
      const options = {
        category: 'updated',
        tags: ['updated'],
        url: 'https://updated.com'
      };

      aggregate.updatePost(newTitle, newContent, options);

      expect(aggregate.title).toBe(newTitle);
      expect(aggregate.content).toBe(newContent);
      expect(aggregate.category).toBe('updated');
      expect(aggregate.tags).toEqual(['updated']);
      expect(aggregate.url).toBe('https://updated.com');
      expect(aggregate.version).toBe(2);
      expect(aggregate.uncommittedEvents).toHaveLength(1);
      expect(aggregate.uncommittedEvents[0].type).toBe('PostUpdated');
    });

    test('should validate update fields', () => {
      expect(() => {
        aggregate.updatePost('', 'Content');
      }).toThrow('Title is required');

      expect(() => {
        aggregate.updatePost('Title', '');
      }).toThrow('Content is required');
    });

    test('should prevent updating deleted post', () => {
      aggregate.delete(authorId, 'Test deletion');

      expect(() => {
        aggregate.updatePost('New Title', 'New content');
      }).toThrow('Cannot update deleted post');
    });

    test('should prevent updating removed post', () => {
      aggregate.moderate(uuidv4(), 'remove', 'Spam content');

      expect(() => {
        aggregate.updatePost('New Title', 'New content');
      }).toThrow('Cannot update removed post');
    });
  });

  describe('Voting', () => {
    let aggregate;
    const voterId = uuidv4();

    beforeEach(() => {
      aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
      aggregate.markEventsAsCommitted();
    });

    test('should handle upvote', () => {
      aggregate.vote(voterId, 'up');

      expect(aggregate.upvotes).toBe(1);
      expect(aggregate.downvotes).toBe(0);
      expect(aggregate.voteCount).toBe(1);
      expect(aggregate.version).toBe(2);
      expect(aggregate.uncommittedEvents).toHaveLength(1);
      expect(aggregate.uncommittedEvents[0].type).toBe('PostVoted');
      expect(aggregate.uncommittedEvents[0].data.voteType).toBe('up');
    });

    test('should handle downvote', () => {
      aggregate.vote(voterId, 'down');

      expect(aggregate.upvotes).toBe(0);
      expect(aggregate.downvotes).toBe(1);
      expect(aggregate.voteCount).toBe(-1);
    });

    test('should handle multiple votes', () => {
      aggregate.vote(uuidv4(), 'up');
      aggregate.vote(uuidv4(), 'up');
      aggregate.vote(uuidv4(), 'down');

      expect(aggregate.upvotes).toBe(2);
      expect(aggregate.downvotes).toBe(1);
      expect(aggregate.voteCount).toBe(1);
    });

    test('should validate vote parameters', () => {
      expect(() => {
        aggregate.vote('', 'up');
      }).toThrow('User ID is required for voting');

      expect(() => {
        aggregate.vote(voterId, 'invalid');
      }).toThrow('Vote type must be "up" or "down"');
    });

    test('should prevent voting on deleted post', () => {
      aggregate.delete(authorId, 'Test deletion');

      expect(() => {
        aggregate.vote(voterId, 'up');
      }).toThrow('Cannot vote on deleted post');
    });

    test('should prevent voting on inactive post', () => {
      aggregate.moderate(uuidv4(), 'reject', 'Inappropriate content');

      expect(() => {
        aggregate.vote(voterId, 'up');
      }).toThrow('Can only vote on active posts');
    });
  });

  describe('Comments', () => {
    let aggregate;
    const commentId = uuidv4();
    const commentAuthorId = uuidv4();

    beforeEach(() => {
      aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
      aggregate.markEventsAsCommitted();
    });

    test('should add comment', () => {
      const content = 'This is a test comment';

      aggregate.addComment(commentId, commentAuthorId, content);

      expect(aggregate.commentCount).toBe(1);
      expect(aggregate.version).toBe(2);
      expect(aggregate.uncommittedEvents).toHaveLength(1);
      expect(aggregate.uncommittedEvents[0].type).toBe('CommentAdded');
      expect(aggregate.uncommittedEvents[0].data.commentId).toBe(commentId);
      expect(aggregate.uncommittedEvents[0].data.content).toBe(content);
    });

    test('should validate comment parameters', () => {
      expect(() => {
        aggregate.addComment('', commentAuthorId, 'Content');
      }).toThrow('Comment ID is required');

      expect(() => {
        aggregate.addComment(commentId, '', 'Content');
      }).toThrow('Author ID is required');

      expect(() => {
        aggregate.addComment(commentId, commentAuthorId, '');
      }).toThrow('Comment content is required');

      const longContent = 'a'.repeat(2001);
      expect(() => {
        aggregate.addComment(commentId, commentAuthorId, longContent);
      }).toThrow('Comment must be 2000 characters or less');
    });

    test('should prevent commenting on deleted post', () => {
      aggregate.delete(authorId, 'Test deletion');

      expect(() => {
        aggregate.addComment(commentId, commentAuthorId, 'Comment');
      }).toThrow('Cannot comment on deleted post');
    });
  });

  describe('Moderation', () => {
    let aggregate;
    const moderatorId = uuidv4();

    beforeEach(() => {
      aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
      aggregate.markEventsAsCommitted();
    });

    test('should approve post', () => {
      aggregate.moderate(moderatorId, 'approve', 'Content is appropriate');

      expect(aggregate.status).toBe('active');
      expect(aggregate.version).toBe(2);
      expect(aggregate.uncommittedEvents[0].type).toBe('PostModerated');
      expect(aggregate.uncommittedEvents[0].data.action).toBe('approve');
    });

    test('should reject post', () => {
      aggregate.moderate(moderatorId, 'reject', 'Inappropriate content');

      expect(aggregate.status).toBe('rejected');
    });

    test('should flag post', () => {
      aggregate.moderate(moderatorId, 'flag', 'Needs review');

      expect(aggregate.status).toBe('flagged');
    });

    test('should remove post', () => {
      aggregate.moderate(moderatorId, 'remove', 'Spam content');

      expect(aggregate.status).toBe('removed');
    });

    test('should validate moderation parameters', () => {
      expect(() => {
        aggregate.moderate('', 'approve', 'Reason');
      }).toThrow('Moderator ID is required');

      expect(() => {
        aggregate.moderate(moderatorId, 'invalid', 'Reason');
      }).toThrow('Invalid moderation action');

      expect(() => {
        aggregate.moderate(moderatorId, 'approve', '');
      }).toThrow('Moderation reason is required');
    });
  });

  describe('Deletion', () => {
    let aggregate;

    beforeEach(() => {
      aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
      aggregate.markEventsAsCommitted();
    });

    test('should delete post', () => {
      aggregate.delete(authorId, 'No longer needed');

      expect(aggregate.isDeleted).toBe(true);
      expect(aggregate.status).toBe('deleted');
      expect(aggregate.version).toBe(2);
      expect(aggregate.uncommittedEvents[0].type).toBe('PostDeleted');
    });

    test('should validate deletion parameters', () => {
      expect(() => {
        aggregate.delete('', 'Reason');
      }).toThrow('Deleted by user ID is required');
    });

    test('should prevent deleting already deleted post', () => {
      aggregate.delete(authorId, 'First deletion');

      expect(() => {
        aggregate.delete(authorId, 'Second deletion');
      }).toThrow('Post is already deleted');
    });
  });

  describe('Snapshots', () => {
    let aggregate;

    beforeEach(() => {
      aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
    });

    test('should create snapshot', () => {
      const snapshot = aggregate.getSnapshot();

      expect(snapshot.id).toBe(postId);
      expect(snapshot.version).toBe(1);
      expect(snapshot.title).toBe('Test Post');
      expect(snapshot.content).toBe('Test content');
      expect(snapshot.authorId).toBe(authorId);
      expect(snapshot.status).toBe('active');
      expect(snapshot.isDeleted).toBe(false);
    });

    test('should determine if snapshot is needed', () => {
      // Version 1 - no snapshot needed
      expect(aggregate.needsSnapshot(100)).toBe(false);

      // Simulate version 100
      aggregate.version = 100;
      expect(aggregate.needsSnapshot(100)).toBe(true);

      // Version 150 - no snapshot needed
      aggregate.version = 150;
      expect(aggregate.needsSnapshot(100)).toBe(false);

      // Version 200 - snapshot needed
      aggregate.version = 200;
      expect(aggregate.needsSnapshot(100)).toBe(true);
    });
  });

  describe('Event Management', () => {
    let aggregate;

    beforeEach(() => {
      aggregate = PostAggregate.create(postId, authorId, 'Test Post', 'Test content');
    });

    test('should track uncommitted events', () => {
      expect(aggregate.uncommittedEvents).toHaveLength(1);

      aggregate.vote(uuidv4(), 'up');
      expect(aggregate.uncommittedEvents).toHaveLength(2);

      aggregate.addComment(uuidv4(), uuidv4(), 'Test comment');
      expect(aggregate.uncommittedEvents).toHaveLength(3);
    });

    test('should get and clear uncommitted events', () => {
      aggregate.vote(uuidv4(), 'up');
      
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(2);
      expect(aggregate.uncommittedEvents).toHaveLength(0);
    });

    test('should mark events as committed', () => {
      aggregate.vote(uuidv4(), 'up');
      expect(aggregate.uncommittedEvents).toHaveLength(2);

      aggregate.markEventsAsCommitted();
      expect(aggregate.uncommittedEvents).toHaveLength(0);
    });
  });
});
