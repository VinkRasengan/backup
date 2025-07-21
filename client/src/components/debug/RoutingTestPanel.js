import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateRoutes, getRouteProtection } from '../../utils/routeValidator';

const RoutingTestPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const allRoutes = [
    // Public routes
    { path: '/', name: 'Home', type: 'public' },
    { path: '/login', name: 'Login', type: 'public' },
    { path: '/register', name: 'Register', type: 'public' },
    { path: '/community', name: 'Community', type: 'public' },
    { path: '/knowledge', name: 'Knowledge Base', type: 'public' },
    { path: '/help', name: 'Help', type: 'public' },
    
    // Protected routes
    { path: '/dashboard', name: 'Dashboard', type: 'protected' },
    { path: '/profile', name: 'Profile', type: 'protected' },
    { path: '/settings', name: 'Settings', type: 'protected' },
    { path: '/notifications', name: 'Notifications', type: 'protected' },
    { path: '/favorites', name: 'Favorites', type: 'protected' },
    { path: '/achievements', name: 'Achievements', type: 'protected' },
    { path: '/security', name: 'Security', type: 'protected' },
    { path: '/analytics', name: 'Analytics', type: 'protected' },
    { path: '/premium', name: 'Premium', type: 'protected' },
    
    // Email verified routes
    { path: '/check', name: 'Check Link', type: 'email-verified' },
    { path: '/chat', name: 'AI Chat', type: 'email-verified' },
    { path: '/submit', name: 'Submit Article', type: 'email-verified' },
    { path: '/my-submissions', name: 'My Submissions', type: 'email-verified' },
    
    // Admin routes
    { path: '/admin', name: 'Admin', type: 'admin' },
    { path: '/admin/dashboard', name: 'Admin Dashboard', type: 'admin' },
    { path: '/admin/firestore-test', name: 'Firestore Test', type: 'admin' },
    
    // Settings sub-routes
    { path: '/settings/account', name: 'Account Settings', type: 'protected' },
    { path: '/settings/security', name: 'Security Settings', type: 'protected' },
    { path: '/settings/notifications', name: 'Notification Settings', type: 'protected' },
    { path: '/settings/appearance', name: 'Appearance Settings', type: 'protected' }
  ];

  const testRoute = (route) => {
    const startTime = Date.now();
    const currentPath = location.pathname;
    
    try {
      navigate(route.path);
      
      // Add result after a short delay to see if navigation worked
      setTimeout(() => {
        const endTime = Date.now();
        const newPath = window.location.pathname;
        const success = newPath === route.path || (route.path === '/' && newPath === '/');
        
        const result = {
          route: route.path,
          name: route.name,
          type: route.type,
          success,
          actualPath: newPath,
          expectedPath: route.path,
          time: endTime - startTime,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
      }, 100);
      
    } catch (error) {
      const result = {
        route: route.path,
        name: route.name,
        type: route.type,
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setTestResults(prev => [result, ...prev.slice(0, 9)]);
    }
  };

  const runAllTests = () => {
    setTestResults([]);
    allRoutes.forEach((route, index) => {
      setTimeout(() => testRoute(route), index * 200);
    });
  };

  const validateRouteConsistency = () => {
    const validation = validateRoutes();
    alert(`Route Validation:\n\nValid: ${validation.isValid}\nApp Routes: ${validation.appRoutes.length}\nSidebar Routes: ${validation.sidebarRoutes.length}\nMobile Routes: ${validation.mobileTabRoutes.length}\n\nIssues:\n${validation.sidebarOnlyRoutes.length > 0 ? 'Sidebar-only routes: ' + validation.sidebarOnlyRoutes.join(', ') : 'No sidebar issues'}\n${validation.mobileOnlyRoutes.length > 0 ? 'Mobile-only routes: ' + validation.mobileOnlyRoutes.join(', ') : 'No mobile issues'}`);
  };

  const getRouteTypeColor = (type) => {
    switch (type) {
      case 'public': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'protected': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'email-verified': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium"
      >
        🧪 Routing Test
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 w-96 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
        <h3 className="font-semibold">🧪 Routing Test Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
      
      {/* Current Status */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 text-sm">
        <div><strong>Current:</strong> {location.pathname}</div>
        <div><strong>User:</strong> {user ? user.email : 'Not logged in'}</div>
        <div><strong>Protection:</strong> {getRouteProtection(location.pathname)}</div>
      </div>
      
      {/* Controls */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={runAllTests}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Test All Routes
          </button>
          <button
            onClick={validateRouteConsistency}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
          >
            Validate
          </button>
        </div>
      </div>
      
      {/* Route List */}
      <div className="max-h-48 overflow-y-auto">
        <div className="p-2">
          <h4 className="text-sm font-semibold mb-2">Quick Navigation:</h4>
          <div className="grid grid-cols-1 gap-1">
            {allRoutes.slice(0, 12).map((route) => (
              <button
                key={route.path}
                onClick={() => testRoute(route)}
                className={`text-left px-2 py-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center ${
                  location.pathname === route.path ? 'bg-blue-100 dark:bg-blue-900' : ''
                }`}
              >
                <span>{route.name}</span>
                <span className={`px-1 rounded text-xs ${getRouteTypeColor(route.type)}`}>
                  {route.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
          <div className="p-2">
            <h4 className="text-sm font-semibold mb-2">Recent Tests:</h4>
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`text-xs p-1 mb-1 rounded ${
                  result.success 
                    ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                <div className="flex justify-between">
                  <span>{result.success ? '✅' : '❌'} {result.name}</span>
                  <span>{result.timestamp}</span>
                </div>
                {!result.success && result.error && (
                  <div className="text-xs opacity-75">{result.error}</div>
                )}
                {result.actualPath !== result.expectedPath && (
                  <div className="text-xs opacity-75">
                    Expected: {result.expectedPath} → Got: {result.actualPath}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutingTestPanel;
