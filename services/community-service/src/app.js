const express = require('express');
const promClient = require('prom-client');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables using standardized loader
const { quickSetup } = require('../../config/env-loader');

// Setup environment with validation
const envResult = quickSetup('community-service');

// Import local utilities
const logger = require('./utils/logger');
const { HealthCheck, commonChecks } = require('./utils/health-check');

// Import local modules
const linksRoutes = require('./routes/links');
const commentsRoutes = require('./routes/comments');
const votesRoutes = require('./routes/votes');
const reportsRoutes = require('./routes/reports');
const statsRoutes = require('./routes/stats');
const firebaseConfig = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');
const { cacheManager } = require('./utils/cache');
const ResponseFormatter = require('./utils/response');

// Import Event Sourcing components
const CommunityEventHandler = require('./events/communityEventHandler');
const CQRSBus = require('./cqrs/cqrsBus');

const app = express();
// Prometheus metrics setup
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route']
});

const PORT = process.env.PORT || 3003; // eslint-disable-line no-process-env
const SERVICE_NAME = 'community-service';

// Initialize logger
// Logger already initialized

// Initialize health check
const healthCheck = new HealthCheck(SERVICE_NAME);

// Add health checks
healthCheck.addCheck('database', async () => {
  // Check Firebase connection
  try {
    await firebaseConfig.db.collection('_health').limit(1).get();
    return 'Database connection healthy';
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
});
healthCheck.addCheck('memory', commonChecks.memory);
healthCheck.addCheck('auth-service', commonChecks.uptime); // eslint-disable-line no-process-env
healthCheck.addCheck('cache', async () => {
  // Skip cache check in test environment
  if (process.env.NODE_ENV === 'test') {
    return 'Cache OK (test environment)';
  }

  const cacheHealth = await cacheManager.healthCheck();
  if (cacheHealth.overall === 'healthy' || cacheHealth.overall === 'degraded') {
    return `Cache ${cacheHealth.overall}`;
  } else {
    throw new Error(`Cache unhealthy: ${JSON.stringify(cacheHealth)}`);
  }
});

// Security middleware with enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\'', 'https:'],
      fontSrc: ['\'self\'', 'https:', 'data:'],
      objectSrc: ['\'none\''],
      mediaSrc: ['\'self\''],
      frameSrc: ['\'none\''],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for API service
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['${process.env.FRONTEND_URL || "http://localhost:3000"}', 'http://localhost:8080'], // eslint-disable-line no-process-env
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-service-name', 'x-service-key']
}));

// Rate limiting - Increased limits for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 500 : 2000, // Higher limit for dev // eslint-disable-line no-process-env
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for localhost in development
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') { // eslint-disable-line no-process-env
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    }
    return false;
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Response formatter middleware
// Response formatter middleware
const responseFormatter = new ResponseFormatter(SERVICE_NAME);
app.use(responseFormatter.errorHandler());
// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode
    });
    httpRequestDuration.observe({
      method: req.method,
      route: req.route ? req.route.path : req.path
    }, duration);
  });
  
  next();
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
app.use(authMiddleware);

// Logging middleware
app.use(logger.requestLogger());
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Health check endpoints

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await promClient.register.metrics();
    res.set('Content-Type', promClient.register.contentType);
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});
app.get('/health', healthCheck.middleware());
app.get('/health/live', healthCheck.middleware());
app.get('/health/ready', healthCheck.middleware());

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

// API versioned endpoint
app.get('/api/v1/community', (req, res) => {
  res.json({
    status: 'healthy',
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

// Event Sourcing health check endpoint
app.get('/health/event-sourcing', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {}
    };

    if (eventHandler) {
      health.components.eventBus = await eventHandler.healthCheck();
    } else {
      health.components.eventBus = { status: 'not_initialized' };
    }

    if (cqrsBus) {
      health.components.cqrs = await cqrsBus.healthCheck();
    } else {
      health.components.cqrs = { status: 'not_initialized' };
    }

    // Determine overall status based on component health
    const componentStatuses = Object.values(health.components).map(c => c.status);

    if (componentStatuses.includes('unhealthy')) {
      health.status = 'unhealthy';
    } else if (componentStatuses.includes('disabled') || componentStatuses.includes('not_initialized') || componentStatuses.includes('fallback')) {
      health.status = 'degraded';
    } else if (componentStatuses.every(status => status === 'healthy')) {
      health.status = 'healthy';
    } else {
      health.status = 'degraded';
    }

    // Add summary information
    health.summary = {
      totalComponents: componentStatuses.length,
      healthyComponents: componentStatuses.filter(s => s === 'healthy').length,
      degradedComponents: componentStatuses.filter(s => ['degraded', 'disabled', 'fallback'].includes(s)).length,
      unhealthyComponents: componentStatuses.filter(s => s === 'unhealthy').length
    };

    // Return appropriate HTTP status
    const httpStatus = health.status === 'unhealthy' ? 503 : 200;
    res.status(httpStatus).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// CQRS statistics endpoint
app.get('/stats/cqrs', (req, res) => {
  try {
    if (!cqrsBus) {
      return res.status(404).json({
        error: 'CQRS Bus not initialized',
        timestamp: new Date().toISOString()
      });
    }

    const stats = cqrsBus.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/links', linksRoutes);
app.use('/comments', commentsRoutes);
app.use('/votes', votesRoutes);
app.use('/reports', reportsRoutes);
app.use('/stats', statsRoutes);

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
// Error handler middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled API Error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    service: 'community-service'
  });
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    // Cleanup Event Sourcing components
    if (eventHandler) {
      await eventHandler.disconnect();
      logger.info('Event Handler disconnected');
    }

    // Cleanup cache manager
    if (cacheManager) {
      await cacheManager.disconnect();
      logger.info('Cache Manager disconnected');
    }

    // Close server
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Initialize Event Sourcing components
let eventHandler;
let cqrsBus;

async function initializeEventSourcing() {
  try {
    logger.info('Initializing Event Sourcing components...');

    // Initialize Event Handler
    eventHandler = new CommunityEventHandler();

    // Initialize CQRS Bus
    cqrsBus = new CQRSBus(eventHandler.eventBus, firebaseConfig.db, cacheManager);

    // Make CQRS Bus available globally for routes
    app.locals.cqrsBus = cqrsBus;
    app.locals.eventHandler = eventHandler;

    logger.info('✅ Event Sourcing components initialized successfully');

    // Health check for Event Sourcing
    const eventBusHealth = await eventHandler.healthCheck();
    const cqrsHealth = await cqrsBus.healthCheck();

    logger.info('Event Sourcing health check', {
      eventBus: eventBusHealth.status,
      cqrs: cqrsHealth.status,
      eventStore: eventBusHealth.eventStore?.status
    });

  } catch (error) {
    logger.error('Failed to initialize Event Sourcing components', {
      error: error.message,
      stack: error.stack
    });
    logger.info('Service will continue without Event Sourcing features');
  }
}

// Initialize cache manager (non-blocking)
cacheManager.connect().catch(error => {
  logger.error('Failed to initialize cache manager', { error: error.message });
  logger.info('Service will continue with memory cache only');
});

// Initialize Event Sourcing (non-blocking)
initializeEventSourcing();

// Start server (skip in test environment)
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`ðŸš€ Community Service started on port ${PORT}`, {
      service: SERVICE_NAME,
      port: PORT,
      environment: process.env.NODE_ENV
    });
  });
}

// Set server timeout to handle long-running requests (only if server exists)
if (server) {
  server.timeout = 60000; // 60 seconds
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  if (server && server.close) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

module.exports = app;

