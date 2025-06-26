#!/usr/bin/env node

/**
 * Simple Local Monitoring Dashboard - No Docker Required
 * Chạy một web server đơn giản để hiển thị trạng thái các services
 */

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3010; // Sử dụng port 3010 giống Grafana

// Services cần monitor
const services = [
  { name: 'Frontend', url: 'http://localhost:3000', port: 3000 },
  { name: 'API Gateway', url: 'http://localhost:8080/health', port: 8080 },
  { name: 'Auth Service', url: 'http://localhost:3001/health', port: 3001 },
  { name: 'Link Service', url: 'http://localhost:3002/health', port: 3002 },
  { name: 'Community Service', url: 'http://localhost:3003/health', port: 3003 },
  { name: 'Chat Service', url: 'http://localhost:3004/health', port: 3004 },
  { name: 'News Service', url: 'http://localhost:3005/health', port: 3005 },
  { name: 'Admin Service', url: 'http://localhost:3006/health', port: 3006 },
  { name: 'Webhook Service', url: 'http://localhost:5001/health', port: 5001 }
];

// Middleware
app.use(express.static(path.join(__dirname, '../monitoring/simple-dashboard')));

// API để lấy trạng thái services
app.get('/api/status', async (req, res) => {
  const results = [];
  
  for (const service of services) {
    try {
      const startTime = Date.now();
      const response = await axios.get(service.url, {
        timeout: 3000,
        validateStatus: () => true
      });
      
      const responseTime = Date.now() - startTime;
      
      results.push({
        name: service.name,
        status: response.status < 400 ? 'healthy' : 'unhealthy',
        statusCode: response.status,
        responseTime: responseTime,
        port: service.port,
        uptime: response.data?.uptime || 0,
        memory: response.data?.memory || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      results.push({
        name: service.name,
        status: 'offline',
        statusCode: 0,
        responseTime: 0,
        port: service.port,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  res.json({
    totalServices: services.length,
    healthyServices: results.filter(r => r.status === 'healthy').length,
    unhealthyServices: results.filter(r => r.status === 'unhealthy').length,
    offlineServices: results.filter(r => r.status === 'offline').length,
    services: results,
    lastUpdate: new Date().toISOString()
  });
});

// API để lấy metrics từ các services
app.get('/api/metrics', async (req, res) => {
  const metricsResults = {};
  
  for (const service of services) {
    if (service.name === 'Frontend' || service.name === 'Webhook Service') continue;
    
    try {
      const metricsUrl = service.url.replace('/health', '/metrics');
      const response = await axios.get(metricsUrl, {
        timeout: 3000,
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        metricsResults[service.name] = {
          status: 'available',
          data: response.data
        };
      }
    } catch (error) {
      metricsResults[service.name] = {
        status: 'unavailable',
        error: error.message
      };
    }
  }
  
  res.json(metricsResults);
});

// API để lấy alerts từ webhook service
app.get('/api/alerts', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5001/alerts', {
      timeout: 3000
    });
    res.json(response.data);
  } catch (error) {
    res.json({
      error: 'Webhook service not available',
      message: error.message
    });
  }
});

// Health check cho monitoring dashboard
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'simple-monitoring-dashboard',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Monitoring Dashboard started on port ${PORT}`);
  console.log(`📊 Dashboard URL: http://localhost:${PORT}`);
  console.log(`🔗 API Status: http://localhost:${PORT}/api/status`);
  console.log(`📈 API Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(`🚨 API Alerts: http://localhost:${PORT}/api/alerts`);
  console.log('');
  console.log('💡 Features:');
  console.log('  • Real-time service status monitoring');
  console.log('  • Response time tracking');
  console.log('  • Memory usage display');
  console.log('  • Alert integration');
  console.log('  • No Docker required!');
});

module.exports = app;
