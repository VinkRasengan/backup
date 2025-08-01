const express = require('express');
const router = express.Router();
const analyticsManager = require('../services/analyticsManager');
const logger = require('../utils/logger');

// GET /api/v1/insights - Get all insights
router.get('/', async (req, res) => {
  try {
    logger.info('Insights requested');
    
    const insights = await analyticsManager.generateInsights();
    
    res.json({
      success: true,
      data: insights,
      count: insights.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights',
      message: error.message
    });
  }
});

// GET /api/v1/insights/:id - Get specific insight
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Insight requested for ID: ${id}`);
    
    const insights = await analyticsManager.generateInsights();
    const insight = insights.find(i => i.id === id);
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        error: 'Insight not found',
        message: `No insight found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: insight,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving insight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve insight',
      message: error.message
    });
  }
});

// GET /api/v1/insights/type/:type - Get insights by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    logger.info(`Insights requested for type: ${type}`);
    
    const insights = await analyticsManager.generateInsights();
    const filteredInsights = insights.filter(i => i.type === type);
    
    res.json({
      success: true,
      data: filteredInsights,
      count: filteredInsights.length,
      type: type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error filtering insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter insights',
      message: error.message
    });
  }
});

module.exports = router; 