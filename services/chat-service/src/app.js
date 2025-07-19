const express = require('express');
const promClient = require('prom-client');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables using standardized loader
const { quickSetup } = require('../../config/env-loader');

// Setup environment with validation
const envResult = quickSetup('chat-service');

// Import shared utilities
const logger = require('./utils/logger');
const { HealthCheck, commonChecks } = require('./utils/health-check');

// Import local modules
const chatRoutes = require('./routes/chat');
const conversationsRoutes = require('./routes/conversations');
const firebaseConfig = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');
const socketHandler = require('./services/socketHandler');

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

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['${process.env.FRONTEND_URL || "http://localhost:3000"}'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3004;
const SERVICE_NAME = 'chat-service';

// Initialize logger
// Logger already initialized

// Initialize health check
const healthCheck = new HealthCheck(SERVICE_NAME);

// Add health checks
healthCheck.addCheck('memory', commonChecks.memory);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['${process.env.FRONTEND_URL || "http://localhost:3000"}', 'http://localhost:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-service-name', 'x-service-key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for chat service
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  }
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
    },
    ai: {
      geminiEnabled: !!process.env.GEMINI_API_KEY
    },
    websocket: {
      enabled: true,
      connectedClients: io.engine.clientsCount
    }
  });
});

// API versioned info endpoint
app.get('/api/v1/chat/info', (req, res) => {
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
    ai: {
      geminiEnabled: !!process.env.GEMINI_API_KEY
    },
    websocket: {
      enabled: true,
      connectedClients: io.engine.clientsCount
    }
  });
});

// API routes
app.use('/chat', chatRoutes);
app.use('/conversations', conversationsRoutes);

// Socket.IO handling
socketHandler(io, logger);

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
    service: 'chat-service'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  io.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  io.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});

// Start server (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`ðŸš€ Chat Service started on port ${PORT}`, {
      service: SERVICE_NAME,
      port: PORT,
      environment: process.env.NODE_ENV,
      websocket: true
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

module.exports = { app, server, io };

