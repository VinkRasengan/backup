import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import FeatureMenu from '../navigation/FeatureMenu';

/**
 * AppHeader - Responsive header with centered search and right-aligned icons
 * Features: Mobile hamburger, centered search bar, icon tooltips, ARIA labels
 */
const AppHeader = ({ onMenuClick, showMenuButton = false }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Refs for click outside detection
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);

  // Mock notifications
  const notifications = [
    { id: 1, text: 'Bài viết của bạn đã được duyệt', time: '5 phút trước', unread: true },
    { id: 2, text: 'Có 3 bình luận mới', time: '1 giờ trước', unread: true },
    { id: 3, text: 'Cập nhật hệ thống', time: '2 giờ trước', unread: false }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // Search suggestions
  const searchSuggestions = [
    { text: 'COVID-19 vaccine', type: 'trending' },
    { text: 'Tin tức chính trị', type: 'category' },
    { text: 'Kiểm tra link Facebook', type: 'guide' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
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

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 h-16 z-50',
        'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm',
        'border-b border-gray-200 dark:border-gray-700',
        'transition-colors duration-300'
      )}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          
          {/* Left Section - Logo + Mobile Menu + Feature Menu */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className={cn(
                  'lg:hidden p-2 rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
                aria-label="Toggle navigation menu"
                aria-expanded="false"
              >
                <Menu size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 group"
              aria-label="FactCheck homepage"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FactCheck
              </span>
            </Link>

            {/* Feature Menu - Hidden on mobile */}
            <div className="hidden md:block">
              <FeatureMenu />
            </div>
          </div>

          {/* Center Section - Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 lg:mx-8" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" 
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết, chủ đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearchSuggestions(true)}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-full border transition-all duration-200',
                    'text-base placeholder:text-gray-500',
                    'focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20',
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500'
                  )}
                  aria-label="Search articles and topics"
                  aria-describedby="search-suggestions"
                />
              </div>

              {/* Search Suggestions */}
              <AnimatePresence>
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'absolute top-full mt-2 w-full rounded-lg shadow-lg border z-50',
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    )}
                    id="search-suggestions"
                    role="listbox"
                  >
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion.text);
                          setShowSearchSuggestions(false);
                        }}
                        className={cn(
                          'w-full px-4 py-3 text-left transition-colors',
                          'hover:bg-gray-50 dark:hover:bg-gray-700',
                          'first:rounded-t-lg last:rounded-b-lg',
                          'focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700'
                        )}
                        role="option"
                        aria-selected="false"
                      >
                        <div className="flex items-center justify-between">
                          <span className={cn(
                            'text-sm',
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          )}>
                            {suggestion.text}
                          </span>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            suggestion.type === 'trending' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
                            suggestion.type === 'category' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                            suggestion.type === 'guide' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          )}>
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

          {/* Right Section - Action Icons */}
          <div className="flex items-center space-x-2">
            {user && (
              <>
                {/* Add Button */}
                <Link
                  to="/submit"
                  className={cn(
                    'p-2 rounded-full transition-colors group relative',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                  aria-label="Submit new article"
                  title="Submit new article"
                >
                  <Plus size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
                </Link>

                {/* Chat Button */}
                <Link
                  to="/chat"
                  className={cn(
                    'p-2 rounded-full transition-colors group relative',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                  aria-label="Open chat assistant"
                  title="Chat Assistant"
                >
                  <MessageCircle size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={cn(
                      'p-2 rounded-full transition-colors group relative',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                    aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                    title="Notifications"
                    aria-expanded={showNotifications}
                  >
                    <Bell size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          'absolute right-0 top-full mt-2 w-80 rounded-lg shadow-lg border z-50',
                          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        )}
                        role="menu"
                        aria-label="Notifications menu"
                      >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Thông báo
                          </h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                'p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0',
                                'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                                notification.unread && 'bg-blue-50 dark:bg-blue-900/20'
                              )}
                              role="menuitem"
                            >
                              <p className="text-sm text-gray-900 dark:text-white">
                                {notification.text}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={cn(
                    'flex items-center space-x-2 p-2 rounded-lg transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white">
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
                      className={cn(
                        'absolute right-0 top-full mt-2 w-64 rounded-lg shadow-lg border z-50',
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      )}
                      role="menu"
                      aria-label="User menu"
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-white">
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
                          className={cn(
                            'flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors',
                            'hover:bg-gray-50 dark:hover:bg-gray-700',
                            'text-gray-700 dark:text-gray-300'
                          )}
                          role="menuitem"
                        >
                          <BarChart3 className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setShowUserMenu(false);
                          }}
                          className={cn(
                            'flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors',
                            'hover:bg-gray-50 dark:hover:bg-gray-700',
                            'text-gray-700 dark:text-gray-300'
                          )}
                          role="menuitem"
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
                            className={cn(
                              'flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors',
                              'hover:bg-gray-50 dark:hover:bg-gray-700',
                              'text-gray-700 dark:text-gray-300'
                            )}
                            role="menuitem"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Admin</span>
                          </button>
                        )}
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                        <button
                          onClick={handleLogout}
                          className={cn(
                            'flex items-center space-x-3 w-full px-4 py-2 text-left transition-colors',
                            'hover:bg-red-50 dark:hover:bg-red-900/20',
                            'text-red-600 dark:text-red-400'
                          )}
                          role="menuitem"
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
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
