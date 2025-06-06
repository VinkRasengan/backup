import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Users,
  BookOpen,
  MessageCircle,
  BarChart3,
  Plus,
  TrendingUp,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const RedditNavigation = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: 'Trang chủ', href: '/', icon: Home },
    { name: 'Thịnh hành', href: '/community?sort=trending', icon: TrendingUp },
    { name: 'Cộng đồng', href: '/community', icon: Users },
    { name: 'Kiến thức', href: '/knowledge', icon: BookOpen },
  ];

  const userNavigation = [
    { name: 'Kiểm tra', href: '/check', icon: Search, requireAuth: false },
    { name: 'Gửi bài viết', href: '/submit', icon: Plus, requireAuth: true },
    { name: 'Trợ lý AI', href: '/chat', icon: MessageCircle, requireAuth: true },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, requireAuth: true },
  ];

  const adminNavigation = [
    { name: 'Admin', href: '/admin', icon: Shield, requireAdmin: true },
  ];

  const isActive = (path) => {
    if (path === '/community?sort=trending') {
      return location.pathname === '/community' && location.search.includes('sort=trending');
    }
    // Handle exact path matching
    if (path === '/') {
      return location.pathname === '/';
    }
    // Handle sub-paths (e.g., /check, /chat, etc.)
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
  };

  const NavItem = ({ item, isActive }) => (
    <Link
      to={item.href}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${isCollapsed ? 'justify-center px-2' : ''}`}
    >
      <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
      {!isCollapsed && (
        <span className="font-medium text-sm">{item.name}</span>
      )}
    </Link>
  );

  return (
    <div className={`fixed left-0 top-0 h-full z-40 ${
      isCollapsed ? 'w-16' : 'w-64'
    } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                FactCheck
              </span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Main Navigation */}
          <div className="px-3 mb-6">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Khám phá
              </h3>
            )}
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
              ))}
            </div>
          </div>

          {/* User Navigation */}
          <div className="px-3 mb-6">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Công cụ
              </h3>
            )}
            <div className="space-y-1">
              {userNavigation.map((item) => {
                if (item.requireAuth && !user) return null;
                return (
                  <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
                );
              })}
            </div>
          </div>

          {/* Admin Navigation */}
          {user?.email?.endsWith('@factcheck.com') && (
            <div className="px-3 mb-6">
              {!isCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Quản trị
                </h3>
              )}
              <div className="space-y-1">
                {adminNavigation.map((item) => (
                  <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 mb-2 ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {!isCollapsed && (
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
              </span>
            )}
          </button>

          {/* User Info */}
          {user ? (
            <div className="space-y-2">
              {!isCollapsed && (
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              )}
              
              <Link
                to="/profile"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
              >
                <Settings className="w-5 h-5" />
                {!isCollapsed && (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Cài đặt
                  </span>
                )}
              </Link>
              
              <button
                onClick={handleLogout}
                className={`flex items-center space-x-3 w-full px-4 py-2 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
              >
                <LogOut className="w-5 h-5" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">Đăng xuất</span>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
              >
                <LogOut className="w-5 h-5 rotate-180" />
                {!isCollapsed && (
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Đăng nhập
                  </span>
                )}
              </Link>
              
              <Link
                to="/register"
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
              >
                <Plus className="w-5 h-5" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">Đăng ký</span>
                )}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedditNavigation;
