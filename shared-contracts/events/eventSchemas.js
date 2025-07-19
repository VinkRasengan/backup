/**
 * Event Schemas and Contracts
 * Shared event definitions for all services - ONLY SCHEMAS, NO IMPLEMENTATION
 */

const EVENT_SCHEMAS = {
  // Authentication Events
  'auth.user.registered': {
    version: '1.0.0',
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 1 },
        roles: { type: 'array', items: { type: 'string' } },
        provider: { type: 'string', enum: ['email', 'google', 'facebook'] },
        emailVerified: { type: 'boolean' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['userId', 'email', 'name', 'timestamp'],
      additionalProperties: false
    }
  },

  'auth.user.login': {
    version: '1.0.0',
    description: 'User successfully logged in',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        sessionId: { type: 'string' },
        ipAddress: { type: 'string' },
        userAgent: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['userId', 'email', 'sessionId', 'timestamp'],
      additionalProperties: false
    }
  },

  'auth.user.logout': {
    version: '1.0.0',
    description: 'User logged out',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        sessionId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['userId', 'sessionId', 'timestamp'],
      additionalProperties: false
    }
  },

  // User Management Events
  'user.created': {
    version: '1.0.0',
    description: 'User profile created',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 1 },
        avatar: { type: 'string', format: 'uri' },
        preferences: { type: 'object' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['userId', 'email', 'name', 'timestamp'],
      additionalProperties: false
    }
  },

  'user.updated': {
    version: '1.0.0',
    description: 'User profile updated',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        changes: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            avatar: { type: 'string', format: 'uri' },
            preferences: { type: 'object' }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['userId', 'changes', 'timestamp'],
      additionalProperties: false
    }
  },

  // Community Events
  'community.post.created': {
    version: '1.0.0',
    description: 'New post created in community',
    schema: {
      type: 'object',
      properties: {
        postId: { type: 'string', format: 'uuid' },
        authorId: { type: 'string', format: 'uuid' },
        title: { type: 'string', minLength: 1, maxLength: 200 },
        content: { type: 'string', minLength: 1 },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['postId', 'authorId', 'title', 'content', 'timestamp'],
      additionalProperties: false
    }
  },

  'community.post.voted': {
    version: '1.0.0',
    description: 'Post received a vote',
    schema: {
      type: 'object',
      properties: {
        postId: { type: 'string', format: 'uuid' },
        voterId: { type: 'string', format: 'uuid' },
        voteType: { type: 'string', enum: ['upvote', 'downvote'] },
        previousVote: { type: 'string', enum: ['upvote', 'downvote', null] },
        newScore: { type: 'integer' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['postId', 'voterId', 'voteType', 'newScore', 'timestamp'],
      additionalProperties: false
    }
  },

  'community.comment.created': {
    version: '1.0.0',
    description: 'New comment created',
    schema: {
      type: 'object',
      properties: {
        commentId: { type: 'string', format: 'uuid' },
        postId: { type: 'string', format: 'uuid' },
        authorId: { type: 'string', format: 'uuid' },
        content: { type: 'string', minLength: 1 },
        parentCommentId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['commentId', 'postId', 'authorId', 'content', 'timestamp'],
      additionalProperties: false
    }
  },

  // Link Verification Events
  'link.submitted': {
    version: '1.0.0',
    description: 'Link submitted for verification',
    schema: {
      type: 'object',
      properties: {
        linkId: { type: 'string', format: 'uuid' },
        url: { type: 'string', format: 'uri' },
        submitterId: { type: 'string', format: 'uuid' },
        source: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['linkId', 'url', 'submitterId', 'timestamp'],
      additionalProperties: false
    }
  },

  'link.verified': {
    version: '1.0.0',
    description: 'Link verification completed',
    schema: {
      type: 'object',
      properties: {
        linkId: { type: 'string', format: 'uuid' },
        url: { type: 'string', format: 'uri' },
        status: { type: 'string', enum: ['safe', 'suspicious', 'malicious'] },
        score: { type: 'number', minimum: 0, maximum: 100 },
        threats: { type: 'array', items: { type: 'string' } },
        scanResults: { type: 'object' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['linkId', 'url', 'status', 'score', 'timestamp'],
      additionalProperties: false
    }
  },

  // Chat Events
  'chat.message.sent': {
    version: '1.0.0',
    description: 'Chat message sent',
    schema: {
      type: 'object',
      properties: {
        messageId: { type: 'string', format: 'uuid' },
        conversationId: { type: 'string', format: 'uuid' },
        senderId: { type: 'string', format: 'uuid' },
        content: { type: 'string', minLength: 1 },
        messageType: { type: 'string', enum: ['text', 'image', 'file', 'system'] },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['messageId', 'conversationId', 'senderId', 'content', 'timestamp'],
      additionalProperties: false
    }
  },

  'chat.ai.response.generated': {
    version: '1.0.0',
    description: 'AI generated response to user query',
    schema: {
      type: 'object',
      properties: {
        responseId: { type: 'string', format: 'uuid' },
        conversationId: { type: 'string', format: 'uuid' },
        userId: { type: 'string', format: 'uuid' },
        query: { type: 'string' },
        response: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        processingTime: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['responseId', 'conversationId', 'userId', 'query', 'response', 'timestamp'],
      additionalProperties: false
    }
  },

  // News Events
  'news.article.fetched': {
    version: '1.0.0',
    description: 'News article fetched from source',
    schema: {
      type: 'object',
      properties: {
        articleId: { type: 'string', format: 'uuid' },
        title: { type: 'string', minLength: 1 },
        content: { type: 'string' },
        url: { type: 'string', format: 'uri' },
        source: { type: 'string' },
        publishedAt: { type: 'string', format: 'date-time' },
        fetchedAt: { type: 'string', format: 'date-time' }
      },
      required: ['articleId', 'title', 'url', 'source', 'fetchedAt'],
      additionalProperties: false
    }
  },

  // System Events
  'system.service.started': {
    version: '1.0.0',
    description: 'Service started successfully',
    schema: {
      type: 'object',
      properties: {
        serviceName: { type: 'string' },
        version: { type: 'string' },
        port: { type: 'integer' },
        environment: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['serviceName', 'version', 'timestamp'],
      additionalProperties: false
    }
  },

  'system.service.health_changed': {
    version: '1.0.0',
    description: 'Service health status changed',
    schema: {
      type: 'object',
      properties: {
        serviceName: { type: 'string' },
        previousStatus: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        currentStatus: { type: 'string', enum: ['healthy', 'unhealthy', 'degraded'] },
        reason: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['serviceName', 'currentStatus', 'timestamp'],
      additionalProperties: false
    }
  },

  // Security Events
  'security.threat.detected': {
    version: '1.0.0',
    description: 'Security threat detected',
    schema: {
      type: 'object',
      properties: {
        threatId: { type: 'string', format: 'uuid' },
        threatType: { type: 'string' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        source: { type: 'string' },
        details: { type: 'object' },
        timestamp: { type: 'string', format: 'date-time' }
      },
      required: ['threatId', 'threatType', 'severity', 'source', 'timestamp'],
      additionalProperties: false
    }
  }
};

// Event Categories for routing and filtering
const EVENT_CATEGORIES = {
  AUTHENTICATION: ['auth.user.registered', 'auth.user.login', 'auth.user.logout'],
  USER_MANAGEMENT: ['user.created', 'user.updated', 'user.deleted'],
  COMMUNITY: ['community.post.created', 'community.post.voted', 'community.comment.created'],
  LINK_VERIFICATION: ['link.submitted', 'link.verified', 'link.flagged.suspicious'],
  CHAT: ['chat.message.sent', 'chat.ai.response.generated'],
  NEWS: ['news.article.fetched', 'news.article.processed'],
  SYSTEM: ['system.service.started', 'system.service.health_changed'],
  SECURITY: ['security.threat.detected', 'security.suspicious_activity']
};

// Event Priorities for processing order
const EVENT_PRIORITIES = {
  CRITICAL: ['security.threat.detected', 'system.service.health_changed'],
  HIGH: ['auth.user.login', 'link.verified'],
  MEDIUM: ['community.post.created', 'user.created'],
  LOW: ['chat.message.sent', 'news.article.fetched']
};

module.exports = {
  EVENT_SCHEMAS,
  EVENT_CATEGORIES,
  EVENT_PRIORITIES
};
