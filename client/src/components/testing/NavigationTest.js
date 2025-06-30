import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Navigation, 
  ExternalLink,
  Home,
  Search,
  Users,
  MessageCircle,
  BookOpen,
  Shield,
  BarChart3,
  Star,
  TrendingUp,
  User,
  Bell,
  Heart,
  Award,
  HelpCircle,
  Settings
} from 'lucide-react';

const NavigationTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [testResults, setTestResults] = useState({});

  // All routes to test
  const routesToTest = [
    { path: '/', label: 'Trang chủ', icon: Home, requiresAuth: false },
    { path: '/check', label: 'Kiểm tra Link', icon: Search, requiresAuth: false },
    { path: '/community', label: 'Cộng đồng', icon: Users, requiresAuth: true },
    { path: '/community/feed', label: 'Bảng tin', icon: Users, requiresAuth: true },
    { path: '/submit', label: 'Đóng góp', icon: Users, requiresAuth: true },
    { path: '/chat', label: 'Trợ lý AI', icon: MessageCircle, requiresAuth: true },
    { path: '/knowledge', label: 'Kiến thức', icon: BookOpen, requiresAuth: false },
    { path: '/security', label: 'Bảo mật', icon: Shield, requiresAuth: false },
    { path: '/analytics', label: 'Thống kê', icon: BarChart3, requiresAuth: false },
    { path: '/premium', label: 'Premium', icon: Star, requiresAuth: false },
    { path: '/dashboard', label: 'Dashboard', icon: TrendingUp, requiresAuth: true },
    { path: '/profile', label: 'Hồ sơ', icon: User, requiresAuth: true },
    { path: '/notifications', label: 'Thông báo', icon: Bell, requiresAuth: true },
    { path: '/favorites', label: 'Đã Vote', icon: Heart, requiresAuth: true },
    { path: '/achievements', label: 'Thành tích', icon: Award, requiresAuth: true },
    { path: '/help', label: 'Trợ giúp', icon: HelpCircle, requiresAuth: false },
    { path: '/settings', label: 'Cài đặt', icon: Settings, requiresAuth: true }
  ];

  const testNavigation = async (route) => {
    try {
      // Try to navigate
      navigate(route.path);
      
      // Wait a bit for navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if we're at the expected path or redirected appropriately
      const currentPath = window.location.pathname;
      const isSuccess = currentPath === route.path || 
                       (route.requiresAuth && currentPath === '/login') ||
                       (currentPath === '/dashboard' && route.path === '/');
      
      setTestResults(prev => ({
        ...prev,
        [route.path]: {
          success: isSuccess,
          actualPath: currentPath,
          expectedPath: route.path,
          timestamp: new Date().toLocaleTimeString()
        }
      }));

      return isSuccess;
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [route.path]: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      return false;
    }
  };

  const testAllRoutes = async () => {
    setTestResults({});
    
    for (const route of routesToTest) {
      await testNavigation(route);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const getResultIcon = (result) => {
    if (!result) return null;
    return result.success ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getResultColor = (result) => {
    if (!result) return 'bg-gray-50 dark:bg-gray-800';
    return result.success ? 
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 
      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Navigation className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Navigation Test
              </h2>
            </div>
            <motion.button
              onClick={testAllRoutes}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Test All Routes
            </motion.button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test navigation to all routes and verify they work correctly
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routesToTest.map((route) => {
              const result = testResults[route.path];
              const Icon = route.icon;
              
              return (
                <motion.div
                  key={route.path}
                  className={`p-4 rounded-lg border transition-all duration-200 ${getResultColor(result)}`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {route.label}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {route.path}
                        </p>
                        {route.requiresAuth && (
                          <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full mt-1">
                            Requires Auth
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getResultIcon(result)}
                      <button
                        onClick={() => testNavigation(route)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Test this route"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {result && (
                    <div className="mt-3 text-sm">
                      {result.success ? (
                        <p className="text-green-700 dark:text-green-300">
                          ✅ Navigation successful
                        </p>
                      ) : (
                        <div className="text-red-700 dark:text-red-300">
                          <p>❌ Navigation failed</p>
                          {result.error && (
                            <p className="text-xs mt-1">Error: {result.error}</p>
                          )}
                          {result.actualPath && (
                            <p className="text-xs mt-1">
                              Expected: {result.expectedPath} | Actual: {result.actualPath}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        Tested at: {result.timestamp}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600 dark:text-gray-400">
              Current Location: <span className="font-mono">{location.pathname}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Total Routes: {routesToTest.length} | 
              Tested: {Object.keys(testResults).length} | 
              Passed: {Object.values(testResults).filter(r => r.success).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationTest;
