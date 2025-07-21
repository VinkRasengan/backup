const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        service: 'chat-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: PORT,
        version: '1.0.0',
        checks: {
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
        }
    });
});

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: 'chat-service is running',
        version: '1.0.0',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// API routes placeholder
app.get('/api', (req, res) => {
    res.json({
        service: 'chat-service',
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
        service: 'chat-service',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        service: 'chat-service',
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
