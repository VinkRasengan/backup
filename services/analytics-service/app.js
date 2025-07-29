const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const logger = require('./src/utils/logger');
const healthCheck = require('./src/utils/health-check');
const analyticsManager = require('./src/services/analyticsManager');
const dashboardRoutes = require('./src/routes/dashboard');
const insightsRoutes = require('./src/routes/insights');
const reportsRoutes = require('./src/routes/reports');

const app = express();
const PORT = process.env.ANALYTICS_SERVICE_PORT || 3012;

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
    service: 'analytics-service',
    version: '1.0.0',
    description: 'Analytics Service for Data Insights & Reporting',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    features: {
      dashboard: process.env.ENABLE_DASHBOARD === 'true',
      insights: process.env.ENABLE_INSIGHTS === 'true',
      reports: process.env.ENABLE_REPORTS === 'true'
    },
    analytics: {
      dataSource: process.env.ANALYTICS_DATA_SOURCE || 'firestore',
      cacheEnabled: process.env.ENABLE_CACHE === 'true',
      realTimeUpdates: process.env.ENABLE_REALTIME === 'true'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/insights', insightsRoutes);
app.use('/api/v1/reports', reportsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'FactCheck Platform - Analytics Service',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      info: '/info',
      dashboard: '/api/v1/dashboard',
      insights: '/api/v1/insights',
      reports: '/api/v1/reports'
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

// Initialize Analytics Manager
async function initializeService() {
  try {
    logger.info('Initializing Analytics Service...');
    
    // Initialize Analytics Manager
    await analyticsManager.initialize();
    
    logger.info('Analytics Service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Analytics Service:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 Analytics Service started on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  
  await initializeService();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Analytics Service shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Analytics Service shut down complete');
    process.exit(0);
  });
});

module.exports = app; 