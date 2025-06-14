import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCommunityData } from '../hooks/useCommunityData';
import {
  Plus,
  Search,
  Eye,
  MessageCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Settings,
  Grid,
  List,
  MoreHorizontal,
  Image,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoteComponent from '../components/Community/VoteComponent';
import CommentsSection from '../components/Community/CommentsSection';
import CommentPreview from '../components/Community/CommentPreview';
import ReportModal from '../components/Community/ReportModal';
import { useStaggerAnimation, useFadeIn } from '../hooks/useGSAP';
import PageLayout from '../components/layout/PageLayout';

const CommunityFeedPage = () => {
  const { isDarkMode } = useTheme();
  const { data: communityData, loading, fetchData } = useCommunityData();
  const [sortBy] = useState('trending');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showComments, setShowComments] = useState({});
  const [showReportModal, setShowReportModal] = useState(null);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [viewMode, setViewMode] = useState('card'); // card, list, compact
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showImages, setShowImages] = useState(true);

  // Refs for debouncing and stable references
  const searchTimeoutRef = useRef(null);
  const fetchDataRef = useRef(fetchData);
  const settingsMenuRef = useRef(null);

  // Update ref when fetchData changes
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu]);

  // Extract data from hook
  const articles = communityData.posts || [];

  // GSAP animations
  const headerRef = useFadeIn('fadeInUp', 0.2);
  const searchRef = useFadeIn('fadeInUp', 0.4);
  const filtersRef = useFadeIn('fadeInUp', 0.6);
  const articlesContainerRef = useStaggerAnimation('staggerFadeIn', !loading && articles.length > 0);
  const hasMore = communityData.pagination?.hasNext || false;

  // Fixed data fetching using ref to avoid dependency issues
  const loadData = useCallback((params) => {
    const finalParams = {
      sort: params.sort || sortBy,
      filter: params.filter || filterBy,
      search: params.search || searchQuery,
      page: params.page || 1
    };

    fetchDataRef.current(finalParams);
    setPage(finalParams.page);
  }, [sortBy, filterBy, searchQuery]);

  // Fixed effect with stable dependencies
  useEffect(() => {
    console.log('🔄 Parameters changed:', { sortBy, filterBy, searchQuery });

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search query exists, use debounced search
    if (searchQuery.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        const finalParams = {
          sort: sortBy,
          filter: filterBy,
          search: searchQuery.trim(),
          page: 1
        };
        fetchDataRef.current(finalParams);
        setPage(1);
        setIsSearching(false);
      }, 500); // Increased debounce time
    } else {
      // For filter/sort changes without search, fetch immediately
      const finalParams = {
        sort: sortBy,
        filter: filterBy,
        search: '',
        page: 1
      };
      fetchDataRef.current(finalParams);
      setPage(1);
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [sortBy, filterBy, searchQuery]);

  // Load more articles (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData({ page: page + 1 });
    }
  }, [loading, hasMore, page, loadData]);  // Manual refresh function
  const refreshData = useCallback(() => {
    console.log('🔄 Manually refreshing community data...');
    loadData({ page: 1 });
  }, [loadData]);

  // Removed auto-refresh interval for Facebook-like experience
  // Users can manually refresh using pull-to-refresh or refresh button

  // Listen for new submissions from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'newCommunitySubmission') {
        console.log('🆕 New submission detected, refreshing...');
        refreshData();
        // Clear the flag
        localStorage.removeItem('newCommunitySubmission');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing community data...');
      fetchDataRef.current({ page: 1 }); // Use fetchDataRef instead of refreshData
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]); // Remove refreshData dependency

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
                <span>Đăng bởi {article.author?.name || article.userInfo?.name || 'Ẩn danh'}</span>
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

              {/* Screenshot/Image */}
              {showImages && (article.imageUrl || article.screenshot) && (
                <div className="mb-3">
                  <img
                    src={article.imageUrl || article.screenshot}
                    alt={article.title}
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
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
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${
                showComments[article.id]
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <MessageCircle size={16} />
              <span>{showComments[article.id] ? 'Ẩn bình luận' : 'Xem tất cả'}</span>
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

      {/* Comment Preview - Always show */}
      <CommentPreview
        linkId={article.id}
        onToggleFullComments={() => {
          console.log('🔗 Article data for comments:', { id: article.id, title: article.title, url: article.url });
          toggleComments(article.id);
        }}
      />

      {/* Full Comments Section */}
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
    <PageLayout
      title="Cộng đồng FactCheck"
      subtitle="Cộng đồng kiểm tra và xác minh thông tin"
      maxWidth="6xl"
      padding="lg"
    >
        {/* Community Stats */}
        <div ref={headerRef} className="mb-6">          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 text-sm">
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">1.2k</span> thành viên
              </div>
              <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">234</span> đang online
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                disabled={loading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors text-sm font-medium ${
                  loading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                }`}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
              </button>

              {/* Settings Menu */}
              <div className="relative" ref={settingsMenuRef}>
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-full transition-colors text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                >
                  <Settings size={16} />
                  <span>Tùy chọn</span>
                </button>

                {/* Settings Dropdown */}
                <AnimatePresence>
                  {showSettingsMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <div className="p-4 space-y-4">
                        {/* View Mode */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Chế độ hiển thị
                          </label>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setViewMode('card')}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                viewMode === 'card'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              <Grid size={14} />
                              <span>Card</span>
                            </button>
                            <button
                              onClick={() => setViewMode('list')}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                viewMode === 'list'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              <List size={14} />
                              <span>List</span>
                            </button>
                          </div>
                        </div>

                        {/* Display Options */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tùy chọn hiển thị
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={showImages}
                              onChange={(e) => setShowImages(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Hiển thị hình ảnh</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={autoRefresh}
                              onChange={(e) => setAutoRefresh(e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Tự động làm mới</span>
                          </label>
                        </div>

                        {/* Quick Actions */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => {
                              // Clear cache and refresh
                              window.location.reload();
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <RotateCcw size={14} />
                            <span>Làm mới hoàn toàn</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => window.location.href = '/submit'}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                <span>Tạo bài viết</span>
              </button>
            </div>
          </div>        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div ref={filtersRef} className="flex items-center space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
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
        <div ref={articlesContainerRef} className="space-y-4">
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

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          linkId={showReportModal}
          onClose={() => setShowReportModal(null)}
        />
      )}
    </PageLayout>
  );
};

export default CommunityFeedPage;
