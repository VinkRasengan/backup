import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoutingDebug = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const testRoutes = [
    '/',
    '/login',
    '/register',
    '/dashboard',
    '/check',
    '/profile',
    '/chat',
    '/community',
    '/submit',
    '/knowledge',
    '/settings',
    '/admin',
    '/admin/dashboard',
    '/admin/firestore-test',
    '/security',
    '/analytics',
    '/premium',
    '/notifications',
    '/favorites',
    '/achievements',
    '/help'
  ];

  const handleRouteTest = (route) => {
    navigate(route);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="text-lg font-semibold mb-2">Routing Debug</h3>
      <div className="text-sm mb-2">
        <strong>Current:</strong> {location.pathname}
      </div>
      <div className="text-sm mb-2">
        <strong>User:</strong> {user ? user.email : 'Not logged in'}
      </div>
      <div className="max-h-40 overflow-y-auto">
        <h4 className="font-medium mb-1">Test Routes:</h4>
        {testRoutes.map((route) => (
          <button
            key={route}
            onClick={() => handleRouteTest(route)}
            className={`block w-full text-left px-2 py-1 text-xs rounded mb-1 ${
              location.pathname === route
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {route}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoutingDebug;
