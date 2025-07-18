#!/usr/bin/env node

/**
 * Build script to replace environment variable placeholders in _redirects file
 * This script runs during the build process to inject actual URLs
 */

const fs = require('fs');
const path = require('path');

const REDIRECTS_PATH = path.join(__dirname, '../public/_redirects');
const REDIRECTS_TEMPLATE_PATH = path.join(__dirname, '../public/_redirects.template');

function buildRedirects() {
  console.log('🔧 Building _redirects file with environment variables...');

  // Read the template file
  let redirectsContent;
  try {
    if (fs.existsSync(REDIRECTS_TEMPLATE_PATH)) {
      redirectsContent = fs.readFileSync(REDIRECTS_TEMPLATE_PATH, 'utf8');
    } else {
      redirectsContent = fs.readFileSync(REDIRECTS_PATH, 'utf8');
    }
  } catch (error) {
    console.error('❌ Error reading _redirects file:', error.message);
    process.exit(1);
  }

  // Get API Gateway URL from environment (updated for current deployment)
  const apiGatewayUrl = process.env.REACT_APP_API_URL ||
                       process.env.REACT_APP_API_GATEWAY_URL ||
                       'https://api-gateway-3lr5.onrender.com';

  console.log('🔗 Using API Gateway URL:', apiGatewayUrl);

  // Replace placeholders
  const updatedContent = redirectsContent.replace(/__API_GATEWAY_URL__/g, apiGatewayUrl);

  // Write the updated file
  try {
    fs.writeFileSync(REDIRECTS_PATH, updatedContent, 'utf8');
    console.log('✅ _redirects file updated successfully');
  } catch (error) {
    console.error('❌ Error writing _redirects file:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  buildRedirects();
}

module.exports = { buildRedirects };
