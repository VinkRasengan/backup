/**
 * Standardized API Response Formatter
 * Provides consistent response format across all services
 */

const Logger = require('./logger');

class ResponseFormatter {
  constructor(serviceName) {
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
      path: res.req?.path,
      method: res.req?.method,
      error,
      code,
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
    const response = {
      success: false,
      error: message,
      code: 'VALIDATION_ERROR',
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        service: this.serviceName,
        correlationId: res.req?.correlationId
      }
    };

    this.logger.warn('Validation Error', {
      path: res.req?.path,
      method: res.req?.method,
      errors,
      correlationId: res.req?.correlationId
    });

    return res.status(400).json(response);
  }

  /**
   * Paginated response format
   * @param {Array} data - Array of data items
   * @param {Object} pagination - Pagination metadata
   * @param {string} message - Success message
   */
  paginated(data = [], pagination = {}, message = 'Data retrieved successfully') {
    const response = {
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || data.length,
        totalPages: pagination.totalPages || Math.ceil((pagination.total || data.length) / (pagination.limit || 10)),
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false,
        ...pagination
      },
      meta: {
        timestamp: new Date().toISOString(),
        service: this.serviceName
      }
    };

    this.logger.info('Paginated Response', {
      count: data.length,
      page: pagination.page,
      total: pagination.total
    });

    return response;
  }

  /**
   * Created resource response
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   */
  created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response
   * @param {Object} res - Express response object
   * @param {string} message - Success message
   */
  noContent(res, message = 'Operation completed successfully') {
    this.logger.info('No Content Response', {
      path: res.req?.path,
      method: res.req?.method,
      message
    });

    return res.status(204).send();
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {string} resource - Resource type
   */
  notFound(res, message = 'Resource not found', resource = 'Resource') {
    return this.error(res, message, 404, 'NOT_FOUND', { resource });
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, 403, 'FORBIDDEN');
  }

  /**
   * Conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  conflict(res, message = 'Resource conflict') {
    return this.error(res, message, 409, 'CONFLICT');
  }

  /**
   * Rate limit exceeded response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   */
  rateLimitExceeded(res, message = 'Rate limit exceeded') {
    return this.error(res, message, 429, 'RATE_LIMIT_EXCEEDED');
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
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    };

    return codes[statusCode] || 'UNKNOWN_ERROR';
  }

  /**
   * Express middleware to attach formatter to response object
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

module.exports = ResponseFormatter;
