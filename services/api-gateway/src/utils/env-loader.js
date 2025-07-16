/**
 * Environment Loader for API Gateway
 * Simple environment variable validation and setup
 */

const fs = require('fs');
const path = require('path');

/**
 * Setup environment with validation
 */
function setupEnvironment(serviceName, requiredVars = [], strict = false) {
  // Load .env file if it exists
  const envPath = path.join(__dirname, '../../../.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }

  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else if (value.includes('your_') || value.includes('YOUR_') || value.includes('xxxxx')) {
      warnings.push(varName);
    }
  }

  if (missing.length > 0) {
    console.warn(`⚠️ Missing required environment variables for ${serviceName}:`, missing);
    if (strict) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`⚠️ Environment variables with placeholder values for ${serviceName}:`, warnings);
  }

  return {
    success: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Get required variables for specific service types
 */
function getRequiredVarsForService(serviceType) {
  switch (serviceType) {
    case 'api-gateway':
      return ['JWT_SECRET'];
    case 'auth':
      return ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET'];
    case 'link':
      return ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET'];
    case 'community':
      return ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET'];
    case 'chat':
      return ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'GEMINI_API_KEY'];
    case 'news':
      return ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET', 'NEWSAPI_API_KEY'];
    case 'admin':
      return ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'JWT_SECRET'];
    default:
      return ['JWT_SECRET'];
  }
}

module.exports = {
  setupEnvironment,
  getRequiredVarsForService
};
