import { useState, useEffect, useCallback, useRef } from 'react';

// Smart Community Data Manager with Caching & Prefetching
class CommunityDataManager {
  constructor() {
    this.cache = new Map();
    this.prefetchQueue = new Set();
    this.activeRequests = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes - longer cache time
    this.maxCacheSize = 100; // Increased cache size
  }

  // Generate cache key
  getCacheKey(params) {
    const { sort, filter, search, page } = params;
    return `${sort}-${filter}-${search || 'none'}-${page}`;
  }

  // Check if data is fresh
  isFresh(cacheEntry) {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
  }

  // Get from cache
  getFromCache(params) {
    const key = this.getCacheKey(params);
    const entry = this.cache.get(key);
    
    if (entry && this.isFresh(entry)) {
      console.log('📦 Cache hit:', key);
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key);
    }
    
    return null;
  }

  // Set to cache
  setToCache(params, data) {
    const key = this.getCacheKey(params);
    
    // Implement LRU eviction
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    console.log('💾 Cached:', key);
  }

  // Fetch data with smart caching
  async fetchData(params) {
    const key = this.getCacheKey(params);
    
    // Check cache first
    const cached = this.getFromCache(params);
    if (cached) {
      // Prefetch next page in background
      this.prefetchNext(params);
      return cached;
    }

    // Check if request is already in progress
    if (this.activeRequests.has(key)) {
      console.log('⏳ Request in progress:', key);
      return this.activeRequests.get(key);
    }

    // Make new request
    const requestPromise = this.makeRequest(params);
    this.activeRequests.set(key, requestPromise);

    try {
      const data = await requestPromise;
      this.setToCache(params, data);
      this.activeRequests.delete(key);
      
      // Prefetch related data
      this.prefetchRelated(params);
      
      return data;
    } catch (error) {
      this.activeRequests.delete(key);
      throw error;
    }
  }

  // Make actual API request with optimization
  async makeRequest(params) {
    const { sort = 'trending', filter = 'all', search = '', page = 1 } = params;

    const urlParams = new URLSearchParams({
      page,
      sort,
      limit: 15, // Increased limit for better UX
      includeNews: 'true'
    });

    if (filter !== 'all') {
      urlParams.append('category', filter);
    }

    if (search?.trim()) {
      urlParams.append('search', search.trim());
    }

    console.log('🌐 API Request:', urlParams.toString());

    const response = await fetch(`/api/community/posts?${urlParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('backendToken')}`,
        'Cache-Control': 'max-age=300' // 5 minutes cache
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const data = await response.json();
    return data.data;
  }

  // Prefetch next page
  prefetchNext(params) {
    const nextParams = { ...params, page: (params.page || 1) + 1 };
    const key = this.getCacheKey(nextParams);
    
    if (!this.cache.has(key) && !this.prefetchQueue.has(key)) {
      this.prefetchQueue.add(key);
      
      // Prefetch after a short delay
      setTimeout(() => {
        this.fetchData(nextParams).catch(() => {
          // Ignore prefetch errors
        }).finally(() => {
          this.prefetchQueue.delete(key);
        });
      }, 1000);
    }
  }

  // Prefetch related filters
  prefetchRelated(params) {
    if (params.filter === 'all' && !params.search) {
      // Prefetch popular categories
      const popularFilters = ['security', 'health', 'technology'];
      
      popularFilters.forEach(filter => {
        const relatedParams = { ...params, filter, page: 1 };
        const key = this.getCacheKey(relatedParams);
        
        if (!this.cache.has(key) && !this.prefetchQueue.has(key)) {
          this.prefetchQueue.add(key);
          
          setTimeout(() => {
            this.fetchData(relatedParams).catch(() => {
              // Ignore prefetch errors
            }).finally(() => {
              this.prefetchQueue.delete(key);
            });
          }, 2000);
        }
      });
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.prefetchQueue.clear();
    console.log('🗑️ Cache cleared');
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      prefetchQueue: Array.from(this.prefetchQueue)
    };
  }
}

// Singleton instance
const dataManager = new CommunityDataManager();

// Custom hook for community data
export const useCommunityData = () => {
  const [data, setData] = useState({ posts: [], pagination: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (params) => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      setLoading(true);
      setError(null);

      const result = await dataManager.fetchData(params);
      
      setData(result);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        console.error('Data fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(() => {
    dataManager.clearCache();
  }, []);

  const getCacheStats = useCallback(() => {
    return dataManager.getCacheStats();
  }, []);

  return {
    data,
    loading,
    error,
    fetchData,
    clearCache,
    getCacheStats
  };
};

export default useCommunityData;
