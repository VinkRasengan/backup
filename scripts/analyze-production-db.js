#!/usr/bin/env node

/**
 * 🔍 Production Database Analysis Script
 * 
 * This script analyzes the current production database structure
 * Run with: node scripts/analyze-production-db.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Initialize Firebase Admin for production
function initializeFirebase() {
  try {
    log('🔥 Connecting to Production Firestore...', 'cyan');

    // Load environment variables
    require('dotenv').config();

    // Check if we have Firebase credentials in .env
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      log('✅ Using Firebase credentials from .env file', 'green');

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          }),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      }
    } else {
      // Fallback to service account file
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT ||
                                process.argv.find(arg => arg.startsWith('--service-account='))?.split('=')[1] ||
                                './config/firebase-service-account.json';

      if (serviceAccountPath) {
        try {
          const serviceAccount = require(serviceAccountPath.startsWith('.') ?
            path.join(process.cwd(), serviceAccountPath) : serviceAccountPath);

          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              projectId: serviceAccount.project_id
            });
          }

          log(`✅ Using service account: ${serviceAccountPath}`, 'green');
        } catch (serviceAccountError) {
          log(`❌ Failed to load service account from: ${serviceAccountPath}`, 'red');
          log(`Error: ${serviceAccountError.message}`, 'red');
          log('', 'reset');
          log('💡 Firebase credentials not found in .env. To get service account:', 'cyan');
          log('1. Go to: https://console.firebase.google.com/u/0/project/factcheck-1d6e8/settings/serviceaccounts/adminsdk', 'cyan');
          log('2. Click "Generate new private key"', 'cyan');
          log('3. Save as config/firebase-service-account.json', 'cyan');
          process.exit(1);
        }
      } else {
        log('❌ Firebase credentials required', 'red');
        log('Either set FIREBASE_* environment variables in .env or use --service-account flag', 'red');
        log('Found in .env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY', 'cyan');
        process.exit(1);
      }
    }

    return admin.firestore();
  } catch (error) {
    log(`❌ Firebase initialization failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Analysis functions
async function analyzeCollection(db, collectionName) {
  try {
    const snapshot = await db.collection(collectionName).limit(5).get();
    
    if (snapshot.empty) {
      return {
        name: collectionName,
        count: 0,
        sample: null,
        exists: false
      };
    }
    
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    
    // Get total count (approximate)
    const allSnapshot = await db.collection(collectionName).get();
    
    return {
      name: collectionName,
      count: allSnapshot.size,
      sample: docs[0],
      exists: true,
      structure: Object.keys(docs[0].data || {})
    };
  } catch (error) {
    return {
      name: collectionName,
      error: error.message,
      exists: false
    };
  }
}

async function analyzeDatabase(db) {
  log('🔍 Analyzing Production Database Structure...', 'blue');
  log('', 'reset');
  
  const collectionsToAnalyze = [
    'users',
    'community_submissions',
    'posts',
    'links',
    'link_analysis',
    'votes',
    'comments',
    'conversations',
    'chat_messages',
    'notifications',
    'reports',
    'verification_tokens',
    'knowledge'
  ];
  
  const results = {};
  
  for (const collectionName of collectionsToAnalyze) {
    log(`   Analyzing ${collectionName}...`, 'cyan');
    results[collectionName] = await analyzeCollection(db, collectionName);
  }
  
  return results;
}

function displayResults(results) {
  log('📊 Database Analysis Results', 'cyan');
  log('============================', 'cyan');
  log('', 'reset');
  
  // Existing collections
  log('✅ Existing Collections:', 'green');
  Object.values(results).filter(r => r.exists).forEach(result => {
    log(`   📁 ${result.name}: ${result.count} documents`, 'green');
    if (result.structure) {
      log(`      Fields: ${result.structure.join(', ')}`, 'cyan');
    }
  });
  
  log('', 'reset');
  
  // Missing collections
  log('❌ Missing Collections:', 'red');
  Object.values(results).filter(r => !r.exists && !r.error).forEach(result => {
    log(`   📁 ${result.name}: Not found`, 'red');
  });
  
  log('', 'reset');
  
  // Error collections
  const errorCollections = Object.values(results).filter(r => r.error);
  if (errorCollections.length > 0) {
    log('⚠️  Collections with Errors:', 'yellow');
    errorCollections.forEach(result => {
      log(`   📁 ${result.name}: ${result.error}`, 'yellow');
    });
    log('', 'reset');
  }
  
  // Migration recommendations
  log('🚀 Migration Recommendations:', 'cyan');
  
  if (results.community_submissions?.exists && !results.posts?.exists) {
    log(`   ✅ Migrate community_submissions (${results.community_submissions.count} docs) → posts`, 'green');
  }
  
  if (results.links?.exists && !results.link_analysis?.exists) {
    log(`   ✅ Migrate links (${results.links.count} docs) → link_analysis`, 'green');
  }
  
  if (!results.notifications?.exists) {
    log('   ✅ Create notifications collection', 'green');
  }
  
  if (!results.reports?.exists) {
    log('   ✅ Create reports collection', 'green');
  }
  
  if (results.votes?.exists) {
    log(`   ✅ Update votes structure (${results.votes.count} docs)`, 'green');
  }
  
  log('', 'reset');
  
  // Sample data
  log('📋 Sample Data:', 'cyan');
  Object.values(results).filter(r => r.exists && r.sample).forEach(result => {
    log(`   📁 ${result.name} sample:`, 'cyan');
    log(`      ID: ${result.sample.id}`, 'cyan');
    
    // Show first few fields
    const sampleData = result.sample.data;
    const fields = Object.keys(sampleData).slice(0, 3);
    fields.forEach(field => {
      const value = sampleData[field];
      const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 50);
      log(`      ${field}: ${displayValue}`, 'cyan');
    });
    log('', 'reset');
  });
}

// Main analysis function
async function analyzeProductionDatabase() {
  log('🔍 Production Database Analysis', 'cyan');
  log('===============================', 'cyan');
  log('', 'reset');
  
  const db = initializeFirebase();
  
  try {
    const results = await analyzeDatabase(db);
    displayResults(results);
    
    log('🎯 Next Steps:', 'cyan');
    log('1. Review the analysis results above', 'cyan');
    log('2. If migration is needed, run: npm run db:migrate:production', 'cyan');
    log('3. Always backup your data first!', 'cyan');
    log('4. See docs/production-migration-guide.md for detailed instructions', 'cyan');
    
  } catch (error) {
    log('', 'reset');
    log('❌ Analysis failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('🔍 Production Database Analysis Script', 'cyan');
    log('Usage: node scripts/analyze-production-db.js [options]', 'cyan');
    log('', 'reset');
    log('Options:', 'cyan');
    log('  --help, -h         Show this help message', 'cyan');
    log('  --service-account  Path to service account JSON file', 'cyan');
    log('', 'reset');
    log('Environment Variables:', 'cyan');
    log('  FIREBASE_SERVICE_ACCOUNT    Path to service account JSON file', 'cyan');
    log('', 'reset');
    log('Examples:', 'cyan');
    log('  # Analyze with service account from environment', 'cyan');
    log('  FIREBASE_SERVICE_ACCOUNT=./config/service-account.json node scripts/analyze-production-db.js', 'cyan');
    log('', 'cyan');
    log('  # Analyze with service account from command line', 'cyan');
    log('  node scripts/analyze-production-db.js --service-account=./config/service-account.json', 'cyan');
    process.exit(0);
  }
  
  analyzeProductionDatabase();
}

module.exports = {
  analyzeProductionDatabase,
  analyzeCollection,
  analyzeDatabase
};
