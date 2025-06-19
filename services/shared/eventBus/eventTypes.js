/**
 * Event Type Definitions
 * Centralized event types for the microservices architecture
 */

const EventTypes = {
  // User Events
  USER: {
    CREATED: 'user:created',
    UPDATED: 'user:updated',
    DELETED: 'user:deleted',
    PROFILE_UPDATED: 'user:profile_updated',
    PREFERENCES_UPDATED: 'user:preferences_updated',
    STATUS_CHANGED: 'user:status_changed'
  },

  // Authentication Events
  AUTH: {
    LOGIN: 'auth:login',
    LOGOUT: 'auth:logout',
    TOKEN_REFRESHED: 'auth:token_refreshed',
    PASSWORD_CHANGED: 'auth:password_changed',
    PASSWORD_RESET_REQUESTED: 'auth:password_reset_requested',
    PASSWORD_RESET_COMPLETED: 'auth:password_reset_completed',
    ACCOUNT_LOCKED: 'auth:account_locked',
    ACCOUNT_UNLOCKED: 'auth:account_unlocked',
    FAILED_LOGIN_ATTEMPT: 'auth:failed_login_attempt',
    SESSION_EXPIRED: 'auth:session_expired'
  },

  // Link/Security Events
  LINK: {
    SCAN_REQUESTED: 'link:scan_requested',
    SCAN_COMPLETED: 'link:scan_completed',
    SCAN_FAILED: 'link:scan_failed',
    THREAT_DETECTED: 'link:threat_detected',
    REPORT_SUBMITTED: 'link:report_submitted',
    REPUTATION_UPDATED: 'link:reputation_updated',
    WHITELIST_ADDED: 'link:whitelist_added',
    BLACKLIST_ADDED: 'link:blacklist_added'
  },

  // Community Events
  COMMUNITY: {
    POST_CREATED: 'community:post_created',
    POST_UPDATED: 'community:post_updated',
    POST_DELETED: 'community:post_deleted',
    POST_VOTED: 'community:post_voted',
    COMMENT_CREATED: 'community:comment_created',
    COMMENT_UPDATED: 'community:comment_updated',
    COMMENT_DELETED: 'community:comment_deleted',
    COMMENT_VOTED: 'community:comment_voted',
    REPORT_CREATED: 'community:report_created',
    CONTENT_MODERATED: 'community:content_moderated'
  },

  // Chat Events
  CHAT: {
    MESSAGE_SENT: 'chat:message_sent',
    MESSAGE_RECEIVED: 'chat:message_received',
    CONVERSATION_STARTED: 'chat:conversation_started',
    CONVERSATION_ENDED: 'chat:conversation_ended',
    USER_TYPING: 'chat:user_typing',
    USER_STOPPED_TYPING: 'chat:user_stopped_typing',
    AI_RESPONSE_GENERATED: 'chat:ai_response_generated',
    CHAT_ANALYZED: 'chat:analyzed'
  },

  // News Events
  NEWS: {
    ARTICLE_PUBLISHED: 'news:article_published',
    ARTICLE_UPDATED: 'news:article_updated',
    ARTICLE_DELETED: 'news:article_deleted',
    CATEGORY_CREATED: 'news:category_created',
    TRENDING_UPDATED: 'news:trending_updated',
    ALERT_CREATED: 'news:alert_created'
  },

  // Admin Events
  ADMIN: {
    USER_MODERATED: 'admin:user_moderated',
    CONTENT_MODERATED: 'admin:content_moderated',
    SYSTEM_ALERT: 'admin:system_alert',
    AUDIT_LOG_CREATED: 'admin:audit_log_created',
    CONFIGURATION_CHANGED: 'admin:configuration_changed',
    MAINTENANCE_STARTED: 'admin:maintenance_started',
    MAINTENANCE_COMPLETED: 'admin:maintenance_completed'
  },

  // System Events
  SYSTEM: {
    SERVICE_STARTED: 'system:service_started',
    SERVICE_STOPPED: 'system:service_stopped',
    SERVICE_HEALTH_CHANGED: 'system:service_health_changed',
    CIRCUIT_BREAKER_OPENED: 'system:circuit_breaker_opened',
    CIRCUIT_BREAKER_CLOSED: 'system:circuit_breaker_closed',
    RATE_LIMIT_EXCEEDED: 'system:rate_limit_exceeded',
    ERROR_OCCURRED: 'system:error_occurred',
    PERFORMANCE_ALERT: 'system:performance_alert',
    BACKUP_COMPLETED: 'system:backup_completed',
    DEPLOYMENT_STARTED: 'system:deployment_started',
    DEPLOYMENT_COMPLETED: 'system:deployment_completed'
  },

  // Notification Events
  NOTIFICATION: {
    CREATED: 'notification:created',
    SENT: 'notification:sent',
    DELIVERED: 'notification:delivered',
    READ: 'notification:read',
    FAILED: 'notification:failed'
  }
};

/**
 * Event Priority Levels
 */
const EventPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Event Categories for filtering and routing
 */
const EventCategories = {
  SECURITY: 'security',
  USER_ACTION: 'user_action',
  SYSTEM: 'system',
  BUSINESS: 'business',
  MONITORING: 'monitoring',
  AUDIT: 'audit'
};

/**
 * Event Schema Definitions
 */
const EventSchemas = {
  [EventTypes.USER.CREATED]: {
    required: ['userId', 'email', 'name'],
    optional: ['roles', 'metadata']
  },
  
  [EventTypes.AUTH.LOGIN]: {
    required: ['userId', 'email', 'timestamp'],
    optional: ['ipAddress', 'userAgent', 'location']
  },
  
  [EventTypes.LINK.SCAN_COMPLETED]: {
    required: ['linkId', 'url', 'result', 'safetyScore'],
    optional: ['threats', 'warnings', 'metadata']
  },
  
  [EventTypes.COMMUNITY.POST_CREATED]: {
    required: ['postId', 'userId', 'title', 'content'],
    optional: ['tags', 'category', 'attachments']
  },
  
  [EventTypes.SYSTEM.SERVICE_HEALTH_CHANGED]: {
    required: ['serviceName', 'status', 'timestamp'],
    optional: ['previousStatus', 'reason', 'metrics']
  }
};

/**
 * Event Routing Rules
 * Defines which services should receive which events
 */
const EventRouting = {
  [EventTypes.USER.CREATED]: ['auth', 'admin', 'notification'],
  [EventTypes.AUTH.LOGIN]: ['admin', 'security', 'analytics'],
  [EventTypes.LINK.THREAT_DETECTED]: ['admin', 'notification', 'security'],
  [EventTypes.COMMUNITY.POST_CREATED]: ['notification', 'admin'],
  [EventTypes.SYSTEM.SERVICE_HEALTH_CHANGED]: ['admin', 'monitoring'],
  [EventTypes.ADMIN.SYSTEM_ALERT]: ['notification', 'monitoring']
};

/**
 * Event Retention Policies
 * How long to keep events in the system
 */
const EventRetention = {
  [EventCategories.SECURITY]: 365, // days
  [EventCategories.AUDIT]: 2555, // 7 years
  [EventCategories.USER_ACTION]: 90,
  [EventCategories.SYSTEM]: 30,
  [EventCategories.BUSINESS]: 180,
  [EventCategories.MONITORING]: 7
};

/**
 * Helper functions
 */
const EventHelpers = {
  /**
   * Get event category
   */
  getEventCategory(eventType) {
    if (eventType.startsWith('auth:') || eventType.startsWith('link:threat')) {
      return EventCategories.SECURITY;
    }
    if (eventType.startsWith('user:') || eventType.startsWith('community:')) {
      return EventCategories.USER_ACTION;
    }
    if (eventType.startsWith('system:')) {
      return EventCategories.SYSTEM;
    }
    if (eventType.startsWith('admin:')) {
      return EventCategories.AUDIT;
    }
    return EventCategories.BUSINESS;
  },

  /**
   * Get event priority
   */
  getEventPriority(eventType) {
    const criticalEvents = [
      EventTypes.LINK.THREAT_DETECTED,
      EventTypes.ADMIN.SYSTEM_ALERT,
      EventTypes.SYSTEM.SERVICE_STOPPED,
      EventTypes.AUTH.ACCOUNT_LOCKED
    ];
    
    const highEvents = [
      EventTypes.SYSTEM.CIRCUIT_BREAKER_OPENED,
      EventTypes.SYSTEM.ERROR_OCCURRED,
      EventTypes.AUTH.FAILED_LOGIN_ATTEMPT
    ];

    if (criticalEvents.includes(eventType)) {
      return EventPriority.CRITICAL;
    }
    if (highEvents.includes(eventType)) {
      return EventPriority.HIGH;
    }
    return EventPriority.NORMAL;
  },

  /**
   * Get target services for an event
   */
  getTargetServices(eventType) {
    return EventRouting[eventType] || [];
  },

  /**
   * Validate event data against schema
   */
  validateEventData(eventType, data) {
    const schema = EventSchemas[eventType];
    if (!schema) {
      return { valid: true, errors: [] };
    }

    const errors = [];
    
    // Check required fields
    schema.required.forEach(field => {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Get retention period for event
   */
  getRetentionPeriod(eventType) {
    const category = this.getEventCategory(eventType);
    return EventRetention[category] || 30;
  }
};

module.exports = {
  EventTypes,
  EventPriority,
  EventCategories,
  EventSchemas,
  EventRouting,
  EventRetention,
  EventHelpers
};
