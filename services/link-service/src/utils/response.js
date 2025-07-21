/**
 * Standardized API Response Utility for link-service
 * Ensures consistent response format across the microservice
 */

const logger = require('./logger');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

class ResponseFormatter {
  constructor(serviceName = 'link-service') {
    this.serviceName = serviceName;
  }

  // Success response
  success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      service: this.serviceName
    };

    logger.info('API Success Response', {
      statusCode,
      message,
      hasData: !!data
    });

    return res.status(statusCode).json(response);
  }

  // Error response
  error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
    const response = {
      success: false,
      message,
      error: details,
      timestamp: new Date().toISOString(),
      service: this.serviceName
    };

    logger.error('API Error Response', {
      statusCode,
      message,
      details
    });

    return res.status(statusCode).json(response);
  }

  // Validation error response
  validationError(res, errors, message = 'Validation failed') {
    return this.error(res, message, 400, { validationErrors: errors });
  }

  // Not found response
  notFound(res, resource = 'Resource', message = null) {
    const defaultMessage = `${resource} not found`;
    return this.error(res, message || defaultMessage, 404);
  }

  // Unauthorized response
  unauthorized(res, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  // Forbidden response
  forbidden(res, message = 'Access forbidden') {
    return this.error(res, message, 403);
  }

  // Conflict response
  conflict(res, message = 'Resource conflict', details = null) {
    return this.error(res, message, 409, details);
  }

  // Too many requests response
  tooManyRequests(res, message = 'Too many requests') {
    return this.error(res, message, 429);
  }

  // Express middleware for error handling
  errorHandler() {
    return (error, req, res, next) => {
      // Log the error
      logger.error('Unhandled API Error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      // Handle specific error types
      if (error.name === 'ValidationError') {
        return this.validationError(res, error.details);
      }

      if (error.name === 'UnauthorizedError') {
        return this.unauthorized(res, error.message);
      }

      if (error.name === 'CastError') {
        return this.error(res, 'Invalid ID format', 400);
      }

      // Default error response
      return this.error(res, 'Internal Server Error', 500, 
        process.env.NODE_ENV === 'development' ? error.stack : null
      );
    };
  }
}

module.exports = ResponseFormatter;