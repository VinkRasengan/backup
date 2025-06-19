const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

// Import shared utilities
const Logger = require('../shared/utils/logger');
const { HealthCheck, commonChecks } = require('../shared/utils/health-check');
// Temporary metrics implementation until shared module is properly set up
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
};

const metricsHandler = (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1
# HELP up Service status
# TYPE up gauge
up{job="api-gateway",instance="localhost:8080"} 1
`);
};

const healthHandler = (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};

// Import local modules (simplified for now)
// const authMiddleware = require('./middleware/auth');
// const routingConfig = require('./config/routing');
// const loadBalancer = require('./services/loadBalancer');

// Simple circuit breaker implementation
const circuitBreaker = {
  call: async (serviceName, fn) => {
    try {
      return await fn();
    } catch (error) {
      throw error;
    }
  }
};

const app = express();
const PORT = process.env.PORT || 8080;
const SERVICE_NAME = 'api-gateway';

// Initialize logger
const logger = new Logger(SERVICE_NAME);

// Initialize health check
const healthCheck = new HealthCheck(SERVICE_NAME);

// Add health checks for all services
const services = [
  { name: 'auth-service', url: process.env.AUTH_SERVICE_URL },
  { name: 'link-service', url: process.env.LINK_SERVICE_URL },
  { name: 'community-service', url: process.env.COMMUNITY_SERVICE_URL },
  { name: 'chat-service', url: process.env.CHAT_SERVICE_URL },
  { name: 'news-service', url: process.env.NEWS_SERVICE_URL },
  { name: 'admin-service', url: process.env.ADMIN_SERVICE_URL }
];

services.forEach(service => {
  if (service.url) {
    healthCheck.addCheck(service.name, commonChecks.externalService(service.name, `${service.url}/health/live`));
  }
});

healthCheck.addCheck('memory', commonChecks.memory(256));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'X-Request-ID', 'Cache-Control']
}));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Body parsing middleware (for non-proxied routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics middleware (before other middleware)
app.use(metricsMiddleware);

// Logging middleware
app.use(logger.logRequest.bind(logger));
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Metrics endpoint
app.get('/metrics', metricsHandler);

// Health check endpoints
app.get('/health', healthHandler);
app.get('/health/live', healthCheck.liveness());
app.get('/health/ready', healthCheck.readiness());

// Gateway info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      'auth-service': process.env.AUTH_SERVICE_URL,
      'link-service': process.env.LINK_SERVICE_URL,
      'community-service': process.env.COMMUNITY_SERVICE_URL,
      'chat-service': process.env.CHAT_SERVICE_URL,
      'news-service': process.env.NEWS_SERVICE_URL,
      'admin-service': process.env.ADMIN_SERVICE_URL
    }
  });
});

// Service status endpoint
app.get('/services/status', async (req, res) => {
  try {
    const serviceStatuses = await Promise.allSettled(
      services.map(async (service) => {
        try {
          const status = await circuitBreaker.call(service.name, async () => {
            const response = await fetch(`${service.url}/health/live`, { timeout: 5000 });
            return response.ok;
          });
          return { name: service.name, status: 'healthy', available: status };
        } catch (error) {
          return { name: service.name, status: 'unhealthy', error: error.message };
        }
      })
    );

    const results = serviceStatuses.map((result, index) => ({
      service: services[index].name,
      ...result.value
    }));

    res.json({
      gateway: 'healthy',
      services: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.logError(error, req);
    res.status(500).json({
      error: 'Failed to check service status',
      timestamp: new Date().toISOString()
    });
  }
});

// API routes with /api prefix
app.use('/api/users', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Auth service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || "http://localhost:3001" || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Auth service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/links', createProxyMiddleware({
  target: process.env.LINK_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/links': '/links' },
  onError: (err, req, res) => {
    logger.error('Link service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Link service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/community', createProxyMiddleware({
  target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/community': '' },
  onError: (err, req, res) => {
    logger.error('Community service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/chat', createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/chat': '/chat' },
  onError: (err, req, res) => {
    logger.error('Chat service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Chat service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/news', createProxyMiddleware({
  target: process.env.NEWS_SERVICE_URL || 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/news': '/news' },
  onError: (err, req, res) => {
    logger.error('News service proxy error', { error: err.message });
    res.status(503).json({
      error: 'News service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/admin', createProxyMiddleware({
  target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3006',
  changeOrigin: true,
  pathRewrite: { '^/api/admin': '/admin' },
  onError: (err, req, res) => {
    logger.error('Admin service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Admin service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Votes routes (proxy to community service)
app.use('/api/votes', createProxyMiddleware({
  target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  timeout: 30000, // 30 seconds
  proxyTimeout: 30000,
  pathRewrite: { '^/api/votes': '/votes' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying votes request', {
      method: req.method,
      url: req.url,
      target: proxyReq.path
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Votes proxy response', {
      status: proxyRes.statusCode,
      url: req.url
    });
  },
  onError: (err, req, res) => {
    logger.error('Community service proxy error (votes)', { error: err.message });
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Posts routes (proxy to community service)
app.use('/api/posts', createProxyMiddleware({
  target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  timeout: 30000, // 30 seconds
  proxyTimeout: 30000,
  pathRewrite: { '^/api/posts': '/posts' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying posts request', {
      method: req.method,
      url: req.url,
      target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003'
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Posts proxy response', {
      method: req.method,
      status: proxyRes.statusCode,
      url: req.url
    });
  },
  onError: (err, req, res) => {
    logger.error('Community service proxy error (posts)', { error: err.message });
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Comments routes (proxy to community service)
app.use('/api/comments', createProxyMiddleware({
  target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/comments': '/comments' },
  onError: (err, req, res) => {
    logger.error('Community service proxy error (comments)', { error: err.message });
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Authentication routes (direct proxy to auth service)
app.use('/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/auth': '/auth' },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Auth service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// User routes (proxy to auth service)
app.use('/users', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || "http://localhost:3001" || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: { '^/users': '/users' },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Auth service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Link verification routes (proxy to link service)
app.use('/links', createProxyMiddleware({
  target: process.env.LINK_SERVICE_URL || "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: { '^/links': '/links' },
  onError: (err, req, res) => {
    logger.error('Link service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Link service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Security routes (proxy to link service)
app.use('/security', createProxyMiddleware({
  target: process.env.LINK_SERVICE_URL || "http://localhost:3002",
  changeOrigin: true,
  pathRewrite: { '^/security': '/security' },
  onError: (err, req, res) => {
    logger.error('Link service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Link service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));



// Chat routes (proxy to chat service)
app.use('/chat', createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || "http://localhost:3004",
  changeOrigin: true,
  pathRewrite: { '^/chat': '/chat' },
  onError: (err, req, res) => {
    logger.error('Chat service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Chat service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Conversations routes (proxy to chat service)
app.use('/conversations', createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || "http://localhost:3004",
  changeOrigin: true,
  pathRewrite: { '^/conversations': '/conversations' },
  onError: (err, req, res) => {
    logger.error('Chat service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Chat service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// News routes (proxy to news service)
app.use('/news', createProxyMiddleware({
  target: process.env.NEWS_SERVICE_URL || "http://localhost:3005",
  changeOrigin: true,
  pathRewrite: { '^/news': '/news' },
  onError: (err, req, res) => {
    logger.error('News service proxy error', { error: err.message });
    res.status(503).json({
      error: 'News service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Admin routes (proxy to admin service)
app.use('/admin', createProxyMiddleware({
  target: process.env.ADMIN_SERVICE_URL || "http://localhost:3006",
  changeOrigin: true,
  pathRewrite: { '^/admin': '/admin' },
  onError: (err, req, res) => {
    logger.error('Admin service proxy error', { error: err.message });
    res.status(503).json({
      error: 'Admin service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

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
  logger.info(`🚀 API Gateway started on port ${PORT}`, {
    service: SERVICE_NAME,
    port: PORT,
    environment: process.env.NODE_ENV,
    services: services.length
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
