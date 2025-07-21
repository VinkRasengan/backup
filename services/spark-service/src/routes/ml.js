const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
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

// Get available ML models
router.get('/models', async (req, res) => {
  try {
    const models = [
      {
        id: 'fake-news-classifier-v1',
        name: 'Fake News Classifier',
        version: '1.0.0',
        type: 'classification',
        status: 'active',
        accuracy: 0.923,
        lastTrained: '2024-01-20T10:00:00Z',
        description: 'BERT-based model for fake news detection'
      },
      {
        id: 'link-risk-scorer-v1',
        name: 'Link Risk Scorer',
        version: '1.0.0',
        type: 'regression',
        status: 'active',
        accuracy: 0.887,
        lastTrained: '2024-01-19T15:30:00Z',
        description: 'Random Forest model for link risk assessment'
      },
      {
        id: 'sentiment-analyzer-v1',
        name: 'Sentiment Analyzer',
        version: '1.0.0',
        type: 'classification',
        status: 'active',
        accuracy: 0.856,
        lastTrained: '2024-01-18T09:15:00Z',
        description: 'LSTM model for sentiment analysis'
      },
      {
        id: 'user-behavior-clusterer-v1',
        name: 'User Behavior Clusterer',
        version: '1.0.0',
        type: 'clustering',
        status: 'training',
        accuracy: null,
        lastTrained: null,
        description: 'K-means clustering for user behavior analysis'
      }
    ];
    
    res.json({
      success: true,
      data: {
        count: models.length,
        models
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get ML models', { error: error.message });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get ML models',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific model details
router.get('/models/:modelId', [
  param('modelId')
    .isLength({ min: 1 })
    .withMessage('Model ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { modelId } = req.params;
    
    // Mock model details
    const modelDetails = {
      id: modelId,
      name: 'Fake News Classifier',
      version: '1.0.0',
      type: 'classification',
      status: 'active',
      metrics: {
        accuracy: 0.923,
        precision: 0.891,
        recall: 0.945,
        f1Score: 0.917
      },
      training: {
        lastTrained: '2024-01-20T10:00:00Z',
        trainingDuration: '2h 34m',
        trainingDataSize: '50,000 articles',
        validationDataSize: '10,000 articles'
      },
      features: [
        'text_length',
        'sentiment_score',
        'readability_score',
        'source_credibility',
        'tf_idf_features',
        'word_embeddings'
      ],
      hyperparameters: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 10,
        dropout_rate: 0.2
      },
      deployment: {
        deployedAt: '2024-01-20T12:00:00Z',
        endpoint: `/api/v1/ml/models/${modelId}/predict`,
        averageLatency: '150ms',
        requestsPerSecond: 45
      }
    };
    
    res.json({
      success: true,
      data: modelDetails,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get model details', { error: error.message, modelId: req.params.modelId });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get model details',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Make prediction using a model
router.post('/models/:modelId/predict', [
  param('modelId')
    .isLength({ min: 1 })
    .withMessage('Model ID is required'),
  body('input')
    .notEmpty()
    .withMessage('Input data is required'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
], handleValidationErrors, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { input, options = {} } = req.body;
    
    logger.info('ML prediction request', { modelId, inputType: typeof input });
    
    // Mock prediction based on model type
    let prediction;
    
    switch (modelId) {
      case 'fake-news-classifier-v1':
        prediction = {
          class: Math.random() > 0.7 ? 'fake' : 'real',
          confidence: Math.random() * 0.3 + 0.7,
          probabilities: {
            fake: Math.random() * 0.5,
            real: Math.random() * 0.5 + 0.5
          }
        };
        break;
        
      case 'link-risk-scorer-v1':
        prediction = {
          riskScore: Math.random() * 0.4 + 0.1,
          riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          factors: [
            { factor: 'domain_age', score: Math.random(), weight: 0.3 },
            { factor: 'ssl_certificate', score: Math.random(), weight: 0.2 },
            { factor: 'reputation', score: Math.random(), weight: 0.5 }
          ]
        };
        break;
        
      case 'sentiment-analyzer-v1':
        prediction = {
          sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
          confidence: Math.random() * 0.3 + 0.7,
          scores: {
            positive: Math.random(),
            negative: Math.random(),
            neutral: Math.random()
          }
        };
        break;
        
      default:
        return res.status(404).json({
          success: false,
          error: 'Model not found',
          message: `Model ${modelId} not found or not available`,
          timestamp: new Date().toISOString()
        });
    }
    
    res.json({
      success: true,
      data: {
        modelId,
        prediction,
        metadata: {
          processingTime: `${Math.floor(Math.random() * 200 + 50)}ms`,
          modelVersion: '1.0.0',
          timestamp: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    logger.error('ML prediction failed', { error: error.message, modelId: req.params.modelId });
    
    res.status(500).json({
      success: false,
      error: 'Prediction failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Batch prediction
router.post('/models/:modelId/predict/batch', [
  param('modelId')
    .isLength({ min: 1 })
    .withMessage('Model ID is required'),
  body('inputs')
    .isArray({ min: 1, max: 100 })
    .withMessage('Inputs must be an array with 1-100 items'),
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object')
], handleValidationErrors, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { inputs, options = {} } = req.body;
    
    logger.info('ML batch prediction request', { modelId, inputCount: inputs.length });
    
    // Mock batch predictions
    const predictions = inputs.map((input, index) => ({
      index,
      input,
      prediction: {
        class: Math.random() > 0.7 ? 'fake' : 'real',
        confidence: Math.random() * 0.3 + 0.7
      }
    }));
    
    res.json({
      success: true,
      data: {
        modelId,
        predictions,
        summary: {
          total: inputs.length,
          processed: predictions.length,
          averageConfidence: predictions.reduce((sum, p) => sum + p.prediction.confidence, 0) / predictions.length
        },
        metadata: {
          processingTime: `${Math.floor(Math.random() * 1000 + 500)}ms`,
          modelVersion: '1.0.0',
          timestamp: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    logger.error('ML batch prediction failed', { error: error.message, modelId: req.params.modelId });
    
    res.status(500).json({
      success: false,
      error: 'Batch prediction failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Train or retrain a model
router.post('/models/:modelId/train', [
  param('modelId')
    .isLength({ min: 1 })
    .withMessage('Model ID is required'),
  body('trainingData')
    .notEmpty()
    .withMessage('Training data is required'),
  body('hyperparameters')
    .optional()
    .isObject()
    .withMessage('Hyperparameters must be an object')
], handleValidationErrors, async (req, res) => {
  try {
    const { modelId } = req.params;
    const { trainingData, hyperparameters = {} } = req.body;
    
    logger.info('ML model training request', { modelId, hyperparameters });
    
    // Mock training job
    const trainingJob = {
      jobId: `training-${Date.now()}`,
      modelId,
      status: 'started',
      startTime: new Date().toISOString(),
      estimatedDuration: '2h 30m',
      progress: 0,
      hyperparameters
    };
    
    res.status(202).json({
      success: true,
      message: 'Model training started',
      data: trainingJob,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('ML model training failed', { error: error.message, modelId: req.params.modelId });
    
    res.status(500).json({
      success: false,
      error: 'Model training failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get model performance metrics
router.get('/models/:modelId/metrics', [
  param('modelId')
    .isLength({ min: 1 })
    .withMessage('Model ID is required'),
  query('timeRange')
    .optional()
    .isIn(['1h', '24h', '7d', '30d'])
    .withMessage('Time range must be 1h, 24h, 7d, or 30d')
], handleValidationErrors, async (req, res) => {
  try {
    const { modelId } = req.params;
    const timeRange = req.query.timeRange || '24h';
    
    // Mock performance metrics
    const metrics = {
      modelId,
      timeRange,
      performance: {
        accuracy: 0.923,
        precision: 0.891,
        recall: 0.945,
        f1Score: 0.917,
        auc: 0.956
      },
      usage: {
        totalPredictions: 15420,
        averageLatency: '145ms',
        requestsPerSecond: 42.3,
        errorRate: 0.002
      },
      trends: [
        { timestamp: '2024-01-24T00:00:00Z', accuracy: 0.920, latency: 142 },
        { timestamp: '2024-01-24T06:00:00Z', accuracy: 0.925, latency: 148 },
        { timestamp: '2024-01-24T12:00:00Z', accuracy: 0.923, latency: 145 },
        { timestamp: '2024-01-24T18:00:00Z', accuracy: 0.921, latency: 150 }
      ]
    };
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get model metrics', { error: error.message, modelId: req.params.modelId });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get model metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
