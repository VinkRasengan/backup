/**
 * Event Validator for Event Bus Service
 */

const Joi = require('joi');
const logger = require('../utils/logger');

class EventValidator {
  constructor() {
    this.schemas = new Map();
    this.setupDefaultSchemas();
    
    logger.info('Event validator initialized');
  }

  /**
   * Setup default event schemas
   */
  setupDefaultSchemas() {
    // Base event schema
    const baseEventSchema = Joi.object({
      type: Joi.string().required(),
      data: Joi.object().required(),
      metadata: Joi.object({
        timestamp: Joi.string().isoDate(),
        correlationId: Joi.string().uuid(),
        causationId: Joi.string().uuid().optional(),
        source: Joi.string().required(),
        version: Joi.string().default('1.0.0'),
        userId: Joi.string().optional(),
        sessionId: Joi.string().optional()
      }).optional()
    });

    // Authentication events
    this.registerSchema('auth.user.registered', Joi.object({
      type: Joi.string().valid('auth.user.registered').required(),
      data: Joi.object({
        userId: Joi.string().uuid().required(),
        email: Joi.string().email().required(),
        name: Joi.string().min(1).required(),
        roles: Joi.array().items(Joi.string()).default([]),
        provider: Joi.string().valid('email', 'google', 'facebook').default('email'),
        emailVerified: Joi.boolean().default(false)
      }).required(),
      metadata: baseEventSchema.extract('metadata')
    }));

    this.registerSchema('auth.user.login', Joi.object({
      type: Joi.string().valid('auth.user.login').required(),
      data: Joi.object({
        userId: Joi.string().uuid().required(),
        email: Joi.string().email().required(),
        sessionId: Joi.string().required(),
        ipAddress: Joi.string().ip().optional(),
        userAgent: Joi.string().optional()
      }).required(),
      metadata: baseEventSchema.extract('metadata')
    }));

    // Community events
    this.registerSchema('community.post.created', Joi.object({
      type: Joi.string().valid('community.post.created').required(),
      data: Joi.object({
        postId: Joi.string().uuid().required(),
        authorId: Joi.string().uuid().required(),
        title: Joi.string().min(1).max(200).required(),
        content: Joi.string().min(1).max(10000).required(),
        tags: Joi.array().items(Joi.string()).default([]),
        links: Joi.array().items(Joi.string().uri()).default([])
      }).required(),
      metadata: baseEventSchema.extract('metadata')
    }));

    this.registerSchema('community.comment.created', Joi.object({
      type: Joi.string().valid('community.comment.created').required(),
      data: Joi.object({
        commentId: Joi.string().uuid().required(),
        postId: Joi.string().uuid().required(),
        authorId: Joi.string().uuid().required(),
        content: Joi.string().min(1).max(2000).required(),
        parentCommentId: Joi.string().uuid().optional()
      }).required(),
      metadata: baseEventSchema.extract('metadata')
    }));

    // Link analysis events
    this.registerSchema('link.analysis.requested', Joi.object({
      type: Joi.string().valid('link.analysis.requested').required(),
      data: Joi.object({
        linkId: Joi.string().uuid().required(),
        url: Joi.string().uri().required(),
        requestedBy: Joi.string().uuid().required(),
        context: Joi.object({
          type: Joi.string().valid('community_post', 'community_comment', 'direct').required(),
          entityId: Joi.string().uuid().optional()
        }).required(),
        priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
        analysisType: Joi.array().items(
          Joi.string().valid('security', 'phishing', 'reputation', 'content')
        ).min(1).required()
      }).required(),
      metadata: baseEventSchema.extract('metadata')
    }));

    this.registerSchema('link.analysis.completed', Joi.object({
      type: Joi.string().valid('link.analysis.completed').required(),
      data: Joi.object({
        linkId: Joi.string().uuid().required(),
        url: Joi.string().uri().required(),
        result: Joi.object({
          status: Joi.string().valid('safe', 'suspicious', 'malicious', 'error').required(),
          score: Joi.number().min(0).max(100).required(),
          threats: Joi.array().items(Joi.string()).default([]),
          details: Joi.object().optional()
        }).required(),
        analysisType: Joi.array().items(Joi.string()).required(),
        completedAt: Joi.string().isoDate().required()
      }).required(),
      metadata: baseEventSchema.extract('metadata')
    }));

    // System events
    this.registerSchema('system.service.started', Joi.object({
      type: Joi.string().valid('system.service.started').required(),
      data: Joi.object({
        serviceName: Joi.string().required(),
        version: Joi.string().required(),
        port: Joi.number().integer().min(1).max(65535).optional(),
        environment: Joi.string().valid('development', 'staging', 'production').required()
      }).required(),
      metadata: baseEventSchema.extract('metadata')
    }));

    logger.info('Default event schemas registered', { 
      count: this.schemas.size 
    });
  }

  /**
   * Register a new event schema
   */
  registerSchema(eventType, schema) {
    this.schemas.set(eventType, schema);
    logger.debug('Event schema registered', { eventType });
  }

  /**
   * Validate an event
   */
  async validate(eventType, data, metadata = {}) {
    try {
      // Create full event object
      const event = {
        type: eventType,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata
        }
      };

      // Get schema for event type
      const schema = this.schemas.get(eventType);
      
      if (!schema) {
        // Use generic validation for unknown event types
        return this.validateGeneric(event);
      }

      // Validate against specific schema
      const { error, value } = schema.validate(event, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Event validation failed', {
          eventType,
          errors
        });

        return {
          valid: false,
          errors,
          event: null
        };
      }

      logger.debug('Event validation passed', { eventType });

      return {
        valid: true,
        errors: [],
        event: value
      };

    } catch (error) {
      logger.error('Event validation error', {
        eventType,
        error: error.message
      });

      return {
        valid: false,
        errors: [{ message: error.message }],
        event: null
      };
    }
  }

  /**
   * Generic validation for unknown event types
   */
  validateGeneric(event) {
    const genericSchema = Joi.object({
      type: Joi.string().required(),
      data: Joi.object().required(),
      metadata: Joi.object({
        timestamp: Joi.string().isoDate().required(),
        source: Joi.string().required(),
        correlationId: Joi.string().optional(),
        causationId: Joi.string().optional(),
        version: Joi.string().default('1.0.0')
      }).optional()
    });

    const { error, value } = genericSchema.validate(event, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return {
        valid: false,
        errors,
        event: null
      };
    }

    logger.debug('Generic event validation passed', { eventType: event.type });

    return {
      valid: true,
      errors: [],
      event: value
    };
  }

  /**
   * Get all registered schemas
   */
  getSchemas() {
    return Array.from(this.schemas.keys());
  }

  /**
   * Remove a schema
   */
  removeSchema(eventType) {
    const removed = this.schemas.delete(eventType);
    if (removed) {
      logger.info('Event schema removed', { eventType });
    }
    return removed;
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      status: 'healthy',
      schemasCount: this.schemas.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = EventValidator;
