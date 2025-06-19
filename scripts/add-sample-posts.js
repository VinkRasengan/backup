const admin = require('firebase-admin');

// Initialize Firebase Admin for emulator
admin.initializeApp({
  projectId: 'factcheck-1d6e8'
});

// Configure for emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';

const db = admin.firestore();

const samplePosts = [
  {
    title: "Breaking: New Technology Breakthrough",
    content: "Scientists have discovered a revolutionary new technology that could change everything we know about computing.",
    author: "Tech Reporter",
    type: "news",
    category: "technology",
    url: "https://example.com/tech-news",
    votes: {
      upvotes: 15,
      downvotes: 2,
      score: 13
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isVerified: true,
    tags: ["technology", "science", "breakthrough"]
  },
  {
    title: "Community Discussion: Best Practices for Fact Checking",
    content: "Let's discuss the most effective methods for verifying information online. What tools and techniques do you use?",
    author: "Community Moderator",
    type: "discussion",
    category: "community",
    votes: {
      upvotes: 8,
      downvotes: 1,
      score: 7
    },
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000),
    isVerified: false,
    tags: ["discussion", "fact-checking", "community"]
  },
  {
    title: "Analysis: Climate Change Data Trends",
    content: "A comprehensive analysis of recent climate data shows significant trends that everyone should be aware of.",
    author: "Climate Scientist",
    type: "analysis",
    category: "science",
    url: "https://example.com/climate-analysis",
    votes: {
      upvotes: 22,
      downvotes: 3,
      score: 19
    },
    createdAt: new Date(Date.now() - 7200000), // 2 hours ago
    updatedAt: new Date(Date.now() - 7200000),
    isVerified: true,
    tags: ["climate", "science", "analysis"]
  },
  {
    title: "Warning: Misinformation Campaign Detected",
    content: "Our fact-checking team has identified a coordinated misinformation campaign spreading false claims about recent events.",
    author: "Fact Check Team",
    type: "alert",
    category: "misinformation",
    votes: {
      upvotes: 35,
      downvotes: 5,
      score: 30
    },
    createdAt: new Date(Date.now() - 10800000), // 3 hours ago
    updatedAt: new Date(Date.now() - 10800000),
    isVerified: true,
    tags: ["misinformation", "alert", "fact-check"]
  },
  {
    title: "User Report: Suspicious Link Analysis",
    content: "I found this suspicious link being shared on social media. Can someone help verify if it's legitimate?",
    author: "Community User",
    type: "user_post",
    category: "verification",
    url: "https://suspicious-example.com",
    votes: {
      upvotes: 5,
      downvotes: 0,
      score: 5
    },
    createdAt: new Date(Date.now() - 14400000), // 4 hours ago
    updatedAt: new Date(Date.now() - 14400000),
    isVerified: false,
    tags: ["verification", "user-report", "suspicious"]
  }
];

async function addSamplePosts() {
  try {
    console.log('🔥 Adding sample posts to Firestore emulator...');
    
    const batch = db.batch();
    
    for (const post of samplePosts) {
      const docRef = db.collection('posts').doc();
      batch.set(docRef, post);
    }
    
    await batch.commit();
    
    console.log('✅ Successfully added', samplePosts.length, 'sample posts');
    console.log('📊 Posts added:');
    samplePosts.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.title} (${post.type})`);
    });
    
    // Verify the posts were added
    const snapshot = await db.collection('posts').get();
    console.log('🔍 Total posts in database:', snapshot.size);
    
  } catch (error) {
    console.error('❌ Error adding sample posts:', error);
  } finally {
    process.exit(0);
  }
}

addSamplePosts();
