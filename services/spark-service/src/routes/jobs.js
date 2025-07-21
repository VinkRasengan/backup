const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const sparkManager = require('../services/sparkManager');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Submit a new Spark job
router.post('/submit', [
  body('type')
    .isIn(['fake-news-detection', 'link-analysis', 'community-analytics', 'batch-processing'])
    .withMessage('Invalid job type'),
  body('params')
    .isObject()
    .withMessage('Params must be an object'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high'])
    .withMessage('Priority must be low, normal, or high')
], handleValidationErrors, async (req, res) => {
  try {
    const { type, params, priority = 'normal' } = req.body;
    
    logger.info('Job submission request', { type, params, priority });
    
    const jobConfig = {
      type,
      params,
      priority,
      submittedBy: req.headers['x-user-id'] || 'anonymous',
      submittedAt: new Date().toISOString()
    };
    
    const result = await sparkManager.submitJob(jobConfig);
    
    res.status(201).json({
      success: true,
      message: 'Job submitted successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Job submission failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Job submission failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get job status
router.get('/:jobId/status', [
  param('jobId')
    .isUUID()
    .withMessage('Invalid job ID format')
], handleValidationErrors, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const jobStatus = await sparkManager.getJobStatus(jobId);
    
    res.json({
      success: true,
      data: jobStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to get job status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cancel a running job
router.post('/:jobId/cancel', [
  param('jobId')
    .isUUID()
    .withMessage('Invalid job ID format')
], handleValidationErrors, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const result = await sparkManager.cancelJob(jobId);
    
    res.json({
      success: true,
      message: 'Job cancelled successfully',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to cancel job',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get running jobs
router.get('/running', async (req, res) => {
  try {
    const runningJobs = sparkManager.getRunningJobs();
    
    res.json({
      success: true,
      data: {
        count: runningJobs.length,
        jobs: runningJobs
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get running jobs', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get running jobs',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get job history
router.get('/history', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const jobHistory = sparkManager.getJobHistory(limit);
    
    res.json({
      success: true,
      data: {
        count: jobHistory.length,
        jobs: jobHistory
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get job history', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get job history',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get job statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = sparkManager.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get job stats', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get job statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Batch job submission for multiple jobs
router.post('/batch', [
  body('jobs')
    .isArray({ min: 1, max: 10 })
    .withMessage('Jobs must be an array with 1-10 items'),
  body('jobs.*.type')
    .isIn(['fake-news-detection', 'link-analysis', 'community-analytics', 'batch-processing'])
    .withMessage('Invalid job type'),
  body('jobs.*.params')
    .isObject()
    .withMessage('Params must be an object')
], handleValidationErrors, async (req, res) => {
  try {
    const { jobs } = req.body;
    
    logger.info('Batch job submission request', { jobCount: jobs.length });
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < jobs.length; i++) {
      try {
        const jobConfig = {
          ...jobs[i],
          priority: jobs[i].priority || 'normal',
          submittedBy: req.headers['x-user-id'] || 'anonymous',
          submittedAt: new Date().toISOString(),
          batchIndex: i
        };
        
        const result = await sparkManager.submitJob(jobConfig);
        results.push(result);
        
      } catch (error) {
        errors.push({
          index: i,
          job: jobs[i],
          error: error.message
        });
      }
    }
    
    const response = {
      success: errors.length === 0,
      message: `Batch submission completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: jobs.length,
          successful: results.length,
          failed: errors.length
        }
      },
      timestamp: new Date().toISOString()
    };
    
    const statusCode = errors.length === 0 ? 201 : 207; // 207 = Multi-Status
    res.status(statusCode).json(response);
    
  } catch (error) {
    logger.error('Batch job submission failed', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Batch job submission failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
