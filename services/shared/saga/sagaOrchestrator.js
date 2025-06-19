/**
 * Saga Orchestrator
 * Implements the Saga pattern for distributed transactions
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

// Import predefined saga workflows
const SagaWorkflows = require('./sagaWorkflows');

class SagaOrchestrator extends EventEmitter {
  constructor(eventBus, logger) {
    super();
    this.eventBus = eventBus;
    this.logger = logger;
    this.activeSagas = new Map();
    this.sagaDefinitions = new Map();
    this.compensationHandlers = new Map();
    
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.eventBus.on('messageReceived', (event) => {
      this.handleSagaEvent(event);
    });
  }

  /**
   * Define a saga workflow
   */
  defineSaga(sagaName, definition) {
    this.sagaDefinitions.set(sagaName, {
      name: sagaName,
      steps: definition.steps,
      compensations: definition.compensations,
      timeout: definition.timeout || 300000, // 5 minutes default
      retryPolicy: definition.retryPolicy || { maxRetries: 3, backoffMs: 1000 }
    });

    this.logger.info('Saga defined', { sagaName, stepCount: definition.steps.length });
  }

  /**
   * Start a saga execution
   */
  async startSaga(sagaName, initialData, options = {}) {
    const sagaDefinition = this.sagaDefinitions.get(sagaName);
    if (!sagaDefinition) {
      throw new Error(`Saga definition not found: ${sagaName}`);
    }

    const sagaId = uuidv4();
    const saga = {
      id: sagaId,
      name: sagaName,
      status: 'RUNNING',
      currentStep: 0,
      data: { ...initialData },
      completedSteps: [],
      failedSteps: [],
      compensatedSteps: [],
      startTime: new Date(),
      lastActivity: new Date(),
      correlationId: options.correlationId || sagaId,
      metadata: options.metadata || {}
    };

    this.activeSagas.set(sagaId, saga);
    
    this.logger.info('Saga started', { 
      sagaId, 
      sagaName, 
      correlationId: saga.correlationId 
    });

    // Start timeout timer
    this.setTimeoutTimer(saga, sagaDefinition.timeout);

    // Execute first step
    await this.executeNextStep(saga, sagaDefinition);

    return sagaId;
  }

  /**
   * Execute the next step in the saga
   */
  async executeNextStep(saga, definition) {
    if (saga.currentStep >= definition.steps.length) {
      await this.completeSaga(saga);
      return;
    }

    const step = definition.steps[saga.currentStep];
    saga.lastActivity = new Date();

    try {
      this.logger.info('Executing saga step', {
        sagaId: saga.id,
        step: saga.currentStep,
        action: step.action
      });

      // Publish step execution event
      await this.eventBus.publish(`saga:step:${step.action}`, {
        sagaId: saga.id,
        stepIndex: saga.currentStep,
        stepData: step.data || {},
        sagaData: saga.data,
        correlationId: saga.correlationId
      }, {
        correlationId: saga.correlationId,
        metadata: { sagaName: saga.name, stepName: step.name }
      });

      // Wait for step completion (handled by event listeners)
      
    } catch (error) {
      this.logger.error('Error executing saga step', {
        sagaId: saga.id,
        step: saga.currentStep,
        error: error.message
      });

      await this.handleStepFailure(saga, definition, error);
    }
  }

  /**
   * Handle saga events
   */
  async handleSagaEvent(event) {
    if (!event.type.startsWith('saga:')) {
      return;
    }

    const sagaId = event.data.sagaId;
    const saga = this.activeSagas.get(sagaId);
    
    if (!saga) {
      this.logger.warn('Received event for unknown saga', { sagaId, eventType: event.type });
      return;
    }

    const definition = this.sagaDefinitions.get(saga.name);
    
    try {
      switch (event.type) {
        case 'saga:step:completed':
          await this.handleStepCompleted(saga, definition, event.data);
          break;
        
        case 'saga:step:failed':
          await this.handleStepFailed(saga, definition, event.data);
          break;
        
        case 'saga:compensation:completed':
          await this.handleCompensationCompleted(saga, definition, event.data);
          break;
        
        case 'saga:compensation:failed':
          await this.handleCompensationFailed(saga, definition, event.data);
          break;
      }
    } catch (error) {
      this.logger.error('Error handling saga event', {
        sagaId,
        eventType: event.type,
        error: error.message
      });
    }
  }

  /**
   * Handle step completion
   */
  async handleStepCompleted(saga, definition, eventData) {
    const step = definition.steps[saga.currentStep];
    
    saga.completedSteps.push({
      stepIndex: saga.currentStep,
      stepName: step.name,
      completedAt: new Date(),
      result: eventData.result
    });

    // Merge step result into saga data
    if (eventData.result && typeof eventData.result === 'object') {
      saga.data = { ...saga.data, ...eventData.result };
    }

    saga.currentStep++;
    saga.lastActivity = new Date();

    this.logger.info('Saga step completed', {
      sagaId: saga.id,
      completedStep: saga.currentStep - 1,
      nextStep: saga.currentStep
    });

    // Execute next step
    await this.executeNextStep(saga, definition);
  }

  /**
   * Handle step failure
   */
  async handleStepFailed(saga, definition, eventData) {
    const step = definition.steps[saga.currentStep];
    
    saga.failedSteps.push({
      stepIndex: saga.currentStep,
      stepName: step.name,
      failedAt: new Date(),
      error: eventData.error,
      retryCount: eventData.retryCount || 0
    });

    this.logger.error('Saga step failed', {
      sagaId: saga.id,
      failedStep: saga.currentStep,
      error: eventData.error
    });

    // Check if we should retry
    const retryPolicy = definition.retryPolicy;
    const failedStep = saga.failedSteps[saga.failedSteps.length - 1];
    
    if (failedStep.retryCount < retryPolicy.maxRetries) {
      // Retry the step
      await this.retryStep(saga, definition, failedStep);
    } else {
      // Start compensation
      await this.startCompensation(saga, definition);
    }
  }

  /**
   * Retry a failed step
   */
  async retryStep(saga, definition, failedStep) {
    const delay = definition.retryPolicy.backoffMs * Math.pow(2, failedStep.retryCount);
    
    this.logger.info('Retrying saga step', {
      sagaId: saga.id,
      step: saga.currentStep,
      retryCount: failedStep.retryCount + 1,
      delayMs: delay
    });

    setTimeout(async () => {
      failedStep.retryCount++;
      await this.executeNextStep(saga, definition);
    }, delay);
  }

  /**
   * Start compensation process
   */
  async startCompensation(saga, definition) {
    saga.status = 'COMPENSATING';
    saga.lastActivity = new Date();

    this.logger.warn('Starting saga compensation', {
      sagaId: saga.id,
      completedSteps: saga.completedSteps.length
    });

    // Compensate completed steps in reverse order
    for (let i = saga.completedSteps.length - 1; i >= 0; i--) {
      const completedStep = saga.completedSteps[i];
      const compensation = definition.compensations[completedStep.stepIndex];
      
      if (compensation) {
        await this.executeCompensation(saga, compensation, completedStep);
      }
    }

    // If no compensations needed, mark as failed
    if (saga.compensatedSteps.length === 0) {
      await this.failSaga(saga);
    }
  }

  /**
   * Execute compensation action
   */
  async executeCompensation(saga, compensation, completedStep) {
    try {
      this.logger.info('Executing compensation', {
        sagaId: saga.id,
        stepIndex: completedStep.stepIndex,
        compensationAction: compensation.action
      });

      await this.eventBus.publish(`saga:compensation:${compensation.action}`, {
        sagaId: saga.id,
        stepIndex: completedStep.stepIndex,
        originalResult: completedStep.result,
        compensationData: compensation.data || {},
        sagaData: saga.data,
        correlationId: saga.correlationId
      }, {
        correlationId: saga.correlationId,
        metadata: { sagaName: saga.name, compensationName: compensation.name }
      });

    } catch (error) {
      this.logger.error('Error executing compensation', {
        sagaId: saga.id,
        stepIndex: completedStep.stepIndex,
        error: error.message
      });
    }
  }

  /**
   * Handle compensation completion
   */
  async handleCompensationCompleted(saga, definition, eventData) {
    saga.compensatedSteps.push({
      stepIndex: eventData.stepIndex,
      compensatedAt: new Date(),
      result: eventData.result
    });

    this.logger.info('Compensation completed', {
      sagaId: saga.id,
      stepIndex: eventData.stepIndex
    });

    // Check if all compensations are done
    if (saga.compensatedSteps.length === saga.completedSteps.length) {
      await this.failSaga(saga);
    }
  }

  /**
   * Handle compensation failure
   */
  async handleCompensationFailed(saga, definition, eventData) {
    this.logger.error('Compensation failed', {
      sagaId: saga.id,
      stepIndex: eventData.stepIndex,
      error: eventData.error
    });

    // Mark saga as failed with compensation issues
    saga.status = 'COMPENSATION_FAILED';
    saga.endTime = new Date();
    
    this.emit('sagaCompensationFailed', saga);
    this.activeSagas.delete(saga.id);
  }

  /**
   * Complete saga successfully
   */
  async completeSaga(saga) {
    saga.status = 'COMPLETED';
    saga.endTime = new Date();
    
    this.logger.info('Saga completed successfully', {
      sagaId: saga.id,
      duration: saga.endTime - saga.startTime
    });

    await this.eventBus.publish('saga:completed', {
      sagaId: saga.id,
      sagaName: saga.name,
      result: saga.data,
      duration: saga.endTime - saga.startTime,
      correlationId: saga.correlationId
    });

    this.emit('sagaCompleted', saga);
    this.activeSagas.delete(saga.id);
  }

  /**
   * Fail saga
   */
  async failSaga(saga) {
    saga.status = 'FAILED';
    saga.endTime = new Date();
    
    this.logger.error('Saga failed', {
      sagaId: saga.id,
      duration: saga.endTime - saga.startTime
    });

    await this.eventBus.publish('saga:failed', {
      sagaId: saga.id,
      sagaName: saga.name,
      failureReason: saga.failedSteps[saga.failedSteps.length - 1]?.error,
      duration: saga.endTime - saga.startTime,
      correlationId: saga.correlationId
    });

    this.emit('sagaFailed', saga);
    this.activeSagas.delete(saga.id);
  }

  /**
   * Set timeout timer for saga
   */
  setTimeoutTimer(saga, timeoutMs) {
    setTimeout(() => {
      if (this.activeSagas.has(saga.id) && saga.status === 'RUNNING') {
        this.logger.warn('Saga timed out', { sagaId: saga.id });
        this.startCompensation(saga, this.sagaDefinitions.get(saga.name));
      }
    }, timeoutMs);
  }

  /**
   * Get saga status
   */
  getSagaStatus(sagaId) {
    return this.activeSagas.get(sagaId);
  }

  /**
   * Get all active sagas
   */
  getActiveSagas() {
    return Array.from(this.activeSagas.values());
  }

  /**
   * Get saga statistics
   */
  getStatistics() {
    const activeSagas = this.getActiveSagas();
    
    return {
      activeSagas: activeSagas.length,
      runningCount: activeSagas.filter(s => s.status === 'RUNNING').length,
      compensatingCount: activeSagas.filter(s => s.status === 'COMPENSATING').length,
      definedSagas: this.sagaDefinitions.size
    };
  }
}

module.exports = SagaOrchestrator;
