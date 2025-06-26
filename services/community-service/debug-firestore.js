const { db, collections } = require('./src/config/firebase');

async function debugFirestore() {
  console.log('🔍 Debugging Firestore Data...');
  console.log('Collection name:', collections.POSTS);
  
  try {
    // Get all documents from links collection
    const snapshot = await db.collection(collections.POSTS).limit(5).get();
    
    console.log(`\n📊 Found ${snapshot.size} documents in collection '${collections.POSTS}'`);
    
    if (snapshot.empty) {
      console.log('❌ Collection is empty!');
      return;
    }
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📄 Document ${index + 1} (ID: ${doc.id}):`);
      console.log('- Title:', data.title || 'NO TITLE');
      console.log('- Content:', data.content ? data.content.substring(0, 100) + '...' : 'NO CONTENT');
      console.log('- Author:', data.author || 'NO AUTHOR');
      console.log('- Type:', data.type || 'NO TYPE');
      console.log('- Category:', data.category || 'NO CATEGORY');
      console.log('- CreatedAt:', data.createdAt || 'NO CREATED_AT');
      console.log('- VoteStats:', data.voteStats || 'NO VOTE_STATS');
      console.log('- CommentCount:', data.commentCount || 'NO COMMENT_COUNT');
      console.log('- All fields:', Object.keys(data));
    });
    
    // Test the exact query used in links.js
    console.log('\n🔍 Testing query from links.js...');
    const testQuery = db.collection(collections.POSTS);
    const testSnapshot = await testQuery.get();
    
    console.log(`Query result: ${testSnapshot.size} documents`);
    
    // Test with filters
    console.log('\n🔍 Testing with common filters...');
    
    // Test type filter
    const typeQuery = await db.collection(collections.POSTS)
      .where('type', '==', 'user_post')
      .get();
    console.log(`Type 'user_post' filter: ${typeQuery.size} documents`);
    
    const newsQuery = await db.collection(collections.POSTS)
      .where('type', '==', 'news')
      .get();
    console.log(`Type 'news' filter: ${newsQuery.size} documents`);
    
    // Check for any documents without type field
    const allDocs = await db.collection(collections.POSTS).get();
    let docsWithoutType = 0;
    let docsWithType = 0;
    
    allDocs.docs.forEach(doc => {
      const data = doc.data();
      if (!data.type) {
        docsWithoutType++;
      } else {
        docsWithType++;
      }
    });
    
    console.log(`\n📈 Type field analysis:`);
    console.log(`- Documents with type field: ${docsWithType}`);
    console.log(`- Documents without type field: ${docsWithoutType}`);
    
  } catch (error) {
    console.error('❌ Error debugging Firestore:', error);
  }
}

// Run debug
debugFirestore().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
