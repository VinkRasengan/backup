const Joi = require('joi');

/**
 * Validation middleware for Link Service
 */

// URL validation schema
const urlSchema = Joi.string().uri({
  scheme: ['http', 'https']
}).required().messages({
  'string.uri': 'Must be a valid HTTP or HTTPS URL',
  'any.required': 'URL is required'
});

// Validation schemas
const schemas = {
  checkLink: Joi.object({
    url: urlSchema
  }),

  bulkCheck: Joi.object({
    urls: Joi.array()
      .items(urlSchema)
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'At least one URL is required',
        'array.max': 'Maximum 10 URLs allowed per bulk check',
        'any.required': 'URLs array is required'
      })
  }),

  securityAnalyze: Joi.object({
    url: urlSchema
  }),

  screenshot: Joi.object({
    url: urlSchema
  }),

  batchScreenshot: Joi.object({
    urls: Joi.array()
      .items(urlSchema)
      .min(1)
      .max(5)
      .required()
      .messages({
        'array.min': 'At least one URL is required',
        'array.max': 'Maximum 5 URLs allowed per batch screenshot',
        'any.required': 'URLs array is required'
      }),
    options: Joi.object({
      maxConcurrent: Joi.number().integer().min(1).max(3).optional().default(3),
      viewport: Joi.string().pattern(/^\d+x\d+$/).optional().default('1440x900'),
      format: Joi.string().valid('PNG', 'JPG', 'WEBP').optional().default('PNG'),
      fullpage: Joi.boolean().optional().default(false)
    }).optional()
  })
};

/**
 * Validation middleware factory
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Query parameter validation
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Query validation failed',
        code: 'QUERY_VALIDATION_ERROR',
        details: errors
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Parameter validation
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Parameter validation failed',
        code: 'PARAM_VALIDATION_ERROR',
        details: errors
      });
    }

    req.params = value;
    next();
  };
};

module.exports = {
  validateRequest,
  validateQuery,
  validateParams,
  schemas
};
