import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  Share,
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  Clock,
  Eye
} from 'lucide-react';
import { gsap } from '../../utils/gsap';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import CommentSection from './CommentSection.jsx';
import CommentPreview from './CommentPreview';

const LazyPostCard = ({ 
  post, 
  onVote, 
  onSave, 
  onComment,
  showComments = false,
  onToggleComments 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  // Intersection observer for lazy loading
  useIntersectionObserver(cardRef, {
    threshold: 0.1,
    onIntersect: () => setIsVisible(true)
  });

  const formatTime = useCallback((date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    return 'Vừa xong';
  }, []);

  const handleVote = useCallback((type) => {
    // GSAP animation for vote button
    const voteButton = document.querySelector(`[data-vote-${type}="${post.id}"]`);
    if (voteButton) {
      gsap.to(voteButton, {
        scale: 1.2,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });
    }
    onVote(post.id, type);
  }, [post.id, onVote]);

  const handleSave = useCallback(() => {
    // GSAP animation for save button
    const saveButton = document.querySelector(`[data-save="${post.id}"]`);
    if (saveButton) {
      gsap.to(saveButton, {
        scale: 1.15,
        rotation: 360,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
    onSave(post.id);
  }, [post.id, onSave]);

  if (!isVisible) {
    return (
      <div 
        ref={cardRef}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-48 animate-pulse"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300"
      whileHover={{ y: -2 }}
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
            {post.userEmail ? post.userEmail.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {post.userEmail || 'Người dùng ẩn danh'}
              </h4>
              {post.verified && (
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatTime(post.createdAt)}</span>
              {post.url && (
                <>
                  <span>•</span>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 truncate max-w-32 flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{new URL(post.url).hostname}</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <MoreHorizontal size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
          {post.description || post.content}
        </p>
      </div>

      {/* Post Image */}
      {(post.imageUrl || post.screenshot) && (
        <div className="mb-4">
          <img
            src={post.imageUrl || post.screenshot}
            alt={post.title}
            className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            onClick={() => {
              // Open image in new tab
              window.open(post.imageUrl || post.screenshot, '_blank');
            }}
          />
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags?.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs rounded-full"
          >
            #{tag}
          </span>
        ))}
        {post.status && (
          <span className={`px-2 py-1 text-xs rounded-full ${
            post.status === 'active'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
          }`}>
            {post.status === 'active' ? 'Đang hoạt động' : post.status}
          </span>
        )}
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          {/* Vote */}
          <div className="flex items-center space-x-2">
            <motion.button
              data-vote-up={post.id}
              onClick={() => handleVote('up')}
              className={`p-2 rounded-full transition-colors ${
                post.upvoted
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronUp size={16} />
            </motion.button>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {post.voteCount || 0}
            </span>
            <motion.button
              data-vote-down={post.id}
              onClick={() => handleVote('down')}
              className={`p-2 rounded-full transition-colors ${
                post.downvoted
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronDown size={16} />
            </motion.button>
          </div>



          {/* Views */}
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
            <Eye size={16} />
            <span className="text-sm">{post.viewCount || 0}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Save */}
          <motion.button
            data-save={post.id}
            onClick={handleSave}
            className={`p-2 rounded-full transition-colors ${
              post.saved
                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bookmark size={16} />
          </motion.button>

          {/* Share */}
          <motion.button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Share size={16} />
          </motion.button>
        </div>
      </div>

      {/* Comments Preview - Always show */}
      <CommentPreview
        linkId={post.id}
        onToggleFullComments={() => onToggleComments(post.id)}
      />

      {/* Full Comments Section */}
      {showComments && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <CommentSection
            postId={post.id}
            initialCommentCount={post.commentCount || 0}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default LazyPostCard;
