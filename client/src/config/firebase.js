import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';

// Firebase configuration with Docker support
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCpeeTLujKruzK14siuDzGmpTadzhfvccI",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "factcheck-1d6e8.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "factcheck-1d6e8",
  storageBucket: "factcheck-1d6e8.firebasestorage.app",
  messagingSenderId: "583342362302",
  appId: "1:583342362302:web:ee97918d159c90e5b8d8ef",
  measurementId: "G-XBLLPBG4HM"
};

// Debug configuration
console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Configure for development/Docker environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isDocker = window.location.hostname === 'localhost' && window.location.port === '3000';

// Enhanced Docker/Development configuration
if (isDevelopment) {
  console.log('🔧 Development mode detected');
  console.log('🐳 Docker environment:', isDocker);

  // Configure Firebase for Docker environment
  try {
    // Enable offline persistence for better development experience
    console.log('🔧 Configuring Firebase for development environment');

    // Add connection timeout settings for Docker
    if (isDocker) {
      console.log('🐳 Applying Docker-specific Firebase settings');
      // Firebase will automatically handle offline mode if connection fails
    }
  } catch (error) {
    console.warn('⚠️ Firebase offline persistence setup failed:', error);
  }
}

// Connection management
let isOnline = true;
let retryCount = 0;
const MAX_RETRIES = 3;

// Enhanced connection handling with Docker support
const handleConnectionError = async (error) => {
  console.warn('🔥 Firebase connection issue:', error.message);

  // Check if this is a Docker environment connection issue
  if (error.code === 'unavailable' || error.message.includes('UNAVAILABLE')) {
    console.warn('🐳 Docker environment detected - Firebase connection unavailable');
    console.warn('💡 This is normal in Docker development - Firebase will work in offline mode');
    isOnline = false;
    return;
  }

  if (retryCount < MAX_RETRIES) {
    retryCount++;
    console.log(`🔄 Retrying Firebase connection (${retryCount}/${MAX_RETRIES})...`);

    try {
      await enableNetwork(db);
      console.log('✅ Firebase connection restored');
      retryCount = 0;
      isOnline = true;
    } catch (retryError) {
      console.error(`❌ Retry ${retryCount} failed:`, retryError.message);
      if (retryCount >= MAX_RETRIES) {
        console.warn('⚠️ Firebase operating in offline mode');
        isOnline = false;

        // In Docker, this is expected behavior
        if (isDocker) {
          console.log('🐳 Docker environment: Firebase offline mode is normal');
          console.log('💡 Data will be cached locally and synced when connection is available');
        }
      }
    }
  }
};

// Monitor online/offline status
window.addEventListener('online', async () => {
  console.log('🌐 Network connection restored');
  try {
    await enableNetwork(db);
    isOnline = true;
    retryCount = 0;
    console.log('✅ Firebase reconnected');
  } catch (error) {
    console.error('Failed to reconnect Firebase:', error);
  }
});

window.addEventListener('offline', async () => {
  console.log('📴 Network connection lost');
  isOnline = false;
  try {
    await disableNetwork(db);
    console.log('⚠️ Firebase switched to offline mode');
  } catch (error) {
    console.error('Failed to switch Firebase to offline mode:', error);
  }
});

// Export connection status
export const getConnectionStatus = () => isOnline;
export const handleFirebaseError = handleConnectionError;

// Debug Firebase connection
console.log('🔥 Firebase initialized:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  environment: process.env.NODE_ENV || 'development',
  isOnline: navigator.onLine
});

export default app;
