import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Search, 
  Users, 
  MessageCircle, 
  Shield,
  TrendingUp,
  BookOpen,
  FileText,
  Settings,
  ChevronDown,
  Home
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const FeatureMenu = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const menuRef = useRef(null);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setIsOpen(false);
    setActiveSubmenu(null);
  }, [location.pathname]);

  const mainFeatures = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      path: '/',
      description: 'Trang chủ FactCheck',
      color: 'blue'
    },
    {
      id: 'check',
      label: 'Kiểm tra Link',
      icon: Search,
      path: '/check',
      description: 'Kiểm tra độ tin cậy bài viết',
      color: 'green',
      submenu: [
        { label: 'Kiểm tra nhanh', path: '/check/quick', icon: Search },
        { label: 'Kiểm tra chi tiết', path: '/check/detailed', icon: FileText },
        { label: 'Lịch sử kiểm tra', path: '/check/history', icon: TrendingUp }
      ]
    },
    {
      id: 'community',
      label: 'Cộng đồng',
      icon: Users,
      path: '/community',
      description: 'Tham gia cộng đồng kiểm chứng',
      color: 'purple',
      submenu: [
        { label: 'Đóng góp', path: '/community/contribute', icon: Users },
        { label: 'Báo cáo', path: '/community/reports', icon: Shield }
      ]
    },
    {
      id: 'chat',
      label: 'AI Trợ lý',
      icon: MessageCircle,
      path: '/chat',
      description: 'Chat với AI về kiểm chứng',
      color: 'indigo'
    },
    {
      id: 'knowledge',
      label: 'Kiến thức',
      icon: BookOpen,
      path: '/knowledge',
      description: 'Tìm hiểu về kiểm chứng sự thật',
      color: 'amber'
    }
  ];

  const userFeatures = user ? [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: TrendingUp,
      path: '/dashboard',
      description: 'Thống kê cá nhân',
      color: 'orange'
    },
    {
      id: 'profile',
      label: 'Hồ sơ',
      icon: Settings,
      path: '/profile',
      description: 'Quản lý tài khoản',
      color: 'pink'
    }
  ] : [];

  const allFeatures = [...mainFeatures, ...userFeatures];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
      green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
      purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
      indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
      amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
      orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
      pink: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20'
    };
    return colors[color] || colors.blue;
  };

  const handleFeatureClick = (feature) => {
    if (feature.submenu) {
      setActiveSubmenu(activeSubmenu === feature.id ? null : feature.id);
    } else {
      navigate(feature.path);
      setIsOpen(false);
    }
  };

  const handleSubmenuClick = (path) => {
    navigate(path);
    setIsOpen(false);
    setActiveSubmenu(null);
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Menu Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${isOpen 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
            : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }
          border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </motion.div>
        <span>Tính năng</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 z-50 overflow-hidden"
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tính năng FactCheck
              </h3>
              
              <div className="space-y-2">
                {allFeatures.map((feature) => {
                  const Icon = feature.icon;
                  const active = isActive(feature.path);
                  const hasSubmenu = feature.submenu && feature.submenu.length > 0;
                  const submenuOpen = activeSubmenu === feature.id;

                  return (
                    <div key={feature.id}>
                      {/* Main Feature Item */}
                      <motion.div
                        onClick={() => handleFeatureClick(feature)}
                        className={`
                          flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                          ${active 
                            ? getColorClasses(feature.color)
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }
                        `}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center
                          ${active ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700'}
                        `}>
                          <Icon size={18} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{feature.label}</p>
                            {hasSubmenu && (
                              <motion.div
                                animate={{ rotate: submenuOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown size={16} />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-sm opacity-70 truncate">{feature.description}</p>
                        </div>
                      </motion.div>

                      {/* Submenu */}
                      <AnimatePresence>
                        {hasSubmenu && submenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-4 mt-2 space-y-1"
                          >
                            {feature.submenu.map((item, index) => {
                              const SubIcon = item.icon;
                              return (
                                <motion.div
                                  key={index}
                                  onClick={() => handleSubmenuClick(item.path)}
                                  className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                >
                                  <SubIcon size={16} />
                                  <span className="text-sm">{item.label}</span>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureMenu;
