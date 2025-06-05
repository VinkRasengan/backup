const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import path for static files
const path = require('path');

// Import middleware (with error handling)
let errorHandler, authenticateToken, authRoutes, userRoutes, linkRoutes;

try {
  errorHandler = require('./middleware/errorHandler');

  // Try pure auth first (no Firebase), then hybrid, then regular
  try {
    const pureAuth = require('./middleware/pureAuth');
    authenticateToken = pureAuth.authenticateToken;
    console.log('✅ Using pure backend authentication (No Firebase)');
  } catch (pureError) {
    console.warn('⚠️ Pure auth not available, trying hybrid auth...');
    try {
      const hybridAuth = require('./middleware/hybridAuth');
      authenticateToken = hybridAuth.authenticateToken;
      console.log('✅ Using hybrid authentication (Firebase + JWT)');
    } catch (hybridError) {
      console.warn('⚠️ Hybrid auth not available, trying regular auth...');
      const authMiddleware = require('./middleware/auth');
      authenticateToken = authMiddleware.authenticateToken;
      console.log('✅ Using regular authentication');
    }
  }

  authRoutes = require('./routes/auth');
  userRoutes = require('./routes/users');
  linkRoutes = require('./routes/links');
} catch (error) {
  console.warn('⚠️ Some middleware/routes not found, using fallbacks:', error.message);

  // Fallback middleware
  errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  };

  authenticateToken = (req, res, next) => {
    // Skip auth for now
    req.user = { userId: 'demo-user', email: 'demo@example.com' };
    next();
  };
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://factcheck-frontend.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    service: 'FactCheck Backend API',
    version: '1.0.1',
    deployment: 'render-force-deploy'
  });
});

// API health check
app.get('/api/health', async (req, res) => {
  try {
    const database = require('./config/database');
    const dbHealth = await database.healthCheck();

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      apis: {
        openai: !!process.env.OPENAI_API_KEY,
        virustotal: !!process.env.VIRUSTOTAL_API_KEY
      },
      authentication: {
        type: 'firebase-backend-bridge',
        frontend: 'Firebase Auth (login/email verification)',
        backend: 'JWT tokens (API access)',
        database: dbHealth.type,
        jwt: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes (with error handling)
try {
  // Try Firebase-Backend bridge first, then pure auth, then fallbacks
  try {
    const firebaseBackendRoutes = require('./routes/firebaseBackend');
    app.use('/api/auth', firebaseBackendRoutes);
    console.log('✅ Using Firebase-Backend bridge routes (Firebase Auth + Backend Features)');
  } catch (firebaseBackendError) {
    console.warn('⚠️ Firebase-Backend bridge not available, trying pure auth...');
    try {
      const pureAuthRoutes = require('./routes/pureAuth');
      app.use('/api/auth', pureAuthRoutes);
      console.log('✅ Using pure backend auth routes (No Firebase)');
    } catch (pureError) {
      console.warn('⚠️ Pure auth not available, trying hybrid auth routes...');
      try {
        const hybridAuthRoutes = require('./routes/hybridAuth');
        app.use('/api/auth', hybridAuthRoutes);
        console.log('✅ Using hybrid auth routes');
      } catch (hybridError) {
        console.warn('⚠️ Hybrid auth routes not available, using regular auth routes');
        if (authRoutes) app.use('/api/auth', authRoutes);
      }
    }
  }

  if (userRoutes) app.use('/api/users', authenticateToken, userRoutes);
  if (linkRoutes) app.use('/api/links', authenticateToken, linkRoutes);
} catch (error) {
  console.error('❌ Error loading main routes:', error.message);
}

// Simple test chat route first
app.get('/api/chat/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Simple chat test route working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Chat routes (essential for frontend) - Load separately with detailed error handling
try {
  console.log('🔄 Loading chat routes...');
  const chatRoutes = require('./routes/chat');
  app.use('/api/chat', chatRoutes);
  console.log('✅ Chat routes loaded successfully');
} catch (error) {
  console.error('❌ CRITICAL: Chat routes failed to load:', error);
  console.error('Stack trace:', error.stack);

  // Fallback chat routes
  app.use('/api/chat', (req, res) => {
    res.status(503).json({
      error: 'Chat service temporarily unavailable',
      message: 'Chat routes failed to load on server startup',
      timestamp: new Date().toISOString(),
      errorDetails: error.message
    });
  });
}

// Community features routes (optional)
try {
  app.use('/api/votes', authenticateToken, require('./routes/votes'));
  app.use('/api/comments', authenticateToken, require('./routes/comments'));
  app.use('/api/reports', authenticateToken, require('./routes/reports'));
  app.use('/api/admin', authenticateToken, require('./routes/admin'));
  console.log('✅ Community routes loaded');
} catch (error) {
  console.warn('⚠️ Community routes not loaded:', error.message);
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Debug: Chat routes loaded: ${!!app._router}`);
  console.log(`🔧 Debug: Available routes:`, app._router?.stack?.map(r => r.route?.path || r.regexp).filter(Boolean));
});

module.exports = app;
