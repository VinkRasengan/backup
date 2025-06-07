// Environment Variable Validation for Render Deployment
require('dotenv').config({ path: '../.env' });

console.log('🔍 Environment Variable Validation for Render');
console.log('==============================================\n');

// Required Firebase environment variables
const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL', 
    'FIREBASE_PRIVATE_KEY'
];

// Optional but recommended variables
const optionalVars = [
    'OPENAI_API_KEY',
    'VIRUSTOTAL_API_KEY',
    'NEWS_API_KEY',
    'NEWSDATA_API_KEY'
];

let hasErrors = false;

console.log('📋 Required Firebase Variables:');
console.log('===============================');

requiredVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
        console.log(`❌ ${varName}: MISSING`);
        hasErrors = true;
    } else {
        console.log(`✅ ${varName}: Present (${value.length} characters)`);
        
        // Special validation for private key
        if (varName === 'FIREBASE_PRIVATE_KEY') {
            if (!value.includes('-----BEGIN PRIVATE KEY-----')) {
                console.log(`   ⚠️  Warning: Private key may not be properly formatted`);
                console.log(`   💡 Should start with: -----BEGIN PRIVATE KEY-----`);
                console.log(`   💡 Current start: ${value.substring(0, 30)}...`);
            } else {
                console.log(`   ✅ Private key format looks correct`);
            }
            
            if (value.includes('\\n')) {
                console.log(`   ⚠️  Warning: Private key contains escaped newlines (\\n)`);
                console.log(`   💡 Render should use actual newlines, not escaped ones`);
            }
        }
        
        // Special validation for email
        if (varName === 'FIREBASE_CLIENT_EMAIL') {
            if (!value.includes('@') || !value.includes('.iam.gserviceaccount.com')) {
                console.log(`   ⚠️  Warning: Client email format may be incorrect`);
                console.log(`   💡 Should end with: .iam.gserviceaccount.com`);
            } else {
                console.log(`   ✅ Client email format looks correct`);
            }
        }
    }
});

console.log('\n📋 Optional API Variables:');
console.log('==========================');

optionalVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
        console.log(`⚪ ${varName}: Not set (optional)`);
    } else {
        console.log(`✅ ${varName}: Present (${value.length} characters)`);
        
        // Special validation for OpenAI key
        if (varName === 'OPENAI_API_KEY') {
            if (!value.startsWith('sk-')) {
                console.log(`   ⚠️  Warning: OpenAI API key should start with 'sk-'`);
            } else {
                console.log(`   ✅ OpenAI API key format looks correct`);
            }
        }
    }
});

console.log('\n🔧 Environment Setup Instructions for Render:');
console.log('==============================================');

if (hasErrors) {
    console.log('❌ ERRORS FOUND - Fix these before deploying:');
    console.log('');
    
    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            console.log(`🔧 Add ${varName} to Render Environment Variables:`);
            console.log(`   1. Go to Render Dashboard → Your Service → Environment`);
            console.log(`   2. Add Variable: ${varName}`);
            
            if (varName === 'FIREBASE_PRIVATE_KEY') {
                console.log(`   3. Value: Copy the ENTIRE private key from Firebase service account JSON`);
                console.log(`   4. Include -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----`);
                console.log(`   5. Use actual newlines, NOT \\n escapes`);
                console.log(`   6. Example format:`);
                console.log(`      -----BEGIN PRIVATE KEY-----`);
                console.log(`      MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8QXt...`);
                console.log(`      -----END PRIVATE KEY-----`);
            } else if (varName === 'FIREBASE_PROJECT_ID') {
                console.log(`   3. Value: Your Firebase project ID (e.g., factcheck-app-12345)`);
            } else if (varName === 'FIREBASE_CLIENT_EMAIL') {
                console.log(`   3. Value: Service account email from Firebase (ends with .iam.gserviceaccount.com)`);
            }
            console.log('');
        }
    });
} else {
    console.log('✅ All required variables are present!');
    console.log('');
    console.log('🚀 Ready for Render deployment:');
    console.log('   1. All Firebase credentials are configured');
    console.log('   2. Private key format looks correct');
    console.log('   3. Client email format is valid');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Deploy to Render');
    console.log('   2. Check deployment logs for Firebase connection');
    console.log('   3. Test API endpoints');
}

console.log('\n🔍 Firebase Connection Test:');
console.log('============================');

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        const firebaseConfig = require('./src/config/firebase-config');
        
        console.log('🧪 Testing Firebase connection...');
        const db = await firebaseConfig.initialize();
        
        console.log('✅ Firebase connection successful!');
        
        // Test a simple query
        const testCollection = db.collection('_test');
        await testCollection.limit(1).get();
        
        console.log('✅ Firestore query test successful!');
        
        // Get collection stats
        const stats = await firebaseConfig.getCollectionStats();
        console.log('📊 Collection stats:', stats);
        
        console.log('\n🎉 Firebase is ready for production!');
        
    } catch (error) {
        console.log('❌ Firebase connection failed:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check environment variables above');
        console.log('   2. Verify Firebase service account permissions');
        console.log('   3. Ensure Firestore is enabled in Firebase console');
        console.log('   4. Check network connectivity');
        
        hasErrors = true;
    }
}

// Run the test
testFirebaseConnection().then(() => {
    console.log('\n🏁 Validation Complete');
    console.log('======================');
    
    if (hasErrors) {
        console.log('❌ Issues found - fix before deploying');
        process.exit(1);
    } else {
        console.log('✅ All checks passed - ready for deployment!');
        process.exit(0);
    }
}).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
});
