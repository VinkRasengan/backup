const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Basic CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://frontend-eklp.onrender.com',
      'https://factcheck-api-gateway.onrender.com',
      'https://factcheck-frontend.onrender.com',
      'http://localhost:3000',
      'http://localhost:8080'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    data: [
      {
        id: '1',
        title: 'Test Post from API Gateway',
        content: 'This proves the API Gateway is working',
        author: 'API Gateway',
        timestamp: new Date().toISOString()
      }
    ],
    message: 'Mock data from simple API Gateway'
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

// Catch all for debugging
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /info', 
      'GET /test-cors',
      'GET /community/posts',
      'GET /news/latest'
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
  console.log(`Available endpoints:`);
  console.log(`  - GET /health`);
  console.log(`  - GET /info`);
  console.log(`  - GET /test-cors`);
  console.log(`  - GET /community/posts`);
  console.log(`  - GET /news/latest`);
});

module.exports = app;
