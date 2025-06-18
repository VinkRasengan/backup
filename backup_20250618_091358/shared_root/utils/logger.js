const winston = require('winston');

/**
 * Shared logger configuration for microservices
 * Provides structured logging with correlation IDs
 */

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName || process.env.SERVICE_NAME || 'unknown-service';
    this.logger = this.createLogger();
  }

  createLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, correlationId, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          service: service || this.serviceName,
          correlationId,
          message,
          ...meta
        });
      })
    );

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: {
        service: this.serviceName
      },
      transports: [
        new winston.transports.Console({
          format: process.env.NODE_ENV === 'development' 
            ? winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
              )
            : logFormat
        })
      ]
    });
  }

  /**
   * Add correlation ID to logs
   */
  withCorrelationId(correlationId) {
    return {
      info: (message, meta = {}) => this.logger.info(message, { correlationId, ...meta }),
      error: (message, meta = {}) => this.logger.error(message, { correlationId, ...meta }),
      warn: (message, meta = {}) => this.logger.warn(message, { correlationId, ...meta }),
      debug: (message, meta = {}) => this.logger.debug(message, { correlationId, ...meta })
    };
  }

  /**
   * Log HTTP requests
   */
  logRequest(req, res, next) {
    const correlationId = req.headers['x-correlation-id'] || this.generateCorrelationId();
    req.correlationId = correlationId;
    
    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);

    const startTime = Date.now();
    
    this.logger.info('HTTP Request', {
      correlationId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.userId
    });

    // Log response
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      this.logger.info('HTTP Response', {
        correlationId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.userId
      });
    });

    next();
  }

  /**
   * Log errors with context
   */
  logError(error, req = null) {
    const correlationId = req?.correlationId || this.generateCorrelationId();
    
    this.logger.error('Application Error', {
      correlationId,
      error: error.message,
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      userId: req?.user?.userId
    });
  }

  /**
   * Log business events
   */
  logEvent(eventName, data = {}, correlationId = null) {
    this.logger.info('Business Event', {
      correlationId: correlationId || this.generateCorrelationId(),
      event: eventName,
      ...data
    });
  }

  /**
   * Log performance metrics
   */
  logMetric(metricName, value, unit = 'count', tags = {}) {
    this.logger.info('Metric', {
      metric: metricName,
      value,
      unit,
      tags,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate correlation ID
   */
  generateCorrelationId() {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Express error handler middleware
   */
  errorHandler() {
    return (error, req, res, next) => {
      this.logError(error, req);

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        error: isDevelopment ? error.message : 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        correlationId: req.correlationId,
        ...(isDevelopment && { stack: error.stack })
      });
    };
  }

  // Direct logging methods
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
}

module.exports = Logger;
