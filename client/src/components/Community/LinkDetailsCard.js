import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  User, 
  Calendar, 
  Tag, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle, 
  MessageCircle, 
  Eye, 
  Shield, 
  Globe,
  Image as ImageIcon,
  Camera,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const LinkDetailsCard = ({ link, className = '' }) => {
  const [imageError, setImageError] = useState({});
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);

  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'news': return <Globe className="w-4 h-4" />;
      case 'user_post': return <User className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'user_post': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {link.title || 'Untitled Link'}
            </CardTitle>
            
            {/* Type and Category */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(link.type)}`}>
                {getTypeIcon(link.type)}
                <span className="ml-1 capitalize">{link.type || 'unknown'}</span>
              </span>
              
              {link.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <Tag className="w-3 h-3 mr-1" />
                  {link.category}
                </span>
              )}
              
              {link.verified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
            </div>
          </div>
          
          {/* ID Badge */}
          <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            ID: {link.id}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Content */}
        {link.content && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" />
              Content
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {link.content}
            </p>
          </div>
        )}

        {/* Author Information */}
        {link.author && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Author
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="font-medium">Name:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">
                    {link.author.displayName || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">
                    {link.author.email || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">UID:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-300 font-mono text-xs">
                    {link.author.uid || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* External URL */}
        {link.url && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <ExternalLink className="w-4 h-4 mr-2" />
              External Link
            </h4>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all"
            >
              {link.url}
              <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Images Section */}
        {((link.images && link.images.length > 0) || link.imageUrl || link.screenshot || link.urlToImage || link.thumbnailUrl) && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <ImageIcon className="w-4 h-4 mr-2" />
              Images
            </h4>
            
            <div className="space-y-4">
              {/* Main Images Array */}
              {link.images && link.images.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gallery ({link.images.length})</h5>
                  <div className={`grid gap-2 ${link.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                    {(showAllImages ? link.images : link.images.slice(0, 6)).map((image, index) => (
                      !imageError[`gallery-${index}`] && (
                        <div key={index} className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                          <img
                            src={image}
                            alt={`Gallery image ${index + 1}`}
                            className="w-full h-32 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                            onError={() => handleImageError(`gallery-${index}`)}
                            onClick={() => window.open(image, '_blank')}
                          />
                        </div>
                      )
                    ))}
                  </div>
                  {link.images.length > 6 && (
                    <button
                      onClick={() => setShowAllImages(!showAllImages)}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mt-2"
                    >
                      {showAllImages ? 'Show less' : `Show ${link.images.length - 6} more images`}
                    </button>
                  )}
                </div>
              )}

              {/* Individual Image Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {link.imageUrl && !imageError.imageUrl && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Image</h5>
                    <img
                      src={link.imageUrl}
                      alt="Main image"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                      onError={() => handleImageError('imageUrl')}
                      onClick={() => window.open(link.imageUrl, '_blank')}
                    />
                  </div>
                )}

                {link.screenshot && !imageError.screenshot && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Camera className="w-3 h-3 mr-1" />
                      Screenshot
                    </h5>
                    <img
                      src={link.screenshot}
                      alt="Screenshot"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                      onError={() => handleImageError('screenshot')}
                      onClick={() => window.open(link.screenshot, '_blank')}
                    />
                  </div>
                )}

                {link.urlToImage && !imageError.urlToImage && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Image</h5>
                    <img
                      src={link.urlToImage}
                      alt="URL image"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                      onError={() => handleImageError('urlToImage')}
                      onClick={() => window.open(link.urlToImage, '_blank')}
                    />
                  </div>
                )}

                {link.thumbnailUrl && !imageError.thumbnailUrl && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thumbnail</h5>
                    <img
                      src={link.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                      onError={() => handleImageError('thumbnailUrl')}
                      onClick={() => window.open(link.thumbnailUrl, '_blank')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {link.tags && link.tags.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Tags ({link.tags.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {(showAllTags ? link.tags : link.tags.slice(0, 10)).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                </span>
              ))}
              {link.tags.length > 10 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {showAllTags ? 'Show less' : `+${link.tags.length - 10} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Vote Statistics */}
        {link.voteStats && (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Vote Statistics
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <ThumbsUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{link.voteStats.safe || 0}</div>
                  <div className="text-xs text-gray-500">Safe</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">{link.voteStats.unsafe || 0}</div>
                  <div className="text-xs text-gray-500">Unsafe</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{link.voteStats.suspicious || 0}</div>
                  <div className="text-xs text-gray-500">Suspicious</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{link.voteStats.total || 0}</div>
                  <div className="text-xs text-gray-500">Total Votes</div>
                </div>
              </div>

              {/* Additional Vote Info */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Vote Score:</span>
                    <span className={`ml-2 font-bold ${link.voteScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {link.voteScore || 0}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Vote Count:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">{link.voteCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Stats */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            Engagement
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Comments:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-300">{link.commentCount || 0}</span>
              </div>
              <div>
                <span className="font-medium">Views:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-300">{link.viewCount || 0}</span>
              </div>
              <div>
                <span className="font-medium">Verified:</span>
                <span className="ml-2">
                  {link.verified ? (
                    <CheckCircle className="w-4 h-4 text-green-600 inline" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 inline" />
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Timestamps
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Created:</span>
                <div className="text-gray-600 dark:text-gray-300 mt-1">
                  {formatDate(link.createdAt)}
                </div>
              </div>
              <div>
                <span className="font-medium">Updated:</span>
                <div className="text-gray-600 dark:text-gray-300 mt-1">
                  {formatDate(link.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Raw Data (for debugging) */}
        <details className="group">
          <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
            <span className="mr-2">🔍</span>
            Raw Data (Click to expand)
          </summary>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto max-h-96">
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {JSON.stringify(link, null, 2)}
            </pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default LinkDetailsCard;
