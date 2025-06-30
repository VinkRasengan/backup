const Joi = require('joi');
const { Logger } = require('@factcheck/shared');

const logger = new Logger('community-service');

// Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
};

// Sanitize object recursively
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Validation schemas
const schemas = {
  // Post creation validation
  createPost: Joi.object({
    title: Joi.string().min(3).max(200).required().messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
    content: Joi.string().min(10).max(5000).required().messages({
      'string.min': 'Content must be at least 10 characters long',
      'string.max': 'Content cannot exceed 5000 characters',
      'any.required': 'Content is required'
    }),
    category: Joi.string().valid('general', 'scam', 'phishing', 'malware', 'fraud', 'other').default('general'),
    url: Joi.string().uri().optional().allow('', null),
    tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
    // Image fields for frontend compatibility
    imageUrl: Joi.string().uri().optional().allow('', null),
    screenshot: Joi.string().uri().optional().allow('', null),
    images: Joi.array().items(Joi.string().uri()).max(10).optional().default([]),
    urlToImage: Joi.string().uri().optional().allow('', null), // For news articles
    thumbnailUrl: Joi.string().uri().optional().allow('', null)
  }),

  // Comment creation validation
  createComment: Joi.object({
    linkId: Joi.string().required().messages({
      'any.required': 'Link ID is required'
    }),
    content: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment cannot exceed 1000 characters',
      'any.required': 'Comment content is required'
    }),
    parentId: Joi.string().optional().allow('', null),
    userId: Joi.string().optional().allow('', null),
    userEmail: Joi.string().email().optional().allow('', null),
    displayName: Joi.string().max(100).optional().allow('', null)
  }),

  // Vote validation
  vote: Joi.object({
    voteType: Joi.string().valid('upvote', 'downvote').required().messages({
      'any.only': 'Vote type must be either "upvote" or "downvote"',
      'any.required': 'Vote type is required'
    })
  }),

  // Report validation
  report: Joi.object({
    reason: Joi.string().valid('spam', 'harassment', 'inappropriate', 'misinformation', 'other').required(),
    description: Joi.string().max(500).optional().allow(''),
    category: Joi.string().valid('content', 'user', 'technical').default('content')
  }),

  // Query parameters validation
  queryParams: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().valid('newest', 'oldest', 'trending', 'popular').default('newest'),
    category: Joi.string().valid('all', 'general', 'scam', 'phishing', 'malware', 'fraud', 'other').default('all'),
    search: Joi.string().max(100).optional().allow(''),
    includeNews: Joi.string().valid('true', 'false').default('true'),
    userPostsOnly: Joi.string().valid('true', 'false').default('false')
  })
};

// Generic validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // Get data from specified source
      let data;
      switch (source) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        default:
          data = req.body;
      }

      // Sanitize input data
      const sanitizedData = sanitizeObject(data);

      // Validate against schema
      const { error, value } = schema.validate(sanitizedData, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          // Don't expose the actual value for security
          type: detail.type
        }));

        logger.warn('Validation failed', {
          source,
          errors,
          path: req.path,
          method: req.method
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }

      // Replace original data with validated and sanitized data
      switch (source) {
        case 'body':
          req.body = value;
          break;
        case 'query':
          req.query = value;
          break;
        case 'params':
          req.params = value;
          break;
      }

      next();
    } catch (validationError) {
      logger.error('Validation middleware error', {
        error: validationError.message,
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
};

// Specific validation middlewares
const validateCreatePost = validate(schemas.createPost, 'body');
const validateCreateComment = validate(schemas.createComment, 'body');
const validateVote = validate(schemas.vote, 'body');
const validateReport = validate(schemas.report, 'body');
const validateQueryParams = validate(schemas.queryParams, 'query');

// Rate limiting validation (check for suspicious patterns)
const validateRateLimit = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  const ip = req.ip || req.connection.remoteAddress;

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    userAgent && pattern.test(userAgent)
  );

  if (isSuspicious) {
    logger.warn('Suspicious user agent detected', {
      userAgent,
      ip,
      path: req.path
    });

    // Don't block, but log for monitoring
    req.suspicious = true;
  }

  next();
};

// Content security validation
const validateContent = (req, res, next) => {
  const { body } = req;

  // Check for potentially malicious content
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i
  ];

  const checkContent = (text) => {
    if (typeof text !== 'string') return false;
    return maliciousPatterns.some(pattern => pattern.test(text));
  };

  // Check all string fields in body
  const hasMaliciousContent = Object.values(body).some(value => {
    if (typeof value === 'string') {
      return checkContent(value);
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(nestedValue => 
        typeof nestedValue === 'string' && checkContent(nestedValue)
      );
    }
    return false;
  });

  if (hasMaliciousContent) {
    logger.warn('Malicious content detected', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });

    return res.status(400).json({
      success: false,
      error: 'Content contains potentially malicious code',
      code: 'MALICIOUS_CONTENT_DETECTED'
    });
  }

  next();
};

module.exports = {
  validate,
  validateCreatePost,
  validateCreateComment,
  validateVote,
  validateReport,
  validateQueryParams,
  validateRateLimit,
  validateContent,
  sanitizeInput,
  sanitizeObject,
  schemas
};
