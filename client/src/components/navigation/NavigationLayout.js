import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NavigationSidebar from './NavigationSidebar';
import HamburgerMenu from './HamburgerMenu';
import FloatingActions from '../layout/FloatingActions';
import MobileTabBar from './MobileTabBar';
import { cn } from '../../utils/cn';

const NavigationLayout = ({ children, showHamburger = true, className, ...props }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
        'min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300',
        className
      )}
      data-theme={isDarkMode ? 'dark' : 'light'}
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
      <div className={`nav-content nav-transition ${sidebarOpen && !hideNavigation ? 'nav-container with-sidebar' : 'nav-container'}`}>
        {children}
      </div>

      {/* Floating Actions */}
      <FloatingActions />

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

NavigationLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showHamburger: PropTypes.bool,
  className: PropTypes.string
};

export default NavigationLayout;
