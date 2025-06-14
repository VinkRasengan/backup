// Performance monitoring and optimization utilities

// Animation performance monitor
export class AnimationPerformanceMonitor {
  constructor() {
    this.activeAnimations = new Set();
    this.performanceData = {
      frameDrops: 0,
      averageFPS: 60,
      lastFrameTime: performance.now()
    };
    this.isMonitoring = false;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.monitorFrame();
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }

  monitorFrame() {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.performanceData.lastFrameTime;
    const currentFPS = 1000 / deltaTime;

    // Update average FPS
    this.performanceData.averageFPS = (this.performanceData.averageFPS * 0.9) + (currentFPS * 0.1);

    // Detect frame drops (below 55 FPS)
    if (currentFPS < 55) {
      this.performanceData.frameDrops++;
      console.warn(`Animation frame drop detected: ${currentFPS.toFixed(2)} FPS`);
    }

    this.performanceData.lastFrameTime = currentTime;
    requestAnimationFrame(() => this.monitorFrame());
  }

  registerAnimation(animation, name = 'unnamed') {
    this.activeAnimations.add({ animation, name, startTime: performance.now() });
  }

  unregisterAnimation(animation) {
    for (const item of this.activeAnimations) {
      if (item.animation === animation) {
        const duration = performance.now() - item.startTime;
        console.log(`Animation "${item.name}" completed in ${duration.toFixed(2)}ms`);
        this.activeAnimations.delete(item);
        break;
      }
    }
  }

  getPerformanceReport() {
    return {
      ...this.performanceData,
      activeAnimationsCount: this.activeAnimations.size,
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      } : null
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new AnimationPerformanceMonitor();

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for performance-critical operations
  debounce: (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  // Throttle function for scroll/resize events
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Check if device supports hardware acceleration
  supportsHardwareAcceleration: () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  },

  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get device performance tier
  getDevicePerformanceTier: () => {
    const memory = navigator.deviceMemory || 4; // Default to 4GB if not available
    const cores = navigator.hardwareConcurrency || 4; // Default to 4 cores
    
    if (memory >= 8 && cores >= 8) return 'high';
    if (memory >= 4 && cores >= 4) return 'medium';
    return 'low';
  },

  // Optimize animations based on device performance
  getOptimizedAnimationConfig: () => {
    const tier = performanceUtils.getDevicePerformanceTier();
    const reducedMotion = performanceUtils.prefersReducedMotion();

    if (reducedMotion) {
      return {
        duration: 0.1,
        ease: 'none',
        stagger: 0,
        enableComplexAnimations: false
      };
    }

    switch (tier) {
      case 'high':
        return {
          duration: 1,
          ease: 'power3.out',
          stagger: 0.1,
          enableComplexAnimations: true
        };
      case 'medium':
        return {
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.05,
          enableComplexAnimations: true
        };
      case 'low':
        return {
          duration: 0.3,
          ease: 'power1.out',
          stagger: 0.02,
          enableComplexAnimations: false
        };
      default:
        return {
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.05,
          enableComplexAnimations: true
        };
    }
  },

  // Memory cleanup utility
  cleanupMemory: () => {
    // Force garbage collection if available (Chrome DevTools)
    if (window.gc) {
      window.gc();
    }
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('animation-cache')) {
            caches.delete(name);
          }
        });
      });
    }
  },

  // Measure animation performance
  measureAnimationPerformance: (animationFunction, name = 'animation') => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let frameCount = 0;
      
      const measureFrame = () => {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed >= 1000) { // Measure for 1 second
          const fps = frameCount / (elapsed / 1000);
          resolve({
            name,
            averageFPS: fps,
            totalFrames: frameCount,
            duration: elapsed
          });
        } else {
          requestAnimationFrame(measureFrame);
        }
      };
      
      animationFunction();
      requestAnimationFrame(measureFrame);
    });
  }
};

// Bundle size optimization - lazy load heavy animations
export const lazyAnimations = {
  // Lazy load complex particle animations
  loadParticleSystem: () => Promise.resolve(null), // Placeholder for future implementation

  // Lazy load 3D animations
  load3DAnimations: () => Promise.resolve(null), // Placeholder for future implementation

  // Lazy load complex morphing animations
  loadMorphAnimations: () => Promise.resolve(null) // Placeholder for future implementation
};

// Performance-aware animation wrapper
export const createPerformantAnimation = (animationConfig, options = {}) => {
  const optimizedConfig = performanceUtils.getOptimizedAnimationConfig();
  const reducedMotion = performanceUtils.prefersReducedMotion();
  
  // Skip complex animations if user prefers reduced motion
  if (reducedMotion && options.skipOnReducedMotion) {
    return null;
  }
  
  // Merge optimized config with user config
  return {
    ...animationConfig,
    duration: optimizedConfig.enableComplexAnimations ? 
      animationConfig.duration : optimizedConfig.duration,
    ease: optimizedConfig.ease,
    force3D: true,
    ...options
  };
};

// Initialize performance monitoring in development
if (process.env.NODE_ENV === 'development') {
  performanceMonitor.startMonitoring();
  
  // Log performance report every 10 seconds
  setInterval(() => {
    const report = performanceMonitor.getPerformanceReport();
    if (report.frameDrops > 0 || report.averageFPS < 55) {
      console.warn('Animation Performance Report:', report);
    }
  }, 10000);
}
