import { useEffect, useRef, useState } from 'react';

/**
 * useIntersectionObserver Hook
 * Optimized intersection observer for lazy loading and performance
 */
export const useIntersectionObserver = (
  targetRef,
  options = {},
  dependencies = []
) => {
  const observerRef = useRef(null);
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    onIntersect,
    onLeave,
    once = false
  } = options;

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onIntersect?.(entry);
            
            // If once is true, stop observing after first intersection
            if (once) {
              observerRef.current?.unobserve(target);
            }
          } else {
            onLeave?.(entry);
          }
        });
      },
      {
        threshold,
        root,
        rootMargin
      }
    );

    // Start observing
    observerRef.current.observe(target);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(target);
        observerRef.current.disconnect();
      }
    };
  }, [targetRef, threshold, root, rootMargin, onIntersect, onLeave, once, ...dependencies]);

  return observerRef.current;
};

/**
 * useInfiniteScroll Hook
 * For implementing infinite scroll with intersection observer
 */
export const useInfiniteScroll = (
  callback,
  options = {}
) => {
  const {
    threshold = 1.0,
    rootMargin = '100px',
    enabled = true
  } = options;

  const loadMoreRef = useRef(null);

  useIntersectionObserver(
    loadMoreRef,
    {
      threshold,
      rootMargin,
      onIntersect: () => {
        if (enabled) {
          callback();
        }
      }
    },
    [callback, enabled]
  );

  return loadMoreRef;
};

/**
 * useLazyImage Hook
 * For lazy loading images with intersection observer
 */
export const useLazyImage = (src, options = {}) => {
  const {
    placeholder = '',
    threshold = 0.1,
    rootMargin = '50px'
  } = options;

  const imgRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useIntersectionObserver(
    imgRef,
    {
      threshold,
      rootMargin,
      once: true,
      onIntersect: () => {
        // Start loading the actual image
        const img = new Image();
        img.onload = () => {
          setImageSrc(src);
          setIsLoaded(true);
        };
        img.onerror = () => {
          setIsError(true);
        };
        img.src = src;
      }
    }
  );

  return {
    imgRef,
    imageSrc,
    isLoaded,
    isError
  };
};

/**
 * useViewportTracker Hook
 * Track when elements enter/leave viewport for analytics
 */
export const useViewportTracker = (
  onView,
  options = {}
) => {
  const {
    threshold = 0.5,
    minViewTime = 1000, // Minimum time in viewport to count as "viewed"
    trackOnce = true
  } = options;

  const elementRef = useRef(null);
  const viewStartTime = useRef(null);
  const hasBeenViewed = useRef(false);

  useIntersectionObserver(
    elementRef,
    {
      threshold,
      onIntersect: () => {
        if (trackOnce && hasBeenViewed.current) return;
        
        viewStartTime.current = Date.now();
      },
      onLeave: () => {
        if (viewStartTime.current) {
          const viewDuration = Date.now() - viewStartTime.current;
          
          if (viewDuration >= minViewTime) {
            onView?.(viewDuration);
            hasBeenViewed.current = true;
          }
          
          viewStartTime.current = null;
        }
      }
    }
  );

  return elementRef;
};

export default useIntersectionObserver;
