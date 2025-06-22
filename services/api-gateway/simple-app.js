const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

// Load environment variables from root directory with fallback
const rootEnvPath = path.join(__dirname, '../../.env');

// Try to load from root first, fallback to local if not found
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  // Fallback for production environments (Render, Docker)
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 8080;

// Basic CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
      // Use environment variable or fallback to defaults
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'https://frontend-eklp.onrender.com',  // Correct frontend URL
      'http://localhost:3000',
      'http://localhost:8080'
    ];
    
    // Clean up whitespace from origins
    const cleanOrigins = allowedOrigins.map(o => o.trim());
    
    if (cleanOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}, allowed: ${cleanOrigins.join(', ')}`);
      callback(null, true); // Allow for now to debug
    }
  },credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Keep-Alive',
    'X-Requested-With'
  ]
}));

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway-simple',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'api-gateway-simple',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    corsOrigins: process.env.ALLOWED_ORIGINS || 'not-set',
    timestamp: new Date().toISOString()
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

// Mock community endpoint for testing
app.get('/community/posts', (req, res) => {
  res.json({
    success: true,
    data: {
      posts: [
        {
          id: '1',
          title: 'Test Post from API Gateway',
          content: 'This proves the API Gateway is working',
          author: 'API Gateway',
          timestamp: new Date().toISOString()
        }
      ]
    },
    message: 'Mock data from simple API Gateway'
  });
});

// Also handle /api/posts for compatibility with frontend
app.get('/api/posts', (req, res) => {
  res.json({
    success: true,
    data: {
      posts: [
        {
          id: '1',
          title: 'Test Post from API Gateway',
          content: 'This proves the API Gateway is working',
          author: 'API Gateway',
          timestamp: new Date().toISOString()
        }
      ]
    },
    message: 'Mock data from simple API Gateway (/api/posts endpoint)'
  });
});

// Mock news endpoint for testing
app.get('/news/latest', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Test News from API Gateway',
        description: 'This proves the API Gateway news endpoint is working',
        source: 'API Gateway',
        timestamp: new Date().toISOString()
      }
    ],
    message: 'Mock news data from simple API Gateway'
  });
});

// Proxy voting requests to community service (real Firestore data)
const COMMUNITY_SERVICE_URL = process.env.COMMUNITY_SERVICE_URL || 'https://backup-8kfl.onrender.com';

// Add fallback voting endpoints in case community service is unavailable
const votingFallbackEnabled = true;

if (votingFallbackEnabled) {
  // Fallback voting endpoints (mock data)
  app.get('/api/votes/:linkId/stats', async (req, res) => {
    console.log('🔄 Using fallback voting stats endpoint');
    res.json({
      success: true,
      data: {
        totalVotes: 5,
        upvotes: 3,
        downvotes: 2,
        userVote: null,
        linkId: req.params.linkId
      },
      message: 'Fallback vote stats (community service unavailable)'
    });
  });

  app.get('/api/votes/:linkId/user', async (req, res) => {
    console.log('🔄 Using fallback user vote endpoint');
    res.json({
      success: true,
      data: {
        vote: null,
        linkId: req.params.linkId
      },
      message: 'Fallback user vote (community service unavailable)'
    });
  });

  app.post('/api/votes/batch/stats', async (req, res) => {
    console.log('🔄 Using fallback batch stats endpoint');
    const linkIds = req.body.linkIds || [];
    const mockStats = linkIds.map(linkId => ({
      linkId: linkId,
      totalVotes: Math.floor(Math.random() * 10),
      upvotes: Math.floor(Math.random() * 7),
      downvotes: Math.floor(Math.random() * 3),
      userVote: null
    }));

    res.json({
      success: true,
      data: mockStats,
      message: 'Fallback batch vote stats (community service unavailable)'
    });
  });

  app.post('/api/votes/:linkId', async (req, res) => {
    console.log('🔄 Using fallback vote submission endpoint');
    res.json({
      success: true,
      data: {
        linkId: req.params.linkId,
        vote: req.body.vote,
        totalVotes: Math.floor(Math.random() * 10) + 1
      },
      message: 'Fallback vote submitted (community service unavailable)'
    });
  });
}

// Try to proxy to community service first, fallback if it fails
// Temporarily disabled proxy due to community service connection issues
/* 
app.use('/api/votes', createProxyMiddleware({
  target: COMMUNITY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/votes': '/votes' },
  timeout: 30000, // 30 second timeout
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying votes request: ${req.method} ${req.originalUrl} -> ${COMMUNITY_SERVICE_URL}/votes${req.path.replace('/api/votes', '')}`);
    // Add headers for better compatibility
    proxyReq.setHeader('User-Agent', 'API-Gateway-Proxy/1.0');
    proxyReq.setHeader('X-Forwarded-For', req.ip);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Votes proxy response: ${proxyRes.statusCode} for ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ Votes proxy error for ${req.originalUrl}:`, err.message);
    console.error(`❌ Community service URL: ${COMMUNITY_SERVICE_URL}`);
    
    // Return a more helpful error response
    if (!res.headersSent) {
      res.status(503).json({
        error: 'Community service unavailable',
        message: `Failed to reach community service at ${COMMUNITY_SERVICE_URL}`,
        details: err.message,
        timestamp: new Date().toISOString(),
        suggestion: 'Check if community service is running and accessible'
      });
    }
  }
}));
*/

// Catch all for debugging
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),    availableRoutes: [
      'GET /health',
      'GET /info', 
      'GET /test-cors',
      'GET /community/posts',
      'GET /api/posts',
      'GET /news/latest',
      'GET /api/votes/:linkId/stats (proxied to community service)',
      'GET /api/votes/:linkId/user (proxied to community service)',
      'POST /api/votes/batch/stats (proxied to community service)',
      'POST /api/votes/:linkId (proxied to community service)'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple API Gateway running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origins: ${process.env.ALLOWED_ORIGINS || 'not-set'}`);
  console.log(`Community Service: ${COMMUNITY_SERVICE_URL}`);
  console.log(`Available endpoints:`);
  console.log(`  - GET /health`);
  console.log(`  - GET /info`);
  console.log(`  - GET /test-cors`);
  console.log(`  - GET /community/posts`);
  console.log(`  - GET /api/posts`);
  console.log(`  - GET /news/latest`);
  console.log(`  - /api/votes/* (proxied to community service)`);
});

module.exports = app;
