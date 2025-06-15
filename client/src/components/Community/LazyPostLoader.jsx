import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * LazyPostLoader - Facebook/Reddit-style infinite scroll loader
 * Features: Intersection Observer, debounced loading, error handling
 */
const LazyPostLoader = ({ 
  onLoadMore, 
  hasMore, 
  loading, 
  error, 
  className = '',
  threshold = 0.1,
  rootMargin = '100px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const loaderRef = useRef(null);
  const timeoutRef = useRef(null);

  // Debounced load more function
  const debouncedLoadMore = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (hasMore && !loading && !error) {
        console.log('🔄 Loading more posts...');
        onLoadMore();
      }
    }, 300); // 300ms debounce
  }, [hasMore, loading, error, onLoadMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(entry.isIntersecting);
        
        if (entry.isIntersecting && hasMore && !loading && !error) {
          debouncedLoadMore();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedLoadMore, hasMore, loading, error, threshold, rootMargin]);

  // Retry function for error handling
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onLoadMore();
  };

  // Don't render if no more content
  if (!hasMore && !loading && !error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 text-gray-500 dark:text-gray-400"
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            ✨
          </div>
          <p className="text-sm font-medium">Bạn đã xem hết tất cả bài viết</p>
          <p className="text-xs">Hãy quay lại sau để xem nội dung mới</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      ref={loaderRef}
      className={cn(
        'flex items-center justify-center py-8',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center space-y-3"
          >
            <div className="relative">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-blue-200 dark:border-blue-800 rounded-full animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Đang tải thêm bài viết...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Vui lòng đợi trong giây lát
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center space-y-4 max-w-sm mx-auto text-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Không thể tải thêm bài viết
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {error.message || 'Đã xảy ra lỗi khi tải dữ liệu'}
              </p>
              <button
                onClick={handleRetry}
                className={cn(
                  'inline-flex items-center space-x-2 px-4 py-2 rounded-lg',
                  'bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium',
                  'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                )}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại {retryCount > 0 && `(${retryCount})`}</span>
              </button>
            </div>
          </motion.div>
        )}

        {!loading && !error && hasMore && isVisible && (
          <motion.div
            key="load-trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center space-y-2"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cuộn để tải thêm
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LazyPostLoader;
