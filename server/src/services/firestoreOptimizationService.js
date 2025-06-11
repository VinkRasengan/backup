/**
 * Firestore Optimization Service
 * Provides optimized queries, caching, and performance improvements for Firestore
 */

const admin = require('firebase-admin');
const NodeCache = require('node-cache');

class FirestoreOptimizationService {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every minute
      useClones: false // Better performance
    });
    
    this.db = null;
    this.batchSize = 500; // Firestore batch limit
    this.maxRetries = 3;
    
    // Cache TTL configurations (in seconds)
    this.cacheTTL = {
      trending: 180,      // 3 minutes - trending changes frequently
      community: 300,     // 5 minutes - community posts
      stats: 600,         // 10 minutes - statistics
      userProfile: 900,   // 15 minutes - user profiles
      static: 3600        // 1 hour - static content
    };
  }

  /**
   * Initialize with Firestore database
   */
  initialize(firestoreDb) {
    this.db = firestoreDb;
    console.log('✅ Firestore Optimization Service initialized');
  }

  /**
   * Get trending posts with optimized query and caching
   */
  async getTrendingPosts(limit = 10, offset = 0) {
    const cacheKey = `trending_posts_${limit}_${offset}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: trending posts');
      return cached;
    }

    try {
      console.log('🔍 Fetching trending posts from Firestore...');

      // Use simplest possible query to avoid index issues temporarily
      let query = this.db.collection('links');

      const snapshot = await query.get();

      if (snapshot.empty) {
        return { posts: [], total: 0, hasMore: false };
      }

      // Process results efficiently and filter out deleted posts
      const allPosts = [];

      snapshot.forEach(doc => {
        const data = doc.data();

        // Skip deleted posts
        if (data.status === 'deleted') {
          return;
        }

        allPosts.push({
          id: doc.id,
          ...data,
          // Calculate engagement score if not present
          engagementScore: data.engagementScore || this.calculateEngagementScore(data)
        });
      });

      // Sort by engagement score manually (since we can't use composite index yet)
      allPosts.sort((a, b) => {
        const scoreA = a.engagementScore || 0;
        const scoreB = b.engagementScore || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA; // Higher engagement first
        }
        // If engagement scores are equal, sort by creation date
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      // Apply offset and get final posts
      const posts = allPosts.slice(offset, offset + limit);

      const result = {
        posts,
        total: allPosts.length,
        hasMore: allPosts.length > offset + limit,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, result, this.cacheTTL.trending);

      console.log(`✅ Trending posts fetched: ${posts.length} posts`);
      return result;

    } catch (error) {
      console.error('❌ Error fetching trending posts:', error);

      // Return fallback data
      return this.getFallbackTrendingPosts(limit);
    }
  }

  /**
   * Get community posts with advanced filtering and caching
   */
  async getCommunityPosts(options = {}) {
    const {
      sort = 'newest',
      category = 'all',
      search = '',
      page = 1,
      limit = 10,
      userId = null
    } = options;

    const cacheKey = `community_posts_${sort}_${category}_${search}_${page}_${limit}_${userId || 'all'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: community posts');
      return cached;
    }

    try {
      console.log('🔍 Fetching community posts from Firestore...');
      
      let query = this.db.collection('links');
      
      // Apply filters with proper indexing
      if (category !== 'all') {
        query = query.where('category', '==', category);
      }
      
      if (userId) {
        query = query.where('userId', '==', userId);
      }

      // Use simplest possible query to avoid index issues temporarily
      // No limit, no ordering - just get all documents

      const snapshot = await query.get();

      const allPosts = [];

      snapshot.forEach(doc => {
        const data = doc.data();

        // Skip deleted posts
        if (data.status === 'deleted') {
          return;
        }

        // Apply search filter (if needed)
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesSearch =
            (data.title && data.title.toLowerCase().includes(searchLower)) ||
            (data.description && data.description.toLowerCase().includes(searchLower)) ||
            (data.url && data.url.toLowerCase().includes(searchLower));

          if (!matchesSearch) {
            return;
          }
        }

        allPosts.push({
          id: doc.id,
          ...data,
          // Ensure required fields
          voteCount: data.voteCount || 0,
          commentCount: data.commentCount || 0,
          engagementScore: data.engagementScore || this.calculateEngagementScore(data)
        });
      });

      // Apply manual sorting based on sort parameter
      switch (sort) {
        case 'trending':
          allPosts.sort((a, b) => {
            const scoreA = a.engagementScore || 0;
            const scoreB = b.engagementScore || 0;
            if (scoreB !== scoreA) {
              return scoreB - scoreA; // Higher engagement first
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          break;
        case 'popular':
          allPosts.sort((a, b) => {
            const votesA = a.voteCount || 0;
            const votesB = b.voteCount || 0;
            if (votesB !== votesA) {
              return votesB - votesA; // More votes first
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          break;
        case 'newest':
        default:
          // Already sorted by createdAt desc from query
          break;
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const posts = allPosts.slice(startIndex, startIndex + limit);
      const hasMore = allPosts.length > startIndex + limit;

      const result = {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allPosts.length,
          hasMore
        },
        filters: { sort, category, search },
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, result, this.cacheTTL.community);
      
      console.log(`✅ Community posts fetched: ${posts.length} posts`);
      return result;

    } catch (error) {
      console.error('❌ Error fetching community posts:', error);
      throw error;
    }
  }

  /**
   * Get community statistics with aggressive caching
   */
  async getCommunityStats() {
    const cacheKey = 'community_stats';
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: community stats');
      return cached;
    }

    try {
      console.log('🔍 Calculating community stats...');
      
      // Use aggregation queries for better performance
      const [postsSnapshot, usersSnapshot, votesSnapshot, commentsSnapshot] = await Promise.all([
        this.db.collection('links').count().get(),
        this.db.collection('users').count().get(),
        this.db.collection('votes').count().get(),
        this.db.collection('comments').count().get()
      ]);

      const stats = {
        totalPosts: postsSnapshot.data().count,
        totalUsers: usersSnapshot.data().count,
        totalVotes: votesSnapshot.data().count,
        totalComments: commentsSnapshot.data().count,
        lastUpdated: new Date().toISOString()
      };

      // Cache for longer period
      this.cache.set(cacheKey, stats, this.cacheTTL.stats);
      
      console.log('✅ Community stats calculated');
      return stats;

    } catch (error) {
      console.error('❌ Error calculating community stats:', error);
      
      // Return fallback stats
      return {
        totalPosts: 0,
        totalUsers: 0,
        totalVotes: 0,
        totalComments: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Stats temporarily unavailable'
      };
    }
  }

  /**
   * Batch update operations for better performance
   */
  async batchUpdateEngagementScores() {
    try {
      console.log('🔄 Starting batch engagement score update...');
      
      const batch = this.db.batch();
      let updateCount = 0;
      
      // Get posts that need engagement score updates
      const snapshot = await this.db.collection('links')
        .where('engagementScore', '==', null)
        .limit(this.batchSize)
        .get();

      snapshot.forEach(doc => {
        const data = doc.data();
        const engagementScore = this.calculateEngagementScore(data);
        
        batch.update(doc.ref, { 
          engagementScore,
          lastEngagementUpdate: new Date().toISOString()
        });
        
        updateCount++;
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(`✅ Updated engagement scores for ${updateCount} posts`);
        
        // Clear related caches
        this.clearCacheByPattern('trending_posts_');
        this.clearCacheByPattern('community_posts_');
      }

      return updateCount;

    } catch (error) {
      console.error('❌ Error in batch engagement update:', error);
      throw error;
    }
  }

  /**
   * Calculate engagement score for a post
   */
  calculateEngagementScore(postData) {
    const {
      voteCount = 0,
      commentCount = 0,
      trustScore = 50,
      createdAt
    } = postData;

    // Time decay factor (newer posts get higher scores)
    const now = new Date();
    const postDate = new Date(createdAt);
    const hoursSincePost = (now - postDate) / (1000 * 60 * 60);
    const timeDecay = Math.max(0.1, 1 - (hoursSincePost / (24 * 7))); // Decay over a week

    // Engagement calculation
    const engagementScore = (
      (voteCount * 2) +           // Votes are important
      (commentCount * 3) +        // Comments show high engagement
      (trustScore / 10)           // Trust score contributes
    ) * timeDecay;

    return Math.round(engagementScore * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Clear cache by pattern
   */
  clearCacheByPattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      this.cache.del(key);
    });
    
    console.log(`🗑️ Cleared ${matchingKeys.length} cache entries matching: ${pattern}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      hitRate: this.cache.getStats().hits / (this.cache.getStats().hits + this.cache.getStats().misses) || 0
    };
  }

  /**
   * Fallback trending posts
   */
  getFallbackTrendingPosts(limit) {
    return {
      posts: [],
      total: 0,
      hasMore: false,
      error: 'Unable to fetch trending posts',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get votes for a specific link with caching
   */
  async getVotesForLink(linkId, options = {}) {
    const { includeUserVote = false, userId = null } = options;
    const cacheKey = `votes_${linkId}_${includeUserVote}_${userId || 'all'}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: votes for link');
      return cached;
    }

    try {
      console.log('🔍 Fetching votes from Firestore...');

      // Get all votes for the link
      const votesQuery = this.db.collection('votes')
        .where('linkId', '==', linkId)
        .orderBy('createdAt', 'desc');

      const votesSnapshot = await votesQuery.get();

      // Process votes efficiently
      const votes = [];
      const voteStats = {
        safe: 0,
        suspicious: 0,
        unsafe: 0,
        total: 0
      };

      let userVote = null;

      votesSnapshot.forEach(doc => {
        const voteData = doc.data();
        votes.push({
          id: doc.id,
          ...voteData
        });

        // Count vote types
        if (voteStats.hasOwnProperty(voteData.voteType)) {
          voteStats[voteData.voteType]++;
          voteStats.total++;
        }

        // Check for user's vote
        if (includeUserVote && userId && voteData.userId === userId) {
          userVote = voteData.voteType;
        }
      });

      const result = {
        votes,
        stats: voteStats,
        userVote,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, result, this.cacheTTL.community);

      console.log(`✅ Votes fetched: ${votes.length} votes`);
      return result;

    } catch (error) {
      console.error('❌ Error fetching votes:', error);
      throw error;
    }
  }

  /**
   * Get comments for a specific link with caching and pagination
   */
  async getCommentsForLink(linkId, options = {}) {
    const { page = 1, limit = 10, includeUserInfo = true } = options;
    const cacheKey = `comments_${linkId}_${page}_${limit}_${includeUserInfo}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: comments for link');
      return cached;
    }

    try {
      console.log('🔍 Fetching comments from Firestore...');

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get comments with pagination
      const commentsQuery = this.db.collection('comments')
        .where('linkId', '==', linkId)
        .orderBy('createdAt', 'desc')
        .limit(limit + offset);

      const commentsSnapshot = await commentsQuery.get();

      if (commentsSnapshot.empty) {
        return { comments: [], pagination: { page, limit, total: 0, hasMore: false } };
      }

      // Process comments efficiently
      const allComments = [];
      const userIds = new Set();

      commentsSnapshot.forEach((doc, index) => {
        if (index >= offset) {
          const commentData = doc.data();
          allComments.push({
            id: doc.id,
            ...commentData
          });

          if (commentData.userId) {
            userIds.add(commentData.userId);
          }
        }
      });

      // Batch fetch user information if needed
      let userInfoMap = {};
      if (includeUserInfo && userIds.size > 0) {
        const userPromises = Array.from(userIds).map(async (userId) => {
          try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
              const userData = userDoc.data();
              return {
                userId,
                displayName: userData.displayName || userData.firstName || 'Anonymous User',
                email: userData.email || 'Anonymous'
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch user ${userId}:`, error);
          }
          return { userId, displayName: 'Anonymous User', email: 'Anonymous' };
        });

        const userInfoArray = await Promise.all(userPromises);
        userInfoMap = userInfoArray.reduce((map, userInfo) => {
          map[userInfo.userId] = userInfo;
          return map;
        }, {});
      }

      // Enhance comments with user info
      const enhancedComments = allComments.map(comment => ({
        ...comment,
        userInfo: userInfoMap[comment.userId] || { displayName: 'Anonymous User', email: 'Anonymous' }
      }));

      const result = {
        comments: enhancedComments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: enhancedComments.length,
          hasMore: commentsSnapshot.size > limit + offset
        },
        lastUpdated: new Date().toISOString()
      };

      // Cache the result (shorter TTL for comments)
      this.cache.set(cacheKey, result, 120); // 2 minutes

      console.log(`✅ Comments fetched: ${enhancedComments.length} comments`);
      return result;

    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Get user profile with caching
   */
  async getUserProfile(userId) {
    const cacheKey = `user_profile_${userId}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: user profile');
      return cached;
    }

    try {
      console.log('🔍 Fetching user profile from Firestore...');

      const userDoc = await this.db.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      const result = {
        id: userDoc.id,
        ...userData,
        lastUpdated: new Date().toISOString()
      };

      // Cache for longer period (user profiles don't change often)
      this.cache.set(cacheKey, result, this.cacheTTL.userProfile);

      console.log('✅ User profile fetched');
      return result;

    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Get chat messages with caching and pagination
   */
  async getChatMessages(conversationId, options = {}) {
    const { page = 1, limit = 50 } = options;
    const cacheKey = `chat_messages_${conversationId}_${page}_${limit}`;

    // Check cache (shorter TTL for chat messages)
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: chat messages');
      return cached;
    }

    try {
      console.log('🔍 Fetching chat messages from Firestore...');

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Get messages with pagination
      const messagesQuery = this.db.collection('chat_messages')
        .where('conversationId', '==', conversationId)
        .orderBy('createdAt', 'desc')
        .limit(limit + offset);

      const messagesSnapshot = await messagesQuery.get();

      if (messagesSnapshot.empty) {
        return { messages: [], pagination: { page, limit, total: 0, hasMore: false } };
      }

      // Process messages efficiently
      const allMessages = [];

      messagesSnapshot.forEach((doc, index) => {
        if (index >= offset) {
          const messageData = doc.data();
          allMessages.push({
            id: doc.id,
            ...messageData
          });
        }
      });

      // Reverse to show oldest first
      allMessages.reverse();

      const result = {
        messages: allMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: allMessages.length,
          hasMore: messagesSnapshot.size > limit + offset
        },
        lastUpdated: new Date().toISOString()
      };

      // Cache for shorter period (chat is more dynamic)
      this.cache.set(cacheKey, result, 60); // 1 minute

      console.log(`✅ Chat messages fetched: ${allMessages.length} messages`);
      return result;

    } catch (error) {
      console.error('❌ Error fetching chat messages:', error);
      throw error;
    }
  }

  /**
   * Get reports with caching and filtering
   */
  async getReports(options = {}) {
    const { status = 'all', category = 'all', page = 1, limit = 20 } = options;
    const cacheKey = `reports_${status}_${category}_${page}_${limit}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit: reports');
      return cached;
    }

    try {
      console.log('🔍 Fetching reports from Firestore...');

      let query = this.db.collection('reports');

      // Apply filters
      if (status !== 'all') {
        query = query.where('status', '==', status);
      }

      if (category !== 'all') {
        query = query.where('category', '==', category);
      }

      // Apply sorting and pagination
      query = query.orderBy('createdAt', 'desc')
                   .limit(limit);

      const reportsSnapshot = await query.get();

      const reports = [];
      reportsSnapshot.forEach(doc => {
        reports.push({
          id: doc.id,
          ...doc.data()
        });
      });

      const result = {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: reports.length,
          hasMore: reports.length === limit
        },
        filters: { status, category },
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, result, this.cacheTTL.community);

      console.log(`✅ Reports fetched: ${reports.length} reports`);
      return result;

    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      throw error;
    }
  }

  /**
   * Batch update vote counts for links
   */
  async batchUpdateVoteCounts(linkIds) {
    try {
      console.log('🔄 Batch updating vote counts...');

      const batch = this.db.batch();
      let updateCount = 0;

      for (const linkId of linkIds) {
        // Get vote counts for this link
        const votesSnapshot = await this.db.collection('votes')
          .where('linkId', '==', linkId)
          .get();

        const voteCounts = {
          safe: 0,
          suspicious: 0,
          unsafe: 0,
          total: 0
        };

        votesSnapshot.forEach(doc => {
          const voteData = doc.data();
          if (voteCounts.hasOwnProperty(voteData.voteType)) {
            voteCounts[voteData.voteType]++;
            voteCounts.total++;
          }
        });

        // Update link document
        const linkRef = this.db.collection('links').doc(linkId);
        batch.update(linkRef, {
          voteCount: voteCounts.total,
          votes: voteCounts,
          updatedAt: new Date().toISOString()
        });

        updateCount++;
      }

      if (updateCount > 0) {
        await batch.commit();
        console.log(`✅ Updated vote counts for ${updateCount} links`);

        // Clear related caches
        this.clearCacheByPattern('votes_');
        this.clearCacheByPattern('community_posts_');
      }

      return updateCount;

    } catch (error) {
      console.error('❌ Error in batch vote count update:', error);
      throw error;
    }
  }

  /**
   * Get last document snapshot for pagination
   */
  async getLastDocumentSnapshot(sort, category, userId, offset) {
    // This is a simplified implementation
    // In production, you'd want to implement proper cursor-based pagination
    return null;
  }
}

module.exports = new FirestoreOptimizationService();
