import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Bell,
  User,
  ChevronDown,
  Settings,
  LogOut,
  MessageCircle,
  BarChart3,
  Shield,
  Filter,
  TrendingUp,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TopBar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/community?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchSuggestions(false);
    }
  };

  const searchSuggestions = [
    { text: 'COVID-19 vaccine', type: 'trending' },
    { text: 'Tin giả về sức khỏe', type: 'category' },
    { text: 'Phishing email', type: 'trending' },
    { text: 'Fake news detection', type: 'guide' },
    { text: 'Scam website', type: 'category' }
  ];

  const quickActions = [
    {
      name: 'Kiểm tra link',
      href: '/check',
      icon: Search,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Gửi bài viết',
      href: '/submit',
      icon: Plus,
      color: 'bg-green-500 hover:bg-green-600',
      requireAuth: true
    },
    {
      name: 'Trợ lý AI',
      href: '/chat',
      icon: MessageCircle,
      color: 'bg-purple-500 hover:bg-purple-600',
      requireAuth: true
    }
  ];

  const sortOptions = [
    { value: 'trending', label: 'Thịnh hành', icon: TrendingUp },
    { value: 'newest', label: 'Mới nhất', icon: Clock },
    { value: 'most_voted', label: 'Nhiều vote', icon: ThumbsUp }
  ];

  const getCurrentSort = () => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('sort') || 'trending';
  };

  const handleSortChange = (sortValue) => {
    const currentPath = location.pathname;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('sort', sortValue);
    navigate(`${currentPath}?${urlParams.toString()}`);
  };

  return (
    <div className={`fixed top-0 right-0 left-64 h-16 z-30 ${
      isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    } border-b backdrop-blur-sm bg-opacity-95`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Search Section */}
        <div className="flex-1 max-w-2xl" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết, chủ đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchSuggestions(true)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-full border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all`}
              />
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSearchSuggestions && searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-full left-0 right-0 mt-2 ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  } border rounded-lg shadow-lg z-50`}
                >
                  {searchSuggestions
                    .filter(suggestion => 
                      suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 5)
                    .map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion.text);
                          setShowSearchSuggestions(false);
                          navigate(`/community?search=${encodeURIComponent(suggestion.text)}`);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          index === 0 ? 'rounded-t-lg' : ''
                        } ${index === 4 ? 'rounded-b-lg' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                            {suggestion.text}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.type === 'trending' ? 'bg-red-100 text-red-600' :
                            suggestion.type === 'category' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {suggestion.type === 'trending' ? 'Thịnh hành' :
                             suggestion.type === 'category' ? 'Danh mục' : 'Hướng dẫn'}
                          </span>
                        </div>
                      </button>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Center Actions */}
        <div className="flex items-center space-x-4 mx-6">
          {/* Sort Options (only show on community page) */}
          {location.pathname === '/community' && (
            <div className="flex items-center space-x-2">
              {sortOptions.map((option) => {
                const isActive = getCurrentSort() === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {quickActions.map((action) => {
              if (action.requireAuth && !user) return null;
              return (
                <button
                  key={action.name}
                  onClick={() => navigate(action.href)}
                  className={`p-2.5 rounded-full text-white transition-all ${action.color} shadow-sm hover:shadow-md`}
                  title={action.name}
                >
                  <action.icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                } relative`}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          )}

          {/* User Menu */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.firstName}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 top-full mt-2 w-64 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } border rounded-lg shadow-lg z-50`}
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate('/dashboard');
                          setShowUserMenu(false);
                        }}
                        className={`flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>Dashboard</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowUserMenu(false);
                        }}
                        className={`flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors ${
                          isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Cài đặt</span>
                      </button>
                      
                      {user?.email?.endsWith('@factcheck.com') && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setShowUserMenu(false);
                          }}
                          className={`flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors ${
                            isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <Shield className="w-4 h-4" />
                          <span>Admin</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/login')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
