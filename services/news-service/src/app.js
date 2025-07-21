const express = require('express');
const promClient = require('prom-client');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Load environment variables using local loader
const { quickSetup } = require('../../../config/env-loader.js');

// Setup environment with validation
const envResult = quickSetup('news-service');

// Import local utilities
const logger = require('./utils/logger');
const { HealthCheck, commonChecks } = require('./utils/health-check');

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

const PORT = process.env.PORT || 3005;
const SERVICE_NAME = 'news-service';

// Initialize logger
// Logger already initialized

// Initialize health check
const healthCheck = new HealthCheck(SERVICE_NAME);

// Add health checks
healthCheck.addCheck('memory', commonChecks.memory);
healthCheck.addCheck('uptime', commonChecks.uptime);
healthCheck.addCheck('environment', commonChecks.environment);

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
    timestamp: new Date().toISOString()
  });
});

// API versioned endpoint
app.get('/api/v1/news', (req, res) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mock news endpoints
app.get('/news/latest', (req, res) => {
  const { source = 'all', pageSize = 10, page = 1 } = req.query;

  // Mock news articles
  const mockArticles = [
    {
      id: '1',
      title: 'Cáº£nh bÃ¡o: Chiáº¿n dá»‹ch lá»«a Ä‘áº£o má»›i nháº¯m vÃ o khÃ¡ch hÃ ng ngÃ¢n hÃ ng',
      summary: 'CÃ¡c nhÃ  nghiÃªn cá»©u báº£o máº­t Ä‘Ã£ phÃ¡t hiá»‡n má»™t chiáº¿n dá»‹ch lá»«a Ä‘áº£o tinh vi nháº¯m vÃ o thÃ´ng tin tÃ i khoáº£n ngÃ¢n hÃ ng...',
      url: 'https://example.com/news/1',
      publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      source: 'VnExpress',
      category: 'CÃ´ng nghá»‡',
      credibilityScore: 95
    },
    {
      id: '2',
      title: 'PhÃ¡t hiá»‡n mÃ£ Ä‘á»™c má»›i cÃ³ kháº£ nÄƒng Ä‘Ã¡nh cáº¯p thÃ´ng tin cÃ¡ nhÃ¢n',
      summary: 'ChuyÃªn gia an ninh máº¡ng cáº£nh bÃ¡o vá» loáº¡i mÃ£ Ä‘á»™c má»›i cÃ³ thá»ƒ truy cáº­p vÃ o dá»¯ liá»‡u nháº¡y cáº£m...',
      url: 'https://example.com/news/2',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      source: 'Tuá»•i Tráº»',
      category: 'An ninh máº¡ng',
      credibilityScore: 92
    },
    {
      id: '3',
      title: 'CÃ¡ch nháº­n biáº¿t vÃ  trÃ¡nh cÃ¡c trang web giáº£ máº¡o',
      summary: 'HÆ°á»›ng dáº«n chi tiáº¿t giÃºp ngÆ°á»i dÃ¹ng internet nháº­n biáº¿t vÃ  trÃ¡nh xa cÃ¡c trang web lá»«a Ä‘áº£o...',
      url: 'https://example.com/news/3',
      publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
      source: 'Thanh NiÃªn',
      category: 'GiÃ¡o dá»¥c',
      credibilityScore: 88
    },
    {
      id: '4',
      title: 'Tin tá»©c giáº£ lan truyá»n nhanh trÃªn máº¡ng xÃ£ há»™i',
      summary: 'NghiÃªn cá»©u má»›i cho tháº¥y tin tá»©c giáº£ lan truyá»n nhanh gáº¥p 6 láº§n tin tá»©c tháº­t trÃªn cÃ¡c ná»n táº£ng máº¡ng xÃ£ há»™i...',
      url: 'https://example.com/news/4',
      publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      source: 'DÃ¢n TrÃ­',
      category: 'XÃ£ há»™i',
      credibilityScore: 90
    },
    {
      id: '5',
      title: 'CÃ´ng nghá»‡ AI giÃºp phÃ¡t hiá»‡n tin tá»©c giáº£',
      summary: 'CÃ¡c cÃ´ng ty cÃ´ng nghá»‡ Ä‘ang phÃ¡t triá»ƒn há»‡ thá»‘ng AI tiÃªn tiáº¿n Ä‘á»ƒ tá»± Ä‘á»™ng phÃ¡t hiá»‡n vÃ  gáº¯n cá» tin tá»©c giáº£...',
      url: 'https://example.com/news/5',
      publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
      source: 'VietnamNet',
      category: 'CÃ´ng nghá»‡',
      credibilityScore: 94
    }
  ];

  // Filter by source if specified
  let filteredArticles = mockArticles;
  if (source !== 'all') {
    filteredArticles = mockArticles.filter(article =>
      article.source.toLowerCase().includes(source.toLowerCase())
    );
  }

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + parseInt(pageSize);
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      articles: paginatedArticles,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: filteredArticles.length,
        totalPages: Math.ceil(filteredArticles.length / pageSize)
      },
      source,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/news/feed', (req, res) => {
  res.json({
    success: true,
    articles: [
      {
        id: '1',
        title: 'New Phishing Campaign Targets Banking Customers',
        summary: 'Security researchers have identified a sophisticated phishing campaign...',
        url: 'https://example.com/news/1',
        publishedAt: new Date().toISOString(),
        source: 'Security News'
      }
    ]
  });
});

app.get('/news/trending', (req, res) => {
  res.json({
    success: true,
    trending: [
      {
        id: '1',
        title: 'Cybersecurity Alert: New Malware Strain Detected',
        views: 1250,
        publishedAt: new Date().toISOString()
      }
    ]
  });
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

// Start server (skip in test environment)
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`ðŸš€ News Service started on port ${PORT}`, {
      service: SERVICE_NAME,
      port: PORT,
      environment: process.env.NODE_ENV
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

