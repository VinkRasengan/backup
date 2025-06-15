import { useState, useCallback, useRef } from 'react';

// Get API base URL (same logic as api.js)
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }

  return 'http://localhost:5000/api';
};

// Smart Community Data Manager with Caching & Prefetching
class CommunityDataManager {
  constructor() {
    this.cache = new Map();
    this.prefetchQueue = new Set();
    this.activeRequests = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 60 minutes - much longer cache time
    this.maxCacheSize = 200; // Increased cache size
    this.debounceMap = new Map(); // For debouncing requests
    this.debounceDelay = 500; // 500ms debounce
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

  // Fetch data with smart caching and debouncing
  async fetchData(params) {
    const key = this.getCacheKey(params);

    // Check cache first
    const cached = this.getFromCache(params);
    if (cached) {
      console.log('📦 Using cached data:', key);
      return cached;
    }

    // Debounce requests to prevent spam
    if (this.debounceMap.has(key)) {
      clearTimeout(this.debounceMap.get(key));
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        this.debounceMap.delete(key);

        // Check if request is already in progress
        if (this.activeRequests.has(key)) {
          console.log('⏳ Request in progress:', key);
          try {
            const result = await this.activeRequests.get(key);
            resolve(result);
          } catch (error) {
            reject(error);
          }
          return;
        }

        // Make new request
        const requestPromise = this.makeRequest(params);
        this.activeRequests.set(key, requestPromise);

        try {
          const data = await requestPromise;
          this.setToCache(params, data);
          this.activeRequests.delete(key);

          console.log('✅ Data fetched and cached:', key);
          resolve(data);
        } catch (error) {
          this.activeRequests.delete(key);
          reject(error);
        }
      }, this.debounceDelay);

      this.debounceMap.set(key, timeoutId);
    });
  }

  // Enhanced API request with Facebook/Reddit-style optimization
  async makeRequest(params) {
    const { sort = 'trending', filter = 'all', search = '', page = 1 } = params;

    const urlParams = new URLSearchParams({
      page,
      sort,
      limit: page === 1 ? 10 : 5, // Load fewer items for subsequent pages
      includeNews: 'true'
    });

    if (filter !== 'all') {
      urlParams.append('category', filter);
    }

    if (search?.trim()) {
      urlParams.append('search', search.trim());
    }

    console.log('🌐 API Request:', urlParams.toString());

    // Enhanced token handling
    const token = localStorage.getItem('token') ||
                 localStorage.getItem('authToken') ||
                 localStorage.getItem('backendToken') ||
                 localStorage.getItem('firebaseToken');

    const response = await fetch(`${getApiBaseUrl()}/community/posts?${urlParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'max-age=300', // 5 minutes cache
        'X-Request-ID': `community-${Date.now()}` // Request tracking
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    const data = await response.json();
    return data.data;
  }

  // Prefetch next page - DISABLED to reduce requests
  prefetchNext(params) {
    // Temporarily disable prefetching to reduce API load
    // Only load data on explicit user action
    console.log('🚫 Prefetch disabled to reduce API requests');
    return;
  }

  // Prefetch related filters - DISABLED to reduce requests
  prefetchRelated(params) {
    // Temporarily disable related prefetching to reduce API load
    console.log('🚫 Related prefetch disabled to reduce API requests');
    return;
  }

  // Clear cache and debounce timers
  clearCache() {
    this.cache.clear();
    this.prefetchQueue.clear();

    // Clear all debounce timers
    this.debounceMap.forEach(timeoutId => clearTimeout(timeoutId));
    this.debounceMap.clear();

    // Clear active requests
    this.activeRequests.clear();

    console.log('🗑️ Cache, debounce timers, and active requests cleared');
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
    getCacheStats,
    dataManager // Export dataManager for monitoring
  };
};

export default useCommunityData;
