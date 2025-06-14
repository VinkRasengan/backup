import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Users, 
  MessageCircle, 
  BookOpen,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const QuickAccessMenu = ({ className = '' }) => {
  const { user } = useAuth();

  const quickActions = [
    {
      id: 'check',
      title: 'Kiểm tra Link',
      description: 'Kiểm tra ngay độ tin cậy',
      icon: Search,
      path: '/check',
      color: 'from-green-500 to-green-600',
      featured: true
    },
    {
      id: 'community',
      title: 'Cộng đồng',
      description: 'Tham gia thảo luận',
      icon: Users,
      path: '/community',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'chat',
      title: 'AI Trợ lý',
      description: 'Hỏi đáp với AI',
      icon: MessageCircle,
      path: '/chat',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'knowledge',
      title: 'Kiến thức',
      description: 'Học về kiểm chứng',
      icon: BookOpen,
      path: '/knowledge',
      color: 'from-amber-500 to-amber-600'
    }
  ];

  // Thêm Dashboard nếu user đã đăng nhập
  if (user) {
    quickActions.push({
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Xem thống kê của bạn',
      icon: TrendingUp,
      path: '/dashboard',
      color: 'from-orange-500 to-orange-600'
    });
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Truy cập nhanh
        </h3>
        <Link
          to="/features"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
        >
          Xem tất cả
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={action.path}
                className={`
                  group relative block p-4 rounded-xl transition-all duration-300 overflow-hidden
                  ${action.featured 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 ring-2 ring-green-200 dark:ring-green-700' 
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }
                `}
              >
                {/* Background gradient */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300
                `} />
                
                <div className="relative">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110
                    ${action.featured 
                      ? `bg-gradient-to-br ${action.color} text-white shadow-lg` 
                      : `bg-gradient-to-br ${action.color} text-white`
                    }
                  `}>
                    <Icon size={20} />
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {action.description}
                  </p>
                  
                  {action.featured && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Phổ biến
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickAccessMenu;
