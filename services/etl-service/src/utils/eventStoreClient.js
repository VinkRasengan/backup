/**
 * Event Store Client for ETL Service
 * Integrates ETL operations with Event Sourcing
 */

const axios = require('axios');
const logger = require('./logger');

class EventStoreClient {
  constructor(options = {}) {
    this.serviceUrl = options.serviceUrl || process.env.EVENT_BUS_SERVICE_URL || 'http://localhost:3007';
    this.serviceName = options.serviceName || 'etl-service';
    this.timeout = options.timeout || 10000;
    
    // Create axios instance
    this.client = axios.create({
      baseURL: `${this.serviceUrl}/api/eventstore`,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'x-service-name': this.serviceName
      }
    });

    logger.info('EventStore client initialized', {
      serviceUrl: this.serviceUrl,
      serviceName: this.serviceName
    });
  }

  /**
   * Append ETL event to event store
   */
  async appendETLEvent(streamName, eventType, eventData, metadata = {}) {
    try {
      const event = {
        eventType,
        eventData: {
          ...eventData,
          timestamp: new Date().toISOString(),
          service: this.serviceName
        },
        metadata: {
          ...metadata,
          correlationId: metadata.correlationId || this.generateCorrelationId(),
          source: this.serviceName,
          version: '1.0.0'
        }
      };

      const response = await this.client.post(`/events/${streamName}`, event);
      
      logger.info('ETL event appended successfully', {
        streamName,
        eventType,
        eventId: response.data.data?.eventId
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to append ETL event', {
        streamName,
        eventType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Read ETL events from stream
   */
  async readETLEvents(streamName, options = {}) {
    try {
      const params = {
        maxCount: options.maxCount || 100,
        direction: options.direction || 'forwards',
        fromPosition: options.fromPosition || 0
      };

      const response = await this.client.get(`/events/${streamName}`, { params });
      
      logger.debug('ETL events read successfully', {
        streamName,
        eventCount: response.data.data?.events?.length || 0
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to read ETL events', {
        streamName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Log ETL pipeline start event
   */
  async logPipelineStart(pipelineId, pipelineConfig) {
    return this.appendETLEvent(
      `etl-pipeline-${pipelineId}`,
      'ETLPipelineStarted',
      {
        pipelineId,
        config: pipelineConfig,
        startTime: new Date().toISOString()
      },
      {
        pipelineId,
        operation: 'pipeline-start'
      }
    );
  }

  /**
   * Log ETL pipeline completion event
   */
  async logPipelineComplete(pipelineId, results) {
    return this.appendETLEvent(
      `etl-pipeline-${pipelineId}`,
      'ETLPipelineCompleted',
      {
        pipelineId,
        results,
        endTime: new Date().toISOString(),
        duration: results.duration,
        recordsProcessed: results.recordsProcessed,
        status: results.status
      },
      {
        pipelineId,
        operation: 'pipeline-complete'
      }
    );
  }

  /**
   * Log ETL pipeline error event
   */
  async logPipelineError(pipelineId, error) {
    return this.appendETLEvent(
      `etl-pipeline-${pipelineId}`,
      'ETLPipelineError',
      {
        pipelineId,
        error: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      },
      {
        pipelineId,
        operation: 'pipeline-error'
      }
    );
  }

  /**
   * Log data transformation event
   */
  async logDataTransformation(transformationId, inputData, outputData, transformationType) {
    return this.appendETLEvent(
      `etl-transformation-${transformationId}`,
      'DataTransformed',
      {
        transformationId,
        transformationType,
        inputRecords: Array.isArray(inputData) ? inputData.length : 1,
        outputRecords: Array.isArray(outputData) ? outputData.length : 1,
        timestamp: new Date().toISOString()
      },
      {
        transformationId,
        operation: 'data-transformation'
      }
    );
  }

  /**
   * Log data quality check event
   */
  async logDataQualityCheck(checkId, data, qualityResults) {
    return this.appendETLEvent(
      `etl-quality-${checkId}`,
      'DataQualityChecked',
      {
        checkId,
        recordsChecked: Array.isArray(data) ? data.length : 1,
        qualityScore: qualityResults.score,
        issues: qualityResults.issues,
        passed: qualityResults.passed,
        timestamp: new Date().toISOString()
      },
      {
        checkId,
        operation: 'quality-check'
      }
    );
  }

  /**
   * Get ETL pipeline history
   */
  async getPipelineHistory(pipelineId, options = {}) {
    try {
      const streamName = `etl-pipeline-${pipelineId}`;
      const events = await this.readETLEvents(streamName, options);
      
      return {
        pipelineId,
        events: events.data?.events || [],
        totalEvents: events.data?.eventCount || 0
      };
    } catch (error) {
      logger.error('Failed to get pipeline history', {
        pipelineId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('Event store health check failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate correlation ID
   */
  generateCorrelationId() {
    return `etl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client statistics
   */
  getStats() {
    return {
      serviceName: this.serviceName,
      serviceUrl: this.serviceUrl,
      timeout: this.timeout
    };
  }
}

module.exports = EventStoreClient;
