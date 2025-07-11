import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  X,
  Home,
  Search,
  Users,
  MessageCircle,
  BookOpen,
  TrendingUp,
  Settings,
  ChevronRight,
  User,
  LogOut,
  Bell,
  Shield,
  Star,
  HelpCircle,
  BarChart3,
  Zap,
  Heart,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreStats, useRealtimeNotifications } from '../../hooks/useFirestoreStats';

const NavigationSidebar = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  // Get real-time data from Firestore
  const firestoreStats = useFirestoreStats();
  
  // Disable realtime notifications on submit page to reduce overhead
  const enableNotifications = !location.pathname.includes('/submit');
  const notifications = useRealtimeNotifications(enableNotifications);  // Memoized navigation items structure
  const navigationItems = useMemo(() => [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      path: '/',
      color: 'blue'
    },
    {
      id: 'check',
      label: 'Kiểm tra Link',
      icon: Search,
      path: '/check',
      color: 'green'
    },
    {
      id: 'community',
      label: 'Cộng đồng',
      icon: Users,
      path: '/community',
      color: 'purple',
      submenu: [
        { label: 'Bảng tin', path: '/community' },
        { label: 'Đóng góp', path: '/submit' }
      ]
    },
    {
      id: 'chat',
      label: 'Trợ lý AI',
      icon: MessageCircle,
      path: '/chat',
      color: 'indigo'
    },
    {
      id: 'knowledge',
      label: 'Kiến thức',
      icon: BookOpen,
      path: '/knowledge',
      color: 'amber'
    },
    {
      id: 'security',
      label: 'Bảo mật',
      icon: Shield,
      path: '/security',
      color: 'red'
    },
    {
      id: 'analytics',
      label: 'Thống kê',
      icon: BarChart3,
      path: '/analytics',
      color: 'blue'
    },
    // Add Premium for non-logged-in users
    ...(!user ? [{
      id: 'premium',
      label: 'Premium',
      icon: Star,
      path: '/premium',
      color: 'yellow',
      badge: 'PRO'
    }] : [])
  ], [user]);

  // User-specific items with memoization
  const userItems = useMemo(() => user ? [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: TrendingUp,
      path: '/dashboard',
      color: 'orange'
    },
    {
      id: 'profile',
      label: 'Hồ sơ',
      icon: User,
      path: '/profile',
      color: 'pink'
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: Bell,
      path: '/notifications',
      color: 'blue',
      badge: notifications.count > 0 ? notifications.count.toString() : null
    },
    {
      id: 'favorites',
      label: 'Đã Vote',
      icon: Heart,
      path: '/favorites',
      color: 'pink'
    },
    {
      id: 'premium',
      label: 'Premium',
      icon: Zap,
      path: '/premium',
      color: 'amber',
      badge: 'PRO'
    },
    {
      id: 'achievements',
      label: 'Thành tích',
      icon: Award,
      path: '/achievements',
      color: 'green'
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: Settings,
      path: '/settings',
      color: 'gray',
      submenu: [
        { label: 'Tài khoản', path: '/settings/account' },
        { label: 'Bảo mật', path: '/settings/security' },
        { label: 'Thông báo', path: '/settings/notifications' },
        { label: 'Giao diện', path: '/settings/appearance' },
        { label: 'Firestore Test', path: '/admin/firestore-test' }
      ]
    },
    {
      id: 'help',
      label: 'Trợ giúp',
      icon: HelpCircle,
      path: '/help',
      color: 'indigo'
    }
  ] : [], [user, notifications.count]);

  // Optimized toggle function
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);
  // Optimized logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
      onToggle(); // Close sidebar after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, navigate, onToggle]);

  const allItems = useMemo(() => [...navigationItems, ...userItems], [navigationItems, userItems]);

  // Debug logging to check if settings is included
  useEffect(() => {
    if (user && allItems.length > 0) {
      console.log('🔍 Debug Navigation Items:', allItems.map(item => ({ id: item.id, label: item.label })));
      const settingsItem = allItems.find(item => item.id === 'settings');
      console.log('⚙️ Settings Menu Found:', settingsItem ? 'YES' : 'NO', settingsItem);
    }
  }, [allItems, user]);

  // Check if current path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);  };

  // Handle navigation
  const handleNavigation = useCallback((item) => {
    if (item.submenu) {
      toggleSection(item.id);
    } else {
      navigate(item.path);
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 768) {
        onToggle();
      }
    }
  }, [toggleSection, navigate, onToggle]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && window.innerWidth < 768) {
        const sidebar = document.getElementById('navigation-sidebar');
        if (sidebar && !sidebar.contains(event.target) && !event.target.closest('.hamburger-menu')) {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);
  const getColorClasses = (color, active = false) => {
    const colors = {
      blue: active 
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20',
      green: active 
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20',
      purple: active 
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20',
      indigo: active 
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
      amber: active 
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20',
      yellow: active 
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20',
      orange: active 
        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20',
      pink: active 
        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20',
      red: active 
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20',
      gray: active 
        ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
    };
    return colors[color] || colors.blue;
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>      {/* Sidebar */}
      <motion.div
        id="navigation-sidebar"
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ duration: 0.3, type: "tween" }}
        className={`fixed left-0 top-0 h-screen w-80 bg-white dark:bg-gray-800 shadow-xl z-40 overflow-y-auto nav-sidebar hardware-accelerated scrollbar-optimized ${isOpen ? 'open' : 'closed'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Link to="/" className="flex items-center ml-[80px] gap-1">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent
                              ">
                FactCheck
              </span>
            </Link>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {/* Online status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.displayName || user.email || 'Người dùng'}
                    </p>
                    {(user.emailVerified || user.email?.endsWith('@factcheck.com')) && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                  {/* User level/points */}
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center space-x-1">
                      <Star size={12} className="text-yellow-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Level 5</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap size={12} className="text-blue-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">1,250 pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {user && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Thống kê nhanh
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {firestoreStats.loading ? '...' : firestoreStats.userPosts}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Links kiểm tra</div>
                </div>
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {firestoreStats.loading ? '...' : firestoreStats.totalPosts}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Tổng bài viết</div>
                </div>
                <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {firestoreStats.loading ? '...' : firestoreStats.userComments}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Bình luận của tôi</div>
                </div>
                <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {firestoreStats.loading ? '...' : firestoreStats.userVotes}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Votes của tôi</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items - Scrollable */}
          <nav className="overflow-y-auto p-4 space-y-2 nav-container-overflow">
            {allItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isExpanded = expandedSections[item.id];

              return (
                <div key={item.id}>
                  {/* Main Item */}
                  <motion.button
                    onClick={() => handleNavigation(item)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg smooth-transition text-left nav-item focus-optimized
                      ${getColorClasses(item.color, active)}
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          item.badge === 'PRO'
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    
                    {hasSubmenu && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight size={16} />
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Submenu */}
                  <AnimatePresence>
                    {hasSubmenu && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 mt-2 space-y-1 overflow-hidden"
                      >
                        {item.submenu.map((subItem, index) => (
                          <Link
                            key={`${item.id}-${subItem.path}-${index}`}
                            to={subItem.path}
                            onClick={() => window.innerWidth < 768 && onToggle()}
                            className="block p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Bottom Section - Fixed */}
          {user && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>  );
};

NavigationSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

export default NavigationSidebar;
