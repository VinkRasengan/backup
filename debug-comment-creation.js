// Debug script to test comment creation with proper authentication
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, addDoc, collection, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCpeeTLujKruzK14siuDzGmpTadzhfvccI",
  authDomain: "factcheck-1d6e8.firebaseapp.com",
  projectId: "factcheck-1d6e8",
  storageBucket: "factcheck-1d6e8.firebasestorage.app",
  messagingSenderId: "583342362302",
  appId: "1:583342362302:web:ee97918d159c90e5b8d8ef",
  measurementId: "G-XBLLPBG4HM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testCommentCreation() {
  try {
    console.log('🔐 Testing comment creation...');
    
    // Get current user (should be already authenticated in browser)
    const user = auth.currentUser;
    if (!user) {
      console.error('❌ No user authenticated');
      return;
    }
    
    console.log('👤 Current user:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    // Test comment data
    const linkId = 'test-post-id';
    const content = 'Test comment from debug script';
    
    const newComment = {
      linkId,
      content,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log('📝 Creating comment:', newComment);
    
    // Try to add comment
    const docRef = await addDoc(collection(db, 'comments'), newComment);
    console.log('✅ Comment created with ID:', docRef.id);
    
    // Try to update comment count on the post
    const postRef = doc(db, 'links', linkId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const currentCount = postSnap.data().commentCount || 0;
      await updateDoc(postRef, {
        commentCount: currentCount + 1
      });
      console.log('✅ Comment count updated to:', currentCount + 1);
    } else {
      console.log('⚠️ Post not found, creating test post...');
      // For testing, we'll just skip the update since we don't have a real post
    }
    
    console.log('🎉 Comment creation test successful!');
    
  } catch (error) {
    console.error('❌ Comment creation failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

// Run the test
testCommentCreation();
