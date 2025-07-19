/**
 * Standardized Environment Variable Loader for Microservices
 * Implements proper microservice configuration hierarchy:
 * 1. Local service .env (highest priority)
 * 2. Shared config/shared.env (fallback for common vars)
 * 3. Production environment variables (platform-provided)
 */

const path = require('path');
const fs = require('fs');

/**
 * Load environment variables with proper microservice hierarchy
 * @param {string} serviceName - Name of the service calling this function
 * @param {string[]} requiredVars - Array of required environment variables
 * @param {boolean} strict - Whether to throw error on missing vars (default: true in production)
 */
function setupEnvironment(serviceName = 'unknown-service', requiredVars = [], strict = null) {
  // Auto-detect strict mode based on environment
  if (strict === null) {
    strict = process.env.NODE_ENV === 'production';
  }

  // Skip loading in production - environment variables are set by platform
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌍 ${serviceName}: Using production environment variables`);
    return validateEnvironment(serviceName, requiredVars, strict);
  }

  // Skip loading in test environment - use default test values
  if (process.env.NODE_ENV === 'test') {
    console.log(`🧪 ${serviceName}: Using test environment variables`);
    return { loaded: false, source: 'test-environment', success: true };
  }

  const loadResults = [];

  // 1. Try to load local service .env file (highest priority)
  const localEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(localEnvPath)) {
    require('dotenv').config({ path: localEnvPath });
    loadResults.push({ path: localEnvPath, type: 'local', loaded: true });
    console.log(`✅ ${serviceName}: Loaded local .env from ${localEnvPath}`);
  } else {
    console.log(`⚠️ ${serviceName}: No local .env found at ${localEnvPath}`);
  }

  // 2. Try to load shared configuration (fallback for common vars)
  const sharedEnvPath = path.resolve(__dirname, 'shared.env');
  if (fs.existsSync(sharedEnvPath)) {
    // Load shared config but don't override existing vars
    const sharedConfig = require('dotenv').config({ path: sharedEnvPath });
    if (sharedConfig.parsed) {
      let sharedVarsLoaded = 0;
      Object.entries(sharedConfig.parsed).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
          sharedVarsLoaded++;
        }
      });
      loadResults.push({ 
        path: sharedEnvPath, 
        type: 'shared', 
        loaded: true, 
        varsLoaded: sharedVarsLoaded 
      });
      console.log(`📋 ${serviceName}: Loaded ${sharedVarsLoaded} shared variables from ${sharedEnvPath}`);
    }
  } else {
    console.log(`⚠️ ${serviceName}: No shared config found at ${sharedEnvPath}`);
  }

  // 3. Fallback: Try to find .env in parent directories (legacy support)
  if (loadResults.length === 0) {
    const fallbackPaths = [
      path.resolve(process.cwd(), '../.env'),     // one level up
      path.resolve(process.cwd(), '../../.env'),  // two levels up (from services/*/src/)
      path.resolve(process.cwd(), '../../../.env') // three levels up
    ];

    for (const fallbackPath of fallbackPaths) {
      if (fs.existsSync(fallbackPath)) {
        require('dotenv').config({ path: fallbackPath });
        loadResults.push({ path: fallbackPath, type: 'fallback', loaded: true });
        console.log(`🔄 ${serviceName}: Fallback loaded .env from ${fallbackPath}`);
        break;
      }
    }
  }

  // Validate environment after loading
  const validation = validateEnvironment(serviceName, requiredVars, strict);

  return {
    loaded: loadResults.length > 0,
    sources: loadResults,
    validation,
    success: validation.success
  };
}

/**
 * Validate required environment variables
 * @param {string} serviceName - Name of the service
 * @param {string[]} requiredVars - Required environment variables
 * @param {boolean} strict - Whether to throw error on missing vars
 */
function validateEnvironment(serviceName, requiredVars = [], strict = false) {
  const missing = [];
  const warnings = [];
  const localhostFallbacks = [];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else if (value.includes('your_') || value.includes('YOUR_') || value.includes('xxxxx')) {
      warnings.push(varName);
    } else if (value.includes('localhost') || value.includes('127.0.0.1')) {
      localhostFallbacks.push(varName);
    }
  }

  // Report results
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables for ${serviceName}:`, missing);
    if (strict) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`⚠️ Environment variables with placeholder values for ${serviceName}:`, warnings);
    console.warn(`💡 Please update these variables with actual values`);
  }

  if (localhostFallbacks.length > 0) {
    console.warn(`🏠 Environment variables using localhost for ${serviceName}:`, localhostFallbacks);
    console.warn(`💡 In Docker/K8s, use service names instead of localhost`);
  }

  const success = missing.length === 0 && warnings.length === 0;
  if (success) {
    console.log(`✅ Environment validation passed for ${serviceName}`);
  }

  return {
    success,
    missing,
    warnings,
    localhostFallbacks,
    strict
  };
}

/**
 * Get required variables for specific service types
 * @param {string} serviceType - Type of service (auth, link, community, chat, etc.)
 * @returns {string[]} Array of required variable names
 */
function getRequiredVarsForService(serviceType) {
  const serviceRequirements = {
    'api-gateway': ['JWT_SECRET'],
    'auth-service': ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET'],
    'chat-service': ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'GEMINI_API_KEY'],
    'link-service': ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'VIRUSTOTAL_API_KEY'],
    'community-service': ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET'],
    'news-service': ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'NEWSAPI_API_KEY'],
    'admin-service': ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET'],
    'phishtank-service': ['JWT_SECRET'],
    'criminalip-service': ['JWT_SECRET']
  };

  return serviceRequirements[serviceType] || ['JWT_SECRET'];
}

/**
 * Quick setup for services - combines loading and validation
 * @param {string} serviceName - Name of the service
 * @param {string} serviceType - Type of service (optional, will derive from serviceName)
 * @param {boolean} strict - Whether to throw error on missing vars
 */
function quickSetup(serviceName, serviceType = null, strict = null) {
  // Derive service type from service name if not provided
  if (!serviceType) {
    serviceType = serviceName;
  }

  const requiredVars = getRequiredVarsForService(serviceType);
  return setupEnvironment(serviceName, requiredVars, strict);
}

module.exports = {
  setupEnvironment,
  validateEnvironment,
  getRequiredVarsForService,
  quickSetup
};
