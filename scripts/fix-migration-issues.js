#!/usr/bin/env node

/**
 * Fix Migration Issues Script
 * 
 * Giải quyết các vấn đề trong quá trình migration từ Posts sang Links:
 * 1. Thêm image fields (imageUrl, screenshot, images, urlToImage, thumbnailUrl)
 * 2. Thêm trustScore cho các posts
 * 3. Cập nhật searchTerms
 * 4. Đảm bảo tương thích với frontend components
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

// Sample images for different categories
const sampleImages = {
  security: [
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&h=400&fit=crop'
  ],
  banking: [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=400&fit=crop'
  ],
  technology: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop'
  ],
  education: [
    'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop'
  ],
  warning: [
    'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=400&fit=crop'
  ]
};

// Calculate trust score based on vote stats
function calculateTrustScore(voteStats, verified = false) {
  if (!voteStats || voteStats.total === 0) {
    return verified ? 80 : 50;
  }

  // Use actual vote structure: upvotes, downvotes
  const upvotes = voteStats.upvotes || 0;
  const downvotes = voteStats.downvotes || 0;
  const total = voteStats.total || (upvotes + downvotes);
  
  if (total === 0) {
    return verified ? 80 : 50;
  }

  const positiveRatio = upvotes / total;
  const negativeRatio = downvotes / total;

  let baseScore = (positiveRatio * 100) - (negativeRatio * 30);
  
  // Boost for verified content
  if (verified) {
    baseScore += 20;
  }

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, Math.round(baseScore)));
}

// Get images for category
function getImagesForCategory(category, type = 'user_post') {
  let imageCategory = 'technology'; // default

  if (category?.includes('security') || category?.includes('phishing')) {
    imageCategory = 'security';
  } else if (category?.includes('banking') || category?.includes('warning')) {
    imageCategory = 'banking';
  } else if (category?.includes('education') || category?.includes('guide')) {
    imageCategory = 'education';
  } else if (category?.includes('warning') || category?.includes('scam')) {
    imageCategory = 'warning';  } else if (type === 'news') {
    imageCategory = 'technology';
  }

  const images = sampleImages[imageCategory] || sampleImages.technology;
  const selectedImages = images.slice(0, Math.floor(Math.random() * 3) + 1);

  return {
    imageUrl: selectedImages[0],
    screenshot: selectedImages[0],
    images: selectedImages,
    urlToImage: selectedImages[0],
    thumbnailUrl: selectedImages[0].replace('w=800&h=400', 'w=300&h=200')
  };
}

// Generate search terms from content
function generateSearchTerms(title, content, tags = []) {
  const text = `${title} ${content}`.toLowerCase();
  const words = text.match(/\b[\p{L}]+\b/gu) || [];
  
  // Remove common words
  const stopWords = ['và', 'là', 'của', 'có', 'được', 'trong', 'với', 'cho', 'từ', 'này', 'đó', 'các', 'một', 'người', 'đã', 'sẽ', 'để', 'về', 'khi', 'không', 'đã', 'nhiều'];
  
  const searchTerms = [...new Set([
    ...words.filter(word => word.length > 2 && !stopWords.includes(word)),
    ...tags.map(tag => tag.toLowerCase())
  ])].slice(0, 10);

  return searchTerms;
}

async function fixMigrationIssues() {
  console.log('🔧 Starting migration fix...');

  try {
    // Get all documents from links collection
    const snapshot = await db.collection('links').get();
    console.log(`📊 Found ${snapshot.size} documents to fix`);

    const batch = db.batch();
    let updateCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const updates = {};

      // 1. Fix image fields if missing
      if (!data.imageUrl && !data.screenshot && (!data.images || data.images.length === 0)) {
        const imageData = getImagesForCategory(data.category, data.type);
        Object.assign(updates, imageData);
        console.log(`🖼️  Adding images for ${doc.id} (${data.category})`);
      }

      // 2. Calculate trust score if missing
      if (data.trustScore === null || data.trustScore === undefined) {
        updates.trustScore = calculateTrustScore(data.voteStats, data.verified);
        console.log(`🏆 Setting trust score ${updates.trustScore} for ${doc.id}`);
      }

      // 3. Generate search terms if empty
      if (!data.searchTerms || data.searchTerms.length === 0) {
        updates.searchTerms = generateSearchTerms(data.title, data.content, data.tags);
        console.log(`🔍 Adding search terms for ${doc.id}: ${updates.searchTerms.slice(0, 3).join(', ')}...`);
      }

      // 4. Ensure viewCount exists
      if (data.viewCount === undefined) {
        updates.viewCount = Math.floor(Math.random() * 100) + 10;
        console.log(`👁️  Setting view count ${updates.viewCount} for ${doc.id}`);
      }

      // 5. Ensure author object has all required fields
      if (data.author && (!data.author.displayName || !data.author.email)) {
        updates['author.displayName'] = data.author.displayName || 'Anonymous User';
        updates['author.email'] = data.author.email || 'unknown@example.com';
        console.log(`👤 Fixing author info for ${doc.id}`);
      }

      // 6. Add isVerified field for frontend compatibility
      if (data.isVerified === undefined && data.verified !== undefined) {
        updates.isVerified = data.verified;
        console.log(`✅ Adding isVerified field for ${doc.id}`);
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updateCount} documents`);
    } else {
      console.log('ℹ️  No updates needed - all documents are already properly configured');
    }

    console.log('🎉 Migration fix completed successfully!');

    // Test the API endpoint
    console.log('\n🧪 Testing API endpoint...');
    const testResponse = await fetch('http://localhost:3003/links?limit=3');
    const testData = await testResponse.json();
    
    if (testData.success && testData.data.posts.length > 0) {
      const samplePost = testData.data.posts[0];
      console.log('📋 Sample post structure:');
      console.log(`  - Has images: ${!!samplePost.imageUrl}`);
      console.log(`  - Trust score: ${samplePost.trustScore}`);
      console.log(`  - Search terms: ${samplePost.searchTerms?.length || 0}`);
      console.log(`  - View count: ${samplePost.viewCount}`);
      console.log(`  - Author display name: ${samplePost.author?.displayName}`);
    }

  } catch (error) {
    console.error('❌ Error during migration fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixMigrationIssues().then(() => {
  console.log('\n✨ Migration fix script completed successfully!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Migration fix script failed:', error);
  process.exit(1);
});
