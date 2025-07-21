/**
 * Logger utility for auth-service
 * Standardized logging across the microservice
 */

const winston = require('winston');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

class Logger {
  constructor(serviceName = 'auth-service') {
    this.serviceName = serviceName;
    
    // Create winston logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            service: service || this.serviceName,
            message,
            ...meta
          });
        })
      ),
      defaultMeta: { service: this.serviceName },
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
        filename: `logs/${this.serviceName}-error.log`,
        level: 'error'
      }));
      this.logger.add(new winston.transports.File({
        filename: `logs/${this.serviceName}.log`
      }));
    }
  }

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

  // Correlation ID support
  withCorrelationId(correlationId) {
    return {
      info: (message, meta = {}) => this.info(message, { ...meta, correlationId }),
      error: (message, meta = {}) => this.error(message, { ...meta, correlationId }),
      warn: (message, meta = {}) => this.warn(message, { ...meta, correlationId }),
      debug: (message, meta = {}) => this.debug(message, { ...meta, correlationId })
    };
  }

  // Express middleware for request logging
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      
      next();
    };
  }
}

// Create logger instance for auth-service
const logger = new Logger('auth-service');

module.exports = logger;