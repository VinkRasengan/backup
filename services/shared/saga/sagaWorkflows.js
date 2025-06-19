/**
 * Predefined Saga Workflows
 * Common distributed transaction patterns for the microservices
 */

const SagaWorkflows = {
  /**
   * User Registration Saga
   * Coordinates user creation across multiple services
   */
  USER_REGISTRATION: {
    name: 'user_registration',
    steps: [
      {
        name: 'validate_user_data',
        action: 'auth:validate_user',
        data: { validateEmail: true, validatePassword: true }
      },
      {
        name: 'create_auth_user',
        action: 'auth:create_user',
        data: {}
      },
      {
        name: 'create_user_profile',
        action: 'community:create_profile',
        data: {}
      },
      {
        name: 'setup_user_preferences',
        action: 'news:setup_preferences',
        data: { defaultCategories: ['security', 'fraud'] }
      },
      {
        name: 'send_welcome_notification',
        action: 'notification:send_welcome',
        data: {}
      }
    ],
    compensations: [
      null, // No compensation for validation
      {
        name: 'delete_auth_user',
        action: 'auth:delete_user',
        data: {}
      },
      {
        name: 'delete_user_profile',
        action: 'community:delete_profile',
        data: {}
      },
      {
        name: 'delete_user_preferences',
        action: 'news:delete_preferences',
        data: {}
      },
      null // No compensation needed for notification
    ],
    timeout: 120000, // 2 minutes
    retryPolicy: { maxRetries: 2, backoffMs: 1000 }
  },

  /**
   * Link Scan and Report Saga
   * Coordinates link scanning across security services
   */
  LINK_SCAN_AND_REPORT: {
    name: 'link_scan_and_report',
    steps: [
      {
        name: 'validate_link',
        action: 'link:validate_url',
        data: {}
      },
      {
        name: 'scan_with_virustotal',
        action: 'link:scan_virustotal',
        data: {}
      },
      {
        name: 'scan_with_phishtank',
        action: 'link:scan_phishtank',
        data: {}
      },
      {
        name: 'analyze_reputation',
        action: 'link:analyze_reputation',
        data: {}
      },
      {
        name: 'generate_report',
        action: 'link:generate_report',
        data: {}
      },
      {
        name: 'store_scan_result',
        action: 'link:store_result',
        data: {}
      },
      {
        name: 'notify_user',
        action: 'notification:scan_complete',
        data: {}
      }
    ],
    compensations: [
      null, // No compensation for validation
      null, // External API calls don't need compensation
      null,
      null,
      {
        name: 'delete_report',
        action: 'link:delete_report',
        data: {}
      },
      {
        name: 'delete_scan_result',
        action: 'link:delete_result',
        data: {}
      },
      null // No compensation for notification
    ],
    timeout: 180000, // 3 minutes
    retryPolicy: { maxRetries: 3, backoffMs: 2000 }
  },

  /**
   * Community Post Creation Saga
   * Coordinates post creation with moderation and notifications
   */
  COMMUNITY_POST_CREATION: {
    name: 'community_post_creation',
    steps: [
      {
        name: 'validate_post_content',
        action: 'community:validate_content',
        data: {}
      },
      {
        name: 'check_user_permissions',
        action: 'auth:check_permissions',
        data: { requiredPermission: 'create_post' }
      },
      {
        name: 'moderate_content',
        action: 'admin:moderate_content',
        data: {}
      },
      {
        name: 'create_post',
        action: 'community:create_post',
        data: {}
      },
      {
        name: 'update_user_stats',
        action: 'community:update_user_stats',
        data: {}
      },
      {
        name: 'notify_followers',
        action: 'notification:notify_followers',
        data: {}
      }
    ],
    compensations: [
      null, // No compensation for validation
      null, // No compensation for permission check
      null, // No compensation for moderation
      {
        name: 'delete_post',
        action: 'community:delete_post',
        data: {}
      },
      {
        name: 'revert_user_stats',
        action: 'community:revert_user_stats',
        data: {}
      },
      null // No compensation for notifications
    ],
    timeout: 90000, // 1.5 minutes
    retryPolicy: { maxRetries: 2, backoffMs: 1000 }
  },

  /**
   * User Account Deletion Saga
   * Coordinates complete user data removal across services
   */
  USER_ACCOUNT_DELETION: {
    name: 'user_account_deletion',
    steps: [
      {
        name: 'verify_deletion_request',
        action: 'auth:verify_deletion',
        data: {}
      },
      {
        name: 'backup_user_data',
        action: 'admin:backup_user_data',
        data: {}
      },
      {
        name: 'delete_community_posts',
        action: 'community:delete_user_posts',
        data: {}
      },
      {
        name: 'delete_chat_history',
        action: 'chat:delete_user_history',
        data: {}
      },
      {
        name: 'delete_scan_history',
        action: 'link:delete_user_scans',
        data: {}
      },
      {
        name: 'delete_news_preferences',
        action: 'news:delete_user_preferences',
        data: {}
      },
      {
        name: 'delete_auth_account',
        action: 'auth:delete_account',
        data: {}
      },
      {
        name: 'send_deletion_confirmation',
        action: 'notification:deletion_confirmed',
        data: {}
      }
    ],
    compensations: [
      null, // No compensation for verification
      {
        name: 'restore_user_data',
        action: 'admin:restore_user_data',
        data: {}
      },
      {
        name: 'restore_community_posts',
        action: 'community:restore_user_posts',
        data: {}
      },
      {
        name: 'restore_chat_history',
        action: 'chat:restore_user_history',
        data: {}
      },
      {
        name: 'restore_scan_history',
        action: 'link:restore_user_scans',
        data: {}
      },
      {
        name: 'restore_news_preferences',
        action: 'news:restore_user_preferences',
        data: {}
      },
      {
        name: 'restore_auth_account',
        action: 'auth:restore_account',
        data: {}
      },
      null // No compensation for notification
    ],
    timeout: 300000, // 5 minutes
    retryPolicy: { maxRetries: 1, backoffMs: 5000 }
  },

  /**
   * Security Alert Processing Saga
   * Coordinates threat detection and response
   */
  SECURITY_ALERT_PROCESSING: {
    name: 'security_alert_processing',
    steps: [
      {
        name: 'analyze_threat',
        action: 'link:analyze_threat',
        data: {}
      },
      {
        name: 'check_threat_database',
        action: 'link:check_threat_db',
        data: {}
      },
      {
        name: 'calculate_risk_score',
        action: 'link:calculate_risk',
        data: {}
      },
      {
        name: 'create_security_alert',
        action: 'admin:create_alert',
        data: {}
      },
      {
        name: 'notify_administrators',
        action: 'notification:notify_admins',
        data: {}
      },
      {
        name: 'update_threat_intelligence',
        action: 'link:update_threat_intel',
        data: {}
      },
      {
        name: 'log_security_event',
        action: 'admin:log_security_event',
        data: {}
      }
    ],
    compensations: [
      null, // No compensation for analysis
      null, // No compensation for database check
      null, // No compensation for risk calculation
      {
        name: 'delete_security_alert',
        action: 'admin:delete_alert',
        data: {}
      },
      null, // No compensation for notifications
      {
        name: 'revert_threat_intelligence',
        action: 'link:revert_threat_intel',
        data: {}
      },
      {
        name: 'delete_security_log',
        action: 'admin:delete_security_log',
        data: {}
      }
    ],
    timeout: 120000, // 2 minutes
    retryPolicy: { maxRetries: 3, backoffMs: 1000 }
  },

  /**
   * Bulk Link Processing Saga
   * Coordinates processing of multiple links
   */
  BULK_LINK_PROCESSING: {
    name: 'bulk_link_processing',
    steps: [
      {
        name: 'validate_bulk_request',
        action: 'link:validate_bulk_request',
        data: {}
      },
      {
        name: 'check_rate_limits',
        action: 'auth:check_rate_limits',
        data: {}
      },
      {
        name: 'process_links_batch',
        action: 'link:process_batch',
        data: {}
      },
      {
        name: 'aggregate_results',
        action: 'link:aggregate_results',
        data: {}
      },
      {
        name: 'generate_bulk_report',
        action: 'link:generate_bulk_report',
        data: {}
      },
      {
        name: 'store_bulk_results',
        action: 'link:store_bulk_results',
        data: {}
      },
      {
        name: 'notify_completion',
        action: 'notification:bulk_complete',
        data: {}
      }
    ],
    compensations: [
      null, // No compensation for validation
      null, // No compensation for rate limit check
      {
        name: 'cleanup_partial_processing',
        action: 'link:cleanup_batch',
        data: {}
      },
      null, // No compensation for aggregation
      {
        name: 'delete_bulk_report',
        action: 'link:delete_bulk_report',
        data: {}
      },
      {
        name: 'delete_bulk_results',
        action: 'link:delete_bulk_results',
        data: {}
      },
      null // No compensation for notification
    ],
    timeout: 600000, // 10 minutes
    retryPolicy: { maxRetries: 2, backoffMs: 5000 }
  }
};

/**
 * Saga workflow factory
 */
class SagaWorkflowFactory {
  /**
   * Get workflow definition by name
   */
  static getWorkflow(workflowName) {
    const workflow = SagaWorkflows[workflowName];
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }
    return { ...workflow }; // Return a copy
  }

  /**
   * Get all available workflows
   */
  static getAllWorkflows() {
    return Object.keys(SagaWorkflows);
  }

  /**
   * Validate workflow definition
   */
  static validateWorkflow(workflow) {
    const errors = [];

    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      errors.push('Workflow steps must be an array');
    }

    if (workflow.steps) {
      workflow.steps.forEach((step, index) => {
        if (!step.name) {
          errors.push(`Step ${index} is missing name`);
        }
        if (!step.action) {
          errors.push(`Step ${index} is missing action`);
        }
      });
    }

    if (workflow.compensations && workflow.compensations.length !== workflow.steps.length) {
      errors.push('Compensations array must match steps array length');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create custom workflow
   */
  static createCustomWorkflow(name, steps, compensations, options = {}) {
    const workflow = {
      name,
      steps,
      compensations,
      timeout: options.timeout || 300000,
      retryPolicy: options.retryPolicy || { maxRetries: 3, backoffMs: 1000 }
    };

    const validation = this.validateWorkflow(workflow);
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
    }

    return workflow;
  }
}

module.exports = {
  SagaWorkflows,
  SagaWorkflowFactory
};
