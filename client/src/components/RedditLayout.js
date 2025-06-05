import React from 'react';
import { useLocation } from 'react-router-dom';
import RedditNavigation from './RedditNavigation';
import TopBar from './TopBar';
import ModernNavigation from './ModernNavigation';
import { useTheme } from '../context/ThemeContext';

const RedditLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  // Pages that should use the Reddit layout
  const redditPages = ['/community', '/submit', '/knowledge', '/dashboard', '/admin', '/chat', '/profile'];
  const shouldUseRedditLayout = redditPages.some(page => location.pathname.startsWith(page));

  if (!shouldUseRedditLayout) {
    // Use original layout for homepage, login, register, etc.
    return (
      <>
        <ModernNavigation />
        <main>{children}</main>
      </>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left Sidebar Navigation */}
      <RedditNavigation />
      
      {/* Top Bar */}
      <TopBar />
      
      {/* Main Content */}
      <main className="ml-64 pt-16">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default RedditLayout;
