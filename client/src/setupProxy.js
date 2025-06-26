const { createProxyMiddleware } = require('http-proxy-middleware');

// Get proxy target based on environment
const getProxyTarget = () => {
  // In production on Render, use the API Gateway URL
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Development fallback
  return 'http://localhost:8080';
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

  // Proxy auth routes
  app.use('/auth', createProxyMiddleware(createCommonProxy('Auth', '🔐')));

  // Proxy user routes
  app.use('/users', createProxyMiddleware(createCommonProxy('Users', '👤')));

  // Proxy chat routes
  app.use('/chat', createProxyMiddleware(createCommonProxy('Chat', '💬')));

  // Proxy news routes
  app.use('/news', createProxyMiddleware(createCommonProxy('News', '📰')));

  // Proxy links routes
  app.use('/links', createProxyMiddleware(createCommonProxy('Links', '🔗')));

  // Proxy admin routes
  app.use('/admin', createProxyMiddleware(createCommonProxy('Admin', '⚙️')));

  // Proxy community routes
  app.use('/community', createProxyMiddleware(createCommonProxy('Community', '👥')));

  // Proxy posts routes (for community posts)
  app.use('/posts', createProxyMiddleware(createCommonProxy('Posts', '📝')));

  // Proxy votes routes
  app.use('/votes', createProxyMiddleware(createCommonProxy('Votes', '👍')));

  // Proxy comments routes
  app.use('/comments', createProxyMiddleware(createCommonProxy('Comments', '💬')));
};
