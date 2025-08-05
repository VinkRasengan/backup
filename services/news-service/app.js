const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.NEWS_SERVICE_PORT || 3005;
// Service configuration
const service = {
    name: 'News Service',
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        service: 'news-service',
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
        message: 'news-service is running',
        version: '1.0.0',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// News endpoints
app.get('/latest', (req, res) => {
    const { source = 'all', pageSize = 10, page = 1 } = req.query;

    // Mock news articles
    const mockArticles = [
        {
            id: '1',
            title: 'Cảnh báo: Chiến dịch lừa đảo mới nhắm vào khách hàng ngân hàng',
            summary: 'Các nhà nghiên cứu bảo mật đã phát hiện một chiến dịch lừa đảo tinh vi nhắm vào thông tin tài khoản ngân hàng...',
            url: 'https://example.com/news/1',
            publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            source: 'VnExpress',
            category: 'Công nghệ',
            credibilityScore: 95
        },
        {
            id: '2',
            title: 'Phát hiện lỗ hổng bảo mật nghiêm trọng trong ứng dụng di động phổ biến',
            summary: 'Các chuyên gia an ninh mạng đã tìm thấy lỗ hổng có thể cho phép kẻ tấn công truy cập dữ liệu người dùng...',
            url: 'https://example.com/news/2',
            publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            source: 'Tuổi Trẻ',
            category: 'Bảo mật',
            credibilityScore: 92
        },
        {
            id: '3',
            title: 'Xu hướng tin tức giả tăng mạnh trên mạng xã hội',
            summary: 'Báo cáo mới nhất cho thấy tỷ lệ tin tức giả lan truyền trên các nền tảng mạng xã hội đã tăng 40% trong tháng qua...',
            url: 'https://example.com/news/3',
            publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
            source: 'Thanh Niên',
            category: 'Xã hội',
            credibilityScore: 88
        },
        {
            id: '4',
            title: 'Chính phủ ra mắt nền tảng kiểm tra thông tin mới',
            summary: 'Nền tảng mới sử dụng AI để tự động phát hiện và đánh giá độ tin cậy của thông tin trên internet...',
            url: 'https://example.com/news/4',
            publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
            source: 'VietnamNet',
            category: 'Chính trị',
            credibilityScore: 96
        },
        {
            id: '5',
            title: 'Công nghệ AI giúp phát hiện tin tức giả',
            summary: 'Các công ty công nghệ đang phát triển hệ thống AI tiên tiến để tự động phát hiện và gắn cờ tin tức giả...',
            url: 'https://example.com/news/5',
            publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
            source: 'VietnamNet',
            category: 'Công nghệ',
            credibilityScore: 94
        }
    ];

    // Filter by source if specified
    let filteredArticles = mockArticles;
    if (source !== 'all') {
        filteredArticles = mockArticles.filter(article =>
            article.source.toLowerCase().includes(source.toLowerCase())
        );
    }

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

    res.json({
        success: true,
        data: {
            articles: paginatedArticles,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total: filteredArticles.length,
                totalPages: Math.ceil(filteredArticles.length / pageSize)
            },
            source,
            timestamp: new Date().toISOString()
        }
    });
});

// API routes placeholder
app.get('/api', (req, res) => {
    res.json({
        service: 'news-service',
        message: 'API endpoint ready',
        endpoints: [
            'GET /',
            'GET /health',
            'GET /api',
            'GET /latest'
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        service: 'news-service',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not found',
        service: 'news-service',
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
