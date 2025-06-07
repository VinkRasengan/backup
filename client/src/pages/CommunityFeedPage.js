import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCommunityData } from '../hooks/useCommunityData';
import {
  TrendingUp,
  Clock,
  Filter,
  Plus,
  Search,
  Eye,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  ExternalLink,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import VoteComponent from '../components/Community/VoteComponent';
import CommentsSection from '../components/Community/CommentsSection';
import ReportModal from '../components/Community/ReportModal';

const CommunityFeedPage = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { data: communityData, loading, error, fetchData, getCacheStats } = useCommunityData();

  const [sortBy, setSortBy] = useState('trending');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showComments, setShowComments] = useState({});
  const [showReportModal, setShowReportModal] = useState(null);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Refs for debouncing
  const searchTimeoutRef = useRef(null);

  // Extract data from hook
  const articles = communityData.posts || [];
  const hasMore = communityData.pagination?.hasNext || false;

  // Smart data fetching with caching
  const loadData = useCallback((params) => {
    const finalParams = {
      sort: params.sort || sortBy,
      filter: params.filter || filterBy,
      search: params.search || searchQuery,
      page: params.page || 1
    };

    fetchData(finalParams);
    setPage(finalParams.page);
  }, [fetchData, sortBy, filterBy, searchQuery]);

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      loadData({ search: query, page: 1 });
      setIsSearching(false);
    }, 300);
  }, [loadData]);

  // Effect for immediate filter/sort changes (no debounce)
  useEffect(() => {
    console.log('🔄 Filter/Sort changed:', { sortBy, filterBy });
    loadData({ page: 1 });
  }, [sortBy, filterBy, loadData]);

  // Effect for search query changes (with debounce)
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else if (searchQuery === '') {
      loadData({ search: '', page: 1 });
    }
  }, [searchQuery, debouncedSearch, loadData]);

  // Load more articles (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData({ page: page + 1 });
    }
  }, [loading, hasMore, page, loadData]);

  const toggleComments = (articleId) => {
    setShowComments(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

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

  const ArticleCard = ({ article }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        border rounded-lg mb-2 hover:shadow-md transition-all duration-200 overflow-hidden`}
    >
      <div className="flex">
        {/* Vote Section - Left Side */}
        <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 min-w-[80px]">
          <VoteComponent linkId={article.id} postData={article} />
        </div>

        {/* Content Section - Right Side */}
        <div className="flex-1 p-4">
          {/* Article Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {/* Meta Info */}
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span className="font-medium">{getPostTypeIcon(article.type)} {article.source}</span>
                <span>•</span>
                <span>Đăng bởi {article.author?.name}</span>
                <span>•</span>
                <span>{new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                {article.isVerified && (
                  <>
                    <span>•</span>
                    <span className="text-blue-500 font-medium">✓ Đã xác minh</span>
                  </>
                )}
                {article.trustScore && (
                  <>
                    <span>•</span>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTrustScoreColor(article.trustScore)}`}>
                      {getTrustScoreLabel(article.trustScore)} ({article.trustScore}%)
                    </div>
                  </>
                )}
              </div>

              {/* Title */}
              <h3 className={`text-lg font-medium mb-2 hover:text-blue-600 cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {article.title || 'Untitled Article'}
              </h3>

              {/* Content */}
              {article.content && (
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3 line-clamp-3`}>
                  {article.content}
                </p>
              )}

              {/* URL Preview */}
              {article.url && (
                <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded border-l-4 border-blue-500">
                  <ExternalLink size={14} className="text-blue-500 flex-shrink-0" />
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 text-sm truncate"
                  >
                    {article.url}
                  </a>
                </div>
              )}

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.tags.slice(0, 5).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-4 text-sm">
            <button
              onClick={() => toggleComments(article.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors
                ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <MessageCircle size={16} />
              <span>{article.commentsCount || 0} bình luận</span>
            </button>

            <button
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors
                ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <span>Chia sẻ</span>
            </button>

            <button
              onClick={() => setShowReportModal(article.id)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
            >
              <AlertTriangle size={16} />
              <span>Báo cáo</span>
            </button>

            <div className="flex items-center space-x-1 text-gray-400">
              <Eye size={14} />
              <span>{article.viewCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments[article.id] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 border-t pt-4"
          >
            <CommentsSection linkId={article.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Community Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                r/factcheck
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Cộng đồng kiểm tra và xác minh thông tin
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">1.2k</span> thành viên
              </div>
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">234</span> đang online
              </div>
            </div>

            <button
              onClick={() => window.location.href = '/submit'}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              <span>Tạo bài viết</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          {[
            { value: 'all', label: 'Tất cả', icon: '📋' },
            { value: 'health', label: 'Sức khỏe', icon: '🏥' },
            { value: 'security', label: 'Bảo mật', icon: '🔒' },
            { value: 'technology', label: 'Công nghệ', icon: '💻' },
            { value: 'news', label: 'Tin tức', icon: '📰' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterBy(filter.value)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filterBy === filter.value
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Articles Feed */}
        <div className="space-y-4">
          {loading && articles.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className={`mt-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Đang tải bài viết...
              </p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!
              </p>
            </div>
          ) : (
            articles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && articles.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Đang tải...' : 'Tải thêm'}
            </button>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          linkId={showReportModal}
          onClose={() => setShowReportModal(null)}
        />
      )}
    </div>
  );
};

export default CommunityFeedPage;
