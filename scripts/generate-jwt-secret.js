#!/usr/bin/env node

/**
 * Generate JWT Secret for development
 * Creates a secure 64-character JWT secret
 */

const crypto = require('crypto');

function generateJWTSecret() {
  // Generate 64 random bytes and convert to hex (128 characters)
  // Then take first 64 characters for a strong but manageable secret
  const secret = crypto.randomBytes(32).toString('hex');
  return secret;
}

function generateSecureSecret() {
  // Alternative: use base64 for more compact but equally secure secret
  const secret = crypto.randomBytes(48).toString('base64');
  return secret;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('🔐 Generating JWT Secret...');
  console.log('');
  
  const hexSecret = generateJWTSecret();
  const base64Secret = generateSecureSecret();
  
  console.log('Option 1 (Hex - 64 chars):');
  console.log(`JWT_SECRET=${hexSecret}`);
  console.log('');
  
  console.log('Option 2 (Base64 - compact):');
  console.log(`JWT_SECRET=${base64Secret}`);
  console.log('');
  
  console.log('💡 Copy one of these to your .env file');
  console.log('   Both are equally secure - choose what you prefer');
}

export default {
  generateJWTSecret,
  generateSecureSecret
}; 