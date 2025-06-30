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
import { useResponsive, getSmartSpacing } from '../../utils/responsiveDesign';

const LinkDetailsCard = ({ link, className = '' }) => {
  const [imageError, setImageError] = useState({});
  const [showAllTags, setShowAllTags] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  
  // Enhanced responsive design system
  const { device, isMobile, isTablet, dimensions } = useResponsive();
  const spacing = getSmartSpacing(device);

  // Get responsive configuration
  const getResponsiveConfig = () => {
    if (isMobile) {
      return {
        imageGrid: 'grid-cols-2',
        imageHeight: 'h-24',
        spacing: 'space-y-3',
        padding: 'p-3',
        textSize: 'text-sm',
        titleSize: 'text-lg',
        iconSize: 16,
        maxTags: 3,
        maxImages: 4
      };
    } else if (isTablet) {
      return {
        imageGrid: 'grid-cols-3',
        imageHeight: 'h-28',
        spacing: 'space-y-4',
        padding: 'p-4',
        textSize: 'text-base',
        titleSize: 'text-xl',
        iconSize: 18,
        maxTags: 5,
        maxImages: 6
      };
    } else {
      return {
        imageGrid: 'grid-cols-3 lg:grid-cols-4',
        imageHeight: 'h-32',
        spacing: 'space-y-6',
        padding: 'p-6',
        textSize: 'text-base',
        titleSize: 'text-xl',
        iconSize: 20,
        maxTags: 10,
        maxImages: 8
      };
    }
  };

  const config = getResponsiveConfig();

  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isMobile) {
        return date.toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
      return date.toLocaleString('vi-VN', {
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
    const iconProps = { size: config.iconSize };
    switch (type) {
      case 'news': return <Globe {...iconProps} />;
      case 'user_post': return <User {...iconProps} />;
      default: return <LinkIcon {...iconProps} />;
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
    <Card className={`overflow-hidden ${spacing.card} ${className}`}>
      <CardHeader className={`${config.padding} pb-3`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-start justify-between'}`}>
          <div className="flex-1">
            <CardTitle className={`${config.titleSize} font-bold text-gray-900 dark:text-white mb-2 leading-tight`}>
              {link.title || 'Untitled Link'}
            </CardTitle>
            
            {/* Enhanced responsive type and category section */}
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center gap-2'} mb-3`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(link.type)}`}>
                  {getTypeIcon(link.type)}
                  <span className="ml-1 capitalize">{link.type || 'unknown'}</span>
                </span>
                
                {link.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    <Tag size={config.iconSize - 2} className="mr-1" />
                    {link.category}
                  </span>
                )}
                
                {link.verified && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle size={config.iconSize - 2} className="mr-1" />
                    {isMobile ? 'Verified' : 'Verified'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Responsive ID Badge */}
          <div className={`text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ${isMobile ? 'self-start' : ''}`}>
            ID: {link.id}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`${config.spacing} ${config.padding} pt-0`}>
        {/* Content */}
        {link.content && (
          <div>
            <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
              <MessageCircle size={config.iconSize} className="mr-2" />
              Content
            </h4>
            <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${config.textSize} ${isMobile ? 'line-clamp-3' : ''}`}>
              {link.content}
            </p>
          </div>
        )}

        {/* Enhanced responsive author information */}
        {link.author && (
          <div>
            <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
              <User size={config.iconSize} className="mr-2" />
              Author
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-3 gap-2'} text-sm`}>
                <div>
                  <span className="font-medium">Name:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-300 break-words">
                    {link.author.displayName || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-300 break-all">
                    {link.author.email || 'Unknown'}
                  </span>
                </div>
                {!isMobile && (
                  <div>
                    <span className="font-medium">UID:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-300 font-mono text-xs break-all">
                      {link.author.uid || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* External URL */}
        {link.url && (
          <div>
            <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
              <ExternalLink size={config.iconSize} className="mr-2" />
              External Link
            </h4>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 break-all ${config.textSize}`}
            >
              <span className="truncate">{link.url}</span>
              <ExternalLink size={config.iconSize - 2} className="ml-2 flex-shrink-0" />
            </a>
          </div>
        )}

        {/* Enhanced responsive images section */}
        {((link.images && link.images.length > 0) || link.imageUrl || link.screenshot || link.urlToImage || link.thumbnailUrl) && (
          <div>
            <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
              <ImageIcon size={config.iconSize} className="mr-2" />
              Images
            </h4>
            
            <div className={config.spacing}>
              {/* Main Images Array */}
              {link.images && link.images.length > 0 && (
                <div>
                  <h5 className={`text-sm font-medium text-gray-700 dark:text-gray-300 mb-2`}>
                    Gallery ({link.images.length})
                  </h5>
                  <div className={`grid gap-2 ${config.imageGrid}`}>
                    {(showAllImages ? link.images : link.images.slice(0, config.maxImages)).map((image, index) => (
                      !imageError[`gallery-${index}`] && (
                        <motion.div 
                          key={index} 
                          className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <img
                            src={image}
                            alt={`Gallery image ${index + 1}`}
                            className={`w-full ${config.imageHeight} object-cover hover:scale-105 transition-transform duration-200 cursor-pointer`}
                            onError={() => handleImageError(`gallery-${index}`)}
                            onClick={() => window.open(image, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity duration-200" />
                        </motion.div>
                      )
                    ))}
                  </div>
                  {link.images.length > config.maxImages && (
                    <button
                      onClick={() => setShowAllImages(!showAllImages)}
                      className={`text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mt-2 font-medium`}
                    >
                      {showAllImages ? 'Show less' : `Show ${link.images.length - config.maxImages} more images`}
                    </button>
                  )}
                </div>
              )}

              {/* Individual Image Fields - Responsive grid */}
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                {link.imageUrl && !imageError.imageUrl && (
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Image</h5>
                    <img
                      src={link.imageUrl}
                      alt="Main image"
                      className={`w-full ${config.imageHeight} object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer`}
                      onError={() => handleImageError('imageUrl')}
                      onClick={() => window.open(link.imageUrl, '_blank')}
                    />
                  </motion.div>
                )}

                {link.screenshot && !imageError.screenshot && (
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Camera size={config.iconSize - 2} className="mr-1" />
                      Screenshot
                    </h5>
                    <img
                      src={link.screenshot}
                      alt="Screenshot"
                      className={`w-full ${config.imageHeight} object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer`}
                      onError={() => handleImageError('screenshot')}
                      onClick={() => window.open(link.screenshot, '_blank')}
                    />
                  </motion.div>
                )}

                {link.urlToImage && !imageError.urlToImage && (
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Image</h5>
                    <img
                      src={link.urlToImage}
                      alt="URL image"
                      className={`w-full ${config.imageHeight} object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer`}
                      onError={() => handleImageError('urlToImage')}
                      onClick={() => window.open(link.urlToImage, '_blank')}
                    />
                  </motion.div>
                )}

                {link.thumbnailUrl && !imageError.thumbnailUrl && (
                  <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thumbnail</h5>
                    <img
                      src={link.thumbnailUrl}
                      alt="Thumbnail"
                      className={`w-full ${config.imageHeight} object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer`}
                      onError={() => handleImageError('thumbnailUrl')}
                      onClick={() => window.open(link.thumbnailUrl, '_blank')}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced responsive tags */}
        {link.tags && link.tags.length > 0 && (
          <div>
            <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
              <Tag size={config.iconSize} className="mr-2" />
              Tags ({link.tags.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {(showAllTags ? link.tags : link.tags.slice(0, config.maxTags)).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                </span>
              ))}
              {link.tags.length > config.maxTags && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium"
                >
                  {showAllTags ? 'Show less' : `+${link.tags.length - config.maxTags} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enhanced responsive vote statistics */}
        {link.voteStats && (
          <div>
            <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
              <Shield size={config.iconSize} className="mr-2" />
              Vote Statistics
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <ThumbsUp size={config.iconSize + 2} className="text-green-600" />
                  </div>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>
                    {link.voteStats.safe || 0}
                  </div>
                  <div className="text-xs text-gray-500">Safe</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <ThumbsDown size={config.iconSize + 2} className="text-red-600" />
                  </div>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-red-600`}>
                    {link.voteStats.unsafe || 0}
                  </div>
                  <div className="text-xs text-gray-500">Unsafe</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <AlertTriangle size={config.iconSize + 2} className="text-yellow-600" />
                  </div>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-yellow-600`}>
                    {link.voteStats.suspicious || 0}
                  </div>
                  <div className="text-xs text-gray-500">Suspicious</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Eye size={config.iconSize + 2} className="text-blue-600" />
                  </div>
                  <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>
                    {link.voteStats.total || 0}
                  </div>
                  <div className="text-xs text-gray-500">Total Votes</div>
                </div>
              </div>

              {/* Additional Vote Info */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} text-sm`}>
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

        {/* Enhanced responsive engagement stats */}
        <div>
          <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
            <MessageCircle size={config.iconSize} className="mr-2" />
            Engagement
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-3 gap-4'} text-sm`}>
              <div className="flex items-center">
                <MessageCircle size={config.iconSize} className="mr-2 text-gray-500" />
                <div>
                  <span className="font-medium">Comments:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">{link.commentCount || 0}</span>
                </div>
              </div>
              <div className="flex items-center">
                <Eye size={config.iconSize} className="mr-2 text-gray-500" />
                <div>
                  <span className="font-medium">Views:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-300">{link.viewCount || 0}</span>
                </div>
              </div>
              <div className={`flex items-center ${isMobile ? 'col-span-2' : ''}`}>
                <Shield size={config.iconSize} className="mr-2 text-gray-500" />
                <div>
                  <span className="font-medium">Verified:</span>
                  <span className="ml-2">
                    {link.verified ? (
                      <CheckCircle size={config.iconSize} className="text-green-600 inline" />
                    ) : (
                      <XCircle size={config.iconSize} className="text-red-600 inline" />
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced responsive timestamps */}
        <div>
          <h4 className={`font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
            <Clock size={config.iconSize} className="mr-2" />
            Timestamps
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'} text-sm`}>
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

        {/* Raw Data (for debugging) - Hidden on mobile by default */}
        <details className={`group ${isMobile ? 'hidden' : ''}`}>
          <summary className={`cursor-pointer font-semibold text-gray-900 dark:text-white mb-2 flex items-center ${config.textSize}`}>
            <span className="mr-2">🔍</span>
            Raw Data (Click to expand)
          </summary>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 overflow-auto max-h-96">
            <pre className={`text-xs font-mono whitespace-pre-wrap`}>
              {JSON.stringify(link, null, 2)}
            </pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default LinkDetailsCard;
