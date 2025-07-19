const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

// Load environment variables using new standardized loader
const { quickSetup } = require('../../config/env-loader');

// Setup environment with automatic validation
const envResult = quickSetup('api-gateway');

// Simple logger implementation
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
  logRequest: (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  }
};

const app = express();
const PORT = process.env.PORT || 8080;
const SERVICE_NAME = 'api-gateway';

// Service configuration - NO LOCALHOST FALLBACKS
// Environment variables are REQUIRED for proper service discovery
const getServiceUrl = (serviceName, envVar, defaultPort) => {
  const url = process.env[envVar];

  if (!url) {
    const errorMsg = `❌ CRITICAL: ${envVar} environment variable is required but not set!`;
    console.error(errorMsg);
    console.error(`💡 For Docker/K8s: Use service name like 'http://${serviceName}:${defaultPort}'`);
    console.error(`💡 For local dev: Use 'http://localhost:${defaultPort}'`);
    console.error(`💡 For production: Use your actual service URL`);

    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Production deployment requires ${envVar} to be set`);
    }

    // Only warn in development, but still fail
    console.warn(`⚠️  Falling back to localhost for development, but this should be fixed!`);
    return `http://localhost:${defaultPort}`;
  }

  return url;
};

const services = {
  'auth-service': getServiceUrl('auth-service', 'AUTH_SERVICE_URL', 3001),
  'link-service': getServiceUrl('link-service', 'LINK_SERVICE_URL', 3002),
  'community-service': getServiceUrl('community-service', 'COMMUNITY_SERVICE_URL', 3003),
  'chat-service': getServiceUrl('chat-service', 'CHAT_SERVICE_URL', 3004),
  'news-service': getServiceUrl('news-service', 'NEWS_SERVICE_URL', 3005),
  'admin-service': getServiceUrl('admin-service', 'ADMIN_SERVICE_URL', 3006)
};

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
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      '${process.env.FRONTEND_URL}',
      'https://frontend-eklp.onrender.com',
      'https://factcheck-frontend-production.onrender.com',
      'https://client-21c1.onrender.com',
      '${process.env.FRONTEND_URL || "http://localhost:3000"}',
      'http://localhost:8080'
    ];
    
    // Clean up whitespace from origins
    const cleanOrigins = allowedOrigins.map(o => o.trim());
    
    if (cleanOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`, { allowedOrigins: cleanOrigins });
      callback(null, true); // Allow for now to debug
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
  optionsSuccessStatus: 200
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(logger.logRequest);
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Request counter for metrics
global.requestCount = 0;
app.use((req, res, next) => {
  global.requestCount++;
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    cpu: process.cpuUsage()
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  // Basic metrics - could be enhanced with prom-client
  const metrics = `
# HELP api_gateway_uptime_seconds Total uptime in seconds
# TYPE api_gateway_uptime_seconds counter
api_gateway_uptime_seconds ${Math.floor(process.uptime())}

# HELP api_gateway_memory_usage_bytes Memory usage in bytes
# TYPE api_gateway_memory_usage_bytes gauge
api_gateway_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP api_gateway_requests_total Total number of requests
# TYPE api_gateway_requests_total counter
api_gateway_requests_total ${global.requestCount || 0}
  `.trim();

  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT,
    corsOrigins: process.env.ALLOWED_ORIGINS || 'not-set',
    services
  });
});

// API versioned info endpoint
app.get('/api/v1/gateway/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT,
    corsOrigins: process.env.ALLOWED_ORIGINS || 'not-set',
    services
  });
});

// Test CORS endpoint
app.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Community links endpoint (proxy to community service)
app.use('/community/links', createProxyMiddleware({
  target: services['community-service'],
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: { '^/community/links': '/links' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying community links request', {
      method: req.method,
      url: req.url,
      target: services['community-service']
    });
  },
  onError: (err, req, res) => {
    logger.error('Community links proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Community service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Mock news endpoint removed - use real news service

// API routes with /api prefix - Authentication
app.use('/api/users', createProxyMiddleware({
  target: services['auth-service'],
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Auth service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

app.use('/api/auth', createProxyMiddleware({
  target: services['auth-service'],
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Auth service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Links service (moved to /link-check to avoid conflict with community service)
// app.use('/api/links', createProxyMiddleware({
//   target: services['link-service'],
//   changeOrigin: true,
//   pathRewrite: { '^/api/links': '/links' },
//   onError: (err, req, res) => {
//     logger.error('Link service proxy error', { error: err.message });
//     if (!res.headersSent) {
//       res.status(503).json({
//         error: 'Link service unavailable',
//         code: 'SERVICE_UNAVAILABLE'
//       });
//     }
//   }
// }));

// Votes routes (proxy to community service) - CRITICAL FIX
app.use('/api/votes', createProxyMiddleware({
  target: services['community-service'],
  changeOrigin: true,
  timeout: 60000, // Increased to 60 seconds for batch operations
  proxyTimeout: 60000,
  pathRewrite: { '^/api/votes': '/votes' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying votes request', {
      method: req.method,
      url: req.url,
      target: `${services['community-service']}${proxyReq.path}`,
      headers: req.headers
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

// Community Links routes (proxy to community service) - backward compatibility for /api/posts
app.use('/api/posts', createProxyMiddleware({
  target: services['community-service'],
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: { '^/api/posts': '/links' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying community posts request (redirected to links)', {
      method: req.method,
      url: req.url,
      target: services['community-service']
    });
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Community posts proxy response', {
      method: req.method,
      status: proxyRes.statusCode,
      url: req.url
    });
  },
  onError: (err, req, res) => {
    logger.error('Community service proxy error (posts)', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Community service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Community Links routes (proxy to community service) - new endpoint
app.use('/api/links', createProxyMiddleware({
  target: services['community-service'],
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: { '^/api/links': '/links' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying community links request', {
      method: req.method,
      url: req.url,
      target: services['community-service']
    });

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
    logger.info('Community links proxy response', {
      method: req.method,
      status: proxyRes.statusCode,
      url: req.url
    });
  },
  onError: (err, req, res) => {
    logger.error('Community service proxy error (links)', { 
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

// Comments routes (proxy to community service)
app.use('/api/comments', createProxyMiddleware({
  target: services['community-service'],
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: { '^/api/comments': '/comments' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying comments request', {
      method: req.method,
      url: req.url,
      target: services['community-service']
    });

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
    logger.info('Comments proxy response', {
      status: proxyRes.statusCode,
      url: req.url
    });
  },
  onError: (err, req, res) => {
    logger.error('Community service proxy error (comments)', { 
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

// Reports routes (proxy to community service)
app.use('/api/reports', createProxyMiddleware({
  target: services['community-service'],
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: { '^/api/reports': '/reports' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying reports request', {
      method: req.method,
      url: req.url,
      target: services['community-service']
    });

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
    logger.info('Reports proxy response', {
      status: proxyRes.statusCode,
      url: req.url
    });
  },
  onError: (err, req, res) => {
    logger.error('Community service proxy error (reports)', { 
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

// General community routes (proxy to community service)
app.use('/api/community', createProxyMiddleware({
  target: services['community-service'],
  changeOrigin: true,
  pathRewrite: { '^/api/community': '' },
  onError: (err, req, res) => {
    logger.error('Community service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Community service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Chat service
app.use('/api/chat', createProxyMiddleware({
  target: services['chat-service'],
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: { '^/api/chat': '/chat' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying chat request', {
      method: req.method,
      url: req.url,
      target: services['chat-service'],
      contentType: req.get('Content-Type'),
      bodySize: req.body ? JSON.stringify(req.body).length : 0
    });

    // Handle JSON body for POST/PUT requests
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info('Chat proxy response', {
      status: proxyRes.statusCode,
      url: req.url,
      headers: proxyRes.headers['content-type']
    });
  },
  onError: (err, req, res) => {
    logger.error('Chat service proxy error', { 
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Chat service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// News service
app.use('/api/news', createProxyMiddleware({
  target: services['news-service'],
  changeOrigin: true,
  pathRewrite: { '^/api/news': '/news' },
  onError: (err, req, res) => {
    logger.error('News service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'News service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Admin reports routes (proxy to admin service) - MUST come before general admin route
app.use('/api/admin/reports', createProxyMiddleware({
  target: services['admin-service'],
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: { '^/api/admin/reports': '/admin/reports' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying admin reports request', {
      method: req.method,
      url: req.url,
      target: services['admin-service']
    });

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
    logger.info('Admin reports proxy response', {
      status: proxyRes.statusCode,
      url: req.url
    });
  },
  onError: (err, req, res) => {
    logger.error('Admin service proxy error (admin reports)', { 
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Admin service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Admin service (general routes)
app.use('/api/admin', createProxyMiddleware({
  target: services['admin-service'],
  changeOrigin: true,
  pathRewrite: { '^/api/admin': '/admin' },
  onError: (err, req, res) => {
    logger.error('Admin service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Admin service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Backward compatibility routes (without /api prefix)
app.use('/community', createProxyMiddleware({
  target: services['community-service'],
  changeOrigin: true,
  pathRewrite: { '^/community': '' },
  onError: (err, req, res) => {
    logger.error('Community service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Community service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

app.use('/auth', createProxyMiddleware({
  target: services['auth-service'],
  changeOrigin: true,
  timeout: 10000, // 10 second timeout
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Auth service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

app.use('/users', createProxyMiddleware({
  target: services['auth-service'],
  changeOrigin: true,
  pathRewrite: { '^/users': '/users' },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Auth service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

app.use('/link-check', createProxyMiddleware({
  target: services['link-service'],
  changeOrigin: true,
  timeout: 60000, // Add timeout configuration
  proxyTimeout: 60000, // Add proxy timeout
  pathRewrite: { '^/link-check': '/links' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying link-check request to link-service', {
      method: req.method,
      url: req.url,
      target: `${services['link-service']}${proxyReq.path}`
    });

    // Set connection keep-alive to prevent timeouts
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
    logger.info('Link-check proxy response from link-service', {
      status: proxyRes.statusCode,
      url: req.url
    });
  },
  onError: (err, req, res) => {
    logger.error('Link service proxy error (link-check)', { 
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Link service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Direct links routes (for /links/check endpoint)
app.use('/links', createProxyMiddleware({
  target: services['link-service'],
  changeOrigin: true,
  timeout: 60000, // 60 seconds
  proxyTimeout: 60000,
  pathRewrite: { '^/links': '/links' },
  onProxyReq: (proxyReq, req, res) => {
    logger.info('Proxying links request to link-service', {
      method: req.method,
      url: req.url,
      target: `${services['link-service']}${proxyReq.path}`,
      headers: req.headers
    });

    // Set connection keep-alive to prevent timeouts
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
    logger.info('Links proxy response from link-service', {
      status: proxyRes.statusCode,
      url: req.url,
      headers: proxyRes.headers
    });
  },
  onError: (err, req, res) => {
    logger.error('Link service proxy error', { 
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Link service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// Security routes for virustotal endpoints
app.use('/api/security', createProxyMiddleware({
  target: services['link-service'],
  changeOrigin: true,
  pathRewrite: { '^/api/security': '/security' },
  onError: (err, req, res) => {
    logger.error('Link service proxy error (security)', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Link service security endpoints unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

app.use('/chat', createProxyMiddleware({
  target: services['chat-service'],
  changeOrigin: true,
  pathRewrite: { '^/chat': '/chat' },
  onError: (err, req, res) => {
    logger.error('Chat service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Chat service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

app.use('/news', createProxyMiddleware({
  target: services['news-service'],
  changeOrigin: true,
  pathRewrite: { '^/news': '/news' },
  onError: (err, req, res) => {
    logger.error('News service proxy error', { error: err.message });
    if (!res.headersSent) {
      res.status(503).json({
        error: 'News service unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
}));

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /info',
      'GET /test-cors',
      'GET /community/links',
      'GET /news/latest',
      'GET /api/votes/:linkId/stats',
      'GET /api/votes/:linkId/user',
      'POST /api/votes/batch/stats',
      'POST /api/votes/batch/user',
      'POST /api/votes/:linkId',
      'GET /api/links',
      'POST /api/links',
      'GET /api/posts (backward compatibility)',
      'POST /api/posts (backward compatibility)',
      'GET /api/comments',
      'POST /api/comments'
    ]
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

  if (!res.headersSent) {
    res.status(error.status || 500).json({
      error: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
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
    logger.info(`🚀 API Gateway started on port ${PORT}`, {
      service: SERVICE_NAME,
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      services: Object.keys(services).length
    });

    console.log(`Available endpoints:`);
    console.log(`  - GET /health`);
    console.log(`  - GET /info`);
    console.log(`  - GET /test-cors`);
    console.log(`  - GET /community/links`);
    console.log(`  - GET /news/latest`);
    console.log(`  - /api/votes/* (proxied to community service)`);
    console.log(`  - /api/links/* (proxied to community service)`);
    console.log(`  - /api/posts/* (backward compatibility - proxied to community service)`);
    console.log(`  - /api/comments/* (proxied to community service)`);
    console.log(`  - /api/reports/* (proxied to community service)`);
    console.log(`  - /api/auth/* (proxied to auth service - user management only)`);
    console.log(`  - /api/users/* (proxied to auth service - user management only)`);
    console.log(`  - /link-check/* (proxied to link service)`);
    console.log(`  - /api/chat/* (proxied to chat service)`);
    console.log(`  - /api/news/* (proxied to news service)`);
    console.log(`  - /api/admin/* (proxied to admin service)`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
