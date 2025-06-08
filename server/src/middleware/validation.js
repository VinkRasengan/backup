const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    console.log('🔍 Validation - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Validation - Request body keys:', Object.keys(req.body));

    const { error } = schema.validate(req.body);

    if (error) {
      const errorMessage = error.details[0].message;
      console.log('❌ Validation failed:', errorMessage);
      console.log('❌ Validation error details:', error.details);
      return res.status(400).json({
        error: 'Validation failed',
        message: errorMessage,
        code: 'VALIDATION_ERROR'
      });
    }

    console.log('✅ Validation passed');
    next();
  };
};

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'New password is required'
    })
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    avatar: Joi.string().uri().optional()
  }),

  checkLink: Joi.object({
    url: Joi.string()
      .required()
      .custom((value, helpers) => {
        // Normalize URL by adding protocol if missing
        let normalizedUrl = value.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
          normalizedUrl = 'https://' + normalizedUrl;
        }

        // Validate the normalized URL
        try {
          new URL(normalizedUrl);
          return normalizedUrl; // Return the normalized URL
        } catch (error) {
          return helpers.error('string.uri');
        }
      })
      .messages({
        'string.uri': 'Please provide a valid URL',
        'any.required': 'URL is required'
      })
  }),

  chatMessage: Joi.object({
    message: Joi.string().trim().min(1).max(1000).required().messages({
      'string.empty': 'Tin nhắn không được để trống',
      'string.min': 'Tin nhắn quá ngắn',
      'string.max': 'Tin nhắn quá dài (tối đa 1000 ký tự)',
      'any.required': 'Tin nhắn là bắt buộc'
    }),
    conversationId: Joi.string().optional().allow('').messages({
      'string.base': 'ID cuộc trò chuyện không hợp lệ'
    })
  }),

  widgetMessage: Joi.object({
    message: Joi.string().trim().min(1).max(1000).required().messages({
      'string.empty': 'Tin nhắn không được để trống',
      'string.min': 'Tin nhắn quá ngắn',
      'string.max': 'Tin nhắn quá dài (tối đa 1000 ký tự)',
      'any.required': 'Tin nhắn là bắt buộc'
    }),
    sessionId: Joi.string().optional().allow('').messages({
      'string.base': 'Session ID không hợp lệ'
    })
  }),

  submitVote: Joi.object({
    voteType: Joi.string().valid('safe', 'unsafe', 'suspicious').required().messages({
      'any.only': 'Vote type must be: safe, unsafe, or suspicious',
      'any.required': 'Vote type is required'
    })
  }),

  addComment: Joi.object({
    content: Joi.string().trim().min(1).max(1000).required().messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment is too short',
      'string.max': 'Comment must be less than 1000 characters',
      'any.required': 'Comment content is required'
    })
  }),

  updateComment: Joi.object({
    content: Joi.string().trim().min(1).max(1000).required().messages({
      'string.empty': 'Comment content is required',
      'string.min': 'Comment is too short',
      'string.max': 'Comment must be less than 1000 characters',
      'any.required': 'Comment content is required'
    })
  }),

  submitReport: Joi.object({
    reason: Joi.string().valid('fake_news', 'scam', 'malicious_content', 'spam', 'inappropriate', 'other').required().messages({
      'any.only': 'Invalid report reason',
      'any.required': 'Report reason is required'
    }),
    description: Joi.string().trim().min(1).max(500).required().messages({
      'string.empty': 'Report description is required',
      'string.min': 'Description is too short',
      'string.max': 'Description must be less than 500 characters',
      'any.required': 'Report description is required'
    })
  }),

  updateReportStatus: Joi.object({
    status: Joi.string().valid('pending', 'reviewed', 'resolved', 'dismissed').required().messages({
      'any.only': 'Invalid status',
      'any.required': 'Status is required'
    }),
    adminNotes: Joi.string().max(1000).optional().messages({
      'string.max': 'Admin notes must be less than 1000 characters'
    })
  }),

  updateUserRole: Joi.object({
    role: Joi.string().valid('user', 'admin').required().messages({
      'any.only': 'Role must be: user or admin',
      'any.required': 'Role is required'
    })
  }),

  submitToCommunity: Joi.object({
    url: Joi.string()
      .required()
      .custom((value, helpers) => {
        // Normalize URL by adding protocol if missing
        let normalizedUrl = value.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
          normalizedUrl = 'https://' + normalizedUrl;
        }

        // Validate the normalized URL
        try {
          new URL(normalizedUrl);
          return normalizedUrl; // Return the normalized URL
        } catch (error) {
          return helpers.error('string.uri');
        }
      })
      .messages({
        'string.uri': 'Please provide a valid URL',
        'any.required': 'URL is required'
      }),
    title: Joi.string().max(200).optional().allow('').messages({
      'string.max': 'Title cannot exceed 200 characters'
    }),
    description: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
    category: Joi.string().valid(
      'politics', 'health', 'technology', 'education', 'economy',
      'society', 'environment', 'sports', 'entertainment', 'other'
    ).required().messages({
      'any.only': 'Invalid category',
      'any.required': 'Category is required'
    }),
    checkResult: Joi.object().required().messages({
      'any.required': 'Check result is required'
    }),
    credibilityScore: Joi.number().min(0).max(100).optional(),
    securityScore: Joi.number().min(0).max(100).optional(),
    status: Joi.string().valid('safe', 'warning', 'dangerous').optional()
  })
};

// Specific validation middleware functions
const validateRegistration = validateRequest(schemas.register);
const validateLogin = validateRequest(schemas.login);
const validateForgotPassword = validateRequest(schemas.forgotPassword);
const validateResetPassword = validateRequest(schemas.resetPassword);
const validateProfileUpdate = validateRequest(schemas.updateProfile);
const validateLinkCheck = validateRequest(schemas.checkLink);
const validateChatMessage = validateRequest(schemas.chatMessage);
const validateWidgetMessage = validateRequest(schemas.widgetMessage);

// Pagination validation
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      error: 'Page must be a positive number',
      code: 'VALIDATION_ERROR'
    });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      error: 'Limit must be between 1 and 100',
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

module.exports = {
  validateRequest,
  schemas,
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate,
  validateLinkCheck,
  validateChatMessage,
  validateWidgetMessage,
  validatePagination
};
