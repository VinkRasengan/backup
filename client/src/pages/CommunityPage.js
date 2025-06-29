import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useCommunityData } from '../hooks/useCommunityData';
import {
  Search,
  Plus,
  RefreshCw,
  Filter,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import ReportModal from '../components/Community/ReportModal';
import RequestMonitor from '../components/Community/RequestMonitor';
import UnifiedPostCard from '../components/Community/UnifiedPostCard';
import { useBatchVotes } from '../hooks/useBatchVotes';
import { useStaggerAnimation, useFadeIn } from '../hooks/useGSAP';
import PageLayout from '../components/layout/PageLayout';
import { communityAPI } from '../services/api';
import toast from 'react-hot-toast';

const CommunityPage = () => {
  const { isDarkMode } = useTheme();
  const { data: communityData, loading, fetchData, dataManager } = useCommunityData();
  const [sortBy, setSortBy] = useState('trending');
  const [filterBy, setFilterBy] = useState('all');
  const [voteFilter, setVoteFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [showComments, setShowComments] = useState({});
  const [showReportModal, setShowReportModal] = useState(null);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [showImages] = useState(true);

  // Batch votes optimization
  const { preloadVotes } = useBatchVotes();
  const [showRequestMonitor, setShowRequestMonitor] = useState(false);

  // Refs for debouncing and stable references
  const searchTimeoutRef = useRef(null);
  const fetchDataRef = useRef(fetchData);
  const settingsMenuRef = useRef(null);
  const filtersMenuRef = useRef(null);

  // Handler functions for LinkCard interactions
  const handleVote = async (linkId, voteType) => {
    try {
      // Get user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.uid && !user.id) {
        toast.error('Vui lòng đăng nhập để vote');
        throw new Error('User not authenticated');
      }

      console.log('🗳️ Submitting vote:', { linkId, voteType, userId: user.uid || user.id });

      // Use API service instead of direct fetch
      const response = await communityAPI.submitVote(
        linkId,
        voteType,
        user.uid || user.id,
        user.email
      );

      if (response.success) {
        // Vote successful - return success for VoteComponent sync
        console.log('✅ Vote submitted successfully:', response);
        toast.success(`Vote ${response.action || 'submitted'} successfully!`);
        return response; // Return response for VoteComponent
      } else {
        console.error('❌ Vote failed:', response.error);
        toast.error('Failed to vote: ' + (response.error || 'Unknown error'));
        throw new Error(response.error || 'Vote failed');
      }
    } catch (error) {
      console.error('❌ Error voting:', error);
      toast.error('Error voting: ' + error.message);
      throw error; // Propagate error to VoteComponent
    }
  };

  // Toggle comments section
  const handleToggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Share function
  const handleShare = (post) => {
    try {
      if (navigator.share) {
        navigator.share({
          title: post.title,
          text: post.content?.substring(0, 100) + '...',
          url: post.url || window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(post.url || window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('❌ Error sharing:', error);
      toast.error('Error sharing');
    }
  };

  // Update ref when fetchData changes
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
      if (filtersMenuRef.current && !filtersMenuRef.current.contains(event.target)) {
        setShowFiltersMenu(false);
      }
    };

    if (showSettingsMenu || showFiltersMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettingsMenu, showFiltersMenu]);

  // Extract data from hook using useMemo to prevent unnecessary re-renders
  const articles = useMemo(() => communityData.posts || [], [communityData.posts]);

  // Preload votes for visible articles
  useEffect(() => {
    if (articles.length > 0) {
      const postIds = articles.map(article => article.id).filter(Boolean);
      if (postIds.length > 0) {
        console.log('🚀 Preloading votes for', postIds.length, 'posts');
        preloadVotes(postIds);
      }
    }
  }, [articles, preloadVotes]);

  // GSAP animations
  const headerRef = useFadeIn('fadeInUp', 0.2);
  const searchRef = useFadeIn('fadeInUp', 0.4);
  const filtersRef = useFadeIn('fadeInUp', 0.6);
  const articlesContainerRef = useStaggerAnimation('staggerFadeIn', !loading && articles.length > 0);
  const hasMore = communityData.pagination?.hasNext || false;

  // Enhanced data fetching with all filter types
  const loadData = useCallback((params) => {
    const finalParams = {
      sort: params.sort || sortBy,
      filter: params.filter || filterBy,
      voteFilter: params.voteFilter || voteFilter,
      timeFilter: params.timeFilter || timeFilter,
      sourceFilter: params.sourceFilter || sourceFilter,
      search: params.search || searchQuery,
      page: params.page || 1,
      newsOnly: false,
      includeNews: true,
      userPostsOnly: false
    };

    fetchDataRef.current(finalParams);
    setPage(finalParams.page);
  }, [sortBy, filterBy, voteFilter, timeFilter, sourceFilter, searchQuery]);

  // Enhanced effect with all filter dependencies
  useEffect(() => {
    console.log('🔄 Parameters changed:', { sortBy, filterBy, voteFilter, timeFilter, sourceFilter, searchQuery });

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
          voteFilter: voteFilter,
          timeFilter: timeFilter,
          sourceFilter: sourceFilter,
          search: searchQuery.trim(),
          page: 1,
          newsOnly: false,
          includeNews: true,
          userPostsOnly: false
        };
        fetchDataRef.current(finalParams);
        setPage(1);
        setIsSearching(false);
      }, 500);
    } else {
      // For filter/sort changes without search, fetch immediately
      const finalParams = {
        sort: sortBy,
        filter: filterBy,
        voteFilter: voteFilter,
        timeFilter: timeFilter,
        sourceFilter: sourceFilter,
        search: '',
        page: 1,
        newsOnly: false,
        includeNews: true,
        userPostsOnly: false
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
  }, [sortBy, filterBy, voteFilter, timeFilter, sourceFilter, searchQuery]);

  // Load more articles (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData({ page: page + 1 });
    }
  }, [loading, hasMore, page, loadData]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    console.log('🔄 Manually refreshing community data...');
    loadData({ page: 1 });
  }, [loadData]);

  // Listen for new submissions from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'newCommunitySubmission') {
        console.log('🆕 New submission detected, refreshing...');
        refreshData();
        localStorage.removeItem('newCommunitySubmission');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshData]);

  return (
    <PageLayout
      title="Cộng đồng FactCheck"
      subtitle="Tin tức và thảo luận từ cộng đồng kiểm chứng thông tin"
      maxWidth="6xl"
      padding="lg"
    >
      {/* Community Stats */}
      <div ref={headerRef} className="mb-6">
        <div className="flex items-center justify-between">
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

            <button
              onClick={() => window.location.href = '/submit'}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              <span>Tạo bài viết</span>
            </button>
          </div>
        </div>
      </div>

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

      {/* Enhanced Sort and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Sort and Advanced Filter Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Sort Dropdown */}
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Sắp xếp:
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`appearance-none border rounded-lg px-3 py-2 pr-8 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                style={{
                  colorScheme: isDarkMode ? 'dark' : 'light'
                }}
              >
                <option 
                  value="trending"
                  className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
                >
                  🔥 Trending
                </option>
                <option 
                  value="newest"
                  className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
                >
                  🆕 Mới nhất
                </option>
                <option 
                  value="oldest"
                  className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
                >
                  📅 Cũ nhất
                </option>
                <option 
                  value="most_voted"
                  className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
                >
                  👍 Nhiều vote nhất
                </option>
                <option 
                  value="most_commented"
                  className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
                >
                  💬 Nhiều bình luận
                </option>
                <option 
                  value="controversial"
                  className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}
                >
                  ⚡ Gây tranh cãi
                </option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>
          </div>

          {/* Advanced Filters Button */}
          <div className="flex items-center space-x-3">
            <div className="relative" ref={filtersMenuRef}>
              <button
                onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium ${
                  (voteFilter !== 'all' || timeFilter !== 'all' || sourceFilter !== 'all')
                    ? 'border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-400/50'
                    : isDarkMode 
                      ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} />
                <span>Bộ lọc nâng cao</span>
                {(voteFilter !== 'all' || timeFilter !== 'all' || sourceFilter !== 'all') && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-600 text-white rounded-full">
                    {[voteFilter, timeFilter, sourceFilter].filter(f => f !== 'all').length}
                  </span>
                )}
                <ChevronDown size={14} />
              </button>

              {/* Advanced Filters Dropdown */}
              <AnimatePresence>
                {showFiltersMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                  >
                    <div className="p-4 space-y-4">
                      {/* Vote-based Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          🗳️ Lọc theo vote
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'all', label: 'Tất cả', icon: '📋' },
                            { value: 'safe', label: 'Đáng tin', icon: '✅' },
                            { value: 'unsafe', label: 'Không tin', icon: '❌' },
                            { value: 'suspicious', label: 'Nghi ngờ', icon: '⚠️' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setVoteFilter(option.value)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                                voteFilter === option.value
                                  ? 'bg-blue-50/70 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                  : 'bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          ⏰ Lọc theo thời gian
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'all', label: 'Tất cả', icon: '📅' },
                            { value: 'today', label: 'Hôm nay', icon: '🌅' },
                            { value: 'week', label: 'Tuần này', icon: '📆' },
                            { value: 'month', label: 'Tháng này', icon: '🗓️' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setTimeFilter(option.value)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                                timeFilter === option.value
                                  ? 'bg-blue-50/70 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                  : 'bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Source Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          📰 Lọc theo nguồn
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'all', label: 'Tất cả', icon: '🌐' },
                            { value: 'verified', label: 'Đã xác minh', icon: '✅' },
                            { value: 'user_posts', label: 'Bài user', icon: '👤' },
                            { value: 'news_only', label: 'Chỉ tin tức', icon: '📰' }
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSourceFilter(option.value)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                                sourceFilter === option.value
                                  ? 'bg-blue-50/70 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                  : 'bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={() => {
                            setVoteFilter('all');
                            setTimeFilter('all');
                            setSourceFilter('all');
                            setShowFiltersMenu(false);
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <RotateCcw size={14} />
                          <span>Xóa tất cả bộ lọc</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick filter indicators */}
            <div className="flex items-center space-x-2">
              {voteFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-50/70 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  Vote: {voteFilter}
                  <button
                    onClick={() => setVoteFilter('all')}
                    className="ml-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  >
                    ×
                  </button>
                </span>
              )}
              {timeFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50/70 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  Time: {timeFilter}
                  <button
                    onClick={() => setTimeFilter('all')}
                    className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    ×
                  </button>
                </span>
              )}
              {sourceFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-50/70 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                  Source: {sourceFilter}
                  <button
                    onClick={() => setSourceFilter('all')}
                    className="ml-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
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
            <UnifiedPostCard 
              key={article.id} 
              post={article}
              onVote={handleVote}
              onToggleComments={handleToggleComments}
              onShare={handleShare}
              showImages={showImages}
              layout="feed"
            />
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

      {/* Request Monitor */}
      <RequestMonitor
        dataManager={dataManager}
        isVisible={showRequestMonitor}
        onClose={() => setShowRequestMonitor(false)}
      />
    </PageLayout>
  );
};

export default CommunityPage; 