const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import shared utilities
const Logger = require('/app/shared/utils/logger');
const { HealthCheck, commonChecks } = require('/app/shared/utils/health-check');

// Import local modules
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');
const votesRoutes = require('./routes/votes');
const reportsRoutes = require('./routes/reports');
const firebaseConfig = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'community-service';

// Initialize logger
const logger = new Logger(SERVICE_NAME);

// Initialize health check
const healthCheck = new HealthCheck(SERVICE_NAME);

// Add health checks
healthCheck.addCheck('database', commonChecks.database(firebaseConfig.db));
healthCheck.addCheck('memory', commonChecks.memory(512));
healthCheck.addCheck('auth-service', commonChecks.externalService('auth-service', process.env.AUTH_SERVICE_URL + '/health/live'));

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-service-name', 'x-service-key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(logger.logRequest.bind(logger));
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Health check endpoints
app.get('/health', healthCheck.middleware());
app.get('/health/live', healthCheck.liveness());
app.get('/health/ready', healthCheck.readiness());

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      connected: !!firebaseConfig.db
    }
  });
});

// API routes
app.use('/posts', postsRoutes);
app.use('/comments', commentsRoutes);
app.use('/votes', votesRoutes);
app.use('/reports', reportsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND',
    service: SERVICE_NAME,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);
app.use(logger.errorHandler());

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Community Service started on port ${PORT}`, {
    service: SERVICE_NAME,
    port: PORT,
    environment: process.env.NODE_ENV
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
