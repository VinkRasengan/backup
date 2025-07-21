/**
 * Error handling middleware for Link Service
 */

const logger = require('../utils/logger');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });
// Logger already initialized

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
  } else if (error.code === 'INVALID_URL') {
    statusCode = 400;
    errorResponse = {
      error: 'Invalid URL format',
      code: 'INVALID_URL',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    statusCode = 503;
    errorResponse = {
      error: 'External service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    };
  } else if (error.code === 'ETIMEDOUT') {
    statusCode = 504;
    errorResponse = {
      error: 'Request timeout',
      code: 'TIMEOUT',
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
