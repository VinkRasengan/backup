const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Import Event-Driven Architecture components
const AuthEventHandlers = require('./src/events/authEventHandlers');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;
// Service configuration
const service = {
    name: 'Auth Service',
    version: '1.0.0',
    port: PORT
};

// Initialize Event Handlers
let eventHandlers = null;

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: {
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes'
  }
});

// CORS configuration for credentials support
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Get allowed origins from environment or use defaults
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
            : [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:8080',
                'https://factcheck-vn.netlify.app',
                'https://factcheck.vn'
            ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID',
        'X-Request-ID',
        'Cache-Control'
    ],
    exposedHeaders: ['X-Correlation-ID']
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(logger.requestLogger());

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const healthChecks = {
            memory: {
                status: 'healthy',
                duration: '0ms',
                result: {
                    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
                },
                timestamp: new Date().toISOString()
            },
            uptime: {
                status: 'healthy',
                duration: '0ms',
                result: {
                    uptime: Math.round(process.uptime()) + 's'
                },
                timestamp: new Date().toISOString()
            },
            environment: {
                status: 'healthy',
                duration: '0ms',
                result: {
                    nodeVersion: process.version,
                    environment: process.env.NODE_ENV || 'development'
                },
                timestamp: new Date().toISOString()
            }
        };

        // Check Event Bus connection if available
        if (eventHandlers) {
            try {
                const eventBusHealth = await eventHandlers.healthCheck();
                healthChecks.eventBus = {
                    status: eventBusHealth ? 'healthy' : 'unhealthy',
                    duration: '0ms',
                    result: {
                        connected: eventBusHealth,
                        eventBusUrl: process.env.EVENT_BUS_SERVICE_URL || 'http://localhost:3007'
                    },
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                healthChecks.eventBus = {
                    status: 'unhealthy',
                    duration: '0ms',
                    result: {
                        error: error.message
                    },
                    timestamp: new Date().toISOString()
                };
            }
        }

        const overallStatus = Object.values(healthChecks).every(check => check.status === 'healthy') ? 'healthy' : 'degraded';

        res.json({
            service: 'auth-service',
            status: overallStatus,
            timestamp: new Date().toISOString(),
            port: PORT,
            version: '1.0.0',
            eventDriven: !!eventHandlers,
            checks: healthChecks
        });

    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(500).json({
            service: 'auth-service',
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'auth-service is running',
        version: '1.0.0',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Import API routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');

// Middleware to pass event handlers to routes
app.use((req, res, next) => {
    if (eventHandlers) {
        req.app.set('eventHandlers', eventHandlers);
    }
    next();
});

// Apply rate limiting to auth endpoints
app.use('/api/auth', authLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        service: 'auth-service',
        message: 'Authentication API ready',
        version: '1.0.0',
        eventDriven: !!eventHandlers,
        endpoints: {
            auth: [
                'POST /api/auth/register - User registration',
                'POST /api/auth/login - User login',
                'POST /api/auth/logout - User logout',
                'POST /api/auth/refresh - Refresh token',
                'POST /api/auth/forgot-password - Request password reset',
                'POST /api/auth/reset-password - Reset password',
                'POST /api/auth/verify-email - Verify email address'
            ],
            users: [
                'GET /api/users/profile - Get user profile',
                'PUT /api/users/profile - Update user profile',
                'POST /api/users/change-password - Change password',
                'GET /api/users/sessions - Get user sessions',
                'DELETE /api/users/sessions/:id - Revoke session'
            ]
        },
        features: {
            eventDriven: !!eventHandlers,
            rateLimiting: true,
            jwtAuth: true,
            emailVerification: true,
            passwordReset: true,
            sessionManagement: true
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        service: 'auth-service',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        service: 'auth-service',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Initialize Event-Driven Architecture
async function initializeEventDrivenArchitecture() {
    if (process.env.ENABLE_EVENT_DRIVEN === 'true') {
        try {
            logger.info('Initializing Event-Driven Architecture...');
            eventHandlers = new AuthEventHandlers();
            await eventHandlers.initialize();
            logger.info('Event-Driven Architecture initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Event-Driven Architecture', {
                error: error.message,
                stack: error.stack
            });
            // Continue without event-driven features in development
            if (process.env.NODE_ENV === 'production') {
                throw error;
            }
        }
    } else {
        logger.info('Event-Driven Architecture disabled');
    }
}

// Start server
async function startServer() {
    try {
        // Initialize Event-Driven Architecture first
        await initializeEventDrivenArchitecture();

        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info('Auth Service started successfully', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                eventDriven: !!eventHandlers,
                healthCheck: `http://localhost:${PORT}/health`
            });
        });

        return server;
    } catch (error) {
        logger.error('Failed to start Auth Service', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Start the server
const serverPromise = startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;
