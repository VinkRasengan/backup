/**
 * Event Store HTTP API Routes
 * Provides REST API for microservices to interact with Event Store
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { validateEventData, validateStreamName } = require('../validators/eventValidators');

/**
 * Initialize Event Store routes
 */
function createEventStoreRoutes(eventStore) {
  
  // ==================== EVENT OPERATIONS ====================
  
  /**
   * POST /events/:streamName
   * Append event to stream
   */
  router.post('/events/:streamName', async (req, res) => {
    try {
      const { streamName } = req.params;
      const { eventType, eventData, metadata = {} } = req.body;
      
      // Add request metadata
      const enrichedMetadata = {
        ...metadata,
        source: req.headers['x-service-name'] || 'unknown',
        correlationId: req.headers['x-correlation-id'] || metadata.correlationId,
        userId: req.headers['x-user-id'] || metadata.userId
      };

      const result = await eventStore.appendEvent(streamName, eventType, eventData, enrichedMetadata);
      
      if (result.success) {
        logger.info('Event appended via API', {
          streamName,
          eventType,
          eventId: result.eventId,
          source: enrichedMetadata.source
        });
        
        res.status(201).json({
          success: true,
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to append event'
        });
      }
      
    } catch (error) {
      logger.error('Error appending event via API', {
        error: error.message,
        streamName: req.params.streamName
      });
      
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /events/:streamName
   * Read events from stream
   */
  router.get('/events/:streamName', async (req, res) => {
    try {
      const { streamName } = req.params;
      const {
        fromRevision = 'start',
        direction = 'forwards',
        maxCount = 100,
        includeMetadata = 'true'
      } = req.query;

      const options = {
        fromRevision: fromRevision === 'start' ? 'start' : parseInt(fromRevision),
        direction: direction === 'backwards' ? 'backwards' : 'forwards',
        maxCount: Math.min(parseInt(maxCount), 1000), // Limit to 1000 events
        includeMetadata: includeMetadata === 'true'
      };

      const result = await eventStore.readStream(streamName, options);
      
      if (result.success) {
        logger.debug('Events read via API', {
          streamName,
          eventCount: result.events.length,
          source: req.headers['x-service-name'] || 'unknown'
        });
        
        res.json({
          success: true,
          data: {
            streamName: result.streamName,
            events: result.events,
            eventCount: result.events.length,
            source: result.source
          }
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Stream not found or no events'
        });
      }
      
    } catch (error) {
      logger.error('Error reading events via API', {
        error: error.message,
        streamName: req.params.streamName
      });
      
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /events
   * Read all events (for projections)
   */
  router.get('/events', async (req, res) => {
    try {
      const {
        fromPosition = 'start',
        direction = 'forwards',
        maxCount = 100,
        streamPrefix = null
      } = req.query;

      const options = {
        fromPosition: fromPosition === 'start' ? 'start' : fromPosition,
        direction: direction === 'backwards' ? 'backwards' : 'forwards',
        maxCount: Math.min(parseInt(maxCount), 1000)
      };

      // Add stream filter if prefix provided
      if (streamPrefix) {
        options.filter = {
          streamNamePrefix: streamPrefix
        };
      }

      const result = await eventStore.readAll(options);
      
      if (result.success) {
        logger.debug('All events read via API', {
          eventCount: result.events.length,
          source: req.headers['x-service-name'] || 'unknown'
        });
        
        res.json({
          success: true,
          data: {
            events: result.events,
            eventCount: result.events.length,
            source: result.source
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to read events'
        });
      }
      
    } catch (error) {
      logger.error('Error reading all events via API', {
        error: error.message
      });
      
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // ==================== SNAPSHOT OPERATIONS ====================
  
  /**
   * POST /snapshots/:aggregateType/:aggregateId
   * Create snapshot for aggregate
   */
  router.post('/snapshots/:aggregateType/:aggregateId', async (req, res) => {
    try {
      const { aggregateType, aggregateId } = req.params;
      const { state, version } = req.body;

      if (!state || version === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: state, version'
        });
      }

      const result = await eventStore.createSnapshot(aggregateId, aggregateType, state, version);
      
      if (result.success) {
        logger.info('Snapshot created via API', {
          aggregateType,
          aggregateId,
          version,
          source: req.headers['x-service-name'] || 'unknown'
        });
        
        res.status(201).json({
          success: true,
          data: result
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create snapshot'
        });
      }
      
    } catch (error) {
      logger.error('Error creating snapshot via API', {
        error: error.message,
        aggregateType: req.params.aggregateType,
        aggregateId: req.params.aggregateId
      });
      
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /snapshots/:aggregateType/:aggregateId
   * Load latest snapshot for aggregate
   */
  router.get('/snapshots/:aggregateType/:aggregateId', async (req, res) => {
    try {
      const { aggregateType, aggregateId } = req.params;

      const result = await eventStore.loadSnapshot(aggregateId, aggregateType);
      
      if (result.success) {
        logger.debug('Snapshot loaded via API', {
          aggregateType,
          aggregateId,
          version: result.version,
          source: req.headers['x-service-name'] || 'unknown'
        });
        
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.reason || 'Snapshot not found'
        });
      }
      
    } catch (error) {
      logger.error('Error loading snapshot via API', {
        error: error.message,
        aggregateType: req.params.aggregateType,
        aggregateId: req.params.aggregateId
      });
      
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });

  // ==================== ADMIN OPERATIONS ====================
  
  /**
   * GET /stats
   * Get event store statistics
   */
  router.get('/stats', async (req, res) => {
    try {
      const stats = eventStore.getStats();
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error getting stats via API', {
        error: error.message
      });
      
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /health
   * Health check endpoint
   */
  router.get('/health', async (req, res) => {
    try {
      const health = await eventStore.healthCheck();
      
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json({
        success: health.status !== 'unhealthy',
        data: health
      });
      
    } catch (error) {
      logger.error('Error in health check via API', {
        error: error.message
      });
      
      res.status(503).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}

module.exports = createEventStoreRoutes;
