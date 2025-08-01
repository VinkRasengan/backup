const express = require('express');
const router = express.Router();
const analyticsManager = require('../services/analyticsManager');
const logger = require('../utils/logger');

// GET /api/v1/reports - Get all reports
router.get('/', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    logger.info(`Reports requested with limit: ${limit}`);
    
    const reports = analyticsManager.getReports(parseInt(limit));
    
    res.json({
      success: true,
      data: reports,
      count: reports.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports',
      message: error.message
    });
  }
});

// POST /api/v1/reports - Generate new report
router.post('/', async (req, res) => {
  try {
    const { type, params = {} } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Report type is required',
        message: 'Please provide a report type'
      });
    }
    
    logger.info(`Generating new report of type: ${type}`);
    
    const report = await analyticsManager.generateReport(type, params);
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Report generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

// GET /api/v1/reports/:id - Get specific report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Report requested for ID: ${id}`);
    
    const reports = analyticsManager.getReports();
    const report = reports.find(r => r.id === id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
        message: `No report found with ID: ${id}`
      });
    }
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report',
      message: error.message
    });
  }
});

// GET /api/v1/reports/type/:type - Get reports by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    logger.info(`Reports requested for type: ${type} with limit: ${limit}`);
    
    const reports = analyticsManager.getReports(parseInt(limit));
    const filteredReports = reports.filter(r => r.type === type);
    
    res.json({
      success: true,
      data: filteredReports,
      count: filteredReports.length,
      type: type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error filtering reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter reports',
      message: error.message
    });
  }
});

module.exports = router; 