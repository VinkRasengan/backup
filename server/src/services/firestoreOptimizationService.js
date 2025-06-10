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
      
      // Optimized query with proper indexing
      const query = this.db.collection('links')
        .where('status', '!=', 'deleted')
        .orderBy('status') // Required for != queries
        .orderBy('engagementScore', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit + offset);

      const snapshot = await query.get();
      
      if (snapshot.empty) {
        return { posts: [], total: 0, hasMore: false };
      }

      // Process results efficiently
      const allPosts = [];
      const batch = this.db.batch();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        allPosts.push({
          id: doc.id,
          ...data,
          // Calculate engagement score if not present
          engagementScore: data.engagementScore || this.calculateEngagementScore(data)
        });
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
    
    // Check cache
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

      // Apply sorting with composite indexes
      switch (sort) {
        case 'trending':
          query = query.orderBy('engagementScore', 'desc')
                      .orderBy('createdAt', 'desc');
          break;
        case 'popular':
          query = query.orderBy('voteCount', 'desc')
                      .orderBy('createdAt', 'desc');
          break;
        case 'newest':
        default:
          query = query.orderBy('createdAt', 'desc');
          break;
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit + 1); // +1 to check if there are more

      if (offset > 0) {
        // For pagination, we need to use cursor-based pagination for better performance
        const lastDocSnapshot = await this.getLastDocumentSnapshot(sort, category, userId, offset);
        if (lastDocSnapshot) {
          query = query.startAfter(lastDocSnapshot);
        }
      }

      const snapshot = await query.get();
      
      const posts = [];
      let hasMore = false;
      
      snapshot.forEach((doc, index) => {
        if (index < limit) {
          const data = doc.data();
          
          // Apply search filter (if needed)
          if (search) {
            const searchLower = search.toLowerCase();
            const matchesSearch = 
              (data.title && data.title.toLowerCase().includes(searchLower)) ||
              (data.description && data.description.toLowerCase().includes(searchLower)) ||
              (data.url && data.url.toLowerCase().includes(searchLower));
            
            if (!matchesSearch) return;
          }
          
          posts.push({
            id: doc.id,
            ...data,
            // Ensure required fields
            voteCount: data.voteCount || 0,
            commentCount: data.commentCount || 0,
            engagementScore: data.engagementScore || this.calculateEngagementScore(data)
          });
        } else {
          hasMore = true;
        }
      });

      const result = {
        posts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: posts.length,
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
   * Get last document snapshot for pagination
   */
  async getLastDocumentSnapshot(sort, category, userId, offset) {
    // This is a simplified implementation
    // In production, you'd want to implement proper cursor-based pagination
    return null;
  }
}

module.exports = new FirestoreOptimizationService();
