const winston = require('winston');

class Logger {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: serviceName },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error'
      }));
      this.logger.add(new winston.transports.File({
        filename: `logs/${serviceName}.log`
      }));
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, { ...meta, service: this.serviceName });
  }

  error(message, meta = {}) {
    this.logger.error(message, { ...meta, service: this.serviceName });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { ...meta, service: this.serviceName });
  }

  debug(message, meta = {}) {
    this.logger.debug(message, { ...meta, service: this.serviceName });
  }

  withCorrelationId(correlationId) {
    return {
      info: (message, meta = {}) => this.info(message, { ...meta, correlationId }),
      error: (message, meta = {}) => this.error(message, { ...meta, correlationId }),
      warn: (message, meta = {}) => this.warn(message, { ...meta, correlationId }),
      debug: (message, meta = {}) => this.debug(message, { ...meta, correlationId })
    };
  }

  logRequest(req, res, next) {
    // Generate correlation ID
    req.correlationId = req.headers['x-correlation-id'] || 
                       `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', req.correlationId);

    this.info('Request received', {
      method: req.method,
      url: req.url,
      correlationId: req.correlationId,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });

    next();
  }

  logError(error, req) {
    this.error('Request error', {
      error: error.message,
      stack: error.stack,
      correlationId: req?.correlationId,
      method: req?.method,
      url: req?.url
    });
  }

  errorHandler() {
    return (error, req, res, next) => {
      this.logError(error, req);
      next(error);
    };
  }
}

module.exports = Logger;
