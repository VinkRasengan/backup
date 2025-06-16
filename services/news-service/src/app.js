const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import shared utilities
const Logger = require('../shared/utils/logger');
const { HealthCheck, commonChecks } = require('../shared/utils/health-check');

const app = express();
const PORT = process.env.PORT || 3005;
const SERVICE_NAME = 'news-service';

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
      title: 'Cảnh báo: Chiến dịch lừa đảo mới nhắm vào khách hàng ngân hàng',
      summary: 'Các nhà nghiên cứu bảo mật đã phát hiện một chiến dịch lừa đảo tinh vi nhắm vào thông tin tài khoản ngân hàng...',
      url: 'https://example.com/news/1',
      publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      source: 'VnExpress',
      category: 'Công nghệ',
      credibilityScore: 95
    },
    {
      id: '2',
      title: 'Phát hiện mã độc mới có khả năng đánh cắp thông tin cá nhân',
      summary: 'Chuyên gia an ninh mạng cảnh báo về loại mã độc mới có thể truy cập vào dữ liệu nhạy cảm...',
      url: 'https://example.com/news/2',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      source: 'Tuổi Trẻ',
      category: 'An ninh mạng',
      credibilityScore: 92
    },
    {
      id: '3',
      title: 'Cách nhận biết và tránh các trang web giả mạo',
      summary: 'Hướng dẫn chi tiết giúp người dùng internet nhận biết và tránh xa các trang web lừa đảo...',
      url: 'https://example.com/news/3',
      publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
      source: 'Thanh Niên',
      category: 'Giáo dục',
      credibilityScore: 88
    },
    {
      id: '4',
      title: 'Tin tức giả lan truyền nhanh trên mạng xã hội',
      summary: 'Nghiên cứu mới cho thấy tin tức giả lan truyền nhanh gấp 6 lần tin tức thật trên các nền tảng mạng xã hội...',
      url: 'https://example.com/news/4',
      publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      source: 'Dân Trí',
      category: 'Xã hội',
      credibilityScore: 90
    },
    {
      id: '5',
      title: 'Công nghệ AI giúp phát hiện tin tức giả',
      summary: 'Các công ty công nghệ đang phát triển hệ thống AI tiên tiến để tự động phát hiện và gắn cờ tin tức giả...',
      url: 'https://example.com/news/5',
      publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
      source: 'VietnamNet',
      category: 'Công nghệ',
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

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 News Service started on port ${PORT}`, {
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
