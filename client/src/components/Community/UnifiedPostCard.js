import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  ExternalLink,
  AlertTriangle,
  Eye,
  Share2,
  Bookmark,
  MoreHorizontal,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import VoteComponent from './VoteComponent';
import CommentsSection from './CommentsSection';
import CommentPreview from './CommentPreview';

const UnifiedPostCard = ({
  post,
  onVote,
  onSave,
  showComments,
  onToggleComments,
  onReport,
  layout = 'feed' // 'sidebar' or 'feed' - default to feed for better UX
}) => {
  const { isDarkMode } = useTheme();
  const [showFullComments, setShowFullComments] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Format time ago
  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  }, []);

  // Handle bookmark toggle
  const handleBookmark = useCallback(() => {
    setIsBookmarked(!isBookmarked);
    if (onSave) onSave(post.id);
  }, [isBookmarked, onSave, post.id]);

  // Handle share
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
        url: post.url || window.location.href
      });
    } else {
      setShowShareMenu(!showShareMenu);
    }
  }, [post, showShareMenu]);

  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
  };

  const getTrustScoreLabel = (score) => {
    if (score >= 80) return 'Đáng tin cậy';
    if (score >= 60) return 'Cần thận trọng';
    if (score >= 40) return 'Nghi ngờ';
    return 'Không đáng tin';
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case 'news': return '📰';
      case 'user_post': return '👤';
      default: return '📝';
    }
  };

  // Sidebar layout (original CommunityPage style)
  if (layout === 'sidebar') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Meta Info */}
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span className="font-medium">{getPostTypeIcon(post.type)} {post.source || 'Community'}</span>
                <span>•</span>
                <span>Đăng bởi {post.author?.name || post.userInfo?.name || 'Ẩn danh'}</span>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                {post.isVerified && (
                  <>
                    <span>•</span>
                    <span className="text-blue-500 font-medium">✓ Đã xác minh</span>
                  </>
                )}
              </div>

              {/* Title */}
              <h3 className={`text-lg font-semibold mb-3 hover:text-blue-600 cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {post.title || 'Untitled Post'}
              </h3>

              {/* Content */}
              {post.content && (
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 line-clamp-3`}>
                  {post.content}
                </p>
              )}

              {/* Trust Score */}
              {post.trustScore && (
                <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mb-3 ${getTrustScoreColor(post.trustScore)}`}>
                  {getTrustScoreLabel(post.trustScore)} ({post.trustScore}%)
                </div>
              )}
            </div>

            {/* Vote Component - Right side for sidebar layout */}
            <div className="ml-4">
              <VoteComponent linkId={post.id} postData={post} />
            </div>
          </div>

          {/* Image */}
          {(post.imageUrl || post.screenshot) && (
            <div className="mb-4">
              <img
                src={post.imageUrl || post.screenshot}
                alt={post.title}
                className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* URL Preview */}
          {post.url && (
            <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-blue-500">
              <ExternalLink size={14} className="text-blue-500 flex-shrink-0" />
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm truncate"
              >
                {post.url}
              </a>
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.slice(0, 5).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onToggleComments(post.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                  showComments
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <MessageCircle size={16} />
                <span>{post.commentCount || 0}</span>
              </button>

              <button className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
                <Share2 size={16} />
                <span>Chia sẻ</span>
              </button>

              <button 
                onClick={() => onSave(post.id)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              >
                <Bookmark size={16} />
                <span>Lưu</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Eye size={14} />
                <span>{post.viewCount || 0}</span>
              </div>
              
              <button 
                onClick={() => onReport && onReport(post.id)}
                className="text-red-500 hover:text-red-600"
              >
                <AlertTriangle size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Comment Preview - Only show when not showing full comments */}
        {!showFullComments && (
          <CommentPreview
            linkId={post.id}
            onToggleFullComments={() => setShowFullComments(true)}
          />
        )}

        {/* Full Comments Section */}
        <AnimatePresence>
          {showFullComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <CommentsSection
                postId={post.id}
                linkId={post.id}
                initialCommentCount={post.commentCount || 0}
                onClose={() => setShowFullComments(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Feed layout (Reddit-style with left voting)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden mb-3`}
    >
      <div className="flex">
        {/* Left Vote Section - Reddit Style */}
        <div className={`w-12 flex flex-col items-center py-3 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'} border-r border-gray-200 dark:border-gray-700`}>
          <VoteComponent linkId={post.id} postData={post} compact={true} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Post Header - Compact */}
          <div className="p-3 pb-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Meta Info */}
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span className="font-medium">{post.source || 'r/community'}</span>
                  <span>•</span>
                  <span>Posted by u/{post.author?.displayName || post.author?.name || 'anonymous'}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(post.createdAt)}</span>
                  {post.verified && (
                    <>
                      <span>•</span>
                      <Shield className="w-3 h-3 text-blue-500" />
                    </>
                  )}
                </div>

                {/* Title - Compact */}
                <h3 className={`text-base font-medium mb-2 leading-tight hover:text-blue-600 cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {post.title}
                </h3>
              </div>

              {/* More Options */}
              <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Post Content - Compact */}
          <div className="px-3 pb-2">
            {/* Content Preview */}
            {post.content && (
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 leading-relaxed line-clamp-3`}>
                {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
              </p>
            )}

            {/* Tags - Compact */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{post.tags.length - 3} more</span>
                )}
              </div>
            )}

            {/* Trust Score - Compact */}
            {post.trustScore && (
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium mb-2 ${getTrustScoreColor(post.trustScore)}`}>
                <TrendingUp className="w-3 h-3" />
                <span>{getTrustScoreLabel(post.trustScore)} ({post.trustScore}%)</span>
              </div>
            )}
          </div>

          {/* Images - Support multiple formats */}
          {(() => {
            // Check for different image field names
            const imageUrl = post.imageUrl || post.screenshot || post.image;
            const images = post.images || (imageUrl ? [imageUrl] : []);

            if (images.length > 0) {
              return (
                <div className="px-3 pb-2">
                  {images.length === 1 ? (
                    <img
                      src={images[0]}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded border border-gray-200 dark:border-gray-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {images.slice(0, 4).map((img, index) => (
                        <div key={index} className="relative">
                          <img
                            src={img}
                            alt={`${post.title} ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {images.length > 4 && index === 3 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                              <span className="text-white text-sm font-medium">+{images.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* URL Preview - Compact */}
          {post.url && (
            <div className="px-3 pb-2">
              <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-2 border-blue-500">
                <ExternalLink size={12} className="text-blue-500 flex-shrink-0" />
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-xs truncate font-medium"
                >
                  {post.url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}

          {/* Action Bar - Reddit Style */}
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <button
                onClick={() => onToggleComments && onToggleComments(post.id)}
                className={`flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  showComments ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                <MessageCircle size={14} />
                <span>{post.commentCount || 0} Comments</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Share2 size={14} />
                <span>Share</span>
              </button>

              <button
                onClick={handleBookmark}
                className={`flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isBookmarked ? 'text-yellow-600 dark:text-yellow-400' : ''
                }`}
              >
                <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} />
                <span>Save</span>
              </button>

              <div className="flex items-center space-x-1">
                <Eye size={14} />
                <span>{post.viewCount || 0}</span>
              </div>

              {onReport && (
                <button
                  onClick={() => onReport(post.id)}
                  className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  title="Report"
                >
                  <AlertTriangle size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Preview - Only show when not showing full comments */}
      {!showFullComments && (
        <CommentPreview
          linkId={post.id}
          onToggleFullComments={() => setShowFullComments(true)}
        />
      )}

      {/* Full Comments Section */}
      <AnimatePresence>
        {showFullComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <CommentsSection
              postId={post.id}
              linkId={post.id}
              initialCommentCount={post.commentCount || 0}
              onClose={() => setShowFullComments(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UnifiedPostCard;
