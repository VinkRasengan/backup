#!/usr/bin/env node

/**
 * 🔄 Firestore Database Migration Script
 * 
 * This script migrates the current Firestore structure to the optimized structure
 * Run with: node scripts/migrate-firestore.js
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

// Initialize Firebase Admin
function initializeFirebase(useProduction = false) {
  try {
    if (!useProduction) {
      log('🔥 Connecting to Firestore Emulator...', 'cyan');

      // Set emulator host
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: 'factcheck-1d6e8'
        });
      }
    } else {
      log('🔥 Connecting to Production Firestore...', 'yellow');
      log('⚠️  WARNING: This will modify production data!', 'red');

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
                                  process.argv.find(arg => arg.startsWith('--service-account='))?.split('=')[1];

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
            process.exit(1);
          }
        } else {
          log('❌ Production mode requires Firebase credentials', 'red');
          log('Either set FIREBASE_* environment variables in .env or use --service-account flag', 'red');
          log('Found in .env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY', 'cyan');
          process.exit(1);
        }
      }
    }

    return admin.firestore();
  } catch (error) {
    log(`❌ Firebase initialization failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Migration functions
async function migrateCommunitySubmissionsToPosts(db) {
  log('📝 Migrating community_submissions to posts...', 'blue');
  
  try {
    const submissionsRef = db.collection('community_submissions');
    const snapshot = await submissionsRef.get();
    
    if (snapshot.empty) {
      log('   No community submissions found to migrate', 'yellow');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const postRef = db.collection('posts').doc(doc.id);
      
      // Transform data to new structure
      const postData = {
        id: doc.id,
        title: data.title || 'Untitled',
        content: data.content || data.description || '',
        type: 'user_post',
        category: data.category || 'general',
        author: {
          uid: data.authorId || data.userId || 'anonymous',
          email: data.authorEmail || data.userEmail || 'anonymous@example.com',
          displayName: data.authorName || data.userName || 'Anonymous User'
        },
        url: data.url || null,
        tags: data.tags || [],
        status: 'active',
        voteStats: {
          safe: 0,
          unsafe: 0,
          suspicious: 0,
          total: 0
        },
        voteScore: 0,
        commentCount: 0,
        viewCount: 0,
        verified: data.verified || false,
        trustScore: data.trustScore || 50,
        source: null,
        createdAt: data.createdAt || admin.firestore.Timestamp.now(),
        updatedAt: data.updatedAt || admin.firestore.Timestamp.now(),
        metadata: {
          migratedFrom: 'community_submissions',
          originalId: doc.id
        }
      };
      
      batch.set(postRef, postData);
      count++;
    });
    
    await batch.commit();
    log(`   ✅ Migrated ${count} community submissions to posts`, 'green');
    
  } catch (error) {
    log(`   ❌ Migration failed: ${error.message}`, 'red');
    throw error;
  }
}

async function migrateLinksToLinkAnalysis(db) {
  log('🔗 Migrating links to link_analysis...', 'blue');
  
  try {
    const linksRef = db.collection('links');
    const snapshot = await linksRef.get();
    
    if (snapshot.empty) {
      log('   No links found to migrate', 'yellow');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      const analysisRef = db.collection('link_analysis').doc(doc.id);
      
      // Transform data to new structure
      const analysisData = {
        url: data.url || '',
        domain: data.domain || new URL(data.url || 'https://example.com').hostname,
        title: data.title || '',
        description: data.description || '',
        screenshot: data.screenshot || null,
        securityScores: {
          virusTotal: data.virusTotal || null,
          scamAdviser: data.scamAdviser || null,
          phishTank: data.phishTank || null,
          criminalIP: data.criminalIP || null
        },
        overallRisk: data.riskLevel || 'unknown',
        riskScore: data.riskScore || 50,
        analysisDate: data.analysisDate || admin.firestore.Timestamp.now(),
        lastChecked: data.lastChecked || admin.firestore.Timestamp.now(),
        metadata: {
          migratedFrom: 'links',
          originalId: doc.id
        }
      };
      
      batch.set(analysisRef, analysisData);
      count++;
    });
    
    await batch.commit();
    log(`   ✅ Migrated ${count} links to link_analysis`, 'green');
    
  } catch (error) {
    log(`   ❌ Migration failed: ${error.message}`, 'red');
    throw error;
  }
}

async function createMissingCollections(db) {
  log('📋 Creating missing collections...', 'blue');
  
  const collections = [
    'notifications',
    'reports', 
    'user_sessions',
    'analytics',
    'user_activity'
  ];
  
  for (const collectionName of collections) {
    try {
      // Create a placeholder document to initialize the collection
      const ref = db.collection(collectionName).doc('_placeholder');
      await ref.set({
        _placeholder: true,
        createdAt: admin.firestore.Timestamp.now(),
        description: `Placeholder document for ${collectionName} collection`
      });
      
      log(`   ✅ Created ${collectionName} collection`, 'green');
    } catch (error) {
      log(`   ❌ Failed to create ${collectionName}: ${error.message}`, 'red');
    }
  }
}

async function updateVotesCollection(db) {
  log('🗳️ Updating votes collection structure...', 'blue');
  
  try {
    const votesRef = db.collection('votes');
    const snapshot = await votesRef.get();
    
    if (snapshot.empty) {
      log('   No votes found to update', 'yellow');
      return;
    }
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Update vote structure if needed
      const updates = {};
      
      if (!data.userEmail && data.userId) {
        updates.userEmail = `${data.userId}@example.com`;
      }
      
      if (!data.updatedAt) {
        updates.updatedAt = data.createdAt || admin.firestore.Timestamp.now();
      }
      
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        count++;
      }
    });
    
    if (count > 0) {
      await batch.commit();
      log(`   ✅ Updated ${count} vote documents`, 'green');
    } else {
      log('   ✅ All votes are already up to date', 'green');
    }
    
  } catch (error) {
    log(`   ❌ Update failed: ${error.message}`, 'red');
    throw error;
  }
}

async function cleanupOldCollections(db) {
  log('🧹 Cleaning up old collections...', 'blue');
  
  const collectionsToRemove = ['knowledge']; // Add more as needed
  
  for (const collectionName of collectionsToRemove) {
    try {
      const ref = db.collection(collectionName);
      const snapshot = await ref.get();
      
      if (snapshot.empty) {
        log(`   Collection ${collectionName} is already empty`, 'yellow');
        continue;
      }
      
      // Delete in batches
      const batch = db.batch();
      let count = 0;
      
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });
      
      await batch.commit();
      log(`   ✅ Removed ${count} documents from ${collectionName}`, 'green');
      
    } catch (error) {
      log(`   ❌ Failed to cleanup ${collectionName}: ${error.message}`, 'red');
    }
  }
}

async function createIndexes(db) {
  log('📊 Creating database indexes...', 'blue');
  
  // Note: Firestore indexes are typically created through the Firebase Console
  // or using the Firebase CLI. This is just for documentation.
  
  const indexesToCreate = [
    'posts: type, createdAt (desc)',
    'posts: category, createdAt (desc)', 
    'posts: author.uid, createdAt (desc)',
    'votes: linkId, userId',
    'votes: userId, createdAt (desc)',
    'comments: postId, createdAt (desc)',
    'notifications: userId, read, createdAt (desc)'
  ];
  
  log('   📝 Recommended indexes to create manually:', 'cyan');
  indexesToCreate.forEach(index => {
    log(`     - ${index}`, 'cyan');
  });
  
  log('   💡 Create these indexes in Firebase Console for optimal performance', 'yellow');
}

// Main migration function
async function runMigration(useProduction = false) {
  log('🚀 Starting Firestore Database Migration', 'cyan');
  log('=====================================', 'cyan');

  if (useProduction) {
    log('⚠️  PRODUCTION MODE ENABLED', 'red');
    log('This will modify your production database!', 'red');
    log('Press Ctrl+C within 5 seconds to cancel...', 'yellow');

    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
    log('Proceeding with production migration...', 'green');
  }

  const db = initializeFirebase(useProduction);
  
  try {
    // Phase 1: Core migrations
    await migrateCommunitySubmissionsToPosts(db);
    await migrateLinksToLinkAnalysis(db);
    
    // Phase 2: Structure updates
    await updateVotesCollection(db);
    await createMissingCollections(db);
    
    // Phase 3: Cleanup and optimization
    await cleanupOldCollections(db);
    await createIndexes(db);
    
    log('', 'reset');
    log('🎉 Migration completed successfully!', 'green');
    log('=====================================', 'green');
    log('📋 Next steps:', 'cyan');
    log('1. Update your application code to use the new structure', 'cyan');
    log('2. Create the recommended indexes in Firebase Console', 'cyan');
    log('3. Test all functionality thoroughly', 'cyan');
    log('4. Update Firestore security rules', 'cyan');
    
  } catch (error) {
    log('', 'reset');
    log('❌ Migration failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    log('Please check the logs above and fix any issues before retrying.', 'red');
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    log('🔄 Firestore Migration Script', 'cyan');
    log('Usage: node scripts/migrate-firestore.js [options]', 'cyan');
    log('', 'reset');
    log('Options:', 'cyan');
    log('  --help, -h         Show this help message', 'cyan');
    log('  --dry-run          Show what would be migrated without making changes', 'cyan');
    log('  --production       Run migration on production database', 'cyan');
    log('  --service-account  Path to service account JSON file', 'cyan');
    log('', 'reset');
    log('Environment Variables:', 'cyan');
    log('  FIRESTORE_EMULATOR_HOST     Use Firestore emulator (e.g., localhost:8080)', 'cyan');
    log('  FIREBASE_SERVICE_ACCOUNT    Path to service account JSON file', 'cyan');
    log('  FIREBASE_PROJECT_ID         Firebase project ID', 'cyan');
    log('', 'reset');
    log('Examples:', 'cyan');
    log('  # Migrate emulator database', 'cyan');
    log('  node scripts/migrate-firestore.js', 'cyan');
    log('', 'cyan');
    log('  # Migrate production database', 'cyan');
    log('  FIREBASE_SERVICE_ACCOUNT=./config/service-account.json node scripts/migrate-firestore.js --production', 'cyan');
    process.exit(0);
  }
  
  if (args.includes('--dry-run')) {
    log('🔍 Dry run mode - no changes will be made', 'yellow');
    // TODO: Implement dry run functionality
    process.exit(0);
  }

  const useProduction = args.includes('--production');
  runMigration(useProduction);
}

module.exports = {
  runMigration,
  migrateCommunitySubmissionsToPosts,
  migrateLinksToLinkAnalysis,
  createMissingCollections,
  updateVotesCollection
};
