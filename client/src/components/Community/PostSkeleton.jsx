import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * PostSkeleton - Loading skeleton for community posts
 * Mimics the structure of actual posts for smooth loading experience
 */
const PostSkeleton = ({ className = '', variant = 'default' }) => {
  const skeletonVariants = {
    default: {
      showImage: true,
      showStats: true,
      showComments: true
    },
    compact: {
      showImage: false,
      showStats: true,
      showComments: false
    },
    minimal: {
      showImage: false,
      showStats: false,
      showComments: false
    }
  };

  const config = skeletonVariants[variant] || skeletonVariants.default;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start space-x-3 mb-4">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        
        <div className="flex-1 space-y-2">
          {/* Username */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
          {/* Timestamp */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
        </div>

        {/* Menu button */}
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
        </div>
      </div>

      {/* Image placeholder */}
      {config.showImage && (
        <div className="mb-4">
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-16" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-12" />
      </div>

      {/* Stats */}
      {config.showStats && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-6">
            {/* Vote buttons */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8" />
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>

            {/* Comment count */}
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12" />
            </div>

            {/* Share button */}
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Bookmark */}
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      )}

      {/* Comments preview */}
      {config.showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
          
          {/* Load more comments */}
          <div className="flex items-center space-x-2 pt-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * PostSkeletonGrid - Multiple post skeletons for initial loading
 */
export const PostSkeletonGrid = ({ count = 3, variant = 'default', className = '' }) => {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton 
          key={i} 
          variant={variant}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
};

export default PostSkeleton;
