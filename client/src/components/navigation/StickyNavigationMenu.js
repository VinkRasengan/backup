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

const StickyNavigationMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">FactCheck</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Navigation Menu</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.name || user.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  // Skip items that require auth if user is not logged in
                  if (item.requireAuth && !user) return null;
                  
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        active 
                          ? getColorClasses(item.color, true)
                          : `text-gray-700 dark:text-gray-300 ${getColorClasses(item.color, false)}`
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{item.name}</span>
                      {active && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 bg-current rounded-full"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                <span className="font-medium">{isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}</span>
              </button>

              {/* Logout */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Đăng xuất</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StickyNavigationMenu;
