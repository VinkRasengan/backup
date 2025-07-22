/**
 * Redis Cache Demo for Community Service
 * Demonstrates Redis caching capabilities with real examples
 */

const { communityCache } = require('./src/utils/communityCache');
const logger = require('./src/utils/logger');

// Sample data
const samplePost = {
  id: 'post_demo_123',
  title: 'Cảnh báo: Website lừa đảo mới xuất hiện',
  content: 'Gần đây xuất hiện website giả mạo ngân hàng với domain tương tự...',
  author: 'user_security_expert',
  category: 'phishing-alert',
  tags: ['phishing', 'banking', 'security'],
  upvotes: 45,
  downvotes: 2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const sampleUser = {
  id: 'user_security_expert',
  name: 'Security Expert',
  email: 'expert@security.com',
  reputation: 850,
  joinDate: '2024-01-15T00:00:00.000Z',
  postsCount: 25,
  commentsCount: 150,
  badges: ['Security Expert', 'Top Contributor']
};

const sampleComments = [
  {
    id: 'comment_1',
    postId: 'post_demo_123',
    content: 'Cảm ơn bạn đã chia sẻ thông tin hữu ích!',
    author: 'user_grateful',
    upvotes: 8,
    downvotes: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'comment_2',
    postId: 'post_demo_123',
    content: 'Tôi cũng từng gặp website này, rất nguy hiểm!',
    author: 'user_victim',
    upvotes: 12,
    downvotes: 1,
    createdAt: new Date().toISOString()
  }
];

async function demoRedisCache() {
  console.log('🎯 Redis Cache Demo for Community Service\n');

  try {
    // Initialize cache
    console.log('🔄 Initializing Redis cache...');
    await communityCache.initialize();
    console.log('✅ Cache initialized successfully!\n');

    // Demo 1: Post Caching
    console.log('📝 Demo 1: Post Caching');
    console.log('------------------------');
    
    // Cache a post
    console.log('💾 Caching sample post...');
    await communityCache.cachePost(samplePost.id, samplePost);
    console.log(`✅ Post cached: ${samplePost.title}`);

    // Retrieve cached post
    console.log('📖 Retrieving cached post...');
    const cachedPost = await communityCache.getPost(samplePost.id);
    if (cachedPost) {
      console.log(`✅ Cache HIT: Retrieved "${cachedPost.title}"`);
      console.log(`   Author: ${cachedPost.author}`);
      console.log(`   Votes: ${cachedPost.upvotes} up, ${cachedPost.downvotes} down`);
    } else {
      console.log('❌ Cache MISS: Post not found in cache');
    }

    // Demo 2: User Profile Caching
    console.log('\n👤 Demo 2: User Profile Caching');
    console.log('--------------------------------');
    
    console.log('💾 Caching user profile...');
    await communityCache.cacheUserProfile(sampleUser.id, sampleUser);
    console.log(`✅ User profile cached: ${sampleUser.name}`);

    console.log('📖 Retrieving cached user profile...');
    const cachedUser = await communityCache.getUserProfile(sampleUser.id);
    if (cachedUser) {
      console.log(`✅ Cache HIT: Retrieved profile for "${cachedUser.name}"`);
      console.log(`   Reputation: ${cachedUser.reputation}`);
      console.log(`   Posts: ${cachedUser.postsCount}, Comments: ${cachedUser.commentsCount}`);
    }

    // Demo 3: Comments Caching
    console.log('\n💬 Demo 3: Comments Caching');
    console.log('----------------------------');
    
    console.log('💾 Caching comments for post...');
    await communityCache.cacheComments(samplePost.id, sampleComments);
    console.log(`✅ ${sampleComments.length} comments cached`);

    console.log('📖 Retrieving cached comments...');
    const cachedComments = await communityCache.getComments(samplePost.id);
    if (cachedComments) {
      console.log(`✅ Cache HIT: Retrieved ${cachedComments.length} comments`);
      cachedComments.forEach((comment, index) => {
        console.log(`   ${index + 1}. ${comment.content.substring(0, 50)}...`);
      });
    }

    // Demo 4: Vote Statistics
    console.log('\n🗳️  Demo 4: Vote Statistics Caching');
    console.log('------------------------------------');
    
    const voteStats = {
      upvotes: samplePost.upvotes,
      downvotes: samplePost.downvotes,
      score: samplePost.upvotes - samplePost.downvotes,
      totalVotes: samplePost.upvotes + samplePost.downvotes
    };

    console.log('💾 Caching vote statistics...');
    await communityCache.cacheVoteStats(samplePost.id, voteStats);
    console.log('✅ Vote stats cached');

    console.log('📖 Retrieving vote statistics...');
    const cachedVoteStats = await communityCache.getVoteStats(samplePost.id);
    if (cachedVoteStats) {
      console.log('✅ Cache HIT: Vote statistics retrieved');
      console.log(`   Score: ${cachedVoteStats.score} (${cachedVoteStats.upvotes}↑ ${cachedVoteStats.downvotes}↓)`);
    }

    // Demo 5: User Vote Tracking
    console.log('\n👍 Demo 5: User Vote Tracking');
    console.log('------------------------------');
    
    console.log('💾 Caching user vote...');
    await communityCache.cacheUserVote('user_demo', samplePost.id, 'upvote');
    console.log('✅ User vote cached');

    console.log('📖 Checking user vote...');
    const userVote = await communityCache.getUserVote('user_demo', samplePost.id);
    if (userVote) {
      console.log(`✅ Cache HIT: User voted "${userVote}" on this post`);
    }

    // Demo 6: Trending Posts
    console.log('\n🔥 Demo 6: Trending Posts Caching');
    console.log('----------------------------------');
    
    const trendingPosts = [
      { ...samplePost, score: 43 },
      { id: 'post_2', title: 'Phishing email mới', score: 38 },
      { id: 'post_3', title: 'Cách nhận biết website giả', score: 35 }
    ];

    console.log('💾 Caching trending posts...');
    await communityCache.cacheTrendingPosts(trendingPosts, '24h');
    console.log(`✅ ${trendingPosts.length} trending posts cached`);

    console.log('📖 Retrieving trending posts...');
    const cachedTrending = await communityCache.getTrendingPosts('24h');
    if (cachedTrending) {
      console.log(`✅ Cache HIT: Retrieved ${cachedTrending.length} trending posts`);
      cachedTrending.forEach((post, index) => {
        console.log(`   ${index + 1}. ${post.title} (score: ${post.score})`);
      });
    }

    // Demo 7: Community Statistics
    console.log('\n📊 Demo 7: Community Statistics');
    console.log('--------------------------------');
    
    const communityStats = {
      totalPosts: 1250,
      totalComments: 5680,
      totalUsers: 890,
      activeUsers24h: 156,
      topCategory: 'phishing-alert',
      averagePostScore: 12.5,
      lastUpdated: new Date().toISOString()
    };

    console.log('💾 Caching community statistics...');
    await communityCache.cacheStats(communityStats);
    console.log('✅ Community stats cached');

    console.log('📖 Retrieving community statistics...');
    const cachedStats = await communityCache.getStats();
    if (cachedStats) {
      console.log('✅ Cache HIT: Community statistics retrieved');
      console.log(`   Total Posts: ${cachedStats.totalPosts}`);
      console.log(`   Total Users: ${cachedStats.totalUsers}`);
      console.log(`   Active Users (24h): ${cachedStats.activeUsers24h}`);
      console.log(`   Top Category: ${cachedStats.topCategory}`);
    }

    // Demo 8: Cache Performance Metrics
    console.log('\n📈 Demo 8: Cache Performance Metrics');
    console.log('-------------------------------------');
    
    const metrics = await communityCache.getCacheMetrics();
    if (metrics) {
      console.log('✅ Cache metrics retrieved:');
      console.log(`   Overall Health: ${metrics.health.overall}`);
      console.log(`   Redis Connected: ${metrics.health.redis.connected}`);
      console.log(`   Redis Latency: ${metrics.health.redis.latency || 'N/A'}`);
      console.log(`   Hit Rate: ${metrics.performance.hitRate}`);
      console.log(`   Total Operations: ${metrics.stats.operations}`);
      console.log(`   Memory Entries: ${metrics.stats.memory.entries}`);
    }

    // Demo 9: Cache Invalidation
    console.log('\n🗑️  Demo 9: Cache Invalidation');
    console.log('-------------------------------');
    
    console.log('🔄 Invalidating post cache...');
    await communityCache.invalidatePost(samplePost.id);
    console.log('✅ Post cache invalidated');

    console.log('📖 Trying to retrieve invalidated post...');
    const invalidatedPost = await communityCache.getPost(samplePost.id);
    if (!invalidatedPost) {
      console.log('✅ Cache MISS: Post successfully removed from cache');
    } else {
      console.log('❌ Post still in cache (unexpected)');
    }

    console.log('\n🎉 Redis Cache Demo completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Post caching and retrieval');
    console.log('   ✅ User profile management');
    console.log('   ✅ Comments caching');
    console.log('   ✅ Vote statistics tracking');
    console.log('   ✅ Trending content management');
    console.log('   ✅ Community statistics');
    console.log('   ✅ Performance monitoring');
    console.log('   ✅ Cache invalidation');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up demo data...');
    try {
      await communityCache.cache.delPattern('posts', 'post_demo_*');
      await communityCache.cache.delPattern('users', 'user_*');
      await communityCache.cache.delPattern('comments', 'post_demo_*');
      await communityCache.cache.delPattern('votes', '*demo*');
      await communityCache.cache.delPattern('trending', '*');
      await communityCache.cache.del('stats', 'community');
      console.log('✅ Demo data cleaned up');
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
    }

    await communityCache.disconnect();
    console.log('🔌 Cache disconnected');
  }
}

// Run the demo
if (require.main === module) {
  demoRedisCache()
    .then(() => {
      console.log('\n✨ Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error.message);
      process.exit(1);
    });
}

module.exports = { demoRedisCache };
