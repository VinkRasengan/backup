#!/usr/bin/env node

/**
 * Update all env-loader files with improved validation
 */

const fs = require('fs');
const path = require('path');

const improvedEnvLoader = `/**
 * Setup environment with validation
 * @param {string} serviceName - Name of the service
 * @param {string[]} requiredVars - Required environment variables
 * @param {boolean} strict - Whether to throw error on missing vars (default: true in production)
 */
function setupEnvironment(serviceName, requiredVars = [], strict = null) {
  // Auto-detect strict mode based on environment
  if (strict === null) {
    strict = process.env.NODE_ENV === 'production';
  }

  // Load .env file from root directory
  const rootEnvPath = path.join(process.cwd(), '../../.env');
  const localEnvPath = path.join(process.cwd(), '.env');
  
  // Try root .env first, then local .env
  if (fs.existsSync(rootEnvPath)) {
    require('dotenv').config({ path: rootEnvPath });
  } else if (fs.existsSync(localEnvPath)) {
    require('dotenv').config({ path: localEnvPath });
  }

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

  // Log environment status
  console.log(\`🔧 Environment setup for \${serviceName}:\`);
  console.log(\`   Environment: \${process.env.NODE_ENV || 'development'}\`);
  console.log(\`   Strict mode: \${strict ? 'enabled' : 'disabled'}\`);

  if (missing.length > 0) {
    console.error(\`❌ Missing required environment variables for \${serviceName}:\`, missing);
    console.error(\`💡 Add these to your .env file or set them as environment variables\`);
    if (strict) {
      throw new Error(\`Missing required environment variables: \${missing.join(', ')}\`);
    }
  }

  if (warnings.length > 0) {
    console.warn(\`⚠️  Environment variables with placeholder values for \${serviceName}:\`, warnings);
    console.warn(\`💡 Replace placeholder values with actual configuration\`);
  }

  if (localhostFallbacks.length > 0) {
    console.warn(\`🏠 Environment variables using localhost for \${serviceName}:\`, localhostFallbacks);
    console.warn(\`💡 In Docker/K8s, use service names instead of localhost\`);
    console.warn(\`💡 Example: http://auth-service:3001 instead of http://localhost:3001\`);
  }

  const success = missing.length === 0 && warnings.length === 0;
  if (success) {
    console.log(\`✅ Environment validation passed for \${serviceName}\`);
  }

  return {
    success,
    missing,
    warnings,
    localhostFallbacks,
    strict
  };
}`;

const services = [
  'auth-service',
  'chat-service', 
  'admin-service',
  'phishtank-service',
  'api-gateway'
];

function updateEnvLoader(serviceName) {
  const envLoaderPath = path.join(__dirname, '..', 'services', serviceName, 'src', 'utils', 'env-loader.js');
  
  if (!fs.existsSync(envLoaderPath)) {
    console.log(`⚠️  Skipping ${serviceName} - env-loader.js not found`);
    return;
  }

  try {
    const content = fs.readFileSync(envLoaderPath, 'utf8');
    
    // Find the setupEnvironment function and replace it
    const functionStart = content.indexOf('function setupEnvironment');
    const functionEnd = content.indexOf('module.exports');
    
    if (functionStart === -1 || functionEnd === -1) {
      console.log(`⚠️  Skipping ${serviceName} - function structure not recognized`);
      return;
    }

    const beforeFunction = content.substring(0, functionStart);
    const afterFunction = content.substring(functionEnd);
    
    const newContent = beforeFunction + improvedEnvLoader + '\n\n' + afterFunction;
    
    fs.writeFileSync(envLoaderPath, newContent);
    console.log(`✅ Updated env-loader for ${serviceName}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${serviceName}:`, error.message);
  }
}

console.log('🔄 Updating env-loader files...\n');

services.forEach(updateEnvLoader);

console.log('\n✅ Env-loader update complete!');
console.log('💡 Run "node scripts/validate-env-config.js" to test the changes');
