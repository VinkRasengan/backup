import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import UnifiedWidgets from './UnifiedWidgets';
import MobileTabBar from '../navigation/MobileTabBar';
import { cn } from '../../utils/cn';

/**
 * AppLayout - Main layout wrapper for the entire application
 * Handles responsive sidebar, floating widgets, and page structure
 */
const AppLayout = ({ children, className, ...props }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  
  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Responsive sidebar management
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
        setSidebarCollapsed(false);
      } else {
        setSidebarOpen(false);
        setSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Determine if we should show sidebar (hide on login/register pages only)
  const showSidebar = user && !['/login', '/register'].includes(location.pathname);

  return (
    <div
      className={cn(
        'bg-gray-50 dark:bg-gray-900 transition-colors duration-300',
        className
      )}
      data-theme={isDarkMode ? 'dark' : 'light'}
      {...props}
    >
      {/* App Header */}
      <AppHeader
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={showSidebar}
      />

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <AppSidebar
            isOpen={sidebarOpen}
            isCollapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Main Content Area */}
        <main
          className={cn(
            'flex-1 transition-all duration-300',
            showSidebar && sidebarOpen && !sidebarCollapsed && 'lg:ml-[280px]',
            showSidebar && sidebarOpen && sidebarCollapsed && 'lg:ml-[80px]',
            'pt-16' // Account for fixed header
          )}
        >
          {/* Page Content */}
          <div className="relative">
            {children}
          </div>
        </main>
      </div>

      {/* Unified Widgets - Replaces all duplicated floating widgets */}
      <UnifiedWidgets />

      {/* Mobile Navigation Bar */}
      <MobileTabBar />

      {/* Accessibility Skip Link */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>
    </div>
  );
};

export default AppLayout;
