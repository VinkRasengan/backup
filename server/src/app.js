const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: '../.env' });

// Import path for static files
const path = require('path');

// Database - Firebase Only
const database = require('./config/firebase-database');
// Firebase doesn't need models or sync
const syncDatabase = async () => {
  console.log('🔥 Firebase database - No sync needed');
};

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
const PORT = process.env.PORT || 5001;

// Production environment check
const isProduction = process.env.NODE_ENV === 'production'; // Changed from 5000 to avoid Firebase hosting conflict

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
    version: '2.0.0',
    deployment: 'render-community-features-v2',
    features: ['Community Posts', 'NewsAPI Integration', 'Voting System', 'Enhanced Navigation'],
    lastUpdate: '2025-06-06T14:45:00Z'
  });
});

// API health check
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();

    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      apis: {
        openai: !!process.env.OPENAI_API_KEY,
        virustotal: !!process.env.VIRUSTOTAL_API_KEY,
        newsapi: !!process.env.NEWSAPI_API_KEY,
        newsdata: !!process.env.NEWSDATA_API_KEY
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
  if (linkRoutes) app.use('/api/links', linkRoutes); // Remove auth requirement for some link endpoints
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

// Test OpenAI configuration
app.get('/api/chat/test-openai', async (req, res) => {
  try {
    const openaiService = require('./services/openaiService');
    const isConfigured = openaiService.isConfigured();

    if (!isConfigured) {
      return res.json({
        status: 'NOT_CONFIGURED',
        message: 'OpenAI API key not configured',
        configured: false
      });
    }

    // Test a simple message
    const testResponse = await openaiService.sendMessage('Hello, this is a test message');

    res.json({
      status: 'OK',
      message: 'OpenAI API working!',
      configured: true,
      testResponse: testResponse.success ? 'Success' : testResponse.error
    });
  } catch (error) {
    res.json({
      status: 'ERROR',
      message: 'OpenAI test failed',
      error: error.message
    });
  }
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

// News API routes
try {
  const newsRoutes = require('./routes/news');
  app.use('/api/news', newsRoutes);
  console.log('✅ News API routes loaded successfully');
} catch (error) {
  console.warn('⚠️ News API routes not loaded:', error.message);
}

// Community routes
try {
  const communityRoutes = require('./routes/community');
  app.use('/api/community', communityRoutes);
  console.log('✅ Community routes loaded successfully');
} catch (error) {
  console.warn('⚠️ Community routes not loaded:', error.message);
}

// Community features routes (optional)
try {
  app.use('/api/votes', authenticateToken, require('./routes/votes'));
  app.use('/api/comments', authenticateToken, require('./routes/comments'));
  app.use('/api/reports', authenticateToken, require('./routes/reports'));
  app.use('/api/admin', authenticateToken, require('./routes/admin'));
  console.log('✅ Community features routes loaded');
} catch (error) {
  console.warn('⚠️ Community features routes not loaded:', error.message);
}

// Error handling middleware will be added after routes in startServer()

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database models
    await syncDatabase();
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.warn('⚠️ Database sync failed, continuing with in-memory storage:', error.message);
  }

  // 404 handler - MUST be after all routes
  app.use('*', (req, res) => {
    res.status(404).json({
      code: 404,
      message: 'You have journeyed into the unknown. Where routes do not exist.',
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
      deployment: 'render-community-features-v2'
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
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
