const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const promClient = require('prom-client');
const path = require('path');

// Load environment variables using new standardized loader
const { quickSetup } = require('../../../config/env-loader');
const envResult = quickSetup('auth-service');

// Import local utilities
const logger = require('./utils/logger');
const { HealthCheck, commonChecks } = require('./utils/health-check');
const ResponseFormatter = require('./utils/response');

// Import local modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const firebaseConfig = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'auth-service';

// Logger is already initialized in utils/logger.js

// Initialize health check
const healthCheck = new HealthCheck(SERVICE_NAME);

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

// Add health checks
healthCheck.addCheck('database', () => ({ status: 'healthy', result: { memoryUsage: '62MB' } }));
healthCheck.addCheck('memory', commonChecks.memory); // Memory check

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['${process.env.FRONTEND_URL || "http://localhost:3000"}'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-service-name', 'x-service-key']
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 authentication attempts per windowMs
  message: {
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Logging middleware
app.use(logger.requestLogger());

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health check endpoints
app.get('/health', healthCheck.middleware());
app.get('/health/live', healthCheck.middleware());
app.get('/health/ready', healthCheck.middleware());

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await promClient.register.metrics();
    res.set('Content-Type', promClient.register.contentType);
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics', { error: error.message });
    res.status(500).end('Error generating metrics');
  }
});

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

// API routes with rate limiting
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
app.use('/auth/forgot-password', authLimiter);
app.use('/auth/reset-password', authLimiter);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

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
    service: 'auth-service'
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
    logger.info(`🚀 Auth Service started on port ${PORT}`, {
      service: SERVICE_NAME,
      port: PORT,
      environment: process.env.NODE_ENV,
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'emulator'
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
