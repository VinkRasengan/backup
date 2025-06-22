const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

// Load environment variables from root directory with fallback
const rootEnvPath = path.join(__dirname, '../../../.env');
const fs = require('fs');

// Try to load from root first, fallback to local if not found
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  // Fallback for production environments (Render, Docker)
  require('dotenv').config();
}

// Simple logger implementation
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
  logRequest: (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  },
  errorHandler: () => (err, req, res, next) => {
    console.error('Error:', err);
    next(err);
  }
};

// Simple health check implementation
const healthCheck = {
  middleware: () => (req, res) => {
    res.json({
      status: 'healthy',
      service: 'api-gateway',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  },
  liveness: () => (req, res) => {
    res.json({ status: 'alive', timestamp: new Date().toISOString() });
  },
  readiness: () => (req, res) => {
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  },
  addCheck: () => {} // No-op for now
};

// Metrics implementation
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

// Import local modules (simplified)
// const circuitBreakerService = require('./services/circuitBreaker');
// const fallbackStrategies = require('./services/fallbackStrategies');
// const ServiceAuthMiddleware = require('../../shared/security/serviceAuthMiddleware');
// const MTLSManager = require('../../shared/security/mtlsManager');
// const AuthRedundancyManager = require('../../shared/auth/authRedundancyManager');

// Simplified initialization (complex features disabled for now)
// const initializeCircuitBreakers = () => {
//   const strategies = fallbackStrategies.getAllStrategies();
//   Object.keys(strategies).forEach(serviceName => {
//     circuitBreakerService.registerFallback(serviceName, strategies[serviceName]);
//   });
//   logger.info('Circuit breakers initialized with fallback strategies');
// };

// const serviceAuth = new ServiceAuthMiddleware({
//   redis: {
//     host: process.env.REDIS_HOST,
//     port: process.env.REDIS_PORT,
//     password: process.env.REDIS_PASSWORD
//   }
// });

// const mtlsManager = new MTLSManager({
//   certDir: process.env.CERT_DIR || './certs'
// });

// const authRedundancy = new AuthRedundancyManager({
//   authInstances: [
//     { url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001', priority: 1, healthy: true },
//     { url: process.env.AUTH_SERVICE_URL_BACKUP || 'http://localhost:3011', priority: 2, healthy: true }
//   ],
//   localValidator: {
//     jwtSecret: process.env.JWT_SECRET,
//     cache: {
//       redis: {
//         host: process.env.REDIS_HOST,
//         port: process.env.REDIS_PORT,
//         password: process.env.REDIS_PASSWORD
//       }
//     }
//   }
// });

// initializeCircuitBreakers();

// async function initializeSecurity() {
//   try {
//     await mtlsManager.initializeAllServiceCertificates();
//     logger.info('Security components initialized');
//   } catch (error) {
//     logger.error('Failed to initialize security components', { error: error.message });
//   }
// }
// initializeSecurity();

const app = express();
const PORT = process.env.PORT || 8080;
const SERVICE_NAME = 'api-gateway';

// Service configuration
const services = [
  { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001' },
  { name: 'link-service', url: process.env.LINK_SERVICE_URL || 'http://localhost:3002' },
  { name: 'community-service', url: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003' },
  { name: 'chat-service', url: process.env.CHAT_SERVICE_URL || 'http://localhost:3004' },
  { name: 'news-service', url: process.env.NEWS_SERVICE_URL || 'http://localhost:3005' },
  { name: 'admin-service', url: process.env.ADMIN_SERVICE_URL || 'http://localhost:3006' },
  { name: 'phishtank-service', url: process.env.PHISHTANK_SERVICE_URL || 'http://localhost:3007' },
  { name: 'criminalip-service', url: process.env.CRIMINALIP_SERVICE_URL || 'http://localhost:3008' }
];

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

// CORS configuration - Enhanced for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Clean up whitespace from origins
    const cleanOrigins = allowedOrigins.map(o => o.trim());
    
    if (cleanOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`, { allowedOrigins: cleanOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-correlation-id', 
    'X-Request-ID', 
    'Cache-Control',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

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
app.get('/health', healthCheck.middleware());
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
      'admin-service': process.env.ADMIN_SERVICE_URL,
      'phishtank-service': process.env.PHISHTANK_SERVICE_URL,
      'criminalip-service': process.env.CRIMINALIP_SERVICE_URL
    }
  });
});

// Circuit breaker status endpoint (disabled)
// app.get('/circuit-breaker/status', (req, res) => {
//   try {
//     const status = circuitBreakerService.getStatus();
//     res.json({
//       timestamp: new Date().toISOString(),
//       circuitBreakers: status
//     });
//   } catch (error) {
//     logger.error('Error getting circuit breaker status', { error: error.message });
//     res.status(500).json({
//       error: 'Failed to get circuit breaker status',
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// Circuit breaker health check endpoint (disabled)
// app.get('/circuit-breaker/health', async (req, res) => {
//   try {
//     const health = await circuitBreakerService.healthCheck();
//     res.json({
//       timestamp: new Date().toISOString(),
//       services: health
//     });
//   } catch (error) {
//     logger.error('Error performing circuit breaker health check', { error: error.message });
//     res.status(500).json({
//       error: 'Failed to perform health check',
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// Complex endpoints disabled for simplicity
// app.get('/security/status', serviceAuth.authenticate(), (req, res) => { ... });
// app.get('/auth/redundancy/status', serviceAuth.authenticate(), async (req, res) => { ... });
// app.post('/auth/redundancy/failover', serviceAuth.adminOnly(), (req, res) => { ... });
// app.post('/security/credentials/:serviceName', serviceAuth.adminOnly(), async (req, res) => { ... });
// app.post('/security/rotate-keys', serviceAuth.adminOnly(), async (req, res) => { ... });
// app.get('/services/status', async (req, res) => { ... });

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
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
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

// Votes routes (proxy to community service) - MOVED BEFORE /api/community
app.use('/api/votes', createProxyMiddleware({
  target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  timeout: 60000, // Increased to 60 seconds for batch operations
  proxyTimeout: 60000,
  pathRewrite: { '^/api/votes': '/votes' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying votes request', {
      method: req.method,
      url: req.url,
      target: `${process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003'}${proxyReq.path}`,
      headers: req.headers,
      body: req.body
    });

    // Set connection keep-alive to prevent ECONNRESET
    proxyReq.setHeader('Connection', 'keep-alive');
    proxyReq.setHeader('Keep-Alive', 'timeout=60, max=1000');

    // Forward authentication headers
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }

    // Handle JSON body for POST/PUT requests
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Votes proxy response', {
      status: proxyRes.statusCode,
      url: req.url,
      headers: proxyRes.headers
    });
  },
  onError: (err, req, res) => {
    logger.error('Community service proxy error (votes)', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Community service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Posts routes (proxy to community service) - MOVED BEFORE /api/community
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

// Comments routes (proxy to community service) - MOVED BEFORE /api/community
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

// General community routes (proxy to community service) - MOVED AFTER specific routes
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

// Community routes without /api prefix (for backward compatibility)
app.use('/community', createProxyMiddleware({
  target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: { '^/community': '' },
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

app.use('/api/phishtank', createProxyMiddleware({
  target: process.env.PHISHTANK_SERVICE_URL || 'http://localhost:3007',
  changeOrigin: true,
  pathRewrite: { '^/api/phishtank': '/phishtank' },
  onError: (err, req, res) => {
    logger.error('PhishTank service proxy error', { error: err.message });
    res.status(503).json({
      error: 'PhishTank service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/criminalip', createProxyMiddleware({
  target: process.env.CRIMINALIP_SERVICE_URL || 'http://localhost:3008',
  changeOrigin: true,
  pathRewrite: { '^/api/criminalip': '/criminalip' },
  onError: (err, req, res) => {
    logger.error('CriminalIP service proxy error', { error: err.message });
    res.status(503).json({
      error: 'CriminalIP service unavailable',
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
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
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
  target: process.env.LINK_SERVICE_URL || 'http://localhost:3002',
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
  target: process.env.LINK_SERVICE_URL || 'http://localhost:3002',
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

// REMOVED DUPLICATE ROUTES - Use /api/* routes only for consistency
// Community, posts, and votes routes are now only available via /api/* prefix

// Chat routes (proxy to chat service)
app.use('/chat', createProxyMiddleware({
  target: process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
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
  target: process.env.CHAT_SERVICE_URL || 'http://localhost:3004',
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
  target: process.env.NEWS_SERVICE_URL || 'http://localhost:3005',
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
  target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3006',
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
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

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
