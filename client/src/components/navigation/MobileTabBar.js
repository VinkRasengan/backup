import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  Users, 
  MessageCircle, 
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Don't show mobile tab bar on login/register pages
  const hideOnPages = ['/login', '/register'];
  if (hideOnPages.includes(location.pathname)) {
    return null;
  }

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
      label: 'AI Chat',
      icon: MessageCircle,
      path: '/chat',
      color: 'indigo'
    }
  ];

  // Thêm dashboard tab nếu user đã đăng nhập
  if (user) {
    tabs.push({
      id: 'dashboard',
      label: 'Dashboard',
      icon: TrendingUp,
      path: '/dashboard',
      color: 'orange'
    });
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getColorClasses = (color, active = false) => {
    const colors = {
      blue: active 
        ? 'text-blue-600 dark:text-blue-400' 
        : 'text-gray-500 dark:text-gray-400',
      green: active 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-gray-500 dark:text-gray-400',
      purple: active 
        ? 'text-purple-600 dark:text-purple-400' 
        : 'text-gray-500 dark:text-gray-400',
      indigo: active 
        ? 'text-indigo-600 dark:text-indigo-400' 
        : 'text-gray-500 dark:text-gray-400',
      orange: active 
        ? 'text-orange-600 dark:text-orange-400' 
        : 'text-gray-500 dark:text-gray-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-50 md:hidden">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`
                relative flex flex-col items-center justify-center p-2 min-w-0 flex-1
                ${getColorClasses(tab.color, active)}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ 
                  scale: active ? 1.1 : 1,
                  y: active ? -2 : 0
                }}
                transition={{ duration: 0.2 }}
                className="mb-1"
              >
                <Icon size={20} />
              </motion.div>
              
              <span className="text-xs font-medium truncate w-full text-center">
                {tab.label}
              </span>
              
              {/* Active indicator */}
              {active && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-current rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileTabBar;
