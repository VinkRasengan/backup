const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
// Load environment variables using new standardized loader
const PORT = process.env.CRIMINALIP_SERVICE_PORT || process.env.PORT || 3008;
const SERVICE_NAME = 'criminalip-service';

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
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
    }
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'CriminalIP Security Analysis Service',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// CriminalIP analysis endpoint (placeholder)
app.post('/analyze', (req, res) => {
  const { url, ip } = req.body;
  
  if (!url && !ip) {
    return res.status(400).json({
      error: 'URL or IP address is required',
      code: 'MISSING_PARAMETER'
    });
  }

  // Placeholder response - in real implementation, this would call CriminalIP API
  res.json({
    service: SERVICE_NAME,
    target: url || ip,
    result: {
      risk_score: 0,
      is_malicious: false,
      threat_types: [],
      country: 'Unknown',
      isp: 'Unknown',
      last_seen: null,
      reputation: 'clean'
    },
    timestamp: new Date().toISOString(),
    note: 'CriminalIP service is currently in placeholder mode'
  });
});

// Batch analysis endpoint
app.post('/analyze/batch', (req, res) => {
  const { targets } = req.body;
  
  if (!targets || !Array.isArray(targets)) {
    return res.status(400).json({
      error: 'Targets array is required',
      code: 'INVALID_INPUT'
    });
  }

  // Placeholder batch response
  const results = targets.map(target => ({
    target,
    result: {
      risk_score: 0,
      is_malicious: false,
      threat_types: [],
      country: 'Unknown',
      isp: 'Unknown',
      last_seen: null,
      reputation: 'clean'
    }
  }));

  res.json({
    service: SERVICE_NAME,
    results,
    total: targets.length,
    timestamp: new Date().toISOString(),
    note: 'CriminalIP service is currently in placeholder mode'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    service: SERVICE_NAME,
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /info',
      'POST /analyze',
      'POST /analyze/batch'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Request error:', error);
  
  if (!res.headersSent) {
    res.status(error.status || 500).json({
      error: error.message || 'Internal server error',
      service: SERVICE_NAME,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 ${SERVICE_NAME} started on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => {
      process.exit(1);
    });
  });
}

module.exports = app;
