/**
 * Dedicated Event Bus Service
 * Provides centralized event management while maintaining service independence
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const WebSocket = require('ws');
const http = require('http');
// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

const logger = require('./utils/logger');
const EventBusManager = require('./managers/eventBusManager');
const EventValidator = require('./validators/eventValidator');
const MetricsCollector = require('./utils/metricsCollector');
const HealthChecker = require('./utils/healthChecker');
const KurrentEventStore = require('./eventStore/kurrentEventStore');
const createEventStoreRoutes = require('./routes/eventStore');

class EventBusService {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.port = process.env.EVENT_BUS_SERVICE_PORT || process.env.PORT || 3009;
    this.serviceName = 'event-bus-service';
    
    // Initialize components
    this.eventStore = new KurrentEventStore({ serviceName: this.serviceName });
    this.eventBusManager = new EventBusManager();
    this.eventValidator = new EventValidator();
    this.metricsCollector = new MetricsCollector();
    this.healthChecker = new HealthChecker();
    
    // WebSocket connections
    this.wsConnections = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Get allowed origins from environment or use defaults
        const allowedOrigins = process.env.ALLOWED_ORIGINS
          ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
          : [
              'http://localhost:3000',
              'http://localhost:3001',
              'http://localhost:8080',
              'https://factcheck-vn.netlify.app',
              'https://factcheck.vn'
            ];

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.warn(`⚠️ CORS blocked origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Correlation-ID',
        'X-Request-ID',
        'Cache-Control'
      ],
      exposedHeaders: ['X-Correlation-ID']
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Request logging
    this.app.use((req, res, next) => {
      const correlationId = req.headers['x-correlation-id'] || require('uuid').v4();
      req.correlationId = correlationId;
      res.setHeader('x-correlation-id', correlationId);
      
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        correlationId,
        userAgent: req.headers['user-agent']
      });
      
      next();
    });
  }

  setupRoutes() {
    // Event Store API routes
    this.app.use('/api/eventstore', createEventStoreRoutes(this.eventStore));

    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.healthChecker.getHealthResponse();
        const eventStoreHealth = await this.eventStore.healthCheck();

        const combinedHealth = {
          ...health,
          eventStore: eventStoreHealth
        };

        const isHealthy = health.status === 'healthy' &&
                         (eventStoreHealth.status === 'healthy' || eventStoreHealth.status === 'degraded');

        res.status(isHealthy ? 200 : 503).json(combinedHealth);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', async (req, res) => {
      try {
        const metrics = await this.metricsCollector.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Publish event
    this.app.post('/events', async (req, res) => {
      try {
        const { type: eventType, data, metadata = {} } = req.body;
        
        // Add correlation ID from request
        metadata.correlationId = metadata.correlationId || req.correlationId;
        metadata.source = metadata.source || req.headers['x-service-name'] || 'unknown';
        
        // Validate event
        const validation = await this.eventValidator.validate(eventType, data, metadata);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Invalid event',
            details: validation.errors
          });
        }

        // Publish event
        const result = await this.eventBusManager.publishEvent(eventType, data, metadata);
        
        // Update metrics
        this.metricsCollector.recordEventPublished(eventType, metadata.source);
        
        logger.info('Event published successfully', {
          eventType,
          eventId: result.eventId,
          source: metadata.source,
          correlationId: metadata.correlationId
        });

        res.status(201).json({
          success: true,
          eventId: result.eventId,
          published: result.published,
          failed: result.failed
        });
      } catch (error) {
        this.metricsCollector.recordEventFailed(req.body.eventType, error.message);
        
        logger.error('Failed to publish event', {
          error: error.message,
          eventType: req.body.eventType,
          correlationId: req.correlationId
        });
        
        res.status(500).json({
          error: 'Failed to publish event',
          message: error.message
        });
      }
    });

    // Batch publish events
    this.app.post('/events/batch', async (req, res) => {
      try {
        const { events } = req.body;
        
        if (!Array.isArray(events) || events.length === 0) {
          return res.status(400).json({
            error: 'Events array is required and must not be empty'
          });
        }

        const results = [];
        const errors = [];

        for (const event of events) {
          try {
            const { eventType, data, metadata = {} } = event;
            
            // Add correlation ID
            metadata.correlationId = metadata.correlationId || req.correlationId;
            metadata.source = metadata.source || req.headers['x-service-name'] || 'unknown';
            
            // Validate event
            const validation = await this.eventValidator.validate(eventType, data);
            if (!validation.valid) {
              errors.push({
                eventType,
                error: 'Invalid event',
                details: validation.errors
              });
              continue;
            }

            // Publish event
            const result = await this.eventBusManager.publishEvent(eventType, data, metadata);
            results.push(result);
            
            this.metricsCollector.recordEventPublished(eventType, metadata.source);
          } catch (error) {
            errors.push({
              eventType: event.eventType,
              error: error.message
            });
            this.metricsCollector.recordEventFailed(event.eventType, error.message);
          }
        }

        res.json({
          success: true,
          published: results.length,
          failed: errors.length,
          results,
          errors
        });
      } catch (error) {
        logger.error('Failed to publish batch events', {
          error: error.message,
          correlationId: req.correlationId
        });
        
        res.status(500).json({
          error: 'Failed to publish batch events',
          message: error.message
        });
      }
    });

    // Get event history
    this.app.get('/events/history/:streamName', async (req, res) => {
      try {
        const { streamName } = req.params;
        const { fromVersion = 0, maxCount = 100 } = req.query;
        
        const events = await this.eventBusManager.getEventHistory(
          streamName,
          parseInt(fromVersion),
          parseInt(maxCount)
        );
        
        res.json({
          streamName,
          events,
          count: events.length
        });
      } catch (error) {
        logger.error('Failed to get event history', {
          error: error.message,
          streamName: req.params.streamName
        });
        
        res.status(500).json({
          error: 'Failed to get event history',
          message: error.message
        });
      }
    });

    // Server-Sent Events for real-time subscriptions
    this.app.get('/events/stream', (req, res) => {
      const { eventPattern = '*' } = req.query;
      const serviceName = req.headers['x-service-name'] || 'unknown';
      
      // Setup SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection event
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to event stream',
        pattern: eventPattern
      })}\n\n`);

      // Subscribe to events
      const subscriptionId = this.eventBusManager.subscribe(eventPattern, (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        this.metricsCollector.recordEventConsumed(event.type, serviceName);
      });

      // Handle client disconnect
      req.on('close', () => {
        this.eventBusManager.unsubscribe(subscriptionId);
        logger.info('SSE client disconnected', {
          serviceName,
          eventPattern,
          subscriptionId
        });
      });

      logger.info('SSE client connected', {
        serviceName,
        eventPattern,
        subscriptionId
      });
    });

    // Get event statistics
    this.app.get('/stats', async (req, res) => {
      try {
        const stats = await this.eventBusManager.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to get statistics',
          message: error.message
        });
      }
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const connectionId = require('uuid').v4();
      const serviceName = req.headers['x-service-name'] || 'unknown';
      
      this.wsConnections.set(connectionId, {
        ws,
        serviceName,
        subscriptions: new Set()
      });

      logger.info('WebSocket client connected', {
        connectionId,
        serviceName
      });

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'subscribe') {
            const subscriptionId = this.eventBusManager.subscribe(data.eventPattern, (event) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(event));
                this.metricsCollector.recordEventConsumed(event.type, serviceName);
              }
            });
            
            this.wsConnections.get(connectionId).subscriptions.add(subscriptionId);
            
            ws.send(JSON.stringify({
              type: 'subscribed',
              subscriptionId,
              eventPattern: data.eventPattern
            }));
          }
        } catch (error) {
          logger.error('WebSocket message error', {
            error: error.message,
            connectionId
          });
        }
      });

      ws.on('close', () => {
        const connection = this.wsConnections.get(connectionId);
        if (connection) {
          // Unsubscribe from all subscriptions
          connection.subscriptions.forEach(subscriptionId => {
            this.eventBusManager.unsubscribe(subscriptionId);
          });
          
          this.wsConnections.delete(connectionId);
        }
        
        logger.info('WebSocket client disconnected', {
          connectionId,
          serviceName
        });
      });
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        correlationId: req.correlationId
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  async start() {
    try {
      // Initialize Event Store first
      const eventStoreResult = await this.eventStore.initialize();
      logger.info('Event Store initialization result', eventStoreResult);

      // Initialize Event Bus Manager
      await this.eventBusManager.initialize();

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`Event Bus Service started on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          service: this.serviceName,
          eventStoreMode: eventStoreResult.mode
        });
        console.log(`🚀 Event Bus Service running on http://localhost:${this.port}`);
        console.log(`📊 Event Store API: http://localhost:${this.port}/api/eventstore`);
        console.log(`🔍 Event Store Mode: ${eventStoreResult.mode}`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());

    } catch (error) {
      logger.error('Failed to start Event Bus Service', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    }
  }

  async shutdown() {
    logger.info('Shutting down Event Bus Service...');

    try {
      // Close WebSocket connections
      this.wsConnections.forEach((connection, connectionId) => {
        connection.ws.close();
        connection.subscriptions.forEach(subscriptionId => {
          this.eventBusManager.unsubscribe(subscriptionId);
        });
      });

      // Close Event Bus Manager
      await this.eventBusManager.close();

      // Close server
      this.server.close(() => {
        logger.info('Event Bus Service shut down successfully');
        process.exit(0);
      });
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

// Start the service
if (require.main === module) {
  const service = new EventBusService();
  service.start();
}

module.exports = EventBusService;
