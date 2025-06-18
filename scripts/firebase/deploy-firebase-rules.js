#!/usr/bin/env node

/**
 * Deploy Firebase Security Rules and Indexes
 * Automates Firebase configuration deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Rules & Indexes Deployment');
console.log('=====================================');

// Check if Firebase CLI is installed
function checkFirebaseCLI() {
    try {
        execSync('firebase --version', { stdio: 'pipe' });
        console.log('✅ Firebase CLI is installed');
        return true;
    } catch (error) {
        console.error('❌ Firebase CLI not found. Please install it:');
        console.error('npm install -g firebase-tools');
        return false;
    }
}

// Get project ID from environment
const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
    console.error('❌ FIREBASE_PROJECT_ID environment variable is required');
    console.error('   Set it in your .env file: FIREBASE_PROJECT_ID=your-project-id');
    process.exit(1);
}

// Check if user is logged in
function checkFirebaseAuth() {
    try {
        const result = execSync('firebase projects:list', { stdio: 'pipe', encoding: 'utf8' });
        if (result.includes(projectId)) {
            console.log('✅ Firebase authentication verified');
            console.log(`✅ Project ${projectId} found`);
            return true;
        } else {
            console.error(`❌ Project ${projectId} not found in your Firebase projects`);
            return false;
        }
    } catch (error) {
        console.error('❌ Firebase authentication failed. Please login:');
        console.error('firebase login');
        return false;
    }
}

// Deploy Firestore rules
function deployRules() {
    try {
        console.log('📋 Deploying Firestore security rules...');
        
        // Check if firestore.rules exists
        if (!fs.existsSync('firestore.rules')) {
            console.error('❌ firestore.rules file not found');
            return false;
        }
        
        execSync(`firebase deploy --only firestore:rules --project ${projectId}`, { 
            stdio: 'inherit' 
        });
        
        console.log('✅ Firestore rules deployed successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to deploy Firestore rules:', error.message);
        return false;
    }
}

// Deploy Firestore indexes
function deployIndexes() {
    try {
        console.log('📊 Deploying Firestore indexes...');
        
        // Check if firestore.indexes.json exists
        if (!fs.existsSync('firestore.indexes.json')) {
            console.log('⚠️ firestore.indexes.json not found, creating basic indexes...');
            createBasicIndexes();
        }
        
        execSync(`firebase deploy --only firestore:indexes --project ${projectId}`, { 
            stdio: 'inherit' 
        });
        
        console.log('✅ Firestore indexes deployed successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to deploy Firestore indexes:', error.message);
        return false;
    }
}

// Create basic indexes for FactCheck app
function createBasicIndexes() {
    const indexes = {
        "indexes": [
            {
                "collectionGroup": "links",
                "queryScope": "COLLECTION",
                "fields": [
                    { "fieldPath": "status", "order": "ASCENDING" },
                    { "fieldPath": "createdAt", "order": "DESCENDING" }
                ]
            },
            {
                "collectionGroup": "links",
                "queryScope": "COLLECTION", 
                "fields": [
                    { "fieldPath": "submittedBy", "order": "ASCENDING" },
                    { "fieldPath": "createdAt", "order": "DESCENDING" }
                ]
            },
            {
                "collectionGroup": "votes",
                "queryScope": "COLLECTION",
                "fields": [
                    { "fieldPath": "linkId", "order": "ASCENDING" },
                    { "fieldPath": "createdAt", "order": "DESCENDING" }
                ]
            },
            {
                "collectionGroup": "comments",
                "queryScope": "COLLECTION",
                "fields": [
                    { "fieldPath": "linkId", "order": "ASCENDING" },
                    { "fieldPath": "createdAt", "order": "ASCENDING" }
                ]
            },
            {
                "collectionGroup": "chat_messages",
                "queryScope": "COLLECTION",
                "fields": [
                    { "fieldPath": "conversationId", "order": "ASCENDING" },
                    { "fieldPath": "createdAt", "order": "ASCENDING" }
                ]
            }
        ],
        "fieldOverrides": []
    };
    
    fs.writeFileSync('firestore.indexes.json', JSON.stringify(indexes, null, 2));
    console.log('✅ Created basic firestore.indexes.json');
}

// Main deployment function
async function deployFirebase() {
    console.log('🚀 Starting Firebase deployment...\n');
    
    // Pre-flight checks
    if (!checkFirebaseCLI()) {
        process.exit(1);
    }
    
    if (!checkFirebaseAuth()) {
        process.exit(1);
    }
    
    let success = true;
    
    // Deploy rules
    if (!deployRules()) {
        success = false;
    }
    
    // Deploy indexes
    if (!deployIndexes()) {
        success = false;
    }
    
    // Summary
    console.log('\n📊 Deployment Summary:');
    console.log('======================');
    
    if (success) {
        console.log('🎉 Firebase deployment completed successfully!');
        console.log('\n✅ Security rules active');
        console.log('✅ Database indexes optimized');
        console.log('✅ FactCheck app ready for production');
        
        console.log('\n🔗 Firebase Console:');
        console.log(`https://console.firebase.google.com/project/${projectId}`);
    } else {
        console.log('💥 Firebase deployment failed!');
        console.log('Please check the errors above and try again.');
        process.exit(1);
    }
}

// Run deployment if called directly
if (require.main === module) {
    deployFirebase().catch(error => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    });
}

module.exports = { deployFirebase, deployRules, deployIndexes };
