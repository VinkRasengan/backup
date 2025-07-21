/**
 * Error handling middleware for Chat Service
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
  } else if (error.message) {
    // Custom application errors
    errorResponse.error = error.message;
    errorResponse.code = error.code || 'APPLICATION_ERROR';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.error = 'Internal server error';
    errorResponse.code = 'INTERNAL_ERROR';
    delete errorResponse.details;
  } else if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
