const express = require('express');
const promClient = require('prom-client');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables using standardized loader
const { setupEnvironment } = require('./utils/env-loader');

// Setup environment with validation
const requiredVars = [
  'NODE_ENV',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'JWT_SECRET'
];
const envResult = setupEnvironment('link-service', requiredVars, true);

// Import shared utilities
const logger = require('./utils/logger');
const { HealthCheck, commonChecks } = require('./utils/health-check');

// Import local modules
const linkRoutes = require('./routes/links');
const securityRoutes = require('./routes/security');
const firebaseConfig = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');

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

const PORT = process.env.PORT || 3002;
const SERVICE_NAME = 'link-service';

// Initialize logger
// Logger already initialized

// Initialize health check
const healthCheck = new HealthCheck(SERVICE_NAME);

// Add health checks
healthCheck.addCheck('database', commonChecks.memory);
healthCheck.addCheck('memory', commonChecks.memory(512)); // 512MB limit
healthCheck.addCheck('auth-service', commonChecks.uptime);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

// CORS configuration - more permissive for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      '${process.env.FRONTEND_URL || "http://localhost:3000"}',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8080'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-service-name', 'x-service-key'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Rate limiting - more restrictive for link checking
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (link checking is resource intensive)
  message: {
    error: 'Too many link check requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
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

// Logging middleware
app.use(logger.requestLogger());

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
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
    },
    externalAPIs: {
      virusTotal: !!process.env.VIRUSTOTAL_API_KEY,
      scamAdviser: !!process.env.SCAMADVISER_API_KEY,
      screenshotLayer: !!process.env.SCREENSHOTLAYER_API_KEY,
      geminiAI: !!process.env.GEMINI_API_KEY
    }
  });
});

// API versioned info endpoint
app.get('/api/v1/links/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      connected: !!firebaseConfig.db
    },
    externalAPIs: {
      virusTotal: !!process.env.VIRUSTOTAL_API_KEY,
      scamAdviser: !!process.env.SCAMADVISER_API_KEY,
      screenshotLayer: !!process.env.SCREENSHOTLAYER_API_KEY,
      geminiAI: !!process.env.GEMINI_API_KEY
    }
  });
});

// API routes
app.use('/links', linkRoutes);
app.use('/security', securityRoutes);

// 404 handler for API routes
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
    service: 'link-service'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server (skip in test environment)
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`ðŸš€ Link Service started on port ${PORT}`, {
      service: SERVICE_NAME,
      port: PORT,
      environment: process.env.NODE_ENV,
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'emulator'
      },
      externalAPIs: {
        virusTotal: !!process.env.VIRUSTOTAL_API_KEY,
        scamAdviser: !!process.env.SCAMADVISER_API_KEY,
        screenshotLayer: !!process.env.SCREENSHOTLAYER_API_KEY
      }
    });
  });
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

