import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageCircle,
  TrendingUp,
  Plus,
  Search,
  Share,
  Bookmark,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Eye,
  Clock
} from 'lucide-react';
import NavigationLayout from '../components/navigation/NavigationLayout';
import LazyPostLoader from '../components/Community/LazyPostLoader';
import PostSkeleton, { PostSkeletonGrid } from '../components/Community/PostSkeleton';
import { gsap } from '../utils/gsap';
import { useGSAP } from '../hooks/useGSAP';
import firestoreService from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useCommunityStats } from '../hooks/useFirestoreStats';

const CommunityPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  // Get community stats
  const communityStats = useCommunityStats();

  // GSAP refs
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const sidebarRef = useRef(null);
  const postsRef = useRef(null);
  const tabsRef = useRef(null);

  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Header animation
    gsap.fromTo(headerRef.current,
      { y: -50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );

    // Sidebar animation
    gsap.fromTo(sidebarRef.current,
      { x: -30, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power2.out" }
    );

    // Tab animation
    gsap.fromTo(tabsRef.current?.children || [],
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.3, ease: "power2.out" }
    );

  }, []);

  // Posts animation
  useGSAP(() => {
    if (!posts.length || loading) return;

    const postElements = postsRef.current?.children || [];
    gsap.fromTo(postElements,
      { y: 50, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.2
      }
    );
  }, [posts, loading]);
  // Fetch posts from Firestore
  const fetchPosts = async (refresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const sortBy = activeTab === 'trending' ? 'trending' :
                    activeTab === 'latest' ? 'newest' : 'newest';

      const options = {
        sortBy,
        limitCount: 10,
        lastDoc: refresh ? null : lastDoc
      };

      const result = await firestoreService.getCommunityPosts(options);

      if (refresh) {
        setPosts(result.posts);
      } else {
        setPosts(prev => [...prev, ...result.posts]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Không thể tải bài viết. Vui lòng thử lại.');
      setLoading(false);

      // Fallback to mock data if Firestore fails
      const mockPostsData = [
        {
          id: 'mock-1',
          title: 'Cảnh báo: Website lừa đảo giả mạo ngân hàng đang hoạt động',
          description: 'Vừa phát hiện website lừa đảo có domain tương tự ngân hàng VCB. Các bạn cần cẩn thận khi truy cập các trang web ngân hàng.',
          url: 'https://example-scam.com',
          userId: 'mock-user-1',
          userEmail: 'user1@example.com',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          voteCount: 23,
          commentCount: 8,
          status: 'active'
        },
        {
          id: 'mock-2',
          title: 'Chia sẻ cách nhận biết email phishing hiệu quả',
          description: 'Sau khi bị lừa một lần, mình đã học được cách nhận biết email lừa đảo. Chia sẻ với mọi người một số tip hữu ích.',
          url: 'https://example-phishing.com',
          userId: 'mock-user-2',
          userEmail: 'user2@example.com',
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
          voteCount: 41,
          commentCount: 15,
          status: 'active'
        }
      ];
      setPosts(mockPostsData);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps
  const handleVote = async (postId, type) => {
    if (!user) {
      alert('Vui lòng đăng nhập để vote');
      return;
    }

    // Additional validation for user ID
    const userId = user.uid || user.id;
    if (!userId) {
      console.error('User ID not found:', user);
      alert('Lỗi xác thực người dùng. Vui lòng đăng nhập lại.');
      return;
    }

    try {
      // Add GSAP animation for vote button
      const voteButton = document.querySelector(`[data-vote-${type}-${postId}]`);
      if (voteButton) {
        gsap.to(voteButton, {
          scale: 1.2,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: "power2.out"
        });
      }

      const voteType = type === 'up' ? 'safe' : 'unsafe';
      await firestoreService.submitVote(postId, voteType, userId, user.email);

      // Update local state optimistically
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const currentVoteCount = post.voteCount || 0;
          return {
            ...post,
            voteCount: type === 'up' ? currentVoteCount + 1 : Math.max(0, currentVoteCount - 1),
            userVoted: voteType
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error voting:', error);
      alert('Không thể vote. Vui lòng thử lại.');
    }
  };

  const handleSave = (postId) => {
    // Add GSAP animation for save button
    const saveButton = document.querySelector(`[data-save-${postId}]`);
    if (saveButton) {
      gsap.to(saveButton, {
        scale: 1.15,
        rotation: 360,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }

    setPosts(posts.map(post =>
      post.id === postId ? { ...post, saved: !post.saved } : post
    ));
  };

  // Enhanced tab switching with GSAP
  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;

    // Animate out current content
    gsap.to(postsRef.current?.children || [], {
      y: 20,
      opacity: 0,
      duration: 0.3,
      stagger: 0.05,
      ease: "power2.in",
      onComplete: () => {
        setActiveTab(tabId);
        // Animate in new content
        setTimeout(() => {
          gsap.fromTo(postsRef.current?.children || [],
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" }
          );
        }, 100);
      }
    });
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    return 'Vừa xong';
  };

  const tabs = [
    { id: 'trending', label: 'Thịnh hành', icon: TrendingUp },
    { id: 'latest', label: 'Mới nhất', icon: Clock },
    { id: 'discussions', label: 'Thảo luận', icon: MessageCircle }
  ];

  return (
    <NavigationLayout>
      <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div ref={headerRef} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Cộng đồng
                  </h1>
                </div>
                
                {/* Tabs */}
                <div ref={tabsRef} className="hidden md:flex space-x-1 ml-8">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Search */}
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white w-64 transition-all duration-300 focus:shadow-lg"
                  />
                </motion.div>

                {/* Create Post Button */}
                <motion.button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Tạo bài viết</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div ref={sidebarRef} className="lg:col-span-1">
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                whileHover={{ y: -5, shadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Thống kê cộng đồng
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Thành viên</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {communityStats.loading ? '...' : communityStats.totalMembers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bài viết</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {communityStats.loading ? '...' : communityStats.totalPosts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Đang online</span>
                    <span className="font-semibold text-green-600">
                      {communityStats.loading ? '...' : communityStats.onlineMembers}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Popular Tags */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Thẻ phổ biến
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['lừa đảo', 'phishing', 'bảo mật', 'ngân hàng', 'email'].map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts */}
            <div className="lg:col-span-3">
              {loading && posts.length === 0 ? (
                <PostSkeletonGrid count={3} />
              ) : (
                <div ref={postsRef} className="space-y-4">
                  <AnimatePresence>
                    {posts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                      >
                        {/* Post Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white">
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
                                <span>{formatTime(post.createdAt)}</span>
                                {post.url && (
                                  <>
                                    <span>•</span>
                                    <a
                                      href={post.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:text-blue-600 truncate max-w-32"
                                    >
                                      {new URL(post.url).hostname}
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
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {post.title}
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {post.description || post.content}
                          </p>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags && post.tags.map((tag) => (
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
                                onClick={() => handleVote(post.id, 'up')}
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
                                onClick={() => handleVote(post.id, 'down')}
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

                            {/* Comments */}
                            <button className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400">
                              <MessageCircle size={16} />
                              <span className="text-sm">{post.commentCount || 0}</span>
                            </button>

                            {/* Views */}
                            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                              <Eye size={16} />
                              <span className="text-sm">{post.views || 0}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <motion.button
                              data-save={post.id}
                              onClick={() => handleSave(post.id)}
                              className={`p-2 rounded-full transition-colors ${
                                post.saved
                                  ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Bookmark size={16} />
                            </motion.button>
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                              <Share size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Lazy Loading Component */}
                  <LazyPostLoader
                    onLoadMore={() => fetchPosts(false)}
                    hasMore={hasMore}
                    loading={loading && posts.length > 0}
                    error={error}
                    className="mt-6"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </NavigationLayout>
  );
};

export default CommunityPage;
