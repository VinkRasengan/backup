const express = require('express');
const router = express.Router();
const sparkManager = require('../services/sparkManager');
const logger = require('../utils/logger');

// GET /api/v1/jobs - Get all jobs
router.get('/', async (req, res) => {
  try {
    const runningJobs = sparkManager.getRunningJobs();
    const jobHistory = sparkManager.getJobHistory();
    
    res.json({
      success: true,
      data: {
        running: runningJobs,
        history: jobHistory,
        stats: sparkManager.getStats()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve jobs',
      message: error.message
    });
  }
});

// POST /api/v1/jobs - Submit new job
router.post('/', async (req, res) => {
  try {
    const { type, params = {} } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        error: 'Job type is required',
        message: 'Please provide a job type'
      });
    }
    
    logger.info(`Submitting new job of type: ${type}`);
    
    const result = await sparkManager.submitJob({ type, params });
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Job submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error submitting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit job',
      message: error.message
    });
  }
});

// GET /api/v1/jobs/:id - Get specific job
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Job status requested for ID: ${id}`);
    
    const job = await sparkManager.getJobStatus(id);
    
    res.json({
      success: true,
      data: job,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving job status:', error);
    res.status(404).json({
      success: false,
      error: 'Job not found',
      message: error.message
    });
  }
});

// DELETE /api/v1/jobs/:id - Cancel job
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    logger.info(`Cancelling job with ID: ${id}`);
    
    const result = await sparkManager.cancelJob(id);
    
    res.json({
      success: true,
      data: result,
      message: 'Job cancelled successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error cancelling job:', error);
    res.status(404).json({
      success: false,
      error: 'Failed to cancel job',
      message: error.message
    });
  }
});

// GET /api/v1/jobs/stats - Get job statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = sparkManager.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error retrieving job stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve job stats',
      message: error.message
    });
  }
});

module.exports = router;
