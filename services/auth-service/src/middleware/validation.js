const joi = require('joi');

/**
 * Validation middleware for Auth Service
 */

// Validation schemas
const schemas = {
  register: joi.object({
    idToken: joi.string().required().messages({
      'string.empty': 'Firebase ID token is required',
      'any.required': 'Firebase ID token is required'
    }),
    firstName: joi.string().min(1).max(50).optional().messages({
      'string.min': 'First name must be at least 1 character',
      'string.max': 'First name must not exceed 50 characters'
    }),
    lastName: joi.string().min(1).max(50).optional().messages({
      'string.min': 'Last name must be at least 1 character',
      'string.max': 'Last name must not exceed 50 characters'
    })
  }),

  login: joi.object({
    idToken: joi.string().required().messages({
      'string.empty': 'Firebase ID token is required',
      'any.required': 'Firebase ID token is required'
    })
  }),

  refreshToken: joi.object({
    idToken: joi.string().required().messages({
      'string.empty': 'Firebase ID token is required',
      'any.required': 'Firebase ID token is required'
    })
  }),

  verifyToken: joi.object({
    token: joi.string().required().messages({
      'string.empty': 'JWT token is required',
      'any.required': 'JWT token is required'
    })
  }),

  updateProfile: joi.object({
    firstName: joi.string().min(1).max(50).optional().messages({
      'string.min': 'First name must be at least 1 character',
      'string.max': 'First name must not exceed 50 characters'
    }),
    lastName: joi.string().min(1).max(50).optional().messages({
      'string.min': 'Last name must be at least 1 character',
      'string.max': 'Last name must not exceed 50 characters'
    }),
    bio: joi.string().max(500).optional().allow('').messages({
      'string.max': 'Bio must not exceed 500 characters'
    }),
    avatar: joi.string().uri().optional().allow(null).messages({
      'string.uri': 'Avatar must be a valid URL'
    }),
    preferences: joi.object({
      notifications: joi.boolean().optional(),
      theme: joi.string().valid('light', 'dark').optional().messages({
        'any.only': 'Theme must be either "light" or "dark"'
      })
    }).optional()
  }),

  updateRoles: joi.object({
    roles: joi.array().items(
      joi.string().valid('user', 'admin', 'moderator')
    ).min(1).required().messages({
      'array.min': 'At least one role is required',
      'any.only': 'Invalid role. Valid roles are: user, admin, moderator',
      'any.required': 'Roles array is required'
    })
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
