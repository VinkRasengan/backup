const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3006;
// Service configuration
const service = {
    name: 'Admin Service',
    version: '1.0.0',
    port: PORT
};

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
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint with Firebase connectivity
app.get('/health', async (req, res) => {
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

    // Firebase connectivity check
    try {
        const { db } = require('./src/config/firebase');
        if (db) {
            const startTime = Date.now();
            // Try to read from a test collection
            await db.collection('health-check').limit(1).get();
            const duration = Date.now() - startTime;

            healthChecks.firebase = {
                status: 'healthy',
                duration: `${duration}ms`,
                result: {
                    connected: true,
                    projectId: process.env.FIREBASE_PROJECT_ID
                },
                timestamp: new Date().toISOString()
            };
        } else {
            healthChecks.firebase = {
                status: 'warning',
                duration: '0ms',
                result: {
                    connected: false,
                    message: 'Firebase not initialized'
                },
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        healthChecks.firebase = {
            status: 'unhealthy',
            duration: '0ms',
            result: {
                connected: false,
                error: error.message
            },
            timestamp: new Date().toISOString()
        };
    }

    const overallStatus = Object.values(healthChecks).some(check => check.status === 'unhealthy')
        ? 'unhealthy'
        : Object.values(healthChecks).some(check => check.status === 'warning')
        ? 'warning'
        : 'healthy';

    res.status(overallStatus === 'unhealthy' ? 503 : 200).json({
        service: 'admin-service',
        status: overallStatus,
        timestamp: new Date().toISOString(),
        port: PORT,
        version: '1.0.0',
        checks: healthChecks
    });
});

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'admin-service is running',
        version: '1.0.0',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// API routes placeholder
app.get('/api', (req, res) => {
    res.json({
        service: 'admin-service',
        message: 'API endpoint ready',
        endpoints: [
            'GET /',
            'GET /health',
            'GET /api'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        service: 'admin-service',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        service: 'admin-service',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 ${service.name} running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

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
