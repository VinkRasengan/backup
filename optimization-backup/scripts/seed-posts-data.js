const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../.env');
require('dotenv').config({ path: serviceAccountPath });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
}

const db = admin.firestore();

// Sample rich posts data
const samplePosts = [
  {
    title: "Breaking: New AI Technology Revolutionizes Fact-Checking",
    content: "A groundbreaking AI system has been developed that can verify news articles in real-time with 95% accuracy. This technology uses advanced natural language processing and cross-references multiple reliable sources to determine the authenticity of claims. The system has already been tested on over 10,000 articles and shows promising results in combating misinformation.",
    type: "user_post",
    category: "technology",
    author: {
      uid: "user_001",
      email: "john.doe@example.com",
      displayName: "John Doe"
    },
    url: "https://techcrunch.com/ai-fact-checking",
    tags: ["AI", "fact-checking", "technology", "misinformation"],
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop"
    ],
    voteStats: {
      safe: 45,
      unsafe: 3,
      suspicious: 2,
      total: 50
    },
    voteScore: 42,
    commentCount: 12,
    viewCount: 1250,
    verified: true,
    trustScore: 92,
    source: "TechCrunch",
    createdAt: new Date('2025-06-15T10:30:00Z'),
    updatedAt: new Date('2025-06-15T10:30:00Z')
  },
  {
    title: "Climate Change Report: Arctic Ice Melting Faster Than Expected",
    content: "New satellite data reveals that Arctic sea ice is melting at an unprecedented rate, 40% faster than previous models predicted. Scientists warn that this accelerated melting could lead to significant sea level rise and weather pattern changes globally. The report, published in Nature Climate Change, calls for immediate action to reduce greenhouse gas emissions.",
    type: "user_post",
    category: "environment",
    author: {
      uid: "user_002",
      email: "sarah.climate@example.com",
      displayName: "Dr. Sarah Climate"
    },
    url: "https://nature.com/climate-report-2025",
    tags: ["climate change", "arctic", "environment", "science"],
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop",
      "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=400&fit=crop"
    ],
    voteStats: {
      safe: 78,
      unsafe: 5,
      suspicious: 7,
      total: 90
    },
    voteScore: 73,
    commentCount: 28,
    viewCount: 2100,
    verified: true,
    trustScore: 88,
    source: "Nature Climate Change",
    createdAt: new Date('2025-06-14T14:20:00Z'),
    updatedAt: new Date('2025-06-14T14:20:00Z')
  },
  {
    title: "Cryptocurrency Market Analysis: Bitcoin Reaches New Milestone",
    content: "Bitcoin has surpassed $75,000 for the first time, driven by institutional adoption and regulatory clarity. Major corporations continue to add Bitcoin to their treasury reserves, while several countries are exploring Bitcoin as legal tender. However, experts warn about volatility and environmental concerns related to mining operations.",
    type: "user_post",
    category: "finance",
    author: {
      uid: "user_003",
      email: "crypto.analyst@example.com",
      displayName: "Alex Crypto"
    },
    url: "https://coindesk.com/bitcoin-75k-milestone",
    tags: ["bitcoin", "cryptocurrency", "finance", "investment"],
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=400&fit=crop"
    ],
    voteStats: {
      safe: 32,
      unsafe: 18,
      suspicious: 15,
      total: 65
    },
    voteScore: 14,
    commentCount: 45,
    viewCount: 3200,
    verified: false,
    trustScore: 65,
    source: "CoinDesk",
    createdAt: new Date('2025-06-13T09:15:00Z'),
    updatedAt: new Date('2025-06-13T09:15:00Z')
  },
  {
    title: "Medical Breakthrough: New Treatment Shows Promise for Alzheimer's",
    content: "Researchers at Stanford University have developed a novel treatment that shows significant promise in slowing Alzheimer's disease progression. The treatment, which targets amyloid plaques in the brain, showed a 60% reduction in cognitive decline in clinical trials. The FDA has granted fast-track designation for further testing.",
    type: "user_post",
    category: "health",
    author: {
      uid: "user_004",
      email: "dr.research@stanford.edu",
      displayName: "Dr. Maria Research"
    },
    url: "https://stanford.edu/alzheimers-breakthrough",
    tags: ["alzheimers", "medical", "research", "breakthrough"],
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=400&fit=crop"
    ],
    voteStats: {
      safe: 95,
      unsafe: 2,
      suspicious: 3,
      total: 100
    },
    voteScore: 93,
    commentCount: 67,
    viewCount: 4500,
    verified: true,
    trustScore: 96,
    source: "Stanford University",
    createdAt: new Date('2025-06-12T16:45:00Z'),
    updatedAt: new Date('2025-06-12T16:45:00Z')
  },
  {
    title: "Space Exploration: Mars Mission Discovers Potential Signs of Life",
    content: "NASA's Perseverance rover has discovered organic compounds in Martian rock samples that could indicate past microbial life. The samples, collected from an ancient river delta, contain complex carbon-based molecules that are typically associated with biological processes. Scientists are cautiously optimistic but emphasize the need for further analysis.",
    type: "user_post",
    category: "science",
    author: {
      uid: "user_005",
      email: "space.explorer@nasa.gov",
      displayName: "NASA Explorer"
    },
    url: "https://nasa.gov/mars-life-discovery",
    tags: ["mars", "space", "NASA", "life", "discovery"],
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=400&fit=crop",
      "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=800&h=400&fit=crop"
    ],
    voteStats: {
      safe: 156,
      unsafe: 8,
      suspicious: 12,
      total: 176
    },
    voteScore: 148,
    commentCount: 89,
    viewCount: 8900,
    verified: true,
    trustScore: 94,
    source: "NASA",
    createdAt: new Date('2025-06-11T11:30:00Z'),
    updatedAt: new Date('2025-06-11T11:30:00Z')
  }
];

// Sample comments data
const sampleComments = [
  {
    postId: "", // Will be filled when posts are created
    content: "This is incredible! The implications for combating misinformation are huge.",
    author: {
      uid: "commenter_001",
      email: "user1@example.com",
      displayName: "Tech Enthusiast"
    },
    voteStats: {
      upvotes: 15,
      downvotes: 2
    },
    createdAt: new Date('2025-06-15T11:00:00Z'),
    updatedAt: new Date('2025-06-15T11:00:00Z')
  },
  {
    postId: "",
    content: "I'm skeptical about the 95% accuracy claim. What's the methodology?",
    author: {
      uid: "commenter_002",
      email: "skeptic@example.com",
      displayName: "Critical Thinker"
    },
    voteStats: {
      upvotes: 8,
      downvotes: 1
    },
    createdAt: new Date('2025-06-15T11:15:00Z'),
    updatedAt: new Date('2025-06-15T11:15:00Z')
  }
];

async function seedData() {
  try {
    console.log('🌱 Starting to seed posts data...');
    
    // Add posts
    const postIds = [];
    for (const post of samplePosts) {
      const docRef = await db.collection('posts').add(post);
      postIds.push(docRef.id);
      console.log(`✅ Added post: ${post.title} (ID: ${docRef.id})`);
    }
    
    // Add comments for first post
    if (postIds.length > 0) {
      console.log('🗨️ Adding sample comments...');
      for (const comment of sampleComments) {
        comment.postId = postIds[0]; // Add to first post
        await db.collection('comments').add(comment);
        console.log(`✅ Added comment: ${comment.content.substring(0, 50)}...`);
      }
    }
    
    console.log('🎉 Data seeding completed successfully!');
    console.log(`📊 Added ${samplePosts.length} posts and ${sampleComments.length} comments`);
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedData();
