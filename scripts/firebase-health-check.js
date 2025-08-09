import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
eck for All Services
 * Comprehensive Firebase connectivity test for Docker deployment
 */

import path from 'path';
import fs from 'fs';

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🔥 Firebase Health Check for All Services');
console.log('==========================================\n');

// Check if running in Docker
const isDocker = fs.existsSync('/.dockerenv') || 
                 process.env.DOCKER_CONTAINER === 'true' ||
                 process.env.HOSTNAME?.includes('docker');

console.log('🐳 Environment:', isDocker ? 'Docker Container' : 'Local Host');
console.log('📋 Node.js Version:', process.version);
console.log('📋 Platform:', process.platform);
console.log('');

// Firebase configuration check
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
  // Frontend config
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  frontendProjectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
};

console.log('🔧 Firebase Configuration Status:');
console.log('Backend Configuration:');
console.log('- Project ID:', firebaseConfig.projectId ? '✅ Set' : '❌ Missing');
console.log('- Client Email:', firebaseConfig.clientEmail ? '✅ Set' : '❌ Missing');
console.log('- Private Key:', firebaseConfig.privateKey ? '✅ Set' : '❌ Missing');
console.log('');
console.log('Frontend Configuration:');
console.log('- API Key:', firebaseConfig.apiKey ? '✅ Set' : '❌ Missing');
console.log('- Auth Domain:', firebaseConfig.authDomain ? '✅ Set' : '❌ Missing');
console.log('- Project ID:', firebaseConfig.frontendProjectId ? '✅ Set' : '❌ Missing');
console.log('');

// Network connectivity test
async function testNetworkConnectivity() {
  console.log('🌐 Testing Network Connectivity...');
  
  const testUrls = [
    'https://www.google.com',
    'https://firebase.googleapis.com',
    'https://firestore.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com'
  ];

  const results = [];
  
  for (const url of testUrls) {
    try {
      const https = require('https');
      import { URL  } from 'url';
import { fileURLToPath } from 'url';
      const parsedUrl = new URL(url);
      
      const result = await new Promise((resolve, reject) => {
        const startTime = Date.now();
        const req = https.request({
          hostname: parsedUrl.hostname,
          port: 443,
          path: '/',
          method: 'HEAD',
          timeout: 10000,
          headers: {
            'User-Agent': 'Firebase-Health-Check/1.0'
          }
        }, (res) => {
          const duration = Date.now() - startTime;
          resolve({ url, status: res.statusCode, duration, success: true });
        });
        
        req.on('error', (error) => reject({ url, error: error.message, success: false }));
        req.on('timeout', () => reject({ url, error: 'Timeout', success: false }));
        req.end();
      });
      
      console.log(`✅ ${result.url} - Status: ${result.status} (${result.duration}ms)`);
      results.push(result);
    } catch (error) {
      console.log(`❌ ${error.url} - Error: ${error.error}`);
      results.push(error);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 Network Test Results: ${successCount}/${results.length} successful\n`);
  
  return successCount === results.length;
}

// Firebase Admin SDK test
async function testFirebaseAdmin() {
  console.log('🔥 Testing Firebase Admin SDK...');
  
  try {
    // Check if firebase-admin is available
    let admin;
    try {
      admin = require('firebase-admin');
    } catch (error) {
      console.log('❌ Firebase Admin SDK not installed');
      return false;
    }
    
    // Validate credentials
    if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
      console.log('❌ Missing Firebase Admin credentials');
      return false;
    }
    
    // Clean private key
    let privateKey = firebaseConfig.privateKey.trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    // Initialize Firebase Admin (if not already initialized)
    if (!admin.apps.length) {
      const serviceAccount = {
        type: 'service_account',
        project_id: firebaseConfig.projectId,
        client_email: firebaseConfig.clientEmail,
        private_key: privateKey
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId
      });
    }
    
    console.log('✅ Firebase Admin SDK initialized');
    
    // Test Firestore connection
    const db = admin.firestore();
    const testRef = db.collection('health-check').doc('admin-test');
    
    // Test write with timeout
    const writePromise = testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      service: 'health-check',
      environment: process.env.NODE_ENV || 'development',
      docker: isDocker,
      hostname: process.env.HOSTNAME || 'unknown'
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Write timeout after 15 seconds')), 15000)
    );
    
    await Promise.race([writePromise, timeoutPromise]);
    console.log('✅ Firestore write successful');
    
    // Test read
    const doc = await testRef.get();
    if (doc.exists) {
      console.log('✅ Firestore read successful');
    }
    
    // Test Auth
    try {
      const auth = admin.auth();
      await auth.listUsers(1); // Just test if auth is accessible
      console.log('✅ Firebase Auth accessible');
    } catch (authError) {
      console.log('⚠️ Firebase Auth test failed:', authError.message);
    }
    
    // Cleanup
    await testRef.delete();
    console.log('✅ Cleanup completed');
    
    return true;
    
  } catch (error) {
    console.log('❌ Firebase Admin test failed:', error.message);
    
    // Provide specific error guidance
    if (error.code === 'ENOTFOUND') {
      console.log('🔧 DNS resolution failed - check network connectivity');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Connection refused - check firewall settings');
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      console.log('🔧 Connection timeout - Firebase servers may be unreachable');
    } else if (error.message.includes('invalid_grant')) {
      console.log('🔧 Invalid credentials - check Firebase service account key');
    }
    
    return false;
  }
}

// Test all services
async function testAllServices() {
  console.log('🔍 Testing All Services Firebase Configuration...');
  
  const services = [
    'admin-service',
    'auth-service', 
    'community-service',
    'chat-service',
    'link-service',
    'news-service'
  ];
  
  const serviceResults = [];
  
  for (const service of services) {
    try {
      const configPath = path.join(__dirname, `../services/${service}/src/config/firebase.js`);
      if (fs.existsSync(configPath)) {
        console.log(`✅ ${service}: Firebase config file exists`);
        serviceResults.push({ service, hasConfig: true });
      } else {
        console.log(`⚠️ ${service}: Firebase config file missing`);
        serviceResults.push({ service, hasConfig: false });
      }
    } catch (error) {
      console.log(`❌ ${service}: Error checking config - ${error.message}`);
      serviceResults.push({ service, hasConfig: false, error: error.message });
    }
  }
  
  console.log('');
  return serviceResults;
}

// Main execution
async function main() {
  const networkOk = await testNetworkConnectivity();
  const adminOk = await testFirebaseAdmin();
  const serviceResults = await testAllServices();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 FIREBASE HEALTH CHECK SUMMARY');
  console.log('='.repeat(60));
  
  console.log('🌐 Network Connectivity:', networkOk ? '✅ PASS' : '❌ FAIL');
  console.log('🔥 Firebase Admin SDK:', adminOk ? '✅ PASS' : '❌ FAIL');
  
  console.log('\n📋 Service Configuration Status:');
  serviceResults.forEach(result => {
    const status = result.hasConfig ? '✅ OK' : '❌ MISSING';
    console.log(`- ${result.service}: ${status}`);
  });
  
  const overallStatus = networkOk && adminOk;
  console.log('\n🎯 Overall Status:', overallStatus ? '✅ HEALTHY' : '❌ ISSUES DETECTED');
  
  if (!overallStatus) {
    console.log('\n🔧 Recommended Actions:');
    if (!networkOk) {
      console.log('1. Check Docker network configuration');
      console.log('2. Verify internet connectivity from container');
      console.log('3. Check firewall and proxy settings');
    }
    if (!adminOk) {
      console.log('4. Verify Firebase service account credentials');
      console.log('5. Check Firebase project permissions');
      console.log('6. Ensure Firebase Admin SDK is installed');
    }
  }
  
  console.log('='.repeat(60));
  
  return overallStatus;
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('\n💥 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n💥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Run the health check
main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
