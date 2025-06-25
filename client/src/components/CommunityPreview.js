import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MessageCircle,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { gsap, ScrollTrigger } from '../utils/gsap';

// Get API base URL (same logic as api.js)
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }

  return 'http://localhost:8080/api';
};

const CommunityPreview = () => {
  const { isDarkMode } = useTheme();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      console.log('🚀 Loading community posts from API...');
      setLoading(true);

      try {
        console.log('🔄 Fetching community data from API...');
        const token = localStorage.getItem('token') ||
                     localStorage.getItem('authToken') ||
                     localStorage.getItem('backendToken');

        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${getApiBaseUrl()}/community/links?limit=4&sort=trending`, { headers });

        console.log('📡 Community API Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Community API Response data:', data);

          if (data.success && data.data?.posts?.length > 0) {
            console.log('✅ Updated with real community posts:', data.data.posts.length);

            // Transform API data to match our format
            const transformedPosts = data.data.posts.slice(0, 4).map(post => ({
              id: post.id,
              title: post.title,
              content: post.content || post.description || 'No description available',
              author: { name: post.author?.name || post.author?.displayName || 'Unknown User' },
              createdAt: post.createdAt,
              votes: {
                safe: post.voteStats?.safe || 0,
                unsafe: post.voteStats?.unsafe || 0,
                suspicious: post.voteStats?.suspicious || 0
              },
              commentsCount: post.commentsCount || 0,
              type: post.category || 'community'
            }));

            setPosts(transformedPosts);
          } else {
            console.log('⚠️ Community API returned no posts, keeping mock data');
          }
        } else {
          console.log('⚠️ Community API request failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.log('ℹ️ Community API not available, using mock data:', error.message);
      }
    };

    fetchRecentPosts();
  }, []);

  // Optimized lightweight animation
  useEffect(() => {
    if (!containerRef.current || loading || posts.length === 0) return;

    const container = containerRef.current;
    const postItems = container.querySelectorAll('[data-post]');

    // Set content visible immediately - no lag
    gsap.set(container, { opacity: 1 });
    gsap.set(postItems, { opacity: 1, x: 0, scale: 1 });

    // Lightweight ScrollTrigger with minimal animation
    const st = ScrollTrigger.create({
      trigger: container,
      start: "top 95%",
      once: true, // Only run once for performance
      onEnter: () => {
        // Simple fade-in only
        gsap.fromTo(postItems,
          { opacity: 0.7 },
          {
            opacity: 1,
            duration: 0.3,
            ease: "none",
            stagger: 0.05
          }
        );
      }
    });

    return () => {
      st.kill();
    };
  }, [loading, posts]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case 'security': return '🔒';
      case 'guide': return '📚';
      case 'discussion': return '💬';
      default: return '👥';
    }
  };

  const getTotalVotes = (votes) => {
    if (!votes) return 0;
    return (votes.safe || 0) + (votes.unsafe || 0) + (votes.suspicious || 0);
  };

  if (loading) {
    return (
      <div className={`rounded-2xl shadow-sm border ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } p-6`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl shadow-sm border hover:shadow-lg transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Hoạt động cộng đồng
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Thảo luận mới nhất từ cộng đồng
            </p>
          </div>
        </div>
        
        <motion.button
          onClick={() => window.location.href = '/community'}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isDarkMode 
              ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50' 
              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>Xem tất cả</span>
          <ChevronRight size={14} />
        </motion.button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className={`w-12 h-12 mx-auto mb-4 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Chưa có hoạt động nào gần đây
            </p>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              data-post
              initial={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              className={`group flex space-x-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isDarkMode
                  ? 'border-gray-700 hover:border-purple-500/50 hover:bg-gray-700/50'
                  : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/50'
              }`}
              onClick={() => window.location.href = '/community'}
              whileHover={{ y: -2 }}
            >
              {/* Post Type Icon */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {getPostTypeIcon(post.type)}
              </div>

              {/* Post Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {post.title}
                </h4>
                
                <p className={`text-xs mb-2 line-clamp-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {post.content}
                </p>

                {/* Post Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-gray-500 dark:text-gray-500">
                        {formatTime(post.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-gray-500 dark:text-gray-500">
                        {getTotalVotes(post.votes)} phiếu
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span className="text-gray-500 dark:text-gray-500">
                        {post.commentsCount || 0} bình luận
                      </span>
                    </div>
                  </div>

                  <ExternalLink className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer CTA */}
      {posts.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <motion.button
            onClick={() => window.location.href = '/community'}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${
              isDarkMode
                ? 'bg-purple-900/30 text-purple-300 hover:bg-purple-900/50'
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Tham gia thảo luận cộng đồng
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default CommunityPreview;
