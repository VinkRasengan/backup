import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  Users, 
  MessageCircle, 
  User,
  Settings,
  TrendingUp,
  Shield,
  BookOpen,
  Plus,
  BarChart3,
  X,
  Menu,
  LogOut,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../utils/responsiveDesign';

const StickyNavigationMenu = ({ isOpen, onClose, device, isMobile: propIsMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { dimensions } = useResponsive();
  
  // Use passed props or fallback to hook
  const isMobile = propIsMobile !== undefined ? propIsMobile : dimensions.width < 768;
  const isTablet = dimensions.width >= 768 && dimensions.width < 1024;
  const isSmallMobile = dimensions.width < 375;

  // Enhanced responsive menu configuration
  const getMenuConfig = () => {
    if (isSmallMobile) {
      return {
        width: 'w-full max-w-xs', // Full width with max constraint on very small screens
        padding: 'p-4',
        headerPadding: 'p-4',
        itemPadding: 'px-3 py-2.5',
        iconSize: 18,
        fontSize: 'text-sm',
        spacing: 'space-y-1'
      };
    } else if (isMobile) {
      return {
        width: 'w-80', // Standard mobile width
        padding: 'p-4',
        headerPadding: 'p-5',
        itemPadding: 'px-4 py-3',
        iconSize: 20,
        fontSize: 'text-base',
        spacing: 'space-y-2'
      };
    } else if (isTablet) {
      return {
        width: 'w-84', // Slightly wider on tablet
        padding: 'p-5',
        headerPadding: 'p-6',
        itemPadding: 'px-4 py-3',
        iconSize: 22,
        fontSize: 'text-base',
        spacing: 'space-y-2'
      };
    } else {
      return {
        width: 'w-96', // Wider on desktop
        padding: 'p-6',
        headerPadding: 'p-6',
        itemPadding: 'px-4 py-3',
        iconSize: 24,
        fontSize: 'text-base',
        spacing: 'space-y-2'
      };
    }
  };

  const menuConfig = getMenuConfig();

  const navigationItems = [
    {
      name: 'Trang chủ',
      path: '/',
      icon: Home,
      color: 'blue',
      requireAuth: false
    },
    {
      name: 'Kiểm tra',
      path: '/check',
      icon: Search,
      color: 'green',
      requireAuth: false
    },
    {
      name: 'Cộng đồng',
      path: '/community',
      icon: Users,
      color: 'purple',
      requireAuth: false
    },
    {
      name: 'Chat AI',
      path: '/chat',
      icon: MessageCircle,
      color: 'indigo',
      requireAuth: true
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
      color: 'orange',
      requireAuth: true
    },
    {
      name: 'Kiến thức',
      path: '/knowledge',
      icon: BookOpen,
      color: 'teal',
      requireAuth: false
    },
    {
      name: 'Gửi bài viết',
      path: '/submit',
      icon: Plus,
      color: 'emerald',
      requireAuth: true
    },
    {
      name: 'Hồ sơ',
      path: '/profile',
      icon: User,
      color: 'pink',
      requireAuth: true
    },
    {
      name: 'Cài đặt',
      path: '/settings',
      icon: Settings,
      color: 'gray',
      requireAuth: true
    }
  ];

  // Add admin items if user is admin
  if (user?.isAdmin) {
    navigationItems.push({
      name: 'Admin',
      path: '/admin',
      icon: Shield,
      color: 'red',
      requireAuth: true,
      requireAdmin: true
    });
  }

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getColorClasses = (color, active = false) => {
    const colors = {
      blue: active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      green: active ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'hover:bg-green-50 dark:hover:bg-green-900/20',
      purple: active ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      indigo: active ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
      orange: active ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
      teal: active ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' : 'hover:bg-teal-50 dark:hover:bg-teal-900/20',
      emerald: active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      pink: active ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
      gray: active ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'hover:bg-gray-50 dark:hover:bg-gray-800',
      red: active ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'hover:bg-red-50 dark:hover:bg-red-900/20'
    };
    return colors[color] || colors.blue;
  };

  // Enhanced responsive animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  const menuVariants = {
    hidden: { 
      x: '-100%',
      opacity: 0
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: isMobile ? 400 : 300,
        damping: isMobile ? 40 : 30,
        mass: 0.8
      }
    },
    exit: {
      x: '-100%',
      opacity: 0,
      transition: {
        duration: isMobile ? 0.2 : 0.3,
        ease: "easeIn"
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -20 
    },
    visible: (index) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * (isMobile ? 0.03 : 0.05),
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Responsive Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Enhanced Responsive Menu Panel */}
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed left-0 top-0 h-full ${menuConfig.width} bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col 
              ${isMobile ? 'border-r-0' : 'border-r border-gray-200 dark:border-gray-700'}`}
            style={{
              maxHeight: '100vh',
              overflowY: 'auto'
            }}
          >
            {/* Enhanced Responsive Header */}
            <div className={`${menuConfig.headerPadding} border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700`}>
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${isSmallMobile ? 'space-x-2' : 'space-x-3'}`}>
                  <div className={`${isSmallMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg`}>
                    <BarChart3 className={`${isSmallMobile ? 'w-4 h-4' : 'w-6 h-6'} text-white`} />
                  </div>
                  <div>
                    <h2 className={`${isSmallMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 dark:text-white`}>
                      FactCheck
                    </h2>
                    {!isSmallMobile && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Navigation Menu</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                    isSmallMobile ? 'p-1.5' : 'p-2'
                  }`}
                >
                  <X size={isSmallMobile ? 16 : 20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Enhanced Responsive User Info */}
            {user && (
              <motion.div 
                className={`${menuConfig.padding} border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className={`flex items-center ${isSmallMobile ? 'space-x-2' : 'space-x-3'}`}>
                  <div className={`${isSmallMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md`}>
                    <User className={`${isSmallMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-gray-900 dark:text-white truncate ${menuConfig.fontSize}`}>
                      {user.name || user.email}
                    </p>
                    {!isSmallMobile && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Enhanced Responsive Navigation Items */}
            <div className={`flex-1 overflow-y-auto ${menuConfig.padding}`}>
              <div className={menuConfig.spacing}>
                {navigationItems.map((item, index) => {
                  // Skip items that require auth if user is not logged in
                  if (item.requireAuth && !user) return null;
                  
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <motion.button
                      key={item.path}
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center ${isSmallMobile ? 'space-x-2' : 'space-x-3'} ${menuConfig.itemPadding} rounded-lg text-left transition-all duration-200 ${
                        active 
                          ? getColorClasses(item.color, true)
                          : `text-gray-700 dark:text-gray-300 ${getColorClasses(item.color, false)}`
                      } ${menuConfig.fontSize} group`}
                      whileHover={!isMobile ? { x: 4, scale: 1.01 } : { scale: 0.98 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Icon size={menuConfig.iconSize} className="flex-shrink-0" />
                      <span className="font-medium truncate">{item.name}</span>
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className={`ml-auto ${isSmallMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-current rounded-full flex-shrink-0`}
                        />
                      )}
                      {/* Subtle arrow for desktop */}
                      {!isMobile && (
                        <motion.div 
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={false}
                          animate={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                        >
                          →
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Responsive Footer Actions */}
            <div className={`${menuConfig.padding} border-t border-gray-200 dark:border-gray-700 ${menuConfig.spacing} bg-gray-50 dark:bg-gray-700/50`}>
              {/* Theme Toggle */}
              <motion.button
                onClick={toggleTheme}
                className={`w-full flex items-center ${isSmallMobile ? 'space-x-2' : 'space-x-3'} ${menuConfig.itemPadding} rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${menuConfig.fontSize} group`}
                whileHover={!isMobile ? { x: 2 } : { scale: 0.98 }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navigationItems.length * 0.05 + 0.1 }}
              >
                {isDarkMode ? <Sun size={menuConfig.iconSize} /> : <Moon size={menuConfig.iconSize} />}
                <span className="font-medium">{isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}</span>
                {!isMobile && (
                  <span className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {isDarkMode ? '☀️' : '🌙'}
                  </span>
                )}
              </motion.button>

              {/* Responsive Logout */}
              {user && (
                <motion.button
                  onClick={handleLogout}
                  className={`w-full flex items-center ${isSmallMobile ? 'space-x-2' : 'space-x-3'} ${menuConfig.itemPadding} rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${menuConfig.fontSize} group`}
                  whileHover={!isMobile ? { x: 2 } : { scale: 0.98 }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navigationItems.length * 0.05 + 0.2 }}
                >
                  <LogOut size={menuConfig.iconSize} />
                  <span className="font-medium">Đăng xuất</span>
                  {!isMobile && (
                    <span className="ml-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      👋
                    </span>
                  )}
                </motion.button>
              )}

              {/* Mobile-only quick actions */}
              {isMobile && (
                <motion.div 
                  className="flex justify-center space-x-4 pt-3 border-t border-gray-200 dark:border-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <button 
                    className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    onClick={() => handleNavigation('/notifications')}
                  >
                    <Bell size={16} />
                  </button>
                  <button 
                    className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                    onClick={() => handleNavigation('/settings')}
                  >
                    <Settings size={16} />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StickyNavigationMenu;
