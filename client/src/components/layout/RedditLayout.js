import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RedditNavigation, TopBar, ModernNavigation } from '../navigation';
import { useTheme } from '../../context/ThemeContext';

const RedditLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  // Pages that should use the Reddit layout
  const redditPages = ['/community', '/submit', '/knowledge', '/dashboard', '/admin', '/chat', '/profile', '/check'];
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
      <RedditNavigation onCollapseChange={setIsNavCollapsed} />

      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${isNavCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default RedditLayout;
