/**
 * Standardized API Response Utility
 * Ensures consistent response format across all microservices
 */

const Logger = require('./logger');

class ResponseFormatter {
  constructor(serviceName = 'unknown') {
    this.serviceName = serviceName;
    this.logger = new Logger(serviceName);
  }

  /**
   * Success response format
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code (default: 200)
   * @param {Object} meta - Additional metadata (pagination, etc.)
   */
  success(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
    const response = {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        service: this.serviceName,
        ...meta
      }
    };

    // Log successful responses for monitoring
    this.logger.info('API Success Response', {
      statusCode,
      path: res.req?.path,
      method: res.req?.method,
      message
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Error response format
   * @param {Object} res - Express response object
   * @param {string} error - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} code - Error code
   * @param {*} details - Additional error details
   */
  error(res, error = 'Internal server error', statusCode = 500, code = null, details = null) {
    const response = {
      success: false,
      error,
      code: code || this.getDefaultErrorCode(statusCode),
      meta: {
        timestamp: new Date().toISOString(),
        service: this.serviceName,
        correlationId: res.req?.correlationId
      }
    };

    // Include details only in development or for client errors
    if (details && (process.env.NODE_ENV === 'development' || statusCode < 500)) {
      response.details = details;
    }

    // Log error responses
    this.logger.error('API Error Response', {
      statusCode,
      error,
      code: response.code,
      path: res.req?.path,
      method: res.req?.method,
      correlationId: res.req?.correlationId
    });

    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Array of validation errors
   * @param {string} message - Error message
   */
  validationError(res, errors = [], message = 'Validation failed') {
    return this.error(res, message, 400, 'VALIDATION_ERROR', { errors });
  }

  /**
   * Authentication error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  authError(res, message = 'Authentication required') {
    return this.error(res, message, 401, 'AUTHENTICATION_ERROR');
  }

  /**
   * Authorization error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  forbiddenError(res, message = 'Access forbidden') {
    return this.error(res, message, 403, 'AUTHORIZATION_ERROR');
  }

  /**
   * Not found error response
   * @param {Object} res - Express response object
   * @param {string} resource - Resource name
   */
  notFoundError(res, resource = 'Resource') {
    return this.error(res, `${resource} not found`, 404, 'NOT_FOUND');
  }

  /**
   * Conflict error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  conflictError(res, message = 'Resource conflict') {
    return this.error(res, message, 409, 'CONFLICT_ERROR');
  }

  /**
   * Rate limit error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} retryAfter - Retry after seconds
   */
  rateLimitError(res, message = 'Rate limit exceeded', retryAfter = null) {
    if (retryAfter) {
      res.set('Retry-After', retryAfter);
    }
    return this.error(res, message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }

  /**
   * Service unavailable error response
   * @param {Object} res - Express response object
   * @param {string} service - Service name
   */
  serviceUnavailableError(res, service = 'External service') {
    return this.error(res, `${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }

  /**
   * Paginated response format
   * @param {Object} res - Express response object
   * @param {Array} items - Array of items
   * @param {Object} pagination - Pagination info
   * @param {string} message - Success message
   */
  paginated(res, items = [], pagination = {}, message = 'Success') {
    const defaultPagination = {
      page: 1,
      limit: 20,
      total: items.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    };

    const paginationMeta = { ...defaultPagination, ...pagination };

    return this.success(res, items, message, 200, {
      pagination: paginationMeta
    });
  }

  /**
   * Created response format
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   */
  created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * Updated response format
   * @param {Object} res - Express response object
   * @param {*} data - Updated resource data
   * @param {string} message - Success message
   */
  updated(res, data = null, message = 'Resource updated successfully') {
    return this.success(res, data, message, 200);
  }

  /**
   * Deleted response format
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   */
  deleted(res, message = 'Resource deleted successfully') {
    return this.success(res, null, message, 200);
  }

  /**
   * No content response
   * @param {Object} res - Express response object
   */
  noContent(res) {
    return res.status(204).send();
  }

  /**
   * Get default error code based on status code
   * @param {number} statusCode - HTTP status code
   * @returns {string} Error code
   */
  getDefaultErrorCode(statusCode) {
    const codes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    };

    return codes[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Express middleware to attach response formatter to res object
   * @param {string} serviceName - Service name
   * @returns {Function} Express middleware
   */
  static middleware(serviceName) {
    return (req, res, next) => {
      res.formatter = new ResponseFormatter(serviceName);
      next();
    };
  }
}

// Export both class and convenience functions
module.exports = ResponseFormatter;

// Convenience functions for backward compatibility
module.exports.success = (res, data, message, statusCode, meta) => {
  const formatter = new ResponseFormatter();
  return formatter.success(res, data, message, statusCode, meta);
};

module.exports.error = (res, error, statusCode, code, details) => {
  const formatter = new ResponseFormatter();
  return formatter.error(res, error, statusCode, code, details);
};

module.exports.validationError = (res, errors, message) => {
  const formatter = new ResponseFormatter();
  return formatter.validationError(res, errors, message);
};

module.exports.authError = (res, message) => {
  const formatter = new ResponseFormatter();
  return formatter.authError(res, message);
};

module.exports.notFoundError = (res, resource) => {
  const formatter = new ResponseFormatter();
  return formatter.notFoundError(res, resource);
};

module.exports.paginated = (res, items, pagination, message) => {
  const formatter = new ResponseFormatter();
  return formatter.paginated(res, items, pagination, message);
};

module.exports.created = (res, data, message) => {
  const formatter = new ResponseFormatter();
  return formatter.created(res, data, message);
};

module.exports.updated = (res, data, message) => {
  const formatter = new ResponseFormatter();
  return formatter.updated(res, data, message);
};

module.exports.deleted = (res, message) => {
  const formatter = new ResponseFormatter();
  return formatter.deleted(res, message);
};
