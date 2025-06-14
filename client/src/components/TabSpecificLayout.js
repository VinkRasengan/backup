import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const TabSpecificLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  // Tab-specific configurations
  const getTabConfig = (pathname) => {
    switch (pathname) {
      case '/':
        return {
          name: 'home',
          bgClass: isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
            : 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
          containerClass: 'min-h-screen',
          contentClass: 'relative z-10'
        };
      
      case '/check':
        return {
          name: 'check',
          bgClass: isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-green-900 to-blue-900' 
            : 'bg-gradient-to-br from-green-50 via-white to-blue-50',
          containerClass: 'min-h-screen flex items-center justify-center',
          contentClass: 'w-full max-w-4xl mx-auto px-4'
        };
      
      case '/community':
        return {
          name: 'community',
          bgClass: isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900' 
            : 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
          containerClass: 'min-h-screen',
          contentClass: 'relative z-10'
        };
      
      case '/chat':
        return {
          name: 'chat',
          bgClass: isDarkMode 
            ? 'bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900' 
            : 'bg-gradient-to-br from-indigo-50 via-white to-blue-50',
          containerClass: 'h-screen flex flex-col overflow-hidden',
          contentClass: 'flex-1 flex flex-col'
        };
      
      case '/submit':
        return {
          name: 'submit',
          bgClass: isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-orange-900 to-red-900'
            : 'bg-gradient-to-br from-orange-50 via-white to-red-50',
          containerClass: 'min-h-screen',
          contentClass: 'relative z-10'
        };

      case '/my-submissions':
        return {
          name: 'my-submissions',
          bgClass: isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900'
            : 'bg-gradient-to-br from-teal-50 via-white to-cyan-50',
          containerClass: 'min-h-screen',
          contentClass: 'relative z-10'
        };

      case '/dashboard':
        return {
          name: 'dashboard',
          bgClass: isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800'
            : 'bg-gradient-to-br from-slate-50 via-white to-gray-50',
          containerClass: 'min-h-screen',
          contentClass: 'relative z-10'
        };

      default:
        return {
          name: 'default',
          bgClass: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
          containerClass: 'min-h-screen',
          contentClass: 'relative z-10'
        };
    }
  };

  const config = getTabConfig(location.pathname);

  // Apply tab-specific body classes
  useEffect(() => {
    const body = document.body;
    
    // Remove all previous tab classes
    body.classList.remove(
      'tab-home', 'tab-check', 'tab-community',
      'tab-chat', 'tab-dashboard', 'tab-submit',
      'tab-my-submissions', 'tab-default'
    );
    
    // Add current tab class
    body.classList.add(`tab-${config.name}`);
    
    return () => {
      body.classList.remove(`tab-${config.name}`);
    };
  }, [config.name]);

  return (
    <div className={`${config.bgClass} ${config.containerClass} transition-all duration-500 relative`}>
      {/* Tab-specific background effects */}
      {config.name === 'home' && (
        <>
          {/* Floating particles for home */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </>
      )}
      
      {config.name === 'check' && (
        <>
          {/* Scanning effect for check page */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-green-400/20 rounded-full animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-400/30 rounded-full animate-ping delay-500"></div>
          </div>
        </>
      )}
      
      {config.name === 'community' && (
        <>
          {/* Social network effect for community */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/6 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl animate-bounce"></div>
            <div className="absolute top-2/3 right-1/6 w-48 h-48 bg-pink-400/10 rounded-full blur-2xl animate-bounce delay-700"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-indigo-400/10 rounded-full blur-xl animate-bounce delay-1000"></div>
          </div>
        </>
      )}
      
      {config.name === 'chat' && (
        <>
          {/* Conversation bubbles for chat */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-blue-400/20 rounded-full animate-pulse"></div>
            <div className="absolute top-3/4 left-1/4 w-12 h-12 bg-indigo-400/20 rounded-full animate-pulse delay-500"></div>
            <div className="absolute top-1/2 right-1/6 w-20 h-20 bg-purple-400/20 rounded-full animate-pulse delay-1000"></div>
          </div>
        </>
      )}
      
      {config.name === 'submit' && (
        <>
          {/* Creative submission effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-orange-400/10 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute top-3/4 left-1/4 w-32 h-32 bg-red-400/10 rounded-full blur-xl animate-pulse delay-700"></div>
          </div>
        </>
      )}

      {config.name === 'my-submissions' && (
        <>
          {/* Personal content effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/3 w-24 h-24 bg-teal-400/10 rounded-full blur-xl animate-bounce"></div>
            <div className="absolute top-2/3 right-1/3 w-36 h-36 bg-cyan-400/10 rounded-full blur-2xl animate-bounce delay-500"></div>
          </div>
        </>
      )}

      {config.name === 'dashboard' && (
        <>
          {/* Data visualization effect for dashboard */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/3 w-2 h-32 bg-gradient-to-t from-transparent to-blue-400/20 animate-pulse"></div>
            <div className="absolute top-1/3 left-1/2 w-2 h-24 bg-gradient-to-t from-transparent to-green-400/20 animate-pulse delay-300"></div>
            <div className="absolute top-1/2 left-2/3 w-2 h-40 bg-gradient-to-t from-transparent to-purple-400/20 animate-pulse delay-600"></div>
          </div>
        </>
      )}
      
      <div className={`${config.contentClass} relative z-10`}>
        {children}
      </div>
    </div>
  );
};

export default TabSpecificLayout;
