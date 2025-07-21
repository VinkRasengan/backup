const winston = require('winston');
const path = require('path');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// Create logger configuration
const createLogger = () => {
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  );

  const transports = [
    // Console transport
    new winston.transports.Console({
      format: logFormat
    })
  ];

  // File transport for production
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }),
      new winston.transports.File({
        filename: path.join(__dirname, '../../logs/combined.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: logLevels,
    transports
  });
};

const logger = createLogger();

// Add structured logging methods
logger.logJobStart = (jobId, jobType, params = {}) => {
  logger.info('Spark job started', {
    jobId,
    jobType,
    params,
    timestamp: new Date().toISOString()
  });
};

logger.logJobComplete = (jobId, jobType, duration, results = {}) => {
  logger.info('Spark job completed', {
    jobId,
    jobType,
    duration,
    results,
    timestamp: new Date().toISOString()
  });
};

logger.logJobError = (jobId, jobType, error, params = {}) => {
  logger.error('Spark job failed', {
    jobId,
    jobType,
    error: error.message,
    stack: error.stack,
    params,
    timestamp: new Date().toISOString()
  });
};

logger.logDataProcessing = (operation, recordCount, duration) => {
  logger.info('Data processing completed', {
    operation,
    recordCount,
    duration,
    timestamp: new Date().toISOString()
  });
};

module.exports = logger;
