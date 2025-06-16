const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

// Load environment variables from root directory
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PHISHTANK_SERVICE_PORT || 3008;
const SERVICE_NAME = 'phishtank-service';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8080'
    ];
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});

// Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'PhishTank Opensource Service using Public Data Feed',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    features: {
      phishingDetection: true,
      urlAnalysis: true,
      offlineDatabase: true,
      autoUpdate: true
    },
    dataSource: 'http://data.phishtank.com/data/online-valid.json'
  });
});

// Import routes
const phishtankRoutes = require('./routes/phishtank');
app.use('/phishtank', phishtankRoutes);

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
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

// Schedule database updates (every 6 hours)
cron.schedule('0 */6 * * *', () => {
  console.log('🔄 Scheduled PhishTank database update...');
  const updateDatabase = require('./scripts/updateDatabase');
  updateDatabase.updatePhishTankDatabase();
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 ${SERVICE_NAME} started on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎣 Features: Phishing Detection, URL Analysis, Offline Database`);
  console.log(`⏰ Auto-update: Every 6 hours`);
  
  // Initial database update
  const updateDatabase = require('./scripts/updateDatabase');
  updateDatabase.updatePhishTankDatabase();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
