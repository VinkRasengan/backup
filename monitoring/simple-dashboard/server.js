const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3010;

// Serve static files
app.use(express.static(__dirname));

// API endpoint to get service health
app.get('/api/health', async (req, res) => {
  const services = [
    { name: 'api-gateway', port: 8080, path: '/health' },
    { name: 'auth-service', port: 3001, path: '/health' },
    { name: 'link-service', port: 3002, path: '/health' },
    { name: 'community-service', port: 3003, path: '/health' },
    { name: 'chat-service', port: 3004, path: '/health' },
    { name: 'news-service', port: 3005, path: '/health' },
    { name: 'admin-service', port: 3006, path: '/health' },
    { name: 'webhook-service', port: 5001, path: '/health' }
  ];

  const results = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const response = await axios.get(`http://localhost:${service.port}${service.path}`, {
          timeout: 2000
        });
        return {
          ...service,
          status: 'healthy',
          response: response.data,
          responseTime: response.headers['x-response-time'] || 'N/A'
        };
      } catch (error) {
        return {
          ...service,
          status: 'offline',
          error: error.message,
          responseTime: 'N/A'
        };
      }
    })
  );

  const healthData = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        ...services[index],
        status: 'offline',
        error: result.reason?.message || 'Unknown error',
        responseTime: 'N/A'
      };
    }
  });

  res.json({
    timestamp: new Date().toISOString(),
    services: healthData,
    summary: {
      total: healthData.length,
      healthy: healthData.filter(s => s.status === 'healthy').length,
      offline: healthData.filter(s => s.status === 'offline').length,
      unhealthy: healthData.filter(s => s.status === 'unhealthy').length
    }
  });
});

// API endpoint to get alerts from webhook service
app.get('/api/alerts', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5001/alerts', {
      timeout: 2000
    });
    res.json(response.data);
  } catch (error) {
    res.json({
      error: 'Could not fetch alerts',
      message: error.message,
      alerts: []
    });
  }
});

// Serve index.html on root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Simple Monitoring Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 Health API: http://localhost:${PORT}/api/health`);
  console.log(`🚨 Alerts API: http://localhost:${PORT}/api/alerts`);
});

module.exports = app; 