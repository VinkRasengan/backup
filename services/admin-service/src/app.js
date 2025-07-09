const express = require('express');
const promClient = require('prom-client');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables using standardized loader
const { setupEnvironment, getRequiredVarsForService } = require('../../../shared/utils/env-loader');

// Setup environment with validation
const envResult = setupEnvironment('admin-service', getRequiredVarsForService('admin'), true);

// Import shared utilities
const { Logger } = require('@factcheck/shared');
const { HealthCheck, commonChecks } = require('@factcheck/shared');

// Import Firebase configuration
const { admin, db, collections } = require('./config/firebase');

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

const PORT = process.env.PORT || 3006;
const SERVICE_NAME = 'admin-service';

// Initialize logger
const logger = new Logger(SERVICE_NAME);

// Initialize health check
const healthCheck = new HealthCheck(SERVICE_NAME);

// Add health checks
healthCheck.addCheck('memory', commonChecks.memory(512));

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
  max: 100,
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
app.use(logger.logRequest.bind(logger));
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
app.get('/health/live', healthCheck.liveness());
app.get('/health/ready', healthCheck.readiness());

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mock admin endpoints
app.get('/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalUsers: 1250,
      totalLinks: 5430,
      totalReports: 89,
      systemHealth: 'healthy'
    }
  });
});

app.get('/admin/users', (req, res) => {
  res.json({
    success: true,
    users: [
      {
        id: '1',
        email: 'user@example.com',
        displayName: 'Test User',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        roles: ['user']
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1250
    }
  });
});

app.get('/admin/reports', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = null, reason = null } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let reportsQuery = db.collection(collections.REPORTS);
    
    // Add filters
    if (status && status !== 'all') {
      reportsQuery = reportsQuery.where('status', '==', status);
    }
    if (reason && reason !== 'all') {
      reportsQuery = reportsQuery.where('reason', '==', reason);
    }

    // Order by creation date (newest first)
    reportsQuery = reportsQuery.orderBy('createdAt', 'desc');

    // Get total count for pagination
    const totalSnapshot = await reportsQuery.get();
    const totalReports = totalSnapshot.size;

    // Apply pagination
    const paginatedQuery = reportsQuery.offset(offset).limit(limitNum);
    const snapshot = await paginatedQuery.get();

    const reports = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate().toISOString() : data.reviewedAt
      });
    });

    const totalPages = Math.ceil(totalReports / limitNum);

    res.json({
      success: true,
      reports,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalReports,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
      code: 'FETCH_ERROR'
    });
  }
});

// Admin reports statistics endpoint
app.get('/admin/reports/statistics', async (req, res) => {
  try {
    // Get all reports for statistics
    const snapshot = await db.collection(collections.REPORTS).get();
    
    const stats = {
      total: snapshot.size,
      byStatus: {
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0
      },
      byReason: {
        spam: 0,
        fake_news: 0,
        misleading: 0,
        harassment: 0,
        other: 0
      },
      recent: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      }
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Count by status
      if (stats.byStatus.hasOwnProperty(data.status)) {
        stats.byStatus[data.status]++;
      }
      
      // Count by reason
      if (stats.byReason.hasOwnProperty(data.reason)) {
        stats.byReason[data.reason]++;
      }
      
      // Count recent reports
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      if (createdAt >= today) {
        stats.recent.today++;
      }
      if (createdAt >= weekAgo) {
        stats.recent.thisWeek++;
      }
      if (createdAt >= monthAgo) {
        stats.recent.thisMonth++;
      }
    });

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching report statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report statistics',
      code: 'STATS_ERROR'
    });
  }
});

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
app.use((error, req, res, next) => {
  logger.logError(error, req);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
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



// Start server
const server = app.listen(PORT, () => {
  logger.info(`ðŸš€ Admin Service started on port ${PORT}`, {
    service: SERVICE_NAME,
    port: PORT,
    environment: process.env.NODE_ENV
  });
});

// Handle unhandled promise rejections
process.on('unhandled Rejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;

