const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs-extra');
const logsDir = path.join(__dirname, '../../logs');
fs.ensureDirSync(logsDir);

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'spark-service' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Add custom methods for job logging
logger.logJobStart = (jobId, jobType, params) => {
  logger.info('Job started', { jobId, jobType, params });
};

logger.logJobComplete = (jobId, jobType, duration, result) => {
  logger.info('Job completed', { jobId, jobType, duration, result });
};

logger.logJobError = (jobId, jobType, error, params) => {
  logger.error('Job failed', { jobId, jobType, error: error.message, params });
};

module.exports = logger;
