const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const etlManager = require('../services/etlManager');

/**
 * GET /pipelines - Get all pipelines
 */
router.get('/', async (req, res) => {
  try {
    const pipelines = etlManager.getAllPipelines();
    res.json({
      success: true,
      data: pipelines,
      count: pipelines.length
    });
  } catch (error) {
    logger.error('Failed to get pipelines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pipelines'
    });
  }
});

/**
 * GET /pipelines/:id - Get specific pipeline
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pipeline = etlManager.getPipelineStatus(id);
    
    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }
    
    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    logger.error('Failed to get pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pipeline'
    });
  }
});

/**
 * POST /pipelines - Create and start new pipeline
 */
router.post('/', async (req, res) => {
  try {
    const { id, config = {} } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Pipeline ID is required'
      });
    }
    
    const pipeline = await etlManager.startPipeline(id, config);
    
    res.status(201).json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    logger.error('Failed to create pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pipeline'
    });
  }
});

/**
 * POST /pipelines/:id/start - Start pipeline
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { config = {} } = req.body;
    
    const pipeline = await etlManager.startPipeline(id, config);
    
    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    logger.error('Failed to start pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start pipeline'
    });
  }
});

/**
 * POST /pipelines/:id/stop - Stop pipeline
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pipeline = await etlManager.stopPipeline(id);
    
    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    logger.error('Failed to stop pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop pipeline'
    });
  }
});

/**
 * POST /pipelines/:id/process - Process data through pipeline
 */
router.post('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }
    
    const result = await etlManager.processData(id, data);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to process data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process data'
    });
  }
});

module.exports = router;
