const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const logger = require('./src/utils/logger');
const healthCheck = require('./src/utils/health-check');
const etlManager = require('./src/services/etlManager');
const pipelineRoutes = require('./src/routes/pipelines');
const dataRoutes = require('./src/routes/data');
// Event Sourcing integration
let eventStoreClient = null;
if (process.env.EVENT_STORE_ENABLED === 'true') {
  try {
    const EventStoreClient = require('./src/utils/eventStoreClient');
    eventStoreClient = new EventStoreClient({
      serviceUrl: process.env.EVENT_BUS_SERVICE_URL || 'http://localhost:3007',
      serviceName: 'etl-service'
    });
    logger.info('Event Store client initialized for ETL service');
  } catch (error) {
    logger.warn('Event Store client not available, continuing without event sourcing', { error: error.message });
  }
}

const app = express();
const PORT = process.env.PORT || process.env.ETL_SERVICE_PORT || 3008;

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    service: 'etl-service',
    version: '1.0.0',
    description: 'ETL Service for Data Pipeline Management',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    features: {
      firestoreExtraction: true,
      hdfsLoading: process.env.HDFS_NAMENODE_URL ? true : false,
      scheduledPipelines: true,
      realTimeStreaming: process.env.ENABLE_EVENT_DRIVEN === 'true'
    },
    configuration: {
      batchSize: process.env.ETL_BATCH_SIZE || 1000,
      processingInterval: process.env.BATCH_PROCESSING_INTERVAL || '1h',
      hdfsPath: process.env.HDFS_DATA_PATH || '/factcheck/data'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/pipelines', pipelineRoutes);
app.use('/api/v1/data', dataRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FactCheck Platform - ETL Service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      info: '/info',
      pipelines: '/api/v1/pipelines',
      data: '/api/v1/data'
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

// Initialize ETL Manager
async function initializeService() {
  try {
    logger.info('Initializing ETL Service...');
    
    // Initialize ETL Manager
    await etlManager.initialize();
    
    // Setup scheduled pipelines
    setupScheduledPipelines();
    
    logger.info('ETL Service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize ETL Service:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Setup scheduled ETL pipelines
function setupScheduledPipelines() {
  const interval = process.env.BATCH_PROCESSING_INTERVAL || '0 */1 * * *'; // Every hour
  
  logger.info(`Setting up scheduled pipelines with interval: ${interval}`);
  
  // Schedule Firestore to HDFS sync
  cron.schedule(interval, async () => {
    try {
      logger.info('Starting scheduled ETL pipeline...');
      
      await etlManager.runPipeline({
        name: 'scheduled-firestore-sync',
        source: 'firestore',
        destination: 'hdfs',
        collections: ['links', 'posts', 'users', 'votes', 'comments'],
        incremental: true
      });
      
      logger.info('Scheduled ETL pipeline completed successfully');
    } catch (error) {
      logger.error('Scheduled ETL pipeline failed:', error);
    }
  });
  
  // Schedule analytics data preparation
  cron.schedule('0 2 * * *', async () => { // Daily at 2 AM
    try {
      logger.info('Starting daily analytics preparation...');
      
      await etlManager.runPipeline({
        name: 'daily-analytics-prep',
        source: 'hdfs',
        destination: 'spark',
        transformations: ['aggregate', 'clean', 'enrich'],
        schedule: 'daily'
      });
      
      logger.info('Daily analytics preparation completed');
    } catch (error) {
      logger.error('Daily analytics preparation failed:', error);
    }
  });
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 ETL Service started on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  
  await initializeService();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('ETL Service shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('ETL Service shut down complete');
    process.exit(0);
  });
});

module.exports = app;
