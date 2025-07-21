/**
 * Environment Loader for Link Service
 * Simplified version for container deployment
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

/**
 * Quick setup for service environment
 */
function quickSetup(serviceName = 'link-service') {
  // Load service-specific .env if exists
  const serviceEnvPath = path.join(process.cwd(), '.env');
  
  if (fs.existsSync(serviceEnvPath)) {
    const result = dotenv.config({ path: serviceEnvPath });
    if (result.error) {
      console.warn(`Warning: Could not load .env file: ${result.error.message}`);
    }
  }

  // Set default service name
  if (!process.env.SERVICE_NAME) {
    process.env.SERVICE_NAME = serviceName;
  }

  return {
    serviceName: process.env.SERVICE_NAME,
    port: process.env.PORT || process.env.LINK_SERVICE_PORT || 3002,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
}

module.exports = {
  quickSetup
};
