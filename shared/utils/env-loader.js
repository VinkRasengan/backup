/**
 * Load environment variables utility
 * Handles both development (.env file) and production (platform env vars)
 */
const path = require('path');

function loadEnvironmentVariables() {
  // In production (Render, Docker, etc.), environment variables are set by the platform
  // In development, load from .env file at project root
  if (process.env.NODE_ENV !== 'production') {
    try {
      require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
    } catch (error) {
      console.warn('Warning: Could not load .env file:', error.message);
    }
  }
}

module.exports = { loadEnvironmentVariables };
