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

// API routes - proxy to community service for API endpoints with manual handlers for better control
app.all('/api/votes*', async (req, res) => {
    try {
        console.log(`🔄 Votes proxy: ${req.method} ${req.originalUrl} → ${services.community.target}/api/votes`);

        const targetPath = req.originalUrl.replace('/api/votes', '/api/votes');
        const targetUrl = `${services.community.target}${targetPath}`;
        console.log(`🎯 Target URL: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                host: undefined // Remove host header to avoid conflicts
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
        });

        const data = await response.text();
        res.status(response.status);

        // Copy response headers
        response.headers.forEach((value, key) => {
            res.set(key, value);
        });

        res.send(data);
    } catch (error) {
        console.error(`❌ Votes proxy error:`, error.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'community-votes',
            message: 'Votes service is not responding',
            timestamp: new Date().toISOString()
        });
    }
});

app.all('/api/comments*', async (req, res) => {
    try {
        console.log(`🔄 Comments proxy: ${req.method} ${req.originalUrl} → ${services.community.target}/api/comments`);

        const targetPath = req.originalUrl.replace('/api/comments', '/api/comments');
        const targetUrl = `${services.community.target}${targetPath}`;
        console.log(`🎯 Target URL: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                host: undefined // Remove host header to avoid conflicts
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
        });

        const data = await response.text();
        res.status(response.status);

        // Copy response headers
        response.headers.forEach((value, key) => {
            res.set(key, value);
        });

        res.send(data);
    } catch (error) {
        console.error(`❌ Comments proxy error:`, error.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'community-comments',
            message: 'Comments service is not responding',
            timestamp: new Date().toISOString()
        });
    }
});

app.use('/api/posts', createProxyMiddleware({
    target: services.community.target,
    changeOrigin: true,
    pathRewrite: { '^/api/posts': '/api/posts' },
    onError: (err, req, res) => {
        console.error(`❌ Proxy error for posts API:`, err.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'community-posts',
            message: 'Posts service is not responding',
            timestamp: new Date().toISOString()
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying ${req.method} ${req.originalUrl} → ${services.community.target}${proxyReq.path}`);
    }
}));

// Add /api/community/* routes for frontend compatibility (must be before /api/links)
app.use('/api/community', createProxyMiddleware({
    target: services.community.target,
    changeOrigin: true,
    pathRewrite: { '^/api/community': '' },
    onError: (err, req, res) => {
        console.error(`❌ Proxy error for community API:`, err.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'community-api',
            message: 'Community service is not responding',
            timestamp: new Date().toISOString()
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying ${req.method} ${req.originalUrl} → ${services.community.target}${proxyReq.path}`);
    }
}));

// Add /api/links route for community links - using manual proxy
app.all('/api/links*', async (req, res) => {
    try {
        console.log(`🔄 Manual proxy: ${req.method} ${req.originalUrl} → ${services.community.target}/api/links`);

        const targetUrl = `${services.community.target}/api/links${req.url.replace('/api/links', '')}`;
        console.log(`🎯 Target URL: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                ...req.headers,
                host: undefined // Remove host header to avoid conflicts
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
        });

        const data = await response.text();
        res.status(response.status);

        // Copy response headers
        response.headers.forEach((value, key) => {
            res.set(key, value);
        });

        res.send(data);
    } catch (error) {
        console.error(`❌ Manual proxy error for links API:`, error.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'community-links',
            message: 'Links service is not responding',
            timestamp: new Date().toISOString()
        });
    }
});

app.use('/api/stats', createProxyMiddleware({
    target: services.community.target,
    changeOrigin: true,
    pathRewrite: { '^/api/stats': '/api/stats' },
    onError: (err, req, res) => {
        console.error(`❌ Proxy error for stats API:`, err.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'community-stats',
            message: 'Stats service is not responding',
            timestamp: new Date().toISOString()
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying ${req.method} ${req.originalUrl} → ${services.community.target}${proxyReq.path}`);
    }
}));

// Chat API routes - manual proxy
app.all('/api/chat*', async (req, res) => {
    try {
        console.log(`🔄 Manual Chat proxy: ${req.method} ${req.originalUrl} → ${services.chat.target}/chat`);

        const targetPath = req.originalUrl.replace('/api/chat', '/chat');
        const targetUrl = `${services.chat.target}${targetPath}`;
        console.log(`🎯 Target URL: ${targetUrl}`);

        const headers = {
            'Content-Type': req.headers['content-type'] || 'application/json',
            'User-Agent': req.headers['user-agent'] || 'API-Gateway'
        };

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
        });

        const data = await response.text();
        res.status(response.status);

        // Copy response headers
        response.headers.forEach((value, key) => {
            res.set(key, value);
        });

        res.send(data);
    } catch (error) {
        console.error(`❌ Chat proxy error:`, error.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'chat-api',
            message: 'Chat service is not responding',
            timestamp: new Date().toISOString()
        });
    }
});

// Auth API routes
app.use('/api/auth', createProxyMiddleware({
    target: services.auth.target,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/api' },
    onError: (err, req, res) => {
        console.error(`❌ Proxy error for auth API:`, err.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'auth-api',
            message: 'Auth service is not responding',
            timestamp: new Date().toISOString()
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying ${req.method} ${req.originalUrl} → ${services.auth.target}${req.url}`);
    }
}));

// Community API routes
app.use('/api/community', createProxyMiddleware({
    target: services.community.target,
    changeOrigin: true,
    pathRewrite: { '^/api/community': '/api' },
    onError: (err, req, res) => {
        console.error(`❌ Proxy error for community API:`, err.message);
        res.status(503).json({
            error: 'Service unavailable',
            service: 'community-api',
            message: 'Community service is not responding',
            timestamp: new Date().toISOString()
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying ${req.method} ${req.originalUrl} → ${services.community.target}${req.url}`);
    }
}));

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
            'POST /api/votes - Vote on content',
            'GET /api/votes/:linkId - Get vote stats',
            'POST /api/comments - Create comment',
            'GET /api/comments/:linkId - Get comments',
            'GET /api/posts - Get posts',
            'POST /api/posts - Create post',
            'GET /api/links - Get community links',
            'POST /api/links - Create community link',
            'GET /api/community/* - Community service endpoints',
            'POST /api/chat/gemini - Gemini AI chat',
            'GET /api/chat/test-gemini - Test Gemini config',
            'GET /api/chat/starters - Get conversation starters',
            'GET /api/stats - Get statistics',
            'POST /api/auth/login - Login',
            'POST /api/auth/register - Register',
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
