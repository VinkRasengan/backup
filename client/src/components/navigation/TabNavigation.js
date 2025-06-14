import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  Users, 
  MessageCircle, 
  User,
  Shield,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TabNavigation = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const tabs = [
    {
      id: 'home',
      label: 'Trang chủ',
      icon: Home,
      path: '/',
      color: 'blue'
    },
    {
      id: 'check',
      label: 'Kiểm tra',
      icon: Search,
      path: '/check',
      color: 'green'
    },
    {
      id: 'community',
      label: 'Cộng đồng',
      icon: Users,
      path: '/community',
      color: 'purple'
    },
    {
      id: 'chat',
      label: 'Chat AI',
      icon: MessageCircle,
      path: '/chat',
      color: 'indigo'
    },
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
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getColorClasses = (color, active = false) => {
    const colors = {
      blue: active 
        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
        : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400',
      green: active 
        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
        : 'text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400',
      purple: active 
        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
        : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400',
      indigo: active 
        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
        : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400',
      orange: active 
        ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' 
        : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400',
      pink: active 
        ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' 
        : 'text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`
                  relative flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                  ${getColorClasses(tab.color, active)}
                  ${active ? 'shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-current rounded-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
