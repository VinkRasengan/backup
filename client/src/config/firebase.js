import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpeeTLujKruzK14siuDzGmpTadzhfvccI",
  authDomain: "factcheck-1d6e8.firebaseapp.com",
  projectId: "factcheck-1d6e8",
  storageBucket: "factcheck-1d6e8.firebasestorage.app",
  messagingSenderId: "583342362302",
  appId: "1:583342362302:web:ee97918d159c90e5b8d8ef",
  measurementId: "G-XBLLPBG4HM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true') {
  // Connect to Firestore emulator
  if (!db._delegate._databaseId.projectId.includes('localhost')) {
    connectFirestoreEmulator(db, 'localhost', 8084);
  }

  // Connect to Auth emulator
  if (!auth.config.emulator) {
    connectAuthEmulator(auth, 'http://localhost:9099');
  }
}

export default app;
