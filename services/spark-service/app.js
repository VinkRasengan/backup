const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const logger = require('./src/utils/logger');
const healthCheck = require('./src/utils/health-check');
const sparkManager = require('./src/services/sparkManager');
const jobRoutes = require('./src/routes/jobs');
const analyticsRoutes = require('./src/routes/analytics');
const mlRoutes = require('./src/routes/ml');

const app = express();
const PORT = process.env.SPARK_SERVICE_PORT || 3010;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', healthCheck.middleware());

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'spark-service',
    version: '1.0.0',
    description: 'Spark Service for Big Data Processing & ML',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    features: {
      bigDataProcessing: process.env.ENABLE_BIG_DATA_PROCESSING === 'true',
      mlPipeline: process.env.ENABLE_ML_PIPELINE === 'true',
      batchAnalytics: process.env.ENABLE_BATCH_ANALYTICS === 'true'
    },
    spark: {
      masterUrl: process.env.SPARK_MASTER_URL,
      executorMemory: process.env.SPARK_EXECUTOR_MEMORY,
      driverMemory: process.env.SPARK_DRIVER_MEMORY
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ml', mlRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FactCheck Platform - Spark Service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      info: '/info',
      jobs: '/api/v1/jobs',
      analytics: '/api/v1/analytics',
      ml: '/api/v1/ml'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Initialize Spark Manager
async function initializeService() {
  try {
    logger.info('Initializing Spark Service...');
    
    // Initialize Spark Manager
    await sparkManager.initialize();
    
    logger.info('Spark Service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Spark Service:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 Spark Service started on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  
  await initializeService();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Spark Service shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Spark Service shut down complete');
    process.exit(0);
  });
});

module.exports = app;
