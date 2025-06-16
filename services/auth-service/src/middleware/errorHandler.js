/**
 * Error handling middleware for Auth Service
 */

const Logger = require('../../shared/utils/logger');
const logger = new Logger('auth-service');

const errorHandler = (error, req, res, next) => {
  // Log the error
  logger.logError(error, req);

  // Default error response
  let statusCode = error.status || error.statusCode || 500;
  let errorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.details || error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = {
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };
  } else if (error.code && error.code.startsWith('auth/')) {
    // Firebase Auth errors
    statusCode = 401;
    errorResponse = {
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
      details: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };
  } else if (error.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorResponse = {
      error: 'Service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };
  } else if (error.message) {
    // Custom application errors
    errorResponse.error = error.message;
    errorResponse.code = error.code || 'APPLICATION_ERROR';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.error = 'Internal server error';
    errorResponse.code = 'INTERNAL_ERROR';
    // Remove any sensitive details
    delete errorResponse.details;
  } else if (process.env.NODE_ENV === 'development') {
    // Include stack trace in development
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
