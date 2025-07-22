/**
 * Event Store Validators
 * Validation middleware for Event Store API
 */

const Joi = require('joi');
const logger = require('../utils/logger');

// ==================== VALIDATION SCHEMAS ====================

const streamNameSchema = Joi.string()
  .min(1)
  .max(200)
  .pattern(/^[a-zA-Z0-9_\-\.]+$/)
  .required()
  .messages({
    'string.pattern.base': 'Stream name can only contain alphanumeric characters, hyphens, underscores, and dots',
    'string.min': 'Stream name must be at least 1 character long',
    'string.max': 'Stream name must be at most 200 characters long'
  });

const eventTypeSchema = Joi.string()
  .min(1)
  .max(100)
  .pattern(/^[a-zA-Z0-9_\-\.]+$/)
  .required()
  .messages({
    'string.pattern.base': 'Event type can only contain alphanumeric characters, hyphens, underscores, and dots',
    'string.min': 'Event type must be at least 1 character long',
    'string.max': 'Event type must be at most 100 characters long'
  });

const eventDataSchema = Joi.object({
  eventType: eventTypeSchema,
  eventData: Joi.object().required().messages({
    'object.base': 'Event data must be a valid object'
  }),
  metadata: Joi.object({
    correlationId: Joi.string().uuid().optional(),
    causationId: Joi.string().uuid().optional(),
    userId: Joi.string().optional(),
    source: Joi.string().optional(),
    version: Joi.string().optional(),
    aggregateId: Joi.string().optional(),
    aggregateType: Joi.string().optional()
  }).optional().default({})
}).required();

const snapshotDataSchema = Joi.object({
  state: Joi.object().required().messages({
    'object.base': 'Snapshot state must be a valid object'
  }),
  version: Joi.number().integer().min(0).required().messages({
    'number.base': 'Version must be a number',
    'number.integer': 'Version must be an integer',
    'number.min': 'Version must be non-negative'
  })
}).required();

// ==================== VALIDATION MIDDLEWARE ====================

/**
 * Validate stream name parameter
 */
function validateStreamName(req, res, next) {
  try {
    const { error, value } = streamNameSchema.validate(req.params.streamName);
    
    if (error) {
      logger.warn('Invalid stream name', {
        streamName: req.params.streamName,
        error: error.details[0].message,
        source: req.headers['x-service-name'] || 'unknown'
      });
      
      return res.status(400).json({
        success: false,
        error: `Invalid stream name: ${error.details[0].message}`,
        field: 'streamName'
      });
    }
    
    req.params.streamName = value;
    next();
    
  } catch (error) {
    logger.error('Error validating stream name', {
      error: error.message,
      streamName: req.params.streamName
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal validation error'
    });
  }
}

/**
 * Validate event data in request body
 */
function validateEventData(req, res, next) {
  try {
    const { error, value } = eventDataSchema.validate(req.body);
    
    if (error) {
      logger.warn('Invalid event data', {
        error: error.details[0].message,
        source: req.headers['x-service-name'] || 'unknown',
        eventType: req.body.eventType
      });
      
      return res.status(400).json({
        success: false,
        error: `Invalid event data: ${error.details[0].message}`,
        field: error.details[0].path.join('.')
      });
    }
    
    req.body = value;
    next();
    
  } catch (error) {
    logger.error('Error validating event data', {
      error: error.message,
      eventType: req.body?.eventType
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal validation error'
    });
  }
}

/**
 * Validate snapshot data in request body
 */
function validateSnapshotData(req, res, next) {
  try {
    const { error, value } = snapshotDataSchema.validate(req.body);
    
    if (error) {
      logger.warn('Invalid snapshot data', {
        error: error.details[0].message,
        source: req.headers['x-service-name'] || 'unknown',
        aggregateType: req.params.aggregateType,
        aggregateId: req.params.aggregateId
      });
      
      return res.status(400).json({
        success: false,
        error: `Invalid snapshot data: ${error.details[0].message}`,
        field: error.details[0].path.join('.')
      });
    }
    
    req.body = value;
    next();
    
  } catch (error) {
    logger.error('Error validating snapshot data', {
      error: error.message,
      aggregateType: req.params?.aggregateType,
      aggregateId: req.params?.aggregateId
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal validation error'
    });
  }
}

/**
 * Validate aggregate parameters
 */
function validateAggregateParams(req, res, next) {
  try {
    const aggregateTypeSchema = Joi.string()
      .min(1)
      .max(50)
      .pattern(/^[a-zA-Z0-9_\-]+$/)
      .required();
      
    const aggregateIdSchema = Joi.string()
      .min(1)
      .max(100)
      .required();

    const { error: typeError } = aggregateTypeSchema.validate(req.params.aggregateType);
    if (typeError) {
      return res.status(400).json({
        success: false,
        error: `Invalid aggregate type: ${typeError.details[0].message}`,
        field: 'aggregateType'
      });
    }

    const { error: idError } = aggregateIdSchema.validate(req.params.aggregateId);
    if (idError) {
      return res.status(400).json({
        success: false,
        error: `Invalid aggregate ID: ${idError.details[0].message}`,
        field: 'aggregateId'
      });
    }
    
    next();
    
  } catch (error) {
    logger.error('Error validating aggregate parameters', {
      error: error.message,
      aggregateType: req.params?.aggregateType,
      aggregateId: req.params?.aggregateId
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal validation error'
    });
  }
}

/**
 * Validate query parameters for reading events
 */
function validateReadQuery(req, res, next) {
  try {
    const querySchema = Joi.object({
      fromRevision: Joi.alternatives()
        .try(
          Joi.string().valid('start', 'end'),
          Joi.number().integer().min(0)
        )
        .default('start'),
      direction: Joi.string().valid('forwards', 'backwards').default('forwards'),
      maxCount: Joi.number().integer().min(1).max(1000).default(100),
      includeMetadata: Joi.string().valid('true', 'false').default('true'),
      streamPrefix: Joi.string().optional()
    });

    const { error, value } = querySchema.validate(req.query);
    
    if (error) {
      logger.warn('Invalid query parameters', {
        error: error.details[0].message,
        source: req.headers['x-service-name'] || 'unknown'
      });
      
      return res.status(400).json({
        success: false,
        error: `Invalid query parameters: ${error.details[0].message}`,
        field: error.details[0].path.join('.')
      });
    }
    
    req.query = value;
    next();
    
  } catch (error) {
    logger.error('Error validating query parameters', {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal validation error'
    });
  }
}

/**
 * Validate service authentication headers
 */
function validateServiceAuth(req, res, next) {
  try {
    const serviceName = req.headers['x-service-name'];
    const serviceToken = req.headers['x-service-token'];
    
    if (!serviceName) {
      return res.status(401).json({
        success: false,
        error: 'Missing service name header (x-service-name)'
      });
    }
    
    // In production, validate service token
    if (process.env.NODE_ENV === 'production' && !serviceToken) {
      return res.status(401).json({
        success: false,
        error: 'Missing service token header (x-service-token)'
      });
    }
    
    // Add service info to request
    req.serviceInfo = {
      name: serviceName,
      token: serviceToken
    };
    
    next();
    
  } catch (error) {
    logger.error('Error validating service authentication', {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal authentication error'
    });
  }
}

// ==================== EXPORTS ====================

module.exports = {
  validateStreamName,
  validateEventData,
  validateSnapshotData,
  validateAggregateParams,
  validateReadQuery,
  validateServiceAuth,
  
  // Export schemas for testing
  schemas: {
    streamNameSchema,
    eventTypeSchema,
    eventDataSchema,
    snapshotDataSchema
  }
};
