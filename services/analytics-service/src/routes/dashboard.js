const express = require('express');
const router = express.Router();
const analyticsManager = require('../services/analyticsManager');
const logger = require('../utils/logger');

// GET /api/v1/dashboard - Get dashboard data
router.get('/', async (req, res) => {
  try {
    logger.info('Dashboard data requested');
    
    const dashboardData = await analyticsManager.generateDashboardData();
    
    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard data',
      message: error.message
    });
  }
});

// GET /api/v1/dashboard/metrics - Get specific metrics
router.get('/metrics', async (req, res) => {
  try {
    const { type } = req.query;
    logger.info(`Metrics requested for type: ${type}`);
    
    const dashboardData = await analyticsManager.generateDashboardData();
    
    let metrics = dashboardData;
    if (type) {
      metrics = dashboardData[type] || {};
    }
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// GET /api/v1/dashboard/overview - Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    logger.info('Dashboard overview requested');
    
    const dashboardData = await analyticsManager.generateDashboardData();
    const stats = analyticsManager.getStats();
    
    const overview = {
      summary: {
        totalUsers: dashboardData.userMetrics.totalUsers,
        totalPosts: dashboardData.contentMetrics.totalPosts,
        systemUptime: dashboardData.systemMetrics.uptime
      },
      stats: stats,
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard overview',
      message: error.message
    });
  }
});

module.exports = router; 