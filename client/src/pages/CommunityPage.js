import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Plus,
  Search,
  Clock,
  MessageCircle
} from 'lucide-react';
import NavigationLayout from '../components/navigation/NavigationLayout';
import LazyPostCard from '../components/Community/LazyPostCard';
import { PostSkeletonGrid } from '../components/Community/PostSkeleton';
import { gsap } from '../utils/gsap';
import { useGSAP } from '../hooks/useGSAP';
import firestoreService from '../services/firestoreService';
import communityCache from '../services/communityCache';
import { useAuth } from '../context/AuthContext';
import { useCommunityStats } from '../hooks/useFirestoreStats';

const CommunityPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [showComments, setShowComments] = useState({});

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
  // Fetch posts from Firestore with caching
  const fetchPosts = async (refresh = false) => {
    try {
      setLoading(true);

      const sortBy = activeTab === 'trending' ? 'trending' : 'newest';

      const options = {
        sortBy,
        limitCount: 10,
        lastDoc: refresh ? null : lastDoc,
        refresh
      };

      // Use cached data for better performance
      const result = await communityCache.getCachedPosts(firestoreService, options);

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
          status: 'active',
          tags: ['lừa đảo', 'ngân hàng']
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
          status: 'active',
          tags: ['phishing', 'email', 'bảo mật']
        },
        {
          id: 'mock-3',
          title: 'Trang web giả mạo Shopee đang lừa đảo người dùng',
          description: 'Phát hiện trang web có giao diện giống hệt Shopee nhưng domain khác. Đã có nhiều người bị lừa mất tiền.',
          url: 'https://fake-shopee.com',
          userId: 'mock-user-3',
          userEmail: 'user3@example.com',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          voteCount: 67,
          commentCount: 23,
          status: 'active',
          tags: ['shopee', 'lừa đảo', 'thương mại điện tử']
        }
      ];
      setPosts(mockPostsData);
      setHasMore(false);
    }
  };

  useEffect(() => {
    // Debounce tab changes to prevent rapid API calls
    const timeoutId = setTimeout(() => {
      fetchPosts(true);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize posts on component mount
  useEffect(() => {
    fetchPosts(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
      await communityCache.submitVoteWithCache(firestoreService, postId, voteType, userId, user.email);

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

  const toggleComments = (postId) => {
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
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
          <div className="w-full px-4 sm:px-6 lg:px-8">
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
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sidebar */}
            <div ref={sidebarRef} className="lg:col-span-1 space-y-6">
              {/* Community Stats Card */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                whileHover={{ y: -5, shadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Thống kê cộng đồng
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Thành viên</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {communityStats.loading ? '...' : communityStats.totalMembers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bài viết</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {communityStats.loading ? '...' : communityStats.totalPosts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Đang online</span>
                    <span className="font-bold text-lg text-green-600 dark:text-green-400">
                      {communityStats.loading ? '...' : communityStats.onlineMembers}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Popular Tags Card */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                whileHover={{ y: -5, shadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                  Thẻ phổ biến
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['lừa đảo', 'phishing', 'bảo mật', 'ngân hàng', 'email', 'scam', 'virus', 'malware'].map((tag) => (
                    <motion.span
                      key={tag}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full cursor-pointer hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      #{tag}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Quick Actions Card */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                whileHover={{ y: -5, shadow: "0 10px 25px rgba(0,0,0,0.1)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Hành động nhanh
                </h3>
                <div className="space-y-3">
                  <motion.button
                    className="w-full p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Tạo bài viết mới
                  </motion.button>
                  <motion.button
                    className="w-full p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Báo cáo link lừa đảo
                  </motion.button>
                  <motion.button
                    className="w-full p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Tham gia thảo luận
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Posts */}
            <div className="lg:col-span-4">
              {loading && posts.length === 0 ? (
                <PostSkeletonGrid count={3} />
              ) : (
                <div ref={postsRef} className="space-y-6">
                  <AnimatePresence>
                    {posts.map((post) => (
                      <LazyPostCard
                        key={post.id}
                        post={post}
                        onVote={handleVote}
                        onSave={handleSave}
                        showComments={showComments[post.id]}
                        onToggleComments={toggleComments}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <motion.button
                        onClick={() => fetchPosts(false)}
                        disabled={loading}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {loading ? 'Đang tải...' : 'Tải thêm bài viết'}
                      </motion.button>
                    </div>
                  )}
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
