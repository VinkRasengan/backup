/**
 * CQRS Bus for Community Service
 * Coordinates commands and queries with proper separation
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const CommunityCommandHandlers = require('./commandHandlers');
const CommunityQueryHandlers = require('./queryHandlers');

// Load environment variables from root .env
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

class CQRSBus {
  constructor(eventBus, firebaseDb, cacheManager) {
    this.eventBus = eventBus;
    this.db = firebaseDb;
    this.cache = cacheManager;
    
    // Initialize handlers
    this.commandHandlers = new CommunityCommandHandlers(eventBus, firebaseDb);
    this.queryHandlers = new CommunityQueryHandlers(eventBus, firebaseDb, cacheManager);
    
    // Command routing
    this.commandRoutes = new Map([
      ['CreatePost', this.commandHandlers.handleCreatePost.bind(this.commandHandlers)],
      ['UpdatePost', this.commandHandlers.handleUpdatePost.bind(this.commandHandlers)],
      ['VotePost', this.commandHandlers.handleVotePost.bind(this.commandHandlers)],
      ['CreateComment', this.commandHandlers.handleCreateComment.bind(this.commandHandlers)]
    ]);

    // Query routing
    this.queryRoutes = new Map([
      ['GetPosts', this.queryHandlers.handleGetPosts.bind(this.queryHandlers)],
      ['GetPostById', this.queryHandlers.handleGetPostById.bind(this.queryHandlers)],
      ['GetUserPosts', this.queryHandlers.handleGetUserPosts.bind(this.queryHandlers)],
      ['GetPostComments', this.queryHandlers.handleGetPostComments.bind(this.queryHandlers)]
    ]);

    this.stats = {
      commandsExecuted: 0,
      queriesExecuted: 0,
      commandErrors: 0,
      queryErrors: 0,
      averageCommandTime: 0,
      averageQueryTime: 0
    };

    this.enabled = process.env.CQRS_ENABLED === 'true';
    
    if (this.enabled) {
      logger.info('CQRS Bus initialized', {
        commandHandlers: this.commandRoutes.size,
        queryHandlers: this.queryRoutes.size
      });
    } else {
      logger.info('CQRS Bus disabled, using direct database access');
    }
  }

  /**
   * Execute a command
   */
  async executeCommand(commandType, data, options = {}) {
    if (!this.enabled) {
      throw new Error('CQRS is disabled');
    }

    const startTime = Date.now();
    const command = {
      commandId: uuidv4(),
      type: commandType,
      data,
      aggregateId: options.aggregateId,
      correlationId: options.correlationId || uuidv4(),
      userId: options.userId,
      timestamp: new Date().toISOString(),
      metadata: options.metadata || {}
    };

    try {
      logger.info('Executing command', {
        commandType,
        commandId: command.commandId,
        aggregateId: command.aggregateId,
        correlationId: command.correlationId
      });

      // Route command to appropriate handler
      const handler = this.commandRoutes.get(commandType);
      if (!handler) {
        throw new Error(`No handler found for command: ${commandType}`);
      }

      // Execute command
      const result = await handler(command);

      // Update stats
      const executionTime = Date.now() - startTime;
      this.stats.commandsExecuted++;
      this.stats.averageCommandTime = 
        (this.stats.averageCommandTime * (this.stats.commandsExecuted - 1) + executionTime) / 
        this.stats.commandsExecuted;

      logger.info('Command executed successfully', {
        commandType,
        commandId: command.commandId,
        executionTime,
        success: result.success,
        eventsGenerated: result.events
      });

      return {
        ...result,
        commandId: command.commandId,
        correlationId: command.correlationId,
        executionTime
      };

    } catch (error) {
      this.stats.commandErrors++;
      const executionTime = Date.now() - startTime;

      logger.error('Command execution failed', {
        commandType,
        commandId: command.commandId,
        error: error.message,
        executionTime
      });

      throw {
        error: error.message,
        commandId: command.commandId,
        commandType,
        correlationId: command.correlationId,
        executionTime
      };
    }
  }

  /**
   * Execute a query
   */
  async executeQuery(queryType, params = {}, options = {}) {
    const startTime = Date.now();
    const query = {
      queryId: uuidv4(),
      type: queryType,
      params,
      correlationId: options.correlationId || uuidv4(),
      userId: options.userId,
      timestamp: new Date().toISOString(),
      metadata: options.metadata || {}
    };

    try {
      logger.debug('Executing query', {
        queryType,
        queryId: query.queryId,
        correlationId: query.correlationId
      });

      // Route query to appropriate handler
      const handler = this.queryRoutes.get(queryType);
      if (!handler) {
        throw new Error(`No handler found for query: ${queryType}`);
      }

      // Execute query
      const result = await handler(query);

      // Update stats
      const executionTime = Date.now() - startTime;
      this.stats.queriesExecuted++;
      this.stats.averageQueryTime = 
        (this.stats.averageQueryTime * (this.stats.queriesExecuted - 1) + executionTime) / 
        this.stats.queriesExecuted;

      logger.debug('Query executed successfully', {
        queryType,
        queryId: query.queryId,
        executionTime,
        success: result.success,
        source: result.source
      });

      return {
        ...result,
        queryId: query.queryId,
        correlationId: query.correlationId,
        executionTime
      };

    } catch (error) {
      this.stats.queryErrors++;
      const executionTime = Date.now() - startTime;

      logger.error('Query execution failed', {
        queryType,
        queryId: query.queryId,
        error: error.message,
        executionTime
      });

      throw {
        error: error.message,
        queryId: query.queryId,
        queryType,
        correlationId: query.correlationId,
        executionTime
      };
    }
  }

  /**
   * Register new command handler
   */
  registerCommandHandler(commandType, handler) {
    this.commandRoutes.set(commandType, handler);
    logger.info('Command handler registered', { commandType });
  }

  /**
   * Register new query handler
   */
  registerQueryHandler(queryType, handler) {
    this.queryRoutes.set(queryType, handler);
    logger.info('Query handler registered', { queryType });
  }

  /**
   * Get available commands
   */
  getAvailableCommands() {
    return Array.from(this.commandRoutes.keys());
  }

  /**
   * Get available queries
   */
  getAvailableQueries() {
    return Array.from(this.queryRoutes.keys());
  }

  /**
   * Get CQRS statistics
   */
  getStats() {
    return {
      ...this.stats,
      enabled: this.enabled,
      commandHandlers: this.commandRoutes.size,
      queryHandlers: this.queryRoutes.size,
      uptime: process.uptime()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.enabled) {
        return {
          status: 'disabled',
          enabled: false
        };
      }

      // Test command routing
      const commandsAvailable = this.getAvailableCommands().length > 0;
      const queriesAvailable = this.getAvailableQueries().length > 0;

      // Test EventStore connection
      const eventStoreHealth = await this.eventBus.healthCheck();

      return {
        status: 'healthy',
        enabled: true,
        commandsAvailable,
        queriesAvailable,
        eventStore: eventStoreHealth,
        stats: this.getStats()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        enabled: this.enabled,
        error: error.message,
        stats: this.getStats()
      };
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      commandsExecuted: 0,
      queriesExecuted: 0,
      commandErrors: 0,
      queryErrors: 0,
      averageCommandTime: 0,
      averageQueryTime: 0
    };
    
    logger.info('CQRS Bus statistics reset');
  }
}

module.exports = CQRSBus;
