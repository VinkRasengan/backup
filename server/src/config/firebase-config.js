/**
 * Enhanced Firebase Configuration
 * Handles environment variable parsing and validation
 */

const admin = require('firebase-admin');

class FirebaseConfig {
    constructor() {
        this.app = null;
        this.db = null;
        this.isInitialized = false;
    }

    // Parse and validate environment variables
    getServiceAccount() {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // Validate required fields
        if (!projectId || !clientEmail || !privateKey) {
            throw new Error('Missing Firebase environment variables. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
        }

        // Handle different private key formats
        if (privateKey.includes('\\n')) {
            // Replace escaped newlines with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        // Ensure proper private key format
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
            throw new Error('Invalid private key format. Must include BEGIN/END markers.');
        }

        console.log('🔥 Firebase config validation:');
        console.log(`   Project ID: ${projectId}`);
        console.log(`   Client Email: ${clientEmail}`);
        console.log(`   Private Key: ${privateKey.length} characters`);
        console.log(`   Private Key starts with: ${privateKey.substring(0, 30)}...`);

        return {
            projectId,
            clientEmail,
            privateKey
        };
    }

    // Initialize Firebase Admin SDK
    async initialize() {
        try {
            if (this.isInitialized) {
                console.log('🔥 Firebase already initialized');
                return this.db;
            }

            console.log('🔥 Initializing Firebase Admin SDK...');

            // Get service account
            const serviceAccount = this.getServiceAccount();

            // Initialize Firebase Admin
            if (!admin.apps.length) {
                this.app = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.projectId
                });
                console.log('✅ Firebase Admin SDK initialized');
            } else {
                this.app = admin.app();
                console.log('✅ Using existing Firebase Admin app');
            }

            // Get Firestore instance
            this.db = admin.firestore();
            
            // Test connection
            await this.testConnection();
            
            this.isInitialized = true;
            console.log('✅ Firebase configuration complete');
            
            return this.db;

        } catch (error) {
            console.error('❌ Firebase initialization failed:', error.message);
            console.error('Full error:', error);
            throw error;
        }
    }

    // Test Firestore connection
    async testConnection() {
        try {
            console.log('🧪 Testing Firestore connection...');

            // Try to read from a collection with timeout
            const testRef = this.db.collection('_test');
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout')), 10000)
            );

            await Promise.race([
                testRef.limit(1).get(),
                timeoutPromise
            ]);

            console.log('✅ Firestore connection test successful');
            return true;

        } catch (error) {
            console.error('❌ Firestore connection test failed:', error.message);
            // Don't throw error in production - allow app to continue with fallbacks
            if (process.env.NODE_ENV === 'production') {
                console.log('⚠️ Production mode: Continuing with connection issues...');
                return false;
            }
            throw new Error(`Firestore connection failed: ${error.message}`);
        }
    }

    // Get Firestore database instance
    getDatabase() {
        if (!this.isInitialized || !this.db) {
            throw new Error('Firebase not initialized. Call initialize() first.');
        }
        return this.db;
    }

    // Health check
    async healthCheck() {
        try {
            if (!this.isInitialized) {
                return {
                    status: 'not_initialized',
                    type: 'firestore',
                    message: 'Firebase not initialized'
                };
            }

            // Test a simple query
            await this.db.collection('_health').limit(1).get();
            
            return {
                status: 'connected',
                type: 'firestore',
                message: 'Firestore connection healthy',
                projectId: process.env.FIREBASE_PROJECT_ID
            };
            
        } catch (error) {
            return {
                status: 'error',
                type: 'firestore',
                message: error.message,
                error: error.code || 'unknown'
            };
        }
    }

    // Get collection stats
    async getCollectionStats() {
        if (!this.isInitialized) {
            throw new Error('Firebase not initialized');
        }

        const collections = ['users', 'links', 'votes', 'comments', 'conversations', 'chat_messages', 'reports'];
        const stats = {};

        for (const collection of collections) {
            try {
                const snapshot = await this.db.collection(collection).get();
                stats[collection] = snapshot.size;
            } catch (error) {
                stats[collection] = `error: ${error.message}`;
            }
        }

        return stats;
    }

    // Graceful shutdown
    async close() {
        if (this.app) {
            await this.app.delete();
            this.isInitialized = false;
            console.log('🔥 Firebase connection closed');
        }
    }
}

// Export singleton instance
module.exports = new FirebaseConfig();
