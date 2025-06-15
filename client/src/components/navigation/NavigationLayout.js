import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NavigationSidebar from './NavigationSidebar';
import HamburgerMenu from './HamburgerMenu';

import MobileTabBar from './MobileTabBar';
import NotificationWidget from '../widgets/NotificationWidget';
import QuickActionWidget from '../widgets/QuickActionWidget';
import PerformanceMonitor from '../testing/PerformanceMonitor';
import TestingDashboard from '../testing/TestingDashboard';
import ScrollDebugPanel from '../debug/ScrollDebugPanel';
import { cn } from '../../utils/cn';

const NavigationLayout = ({ children, showHamburger = true, className, ...props }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [performanceMonitorOpen, setPerformanceMonitorOpen] = useState(false);
  const [testingDashboardOpen, setTestingDashboardOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Toggle performance monitor and testing dashboard with keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setPerformanceMonitorOpen(!performanceMonitorOpen);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setTestingDashboardOpen(!testingDashboardOpen);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [performanceMonitorOpen, testingDashboardOpen]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Don't show navigation on login/register pages, and homepage only when not logged in
  const hideNavigation = ['/login', '/register'].includes(location.pathname) || (!user && location.pathname === '/');

  return (
    <div
      className={cn(
        'bg-gray-50 dark:bg-gray-900 transition-colors duration-300 min-h-screen',
        className
      )}
      data-theme={isDarkMode ? 'dark' : 'light'}
      style={{ overflow: 'visible', height: 'auto' }}
      {...props}
    >
      {/* Hamburger Menu Button */}
      {showHamburger && !hideNavigation && (
        <HamburgerMenu 
          isOpen={sidebarOpen}
          onClick={toggleSidebar}
        />
      )}

      {/* Navigation Sidebar */}
      {!hideNavigation && (
        <NavigationSidebar 
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
        />
      )}      {/* Main Content */}
      <div
        className={`nav-content nav-transition ${sidebarOpen && !hideNavigation ? 'nav-container with-sidebar' : 'nav-container'}`}
        style={{ overflow: 'visible', height: 'auto', minHeight: 'auto' }}
      >
        {children}
      </div>

      {/* Unified Widgets - No duplicates */}
      {!hideNavigation && (
        <>
          <NotificationWidget />
          <QuickActionWidget />
        </>
      )}

      {/* Performance Monitor */}
      <PerformanceMonitor
        isOpen={performanceMonitorOpen}
        onClose={() => setPerformanceMonitorOpen(false)}
      />

      {/* Testing Dashboard */}
      <TestingDashboard
        isOpen={testingDashboardOpen}
        onClose={() => setTestingDashboardOpen(false)}
      />

      {/* Mobile Navigation Bar */}
      <MobileTabBar />

      {/* Debug Tools */}
      <ScrollDebugPanel />

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

NavigationLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showHamburger: PropTypes.bool,
  className: PropTypes.string
};

export default NavigationLayout;
