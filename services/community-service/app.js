const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Import Event-Driven Architecture components
const CommunityEventHandlers = require('./src/events/communityEventHandlers');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.COMMUNITY_SERVICE_PORT || 3003;
// Service configuration
const service = {
    name: 'Community Service',
    version: '1.0.0',
    port: PORT
};

// Initialize Event Handlers
let eventHandlers = null;

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
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.logRequest(req, res, duration);
    });
    next();
});

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
            service: 'community-service',
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
            service: 'community-service',
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'community-service is running',
        version: '1.0.0',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Import API routes
const linksRoutes = require('./src/routes/links');
const postsRoutes = require('./src/routes/posts');
const commentsRoutes = require('./src/routes/comments');
const reportsRoutes = require('./src/routes/reports');
const votesRoutes = require('./src/routes/votes');
const statsRoutes = require('./src/routes/stats');
const cacheRoutes = require('./src/routes/cache');

// Import authentication middleware
const { authMiddleware } = require('./src/middleware/auth');

// Import cache manager
const { communityCache } = require('./src/utils/communityCache');

// Middleware to pass event handlers to routes
app.use((req, res, next) => {
    if (eventHandlers) {
        req.app.set('eventHandlers', eventHandlers);
    }
    next();
});

// API routes - Both with and without /api prefix for compatibility
app.use('/links', linksRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/comments', commentsRoutes);
app.use('/api/reports', reportsRoutes);
// Apply authentication middleware to votes routes
app.use('/api/votes', authMiddleware, votesRoutes);
app.use('/votes', authMiddleware, votesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/cache', cacheRoutes); // Cache management routes

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        service: 'community-service',
        message: 'Community API ready',
        version: '1.0.0',
        eventDriven: !!eventHandlers,
        endpoints: {
            posts: [
                'GET /api/posts - Get all posts',
                'POST /api/posts - Create new post',
                'GET /api/posts/:id - Get post by ID',
                'PUT /api/posts/:id - Update post',
                'DELETE /api/posts/:id - Delete post',
                'POST /api/posts/:id/vote - Vote on post',
                'POST /api/posts/:id/comments - Add comment to post',
                'GET /api/posts/:id/comments - Get post comments'
            ],
            comments: [
                'GET /api/comments - Get all comments',
                'POST /api/comments - Create comment',
                'GET /api/comments/:id - Get comment by ID',
                'PUT /api/comments/:id - Update comment',
                'DELETE /api/comments/:id - Delete comment',
                'POST /api/comments/:id/vote - Vote on comment'
            ],
            reports: [
                'POST /api/reports - Submit content report',
                'GET /api/reports - Get reports (admin/moderator)',
                'GET /api/reports/:id - Get report by ID',
                'PUT /api/reports/:id - Update report status',
                'GET /api/reports/stats/summary - Get report statistics'
            ],
            votes: [
                'POST /api/votes - Cast vote',
                'GET /api/votes/user/:userId - Get user votes',
                'DELETE /api/votes/:id - Remove vote'
            ],
            stats: [
                'GET /api/stats/overview - Get community statistics',
                'GET /api/stats/posts - Get post statistics',
                'GET /api/stats/users - Get user statistics'
            ]
        },
        features: {
            eventDriven: !!eventHandlers,
            realTimeNotifications: process.env.ENABLE_REAL_TIME_NOTIFICATIONS === 'true',
            autoModeration: process.env.AUTO_MODERATION_ENABLED === 'true',
            reputationSystem: process.env.FEATURE_REPUTATION_ENABLED === 'true'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        service: 'community-service',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        service: 'community-service',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Initialize Event-Driven Architecture
async function initializeEventDrivenArchitecture() {
    if (process.env.ENABLE_EVENT_DRIVEN === 'true') {
        try {
            logger.info('Initializing Event-Driven Architecture...');
            eventHandlers = new CommunityEventHandlers();
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

        // Initialize Redis cache
        logger.info('Initializing Redis cache...');
        await communityCache.initialize();

        const cacheHealth = await communityCache.getCacheMetrics();
        logger.info('Cache initialization completed', {
            status: cacheHealth?.health?.overall || 'unknown',
            redisConnected: cacheHealth?.health?.redis?.connected || false
        });

        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info('Community Service started successfully', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                eventDriven: !!eventHandlers,
                cacheEnabled: cacheHealth?.health?.overall === 'healthy',
                healthCheck: `http://localhost:${PORT}/health`,
                cacheManagement: `http://localhost:${PORT}/api/cache/health`
            });
        });

        return server;
    } catch (error) {
        logger.error('Failed to start Community Service', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
}

// Start the server
const serverPromise = startServer();

// Graceful shutdown
async function gracefulShutdown(signal) {
    logger.info(`${signal} received, shutting down gracefully`);

    try {
        // Close event handlers first
        if (eventHandlers) {
            logger.info('Closing event handlers...');
            await eventHandlers.close();
        }

        // Close server
        const server = await serverPromise;
        if (server) {
            server.close(() => {
                logger.info('Community Service shut down successfully');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    } catch (error) {
        logger.error('Error during graceful shutdown', {
            error: error.message,
            stack: error.stack
        });
        // Force exit only if really necessary
        setTimeout(() => process.exit(1), 1000);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', {
        error: err.message,
        stack: err.stack
    });
    // Don't exit in development, just log the error
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
        reason: reason.toString(),
        promise: promise.toString()
    });
    // Don't exit in development, just log the error
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

module.exports = app;
