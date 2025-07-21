const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

// Load environment variables from root .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 8080;
// Service configuration
const service = {
    name: 'API Gateway',
    version: '1.0.0',
    port: PORT
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        service: 'api-gateway',
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
        message: 'api-gateway is running',
        version: '1.0.0',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Service proxy configurations
const services = {
    auth: {
        target: `http://localhost:${process.env.AUTH_SERVICE_PORT || 3001}`,
        pathRewrite: { '^/auth': '' }
    },
    link: {
        target: `http://localhost:${process.env.LINK_SERVICE_PORT || 3002}`,
        pathRewrite: { '^/link': '' }
    },
    community: {
        target: `http://localhost:${process.env.COMMUNITY_SERVICE_PORT || 3003}`,
        pathRewrite: { '^/community': '' }
    },
    chat: {
        target: `http://localhost:${process.env.CHAT_SERVICE_PORT || 3004}`,
        pathRewrite: { '^/chat': '' }
    },
    news: {
        target: `http://localhost:${process.env.NEWS_SERVICE_PORT || 3005}`,
        pathRewrite: { '^/news': '' }
    },
    admin: {
        target: `http://localhost:${process.env.ADMIN_SERVICE_PORT || 3006}`,
        pathRewrite: { '^/admin': '' }
    }
};

// Create proxy middleware for each service
Object.keys(services).forEach(serviceName => {
    const config = services[serviceName];
    app.use(`/${serviceName}`, createProxyMiddleware({
        target: config.target,
        changeOrigin: true,
        pathRewrite: config.pathRewrite,
        onError: (err, req, res) => {
            console.error(`❌ Proxy error for ${serviceName}:`, err.message);
            res.status(503).json({
                error: 'Service unavailable',
                service: serviceName,
                message: `${serviceName} service is not responding`,
                timestamp: new Date().toISOString()
            });
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`🔄 Proxying ${req.method} ${req.originalUrl} → ${config.target}${req.url}`);
        }
    }));
});

// API routes placeholder
app.get('/api', (req, res) => {
    res.json({
        service: 'api-gateway',
        message: 'API endpoint ready',
        services: Object.keys(services),
        endpoints: [
            'GET /',
            'GET /health',
            'GET /api',
            ...Object.keys(services).map(service => `/${service}/* → ${services[service].target}`)
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        service: 'api-gateway',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        service: 'api-gateway',
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
