#!/usr/bin/env node

/**
 * Docker Firebase Setup Script
 * Configures Firebase for Docker deployment with proper error handling
 */

import fs from 'fs';
import path from 'path';

console.log('🐳 Docker Firebase Setup Starting...\n');

// Check if running in Docker
const isDocker = fs.existsSync('/.dockerenv') || process.env.DOCKER_CONTAINER === 'true';
console.log('Environment:', isDocker ? '🐳 Docker Container' : '💻 Local Development');

// Environment variables to check
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

const optionalEnvVars = [
  'NODE_ENV',
  'JWT_SECRET',
  'REDIS_URL'
];

console.log('\n📋 Environment Variables Check:');
console.log('Required Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (varName.includes('KEY') ? 'SET (hidden)' : value) : 'MISSING';
  console.log(`  ${status} ${varName}: ${display}`);
});

console.log('\nOptional Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '⚠️';
  const display = value ? (varName.includes('SECRET') || varName.includes('PASSWORD') ? 'SET (hidden)' : value) : 'NOT SET';
  console.log(`  ${status} ${varName}: ${display}`);
});

// Check for missing required variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.log('\n❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  
  console.log('\n🔧 To fix this:');
  console.log('1. Check your .env file in the project root');
  console.log('2. Ensure docker-compose.yml passes environment variables correctly');
  console.log('3. Verify Firebase service account credentials');
  
  process.exit(1);
}

// Validate Firebase private key format
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  console.log('\n🔍 Validating Firebase Private Key...');
  
  let cleanKey = privateKey.trim();
  
  // Remove outer quotes if present
  if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) ||
      (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
    cleanKey = cleanKey.slice(1, -1);
  }
  
  // Replace escaped newlines
  cleanKey = cleanKey.replace(/\\n/g, '\n');
  
  if (cleanKey.includes('-----BEGIN PRIVATE KEY-----') && cleanKey.includes('-----END PRIVATE KEY-----')) {
    console.log('✅ Private key format appears valid');
  } else {
    console.log('❌ Private key format appears invalid');
    console.log('Expected format: -----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----');
  }
}

// Network connectivity check for Docker
if (isDocker) {
  console.log('\n🌐 Docker Network Configuration:');
  
  // Check DNS resolution
  const dns = require('dns');
  const testDomains = ['firebase.googleapis.com', 'firestore.googleapis.com', 'google.com'];
  
  for (const domain of testDomains) {
    try {
      await new Promise((resolve, reject) => {
        dns.lookup(domain, (err, address) => {
          if (err) reject(err);
          else resolve(address);
        });
      });
      console.log(`✅ DNS resolution for ${domain}: OK`);
    } catch (error) {
      console.log(`❌ DNS resolution for ${domain}: FAILED - ${error.message}`);
    }
  }
}

// Create Firebase configuration summary
console.log('\n📄 Firebase Configuration Summary:');
console.log(`Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
console.log(`Client Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Docker-specific recommendations
if (isDocker) {
  console.log('\n🐳 Docker-Specific Recommendations:');
  console.log('1. Ensure container has internet access');
  console.log('2. Check if corporate firewall blocks Firebase endpoints');
  console.log('3. Consider using --dns flag if DNS issues persist');
  console.log('4. Verify environment variables are properly passed to container');
}

// Create a test Firebase connection
async function testConnection() {
  console.log('\n🔥 Testing Firebase Connection...');
  
  try {
    const admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Clean up the private key
      privateKey = privateKey.trim();
      if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
          (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      const serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: privateKey
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }

    const db = admin.firestore();
    
    // Simple connectivity test
    const testRef = db.collection('docker-test').doc('connection-test');
    await testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      container: isDocker,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV
    });
    
    console.log('✅ Firebase connection successful!');
    
    // Cleanup
    await testRef.delete();
    console.log('✅ Test cleanup completed');
    
    return true;
  } catch (error) {
    console.log('❌ Firebase connection failed:', error.message);
    
    // Provide specific error guidance
    if (error.code === 'ENOTFOUND') {
      console.log('🔧 DNS resolution issue - check network connectivity');
    } else if (error.message.includes('invalid_grant')) {
      console.log('🔧 Invalid credentials - check Firebase service account key');
    } else if (error.message.includes('permission-denied')) {
      console.log('🔧 Permission denied - check Firebase security rules');
    }
    
    return false;
  }
}

// Main execution
async function main() {
  const connectionSuccess = await testConnection();
  
  console.log('\n' + '='.repeat(60));
  if (connectionSuccess) {
    console.log('🎉 Docker Firebase Setup: COMPLETED SUCCESSFULLY');
    console.log('✅ All systems ready for deployment');
  } else {
    console.log('💥 Docker Firebase Setup: FAILED');
    console.log('❌ Please fix the issues above before deploying');
  }
  console.log('='.repeat(60));
  
  process.exit(connectionSuccess ? 0 : 1);
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n💥 Unhandled Rejection:', reason);
  process.exit(1);
});

main();
