import React, { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Share2, 
  Eye, 
  ExternalLink,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Tag
} from 'lucide-react';

const PostCard = ({ post, onVote, onComment, onShare }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [imageError, setImageError] = useState({});

  // Calculate trust score color
  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get verification badge
  const getVerificationBadge = (verified, trustScore) => {
    if (verified && trustScore >= 90) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (trustScore >= 70) {
      return <Shield className="w-4 h-4 text-blue-600" />;
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  // Handle image error
  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const postDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return postDate.toLocaleDateString();
  };

  // Handle vote
  const handleVote = (voteType) => {
    if (onVote) {
      onVote(post.id, voteType);
    }
  };

  // Handle comment submit
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim() && onComment) {
      onComment(post.id, newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {post.author?.displayName || post.author?.email || 'Anonymous'}
                </h4>
                {getVerificationBadge(post.verified, post.trustScore)}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(post.createdAt)}</span>
                {post.source && (
                  <>
                    <span>•</span>
                    <span>{post.source}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Trust Score */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTrustScoreColor(post.trustScore)}`}>
            Trust: {post.trustScore}%
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
          {post.title || 'Untitled'}
        </h2>

        {/* Content */}
        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {post.content ? `${post.content.substring(0, 300)}${post.content.length > 300 ? '...' : ''}` : 'No content available'}
        </p>

        {/* Images - Support all image field variants */}
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

          return allImages.length > 0 && (
            <div className={`grid gap-2 mb-4 ${allImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {allImages.slice(0, 4).map((image, index) => (
                !imageError[`img-${index}`] && (
                  <div key={index} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                    <img
                      src={image}
                      alt={`Content ${index + 1}`}
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                      onError={() => handleImageError(`img-${index}`)}
                      onClick={() => window.open(image, '_blank')}
                    />
                    {allImages.length > 4 && index === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-semibold">+{allImages.length - 4} more</span>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          );
        })()}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
            {post.tags.length > 5 && (
              <span className="text-xs text-gray-500">+{post.tags.length - 5} more</span>
            )}
          </div>
        )}

        {/* External Link */}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            View Source
          </a>
        )}
      </div>

      {/* Vote Stats */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Vote Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVote('safe')}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm font-medium">{post.voteStats?.safe || 0}</span>
              </button>
              <button
                onClick={() => handleVote('unsafe')}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-sm font-medium">{post.voteStats?.unsafe || 0}</span>
              </button>
              <button
                onClick={() => handleVote('suspicious')}
                className="flex items-center space-x-1 px-3 py-1 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{post.voteStats?.suspicious || 0}</span>
              </button>
            </div>

            {/* Comments */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.commentCount || 0}</span>
            </button>

            {/* Views */}
            <div className="flex items-center space-x-1 text-gray-500">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{post.viewCount || 0}</span>
            </div>
          </div>

          {/* Share */}
          <button
            onClick={() => onShare && onShare(post)}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="2"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Sample Comments */}
          <div className="space-y-3">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">Tech Enthusiast</span>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    This is incredible! The implications for combating misinformation are huge.
                  </p>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <button className="text-xs text-gray-500 hover:text-gray-700">👍 15</button>
                  <button className="text-xs text-gray-500 hover:text-gray-700">👎 2</button>
                  <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
