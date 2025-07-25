const { createProxyMiddleware } = require('http-proxy-middleware');

// Load environment variables if needed
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
}

// Get proxy target with strict validation
const getProxyTarget = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Warn about missing configuration
  console.warn('⚠️  REACT_APP_API_URL not configured for proxy');
  console.warn('💡 Set REACT_APP_API_URL in your .env file');
  console.warn('💡 Local dev: REACT_APP_API_URL=http://localhost:8080');
  console.warn('💡 Docker dev: REACT_APP_API_URL=http://api-gateway:8080');

  return 'http://localhost:8080'; // Development fallback with warning
};

module.exports = function(app) {
  const proxyTarget = getProxyTarget();
  console.log('🔗 Proxy target:', proxyTarget);
  console.log('🌍 Environment:', process.env.NODE_ENV);

  // Proxy all API calls to API Gateway
  app.use(
    '/api',
    createProxyMiddleware({
      target: proxyTarget,
      changeOrigin: true,
      timeout: 30000,
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
      onError: (err, req, res) => {
        console.log('API Proxy Error:', err.message);
        console.log('Request URL:', req.url);
        console.log('Proxy Target:', proxyTarget);
        res.status(503).json({
          error: 'API Gateway unavailable',
          message: `Cannot connect to API Gateway at ${proxyTarget}`,
          requestedUrl: req.url,
          environment: process.env.NODE_ENV
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Proxying ${req.method} ${req.url} to ${proxyTarget}`);
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Response ${proxyRes.statusCode} for ${req.url}`);
        }
      }
    })
  );

  // Create common proxy configuration
  const createCommonProxy = (pathName, emoji) => ({
    target: proxyTarget,
    changeOrigin: true,
    timeout: 30000,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    onError: (err, req, res) => {
      console.log(`${pathName} Proxy Error:`, err.message);
      res.status(503).json({
        error: `${pathName} service unavailable`,
        target: proxyTarget
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${emoji} Proxying ${pathName} ${req.method} ${req.url} to ${proxyTarget}`);
      }
    }
  });

  // Proxy auth routes (backend API)
  app.use('/auth', createProxyMiddleware(createCommonProxy('Auth', '🔐')));

  // Proxy user routes (backend API)
  app.use('/users', createProxyMiddleware(createCommonProxy('Users', '👤')));

  // ❌ REMOVED: These are frontend routes, should be handled by React Router
  // Frontend routes like /chat and /community should NOT be proxied to backend
  // They should be handled by React Router for SPA functionality
  // app.use('/chat', createProxyMiddleware(createCommonProxy('Chat', '💬')));
  // app.use('/community', createProxyMiddleware(createCommonProxy('Community', '👥')));

  // Proxy backend API routes only
  app.use('/news', createProxyMiddleware(createCommonProxy('News', '📰')));
  app.use('/links', createProxyMiddleware(createCommonProxy('Links', '🔗')));
  // ❌ REMOVED: /admin is a FRONTEND route, not backend API
  // Frontend routes like /admin should be handled by React Router
  // Backend admin APIs are at /api/admin/* (already handled by /api proxy above)
  // app.use('/admin', createProxyMiddleware(createCommonProxy('Admin', '⚙️')));
  app.use('/posts', createProxyMiddleware(createCommonProxy('Posts', '📝')));
  app.use('/votes', createProxyMiddleware(createCommonProxy('Votes', '👍')));
  app.use('/comments', createProxyMiddleware(createCommonProxy('Comments', '💬')));
};
