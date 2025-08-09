import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const admin = require('firebase-admin');
import path from 'path';

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

async function setAdminRole(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${user.uid} - ${user.email}`);

    // Set custom claims
    const customClaims = {
      roles: ['admin'],
      permissions: ['admin-operations', 'moderate_content'],
      isAdmin: true,
      isModerator: true
    };

    await admin.auth().setCustomUserClaims(user.uid, customClaims);
    console.log(`✅ Admin role set successfully for ${email}`);
    
    // Verify the claims
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('Custom claims:', updatedUser.customClaims);
    
    console.log('\n🔥 User needs to logout and login again for changes to take effect!');
    
  } catch (error) {
    console.error('❌ Error setting admin role:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('User not found. Make sure the user has signed up first.');
    }
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'admin@factcheck.com';

console.log(`Setting admin role for: ${email}`);
setAdminRole(email)
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 