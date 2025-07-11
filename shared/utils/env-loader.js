/**
 * Standardized Environment Variable Loader
 * Ensures consistent .env loading across all services
 */
const path = require('path');
const fs = require('fs');

/**
 * Load environment variables from .env file
 * Searches for .env file in project root directory
 * @param {string} serviceName - Name of the service calling this function
 * @param {string} customPath - Custom path to .env file (optional)
 */
function loadEnvironmentVariables(serviceName = 'unknown-service', customPath = null) {
  // Skip loading in production - environment variables are set by platform
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌍 ${serviceName}: Using production environment variables`);
    return { loaded: false, source: 'production-platform' };
  }

  let envPath;
  
  if (customPath) {
    envPath = customPath;
  } else {
    // Standard path: look for .env in project root
    // This works from any service directory
    envPath = path.resolve(process.cwd(), '.env');
    
    // If not found, try going up directories to find project root
    if (!fs.existsSync(envPath)) {
      const possiblePaths = [
        path.resolve(__dirname, '../../../.env'),  // from shared/utils/
        path.resolve(__dirname, '../../../../.env'), // from services/*/src/
        path.resolve(__dirname, '../../.env'),     // from services/*/
        path.resolve(process.cwd(), '../.env'),    // one level up
        path.resolve(process.cwd(), '../../.env'), // two levels up
        path.resolve(process.cwd(), '../../../.env') // three levels up
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          envPath = possiblePath;
          break;
        }
      }
    }
  }

  try {
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
      console.log(`✅ ${serviceName}: Environment variables loaded from ${envPath}`);
      return { 
        loaded: true, 
        source: envPath,
        exists: true
      };
    } else {
      console.warn(`⚠️ ${serviceName}: .env file not found at ${envPath}`);
      console.warn(`   Searched paths: ${envPath}`);
      console.warn(`   Please create .env file in project root or run: npm run env:setup`);
      return { 
        loaded: false, 
        source: envPath,
        exists: false,
        error: 'ENV_FILE_NOT_FOUND'
      };
    }
  } catch (error) {
    console.error(`❌ ${serviceName}: Failed to load .env file:`, error.message);
    return { 
      loaded: false, 
      source: envPath,
      exists: fs.existsSync(envPath),
      error: error.message
    };
  }
}

/**
 * Validate required environment variables
 * @param {string[]} requiredVars - Array of required variable names
 * @param {string} serviceName - Name of the service
 * @returns {object} Validation result
 */
function validateRequiredVars(requiredVars, serviceName = 'unknown-service') {
  const missing = [];
  const placeholders = [];
  const valid = [];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missing.push(varName);
    } else if (
      value.includes('your_') || 
      value.includes('YOUR_') || 
      value.includes('xxxxx') ||
      value.includes('CHANGE_THIS') ||
      value.includes('REPLACE_WITH')
    ) {
      placeholders.push(varName);
    } else {
      valid.push(varName);
    }
  }

  const isValid = missing.length === 0 && placeholders.length === 0;

  if (!isValid) {
    console.error(`❌ ${serviceName}: Environment validation failed:`);
    if (missing.length > 0) {
      console.error(`   Missing variables: ${missing.join(', ')}`);
    }
    if (placeholders.length > 0) {
      console.error(`   Placeholder values: ${placeholders.join(', ')}`);
    }
    console.error(`   Please update your .env file with valid values`);
  } else {
    console.log(`✅ ${serviceName}: All required environment variables are valid`);
  }

  return {
    isValid,
    missing,
    placeholders,
    valid,
    total: requiredVars.length
  };
}

/**
 * Standard environment setup for services
 * Loads .env and validates required variables
 * @param {string} serviceName - Name of the service
 * @param {string[]} requiredVars - Array of required variable names
 * @param {boolean} exitOnError - Whether to exit process on validation error
 * @returns {object} Setup result
 */
function setupEnvironment(serviceName, requiredVars = [], exitOnError = false) {
  console.log(`🔧 ${serviceName}: Setting up environment...`);
  
  // Load environment variables
  const loadResult = loadEnvironmentVariables(serviceName);
  
  if (!loadResult.loaded && loadResult.error === 'ENV_FILE_NOT_FOUND') {
    console.error(`❌ ${serviceName}: Cannot start without .env file`);
    console.error(`   Run: npm run env:setup to create .env file`);
    
    if (exitOnError && process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    
    return {
      success: false,
      error: 'ENV_FILE_NOT_FOUND',
      loadResult,
      validationResult: null
    };
  }

  // Validate required variables if any provided
  let validationResult = null;
  if (requiredVars.length > 0) {
    validationResult = validateRequiredVars(requiredVars, serviceName);
    
    if (!validationResult.isValid) {
      if (exitOnError && process.env.NODE_ENV !== 'test') {
        console.error(`❌ ${serviceName}: Exiting due to environment validation errors`);
        process.exit(1);
      }
      
      return {
        success: false,
        error: 'VALIDATION_FAILED',
        loadResult,
        validationResult
      };
    }
  }

  console.log(`✅ ${serviceName}: Environment setup complete`);
  return {
    success: true,
    loadResult,
    validationResult
  };
}

/**
 * Get common required variables for different service types
 */
const commonRequiredVars = {
  firebase: [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ],
  auth: [
    'JWT_SECRET'
  ],
  ai: [
    'GEMINI_API_KEY'
  ],
  thirdParty: [
    'VIRUSTOTAL_API_KEY',
    'SCAMADVISER_API_KEY',
    'NEWSAPI_API_KEY'
  ]
};

/**
 * Get required variables for specific service types
 * @param {string} serviceType - Type of service (auth, link, community, chat, etc.)
 * @returns {string[]} Array of required variable names
 */
function getRequiredVarsForService(serviceType) {
  const baseVars = [...commonRequiredVars.firebase, ...commonRequiredVars.auth];
  
  switch (serviceType) {
    case 'auth':
      return baseVars;
    
    case 'link':
      return [...baseVars, 'VIRUSTOTAL_API_KEY']; // Others are optional
    
    case 'community':
      return baseVars;
    
    case 'chat':
      return [...baseVars, ...commonRequiredVars.ai];
    
    case 'news':
      return [...baseVars, 'NEWSAPI_API_KEY'];
    
    case 'admin':
      return baseVars;
    
    case 'api-gateway':
      return ['JWT_SECRET']; // API Gateway doesn't need Firebase directly
    
    default:
      return baseVars;
  }
}

module.exports = { 
  loadEnvironmentVariables,
  validateRequiredVars,
  setupEnvironment,
  getRequiredVarsForService,
  commonRequiredVars
};
