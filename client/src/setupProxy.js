const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy all API calls to API Gateway
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
      timeout: 15000,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.log('API Proxy Error:', err.message);
        console.log('Request URL:', req.url);
        res.status(503).json({
          error: 'API Gateway unavailable',
          message: 'Please ensure API Gateway is running on port 8082',
          requestedUrl: req.url
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔄 Proxying ${req.method} ${req.url} to API Gateway (8082)`);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`✅ Response ${proxyRes.statusCode} for ${req.url}`);
      }
    })
  );

  // Proxy auth routes
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
      timeout: 15000,
      onError: (err, req, res) => {
        console.log('Auth Proxy Error:', err.message);
        res.status(503).json({
          error: 'Auth service unavailable'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔐 Proxying auth ${req.method} ${req.url} to API Gateway`);
      }
    })
  );

  // Proxy user routes
  app.use(
    '/users',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
      timeout: 15000,
      onError: (err, req, res) => {
        console.log('Users Proxy Error:', err.message);
        res.status(503).json({
          error: 'User service unavailable'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`👤 Proxying users ${req.method} ${req.url} to API Gateway`);
      }
    })
  );

  // Proxy chat routes
  app.use(
    '/chat',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
      timeout: 15000,
      onError: (err, req, res) => {
        console.log('Chat Proxy Error:', err.message);
        res.status(503).json({
          error: 'Chat service unavailable'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`💬 Proxying chat ${req.method} ${req.url} to API Gateway`);
      }
    })
  );

  // Proxy news routes
  app.use(
    '/news',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
      timeout: 15000,
      onError: (err, req, res) => {
        console.log('News Proxy Error:', err.message);
        res.status(503).json({
          error: 'News service unavailable'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`📰 Proxying news ${req.method} ${req.url} to API Gateway`);
      }
    })
  );

  // Proxy community routes
  app.use(
    '/community',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
      timeout: 15000,
      onError: (err, req, res) => {
        console.log('Community Proxy Error:', err.message);
        res.status(503).json({
          error: 'Community service unavailable'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`👥 Proxying community ${req.method} ${req.url} to API Gateway`);
      }
    })
  );

  // Proxy links routes
  app.use(
    '/links',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
      timeout: 15000,
      onError: (err, req, res) => {
        console.log('Links Proxy Error:', err.message);
        res.status(503).json({
          error: 'Links service unavailable'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`🔗 Proxying links ${req.method} ${req.url} to API Gateway`);
      }
    })
  );

  // Proxy admin routes
  app.use(
    '/admin',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
      timeout: 15000,
      onError: (err, req, res) => {
        console.log('Admin Proxy Error:', err.message);
        res.status(503).json({
          error: 'Admin service unavailable'
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`⚙️ Proxying admin ${req.method} ${req.url} to API Gateway`);
      }
    })
  );
};
