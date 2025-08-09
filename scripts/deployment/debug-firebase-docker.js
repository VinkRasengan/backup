#!/usr/bin/env node

/**
 * Firebase Docker Debug Script
 * So sánh Firebase connection giữa local và Docker
 */

console.log('🔍 Firebase Docker Debug Script');
console.log('================================\n');

// Environment info
console.log('📋 Environment Information:');
console.log('- Node.js Version:', process.version);
console.log('- Platform:', process.platform);
console.log('- Architecture:', process.arch);
console.log('- Working Directory:', process.cwd());
console.log('- Docker Container:', process.env.HOSTNAME || 'N/A');
console.log('- Environment:', process.env.NODE_ENV || 'undefined');
console.log('');

// Check if running in Docker
const isDocker = require('fs').existsSync('/.dockerenv') || 
                 process.env.DOCKER_CONTAINER === 'true' ||
                 process.env.HOSTNAME?.includes('docker');

console.log('🐳 Docker Detection:', isDocker ? 'YES' : 'NO');
console.log('');

// Load environment variables
require('dotenv').config();

// Check Firebase environment variables
console.log('🔥 Firebase Environment Variables:');
const firebaseVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY'
];

firebaseVars.forEach(varName => {
  const value = process.env[varName];
  if (varName === 'FIREBASE_PRIVATE_KEY') {
    console.log(`- ${varName}: ${value ? 'SET (' + value.length + ' chars)' : 'MISSING'}`);
  } else {
    console.log(`- ${varName}: ${value || 'MISSING'}`);
  }
});
console.log('');

// Test network connectivity
async function testNetworkConnectivity() {
  console.log('🌐 Network Connectivity Test:');
  
  const testUrls = [
    'https://www.google.com',
    'https://firebase.googleapis.com',
    'https://firestore.googleapis.com'
  ];

  for (const url of testUrls) {
    try {
      const https = require('https');
      const { URL } = require('url');
      const parsedUrl = new URL(url);
      
      const result = await new Promise((resolve, reject) => {
        const startTime = Date.now();
        const req = https.request({
          hostname: parsedUrl.hostname,
          port: 443,
          path: '/',
          method: 'HEAD',
          timeout: 5000,
          headers: {
            'User-Agent': 'Firebase-Debug-Script/1.0'
          }
        }, (res) => {
          const duration = Date.now() - startTime;
          resolve({ status: res.statusCode, duration });
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Timeout')));
        req.end();
      });
      
      console.log(`✅ ${url} - Status: ${result.status} (${result.duration}ms)`);
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
  console.log('');
}

// Test Firebase Admin SDK
async function testFirebaseAdmin() {
  console.log('🔥 Firebase Admin SDK Test:');
  
  try {
    const admin = require('firebase-admin');
    console.log('✅ Firebase Admin SDK loaded');
    
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('⚠️ Firebase Admin already initialized');
      return;
    }
    
    // Validate credentials
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase credentials');
    }
    
    // Clean private key
    let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
    
    console.log('✅ Private key cleaned');
    
    // Initialize Firebase
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
    
    console.log('✅ Firebase Admin initialized');
    
    // Test Firestore connection
    const db = admin.firestore();
    console.log('✅ Firestore instance created');
    
    // Simple connection test with timeout
    const testRef = db.collection('debug-test').doc('connection-test');
    
    console.log('🔍 Testing Firestore write...');
    const writePromise = testRef.set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      environment: process.env.NODE_ENV || 'development',
      docker: isDocker,
      hostname: process.env.HOSTNAME || 'unknown',
      nodeVersion: process.version
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Write timeout after 10 seconds')), 10000)
    );
    
    await Promise.race([writePromise, timeoutPromise]);
    console.log('✅ Firestore write successful');
    
    // Test read
    console.log('🔍 Testing Firestore read...');
    const readPromise = testRef.get();
    const readTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Read timeout after 5 seconds')), 5000)
    );
    
    const doc = await Promise.race([readPromise, readTimeoutPromise]);
    if (doc.exists) {
      console.log('✅ Firestore read successful');
      console.log('📄 Document data:', doc.data());
    } else {
      console.log('⚠️ Document not found');
    }
    
    // Cleanup
    await testRef.delete();
    console.log('✅ Cleanup completed');
    
    return true;
    
  } catch (error) {
    console.log('❌ Firebase test failed:', error.message);
    
    // Detailed error analysis
    if (error.code === 'ENOTFOUND') {
      console.log('🔧 DNS resolution failed - network issue');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Connection refused - firewall or network policy');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('🔧 Connection timeout - slow network or blocking');
    } else if (error.message.includes('invalid_grant')) {
      console.log('🔧 Invalid credentials - check service account key');
    } else if (error.message.includes('timeout')) {
      console.log('🔧 Operation timeout - Firebase servers unreachable');
    }
    
    console.log('📋 Full error:', error);
    return false;
  }
}

// Main execution
async function main() {
  await testNetworkConnectivity();
  const firebaseResult = await testFirebaseAdmin();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY:');
  console.log('- Environment:', isDocker ? 'Docker Container' : 'Local Host');
  console.log('- Firebase Connection:', firebaseResult ? '✅ SUCCESS' : '❌ FAILED');
  
  if (!firebaseResult && isDocker) {
    console.log('\n🐳 Docker-Specific Issues:');
    console.log('1. Network isolation may prevent Firebase access');
    console.log('2. DNS resolution might be different in container');
    console.log('3. SSL/TLS certificates might be missing');
    console.log('4. Corporate firewall may block container traffic');
    console.log('5. Docker network policies may restrict outbound connections');
    
    console.log('\n💡 Solutions:');
    console.log('1. Use --network=host for testing');
    console.log('2. Add DNS servers to docker-compose.yml');
    console.log('3. Install ca-certificates in Dockerfile');
    console.log('4. Configure proxy settings if behind corporate firewall');
    console.log('5. Use Firebase emulator for development');
  }
  
  console.log('='.repeat(50));
}

main().catch(console.error);
