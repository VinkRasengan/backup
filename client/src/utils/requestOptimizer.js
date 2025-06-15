// Request Optimization Utilities
// Helps prevent request overload and manages API calls efficiently

class RequestOptimizer {
  constructor() {
    this.requestQueue = new Map();
    this.rateLimits = new Map();
    this.retryDelays = [1000, 2000, 4000, 8000]; // Exponential backoff
  }

  // Debounce API requests to prevent spam
  debounceRequest(key, fn, delay = 500) {
    if (this.requestQueue.has(key)) {
      clearTimeout(this.requestQueue.get(key));
    }

    const timeoutId = setTimeout(() => {
      fn();
      this.requestQueue.delete(key);
    }, delay);

    this.requestQueue.set(key, timeoutId);
  }

  // Rate limiting for API endpoints
  async enforceRateLimit(endpoint, limit = 10, window = 60000) {
    const now = Date.now();
    const key = `rate_limit_${endpoint}`;
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, { count: 0, windowStart: now });
    }

    const rateData = this.rateLimits.get(key);
    
    // Reset window if expired
    if (now - rateData.windowStart > window) {
      rateData.count = 0;
      rateData.windowStart = now;
    }

    // Check if limit exceeded
    if (rateData.count >= limit) {
      const waitTime = window - (now - rateData.windowStart);
      console.warn(`⏱️ Rate limit exceeded for ${endpoint}. Waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Reset after waiting
      rateData.count = 0;
      rateData.windowStart = Date.now();
    }

    rateData.count++;
    return true;
  }

  // Batch multiple requests together
  batchRequests(requests, batchSize = 5) {
    const batches = [];
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    return batches.map(batch => 
      Promise.allSettled(batch.map(request => request()))
    );
  }

  // Request with retry logic
  async requestWithRetry(requestFn, maxRetries = 3, endpoint = 'unknown') {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.enforceRateLimit(endpoint);
        return await requestFn();
      } catch (error) {
        console.warn(`🔄 Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
        
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Cancel all pending requests
  cancelAllRequests() {
    this.requestQueue.forEach(timeoutId => clearTimeout(timeoutId));
    this.requestQueue.clear();
    console.log('🚫 All pending requests cancelled');
  }

  // Get queue status
  getQueueStatus() {
    return {
      pendingRequests: this.requestQueue.size,
      rateLimitedEndpoints: this.rateLimits.size
    };
  }
}

// Singleton instance
export const requestOptimizer = new RequestOptimizer();

// Performance-aware fetch wrapper
export async function optimizedFetch(url, options = {}, endpoint = 'api') {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30s timeout

  try {
    await requestOptimizer.enforceRateLimit(endpoint);
    
    const response = await fetch(url, {
      ...options,
      signal: abortController.signal,
      headers: {
        'Cache-Control': 'max-age=300', // 5 minutes cache
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
}

// Animation throttling utility
export class AnimationThrottler {
  constructor() {
    this.activeAnimations = new Set();
    this.maxConcurrentAnimations = 10;
  }

  canAnimate() {
    return this.activeAnimations.size < this.maxConcurrentAnimations;
  }

  registerAnimation(id, cleanupFn) {
    if (!this.canAnimate()) {
      console.warn('🎭 Animation throttled: too many concurrent animations');
      return false;
    }

    this.activeAnimations.add({ id, cleanupFn });
    return true;
  }

  unregisterAnimation(id) {
    const animation = Array.from(this.activeAnimations).find(a => a.id === id);
    if (animation) {
      animation.cleanupFn?.();
      this.activeAnimations.delete(animation);
    }
  }

  killAllAnimations() {
    this.activeAnimations.forEach(animation => {
      animation.cleanupFn?.();
    });
    this.activeAnimations.clear();
    console.log('🎭 All animations killed');
  }
}

export const animationThrottler = new AnimationThrottler();

// Performance monitoring utility
export class PerformanceWatcher {
  constructor() {
    this.observers = new Map();
    this.warnings = [];
  }

  // Monitor DOM changes
  observeDOM(element, callback, options = {}) {
    const observer = new MutationObserver((mutations) => {
      if (mutations.length > 50) {
        console.warn('⚠️ High DOM mutation rate detected');
        this.warnings.push({
          type: 'dom_mutations',
          count: mutations.length,
          timestamp: Date.now()
        });
      }
      callback(mutations);
    });

    observer.observe(element, {
      childList: true,
      subtree: true,
      ...options
    });

    const id = Math.random().toString(36);
    this.observers.set(id, observer);
    return id;
  }

  // Stop observing
  unobserve(id) {
    const observer = this.observers.get(id);
    if (observer) {
      observer.disconnect();
      this.observers.delete(id);
    }
  }

  // Clean up all observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  // Get performance warnings
  getWarnings() {
    return this.warnings;
  }

  // Clear warnings
  clearWarnings() {
    this.warnings = [];
  }
}

export const performanceWatcher = new PerformanceWatcher();

// Cleanup utilities when app unmounts
export function globalCleanup() {
  requestOptimizer.cancelAllRequests();
  animationThrottler.killAllAnimations();
  performanceWatcher.cleanup();
  console.log('🧹 Global cleanup completed');
}

// Auto cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', globalCleanup);
}
