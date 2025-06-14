import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  Users, 
  BookOpen, 
  MessageCircle, 
  BarChart3, 
  Plus, 
  TrendingUp,
  Shield,
  Settings,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

/**
 * AppSidebar - Responsive off-canvas navigation
 * Mobile: Slide-in drawer with overlay
 * Desktop: Fixed sidebar with collapse option
 */
const AppSidebar = ({ isOpen, isCollapsed, onClose, onToggleCollapse }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();

  // Navigation items
  const mainNavigation = [
    { name: 'Trang chủ', href: '/', icon: Home, requireAuth: false },
    { name: 'Thịnh hành', href: '/community?sort=trending', icon: TrendingUp, requireAuth: false },
    { name: 'Cộng đồng', href: '/community', icon: Users, requireAuth: false },
    { name: 'Kiến thức', href: '/knowledge', icon: BookOpen, requireAuth: false },
  ];

  const userNavigation = [
    { name: 'Kiểm tra', href: '/check', icon: Search, requireAuth: false },
    { name: 'Gửi bài viết', href: '/submit', icon: Plus, requireAuth: true },
    { name: 'Trợ lý AI', href: '/chat', icon: MessageCircle, requireAuth: true },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, requireAuth: true },
  ];

  const adminNavigation = [
    { name: 'Admin', href: '/admin', icon: Shield, requireAuth: true, requireAdmin: true },
    { name: 'Cài đặt', href: '/settings', icon: Settings, requireAuth: true },
  ];

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Check if link is active
  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href.split('?')[0]);
  };

  // Navigation item component
  const NavItem = ({ item, onClick }) => {
    const active = isActive(item.href);
    
    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={cn(
          'flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
          active && 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500',
          !active && 'text-gray-700 dark:text-gray-300',
          isCollapsed && 'justify-center px-2'
        )}
        aria-label={item.name}
        aria-current={active ? 'page' : undefined}
      >
        <item.icon 
          size={20} 
          className={cn(
            'flex-shrink-0',
            !isCollapsed && 'mr-3',
            active && 'text-blue-600 dark:text-blue-400'
          )} 
        />
        {!isCollapsed && (
          <span className="truncate">{item.name}</span>
        )}
      </Link>
    );
  };

  // Section header component
  const SectionHeader = ({ title }) => {
    if (isCollapsed) return null;
    
    return (
      <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h3>
    );
  };

  // Sidebar animation variants
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className={cn(
          'fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700',
          'z-50 lg:z-40',
          // Desktop width
          isCollapsed ? 'lg:w-20' : 'lg:w-72',
          // Mobile width
          'w-72',
          // Desktop positioning
          'lg:translate-x-0'
        )}
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700',
            'h-16' // Match AppHeader height
          )}>
            {!isCollapsed && (
              <Link 
                to="/" 
                className="flex items-center space-x-2 group"
                onClick={onClose}
                aria-label="FactCheck homepage"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FactCheck
                </span>
              </Link>
            )}
            
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className={cn(
                'lg:hidden p-2 rounded-lg transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              aria-label="Close navigation menu"
            >
              <X size={20} />
            </button>
            
            {/* Desktop collapse button */}
            <button
              onClick={onToggleCollapse}
              className={cn(
                'hidden lg:block p-2 rounded-lg transition-colors',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>

          {/* Navigation Content */}
          <div className="flex-1 overflow-y-auto py-4">
            {/* Main Navigation */}
            <nav className="px-3 mb-6" role="navigation" aria-label="Main navigation">
              <SectionHeader title="Khám phá" />
              <div className="space-y-1">
                {mainNavigation.map((item) => (
                  <NavItem 
                    key={item.name} 
                    item={item} 
                    onClick={onClose}
                  />
                ))}
              </div>
            </nav>

            {/* User Navigation */}
            <nav className="px-3 mb-6" role="navigation" aria-label="User tools">
              <SectionHeader title="Công cụ" />
              <div className="space-y-1">
                {userNavigation.map((item) => {
                  if (item.requireAuth && !user) return null;
                  return (
                    <NavItem 
                      key={item.name} 
                      item={item} 
                      onClick={onClose}
                    />
                  );
                })}
              </div>
            </nav>

            {/* Admin Navigation */}
            {user && (
              <nav className="px-3" role="navigation" aria-label="Admin tools">
                <SectionHeader title="Quản lý" />
                <div className="space-y-1">
                  {adminNavigation.map((item) => {
                    if (item.requireAuth && !user) return null;
                    if (item.requireAdmin && !user?.isAdmin) return null;
                    return (
                      <NavItem 
                        key={item.name} 
                        item={item} 
                        onClick={onClose}
                      />
                    );
                  })}
                </div>
              </nav>
            )}
          </div>

          {/* Footer */}
          {!isCollapsed && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                <div className="font-medium">FactCheck v2.0</div>
                <div className="text-blue-600 dark:text-blue-400 mt-1">
                  Chống thông tin sai lệch
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default AppSidebar;
