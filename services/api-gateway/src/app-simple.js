const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Starting API Gateway...');

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'api-gateway',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Community routes (strip /community prefix)
app.use('/community', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/community': '' // Remove /community prefix
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to community: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Community response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Community service proxy error:', err.message);
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE',
      details: err.message
    });
  }
}));

// Specific API routes for community service (MUST come before general /api/community)
app.use('/api/votes', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/votes': '/votes' // Remove /api prefix, keep /votes
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to votes: ${req.method} ${req.url} -> ${proxyReq.path}`);
    console.log(`📦 Request body:`, req.body);

    // Forward request body for POST/PUT/PATCH requests
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const bodyData = JSON.stringify(req.body);
      console.log(`📤 Forwarding body:`, bodyData);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('❌ Votes service proxy error:', err.message);
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/comments', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/comments': '/comments' // Remove /api prefix, keep /comments
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to comments: ${req.method} ${req.url} -> ${proxyReq.path}`);

    // Forward request body for POST/PUT/PATCH requests
    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('❌ Comments service proxy error:', err.message);
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

app.use('/api/posts', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/posts': '/posts' // Remove /api prefix, keep /posts
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to posts: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Posts service proxy error:', err.message);
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// General API routes with /api prefix (for frontend compatibility) - AFTER specific routes
app.use('/api/community', createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/community': '' // Remove /api/community prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to community (API): ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Community service proxy error (API):', err.message);
    res.status(503).json({
      error: 'Community service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// News routes (keep /news prefix since service expects it)
app.use('/news', createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  // No pathRewrite needed - service expects /news prefix
  onError: (err, req, res) => {
    console.error('News service proxy error:', err.message);
    res.status(503).json({
      error: 'News service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// API News routes with /api prefix (for frontend compatibility)
app.use('/api/news', createProxyMiddleware({
  target: 'http://localhost:3005',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // Remove /api prefix, keep /news
  },
  onError: (err, req, res) => {
    console.error('News service proxy error (API):', err.message);
    res.status(503).json({
      error: 'News service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Auth routes
app.use('/auth', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Auth service proxy error:', err.message);
    res.status(503).json({
      error: 'Auth service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Link routes
app.use('/links', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Link service proxy error:', err.message);
    res.status(503).json({
      error: 'Link service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Chat routes
app.use('/chat', createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Chat service proxy error:', err.message);
    res.status(503).json({
      error: 'Chat service unavailable',
      code: 'SERVICE_UNAVAILABLE'
    });
  }
}));

// Admin routes
app.use('/admin', createProxyMiddleware({
  target: 'http://localhost:3006',
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Admin service proxy error:', err.message);
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
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Gateway error:', error.message);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = app;
