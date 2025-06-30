import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  ExternalLink,
  AlertTriangle,
  Eye,
  Share2,
  Bookmark,
  Shield,
  TrendingUp
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import SimpleVoteComponent from './SimpleVoteComponent';
import CommentSection from './CommentSection';
import CommentPreview from './CommentPreview';
import {
  useResponsive,
  getSmartImageLayout,
  getSmartSpacing
} from '../../utils/responsiveDesign';

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

  // Enhanced responsive design system
  const { device, isMobile } = useResponsive();
  const spacing = getSmartSpacing(device);

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
            </div>            {/* Vote Component - Right side for sidebar layout */}
            <div className="ml-4">
              <SimpleVoteComponent linkId={post.id} />
            </div>
          </div>          {/* Intelligent Image Layout - Facebook/Reddit Style */}
          {(() => {
            // Collect all available images from different fields
            const allImages = [];

            // Primary images array
            if (post.images && Array.isArray(post.images) && post.images.length > 0) {
              allImages.push(...post.images);
            }

            // Single image fields as fallback
            if (post.imageUrl && !allImages.includes(post.imageUrl)) {
              allImages.push(post.imageUrl);
            }
            if (post.screenshot && !allImages.includes(post.screenshot)) {
              allImages.push(post.screenshot);
            }
            if (post.urlToImage && !allImages.includes(post.urlToImage)) {
              allImages.push(post.urlToImage);
            }
            if (post.thumbnailUrl && !allImages.includes(post.thumbnailUrl)) {
              allImages.push(post.thumbnailUrl);
            }            // Enhanced Smart Image Layout (Reddit/Facebook style)
            if (allImages.length === 0) return null;

            const layout = getSmartImageLayout(allImages.length, device);
            const displayImages = allImages.slice(0, 4);            return (
              <div className="mb-4 relative">
                <div className={layout.container}>
                  {layout.layout === "single" && (
                    <div className="relative group overflow-hidden rounded-xl">
                      <img
                        src={displayImages[0]}
                        alt={post.title}
                        className={layout.imageClass}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onClick={() => window.open(displayImages[0], '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                          <ExternalLink size={16} className="text-gray-700" />
                        </div>
                      </div>
                    </div>
                  )}

                  {layout.layout === "dual" && displayImages.map((img, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-lg">
                      <img
                        src={img}
                        alt={`${post.title} ${index + 1}`}
                        className={layout.imageClass}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onClick={() => window.open(img, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  ))}

                  {layout.layout === "triple" && (
                    <>
                      {/* First image takes full left side */}
                      <div className="relative group overflow-hidden rounded-lg">
                        <img
                          src={displayImages[0]}
                          alt={`${post.title} 1`}
                          className={layout.imageClass.first}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          onClick={() => window.open(displayImages[0], '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>                      {/* Right side with 2 stacked images - responsive */}
                      <div className="grid grid-rows-2 gap-1 sm:gap-2">
                        {displayImages.slice(1, 3).map((img, index) => (
                          <div key={index + 1} className="relative group overflow-hidden rounded-lg">
                            <img
                              src={img}
                              alt={`${post.title} ${index + 2}`}
                              className={layout.imageClass.others}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                              onClick={() => window.open(img, '_blank')}
                              style={{ cursor: 'pointer' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {(layout.layout === "quad" || layout.layout === "multi") && displayImages.map((img, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-lg">
                      <img
                        src={img}
                        alt={`${post.title} ${index + 1}`}
                        className={typeof layout.imageClass === 'string' ? layout.imageClass : layout.imageClass.first}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onClick={() => window.open(img, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      
                      {/* Enhanced "+X more" overlay with better design */}
                      {allImages.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-lg group-hover:bg-black/80 transition-all duration-300">
                          <div className="text-center transform group-hover:scale-105 transition-transform duration-300">
                            <div className="text-white text-2xl font-bold mb-1">+{allImages.length - 4}</div>
                            <div className="text-white/90 text-sm font-medium">more photos</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Enhanced image count indicator with better styling */}
                {allImages.length > 1 && (
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1">
                      <span>📸</span>
                      <span>{allImages.length}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
                <span>{post.commentCount || post.commentsCount || 0} bình luận</span>
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
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Bình luận ({post.commentCount || post.commentsCount || 0})
                  </h3>
                  <button
                    onClick={() => setShowFullComments(false)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    Ẩn bình luận
                  </button>
                </div>
                <CommentSection
                  postId={post.id}
                  initialCommentCount={post.commentCount || 0}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }  // Enhanced Feed layout (Reddit-style with smart responsive design)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        border rounded-md shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
        ${spacing.card}`}
    >
      <div className="flex">
        {/* Left Vote Section - Smart responsive sizing */}        <div className={`${isMobile ? 'w-8' : 'w-10'} flex flex-col items-center ${spacing.element} ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'} border-r border-gray-200 dark:border-gray-700`}>
                        <SimpleVoteComponent linkId={post.id} />
        </div>

        {/* Main Content - Responsive */}
        <div className="flex-1 min-w-0">
          {/* Post Header - Responsive Reddit Style */}
          <div className="p-2 sm:p-3 pb-1 sm:pb-2">
            <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{post.source || 'r/community'}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Posted by</span>
              <span className="font-medium hover:underline cursor-pointer truncate">u/{post.author?.displayName || post.author?.name || 'anonymous'}</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs">{formatTimeAgo(post.createdAt)}</span>
              {post.verified && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <Shield className="w-3 h-3 text-blue-500 flex-shrink-0" />
                </>
              )}
            </div>            {/* Title - Responsive Reddit Style */}
            <h3 className={`text-sm sm:text-base font-medium mb-1 sm:mb-2 leading-tight hover:text-blue-600 cursor-pointer 
              ${isDarkMode ? 'text-white' : 'text-gray-900'} line-clamp-2`}>
              {post.title}
            </h3>
          </div>

          {/* Post Content - Responsive */}
          <div className="px-2 sm:px-3 pb-1 sm:pb-2">            {/* Content Preview - Adaptive length based on screen */}
            {post.content && (
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} 
                mb-2 leading-relaxed line-clamp-2 sm:line-clamp-3`}>
                {post.content.length > (isMobile ? 100 : 200) 
                  ? `${post.content.substring(0, isMobile ? 100 : 200)}...` 
                  : post.content}
              </p>
            )}

            {/* Tags - Responsive */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.tags.slice(0, isMobile ? 2 : 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-1.5 sm:px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > (isMobile ? 2 : 3) && (
                  <span className="text-xs text-gray-500">+{post.tags.length - (isMobile ? 2 : 3)}</span>
                )}
              </div>
            )}

            {/* Trust Score - Compact responsive */}
            {post.trustScore && (
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium mb-2 ${getTrustScoreColor(post.trustScore)}`}>
                <TrendingUp className="w-3 h-3" />
                <span className="hidden sm:inline">{getTrustScoreLabel(post.trustScore)} </span>
                <span>({post.trustScore}%)</span>
              </div>
            )}
          </div>{/* Intelligent Image Layout - Same as sidebar version */}
          {(() => {
            // Collect all available images from different fields
            const allImages = [];

            // Primary images array
            if (post.images && Array.isArray(post.images) && post.images.length > 0) {
              allImages.push(...post.images);
            }

            // Single image fields as fallback
            if (post.imageUrl && !allImages.includes(post.imageUrl)) {
              allImages.push(post.imageUrl);
            }
            if (post.screenshot && !allImages.includes(post.screenshot)) {
              allImages.push(post.screenshot);
            }
            if (post.urlToImage && !allImages.includes(post.urlToImage)) {
              allImages.push(post.urlToImage);
            }
            if (post.thumbnailUrl && !allImages.includes(post.thumbnailUrl)) {
              allImages.push(post.thumbnailUrl);
            }
            // Legacy support
            if (post.image && !allImages.includes(post.image)) {
              allImages.push(post.image);
            }

            // Enhanced Smart Image Layout for Feed (Reddit/Facebook style)
            if (allImages.length === 0) return null;

            const layout = getSmartImageLayout(allImages.length, device);
            const displayImages = allImages.slice(0, 4);

            return (
              <div className="px-3 pb-2 relative">
                <div className={layout.container}>
                  {layout.layout === "single" && (
                    <div className="relative group overflow-hidden rounded-lg">
                      <img
                        src={displayImages[0]}
                        alt={post.title}
                        className={layout.imageClass}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onClick={() => window.open(displayImages[0], '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  )}

                  {layout.layout === "dual" && displayImages.map((img, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-md">
                      <img
                        src={img}
                        alt={`${post.title} ${index + 1}`}
                        className={layout.imageClass}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onClick={() => window.open(img, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  ))}

                  {layout.layout === "triple" && (
                    <>
                      {/* First image takes full left side */}
                      <div className="relative group overflow-hidden rounded-md">
                        <img
                          src={displayImages[0]}
                          alt={`${post.title} 1`}
                          className={layout.imageClass.first}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                          onClick={() => window.open(displayImages[0], '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </div>
                      {/* Right side with 2 stacked images */}
                      <div className="grid grid-rows-2 gap-1.5">
                        {displayImages.slice(1, 3).map((img, index) => (
                          <div key={index + 1} className="relative group overflow-hidden rounded-md">
                            <img
                              src={img}
                              alt={`${post.title} ${index + 2}`}
                              className={layout.imageClass.others}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                              onClick={() => window.open(img, '_blank')}
                              style={{ cursor: 'pointer' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {layout.layout === "multi" && displayImages.map((img, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-md">
                      <img
                        src={img}
                        alt={`${post.title} ${index + 1}`}
                        className={layout.imageClass}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        onClick={() => window.open(img, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      
                      {/* Enhanced "+X more" overlay for feed layout */}
                      {allImages.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-md group-hover:bg-black/80 transition-all duration-300">
                          <div className="text-center transform group-hover:scale-105 transition-transform duration-300">
                            <div className="text-white text-lg font-bold">+{allImages.length - 4}</div>
                            <div className="text-white/90 text-xs font-medium">more</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Compact image count indicator for feed */}
                {allImages.length > 1 && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                      {allImages.length}
                    </div>
                  </div>
                )}
              </div>
            );
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
          )}          {/* Action Bar - Responsive Reddit Style */}
          <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <button
                  onClick={() => onToggleComments && onToggleComments(post.id)}
                  className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    showComments ? 'text-blue-600 dark:text-blue-400' : ''
                  }`}
                >
                  <MessageCircle size={12} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{post.commentCount || post.commentsCount || 0} Comments</span>
                  <span className="sm:hidden">{post.commentCount || post.commentsCount || 0}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share2 size={12} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  onClick={handleBookmark}
                  className={`flex items-center space-x-1 px-1.5 sm:px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isBookmarked ? 'text-yellow-600 dark:text-yellow-400' : ''
                  }`}
                >
                  <Bookmark size={12} className={`sm:w-4 sm:h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-1">
                  <Eye size={12} className="sm:w-4 sm:h-4" />
                  <span>{post.viewCount || 0}</span>
                </div>

                {onReport && (
                  <button
                    onClick={() => onReport(post.id)}
                    className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Report"
                  >
                    <AlertTriangle size={12} className="sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
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
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Bình luận ({post.commentCount || 0})
                </h3>
                <button
                  onClick={() => setShowFullComments(false)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Ẩn bình luận
                </button>
              </div>
              <CommentSection
                postId={post.id}
                initialCommentCount={post.commentCount || 0}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UnifiedPostCard;
