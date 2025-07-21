/**
 * Metrics Collector for Event Bus Service
 */

const promClient = require('prom-client');
const logger = require('./logger');

class MetricsCollector {
  constructor() {
    // Create a Registry to register the metrics
    this.register = new promClient.Registry();
    
    // Add default metrics
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'event_bus_'
    });

    // Custom metrics
    this.eventPublishedCounter = new promClient.Counter({
      name: 'event_bus_events_published_total',
      help: 'Total number of events published',
      labelNames: ['event_type', 'source_service'],
      registers: [this.register]
    });

    this.eventConsumedCounter = new promClient.Counter({
      name: 'event_bus_events_consumed_total',
      help: 'Total number of events consumed',
      labelNames: ['event_type', 'target_service'],
      registers: [this.register]
    });

    this.eventFailedCounter = new promClient.Counter({
      name: 'event_bus_events_failed_total',
      help: 'Total number of failed events',
      labelNames: ['event_type', 'error_type'],
      registers: [this.register]
    });

    this.eventProcessingDuration = new promClient.Histogram({
      name: 'event_bus_event_processing_duration_seconds',
      help: 'Duration of event processing in seconds',
      labelNames: ['event_type', 'operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.register]
    });

    this.activeConnectionsGauge = new promClient.Gauge({
      name: 'event_bus_active_connections',
      help: 'Number of active connections',
      labelNames: ['connection_type'],
      registers: [this.register]
    });

    this.eventQueueSizeGauge = new promClient.Gauge({
      name: 'event_bus_queue_size',
      help: 'Size of event queues',
      labelNames: ['queue_name'],
      registers: [this.register]
    });

    logger.info('Metrics collector initialized');
  }

  /**
   * Record event published
   */
  recordEventPublished(eventType, sourceService = 'unknown') {
    this.eventPublishedCounter.inc({
      event_type: eventType,
      source_service: sourceService
    });
  }

  /**
   * Record event consumed
   */
  recordEventConsumed(eventType, targetService = 'unknown') {
    this.eventConsumedCounter.inc({
      event_type: eventType,
      target_service: targetService
    });
  }

  /**
   * Record event failed
   */
  recordEventFailed(eventType, errorType = 'unknown') {
    this.eventFailedCounter.inc({
      event_type: eventType,
      error_type: errorType
    });
  }

  /**
   * Record event processing duration
   */
  recordEventProcessingDuration(eventType, operation, duration) {
    this.eventProcessingDuration
      .labels(eventType, operation)
      .observe(duration);
  }

  /**
   * Set active connections
   */
  setActiveConnections(connectionType, count) {
    this.activeConnectionsGauge
      .labels(connectionType)
      .set(count);
  }

  /**
   * Set queue size
   */
  setQueueSize(queueName, size) {
    this.eventQueueSizeGauge
      .labels(queueName)
      .set(size);
  }

  /**
   * Get metrics
   */
  async getMetrics() {
    return await this.register.metrics();
  }

  /**
   * Get metrics in JSON format
   */
  async getMetricsJSON() {
    const metrics = await this.register.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.register.resetMetrics();
    logger.info('Metrics reset');
  }

  /**
   * Health check for metrics
   */
  healthCheck() {
    try {
      const metricsCount = this.register._metrics.size;
      return {
        status: 'healthy',
        metricsCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Metrics health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = MetricsCollector;
