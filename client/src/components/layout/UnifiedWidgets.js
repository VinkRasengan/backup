import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Plus, 
  X, 
  ChevronUp,
  Search,
  Users,
  PenTool,
  Shield,
  Settings,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import ChatBot from '../ChatBot/ChatBot';

/**
 * UnifiedWidgets - Single source of truth for all floating widgets
 * Replaces all duplicated widget components across the app
 * Features: Chat widget, Quick actions, Scroll to top, Mobile optimized
 */
const UnifiedWidgets = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Widget states
  const [chatOpen, setChatOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Refs for animations
  const containerRef = useRef(null);
  const chatButtonRef = useRef(null);
  const quickMenuRef = useRef(null);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close widgets when route changes
  useEffect(() => {
    setChatOpen(false);
    setQuickMenuOpen(false);
  }, [location.pathname]);

  // Quick action menu items
  const quickActions = [
    {
      id: 'check',
      icon: Search,
      label: 'Kiểm tra Link',
      path: '/check',
      color: 'from-green-500 to-green-600',
      requireAuth: false
    },
    {
      id: 'community',
      icon: Users,
      label: 'Cộng đồng',
      path: '/community',
      color: 'from-purple-500 to-purple-600',
      requireAuth: false
    },
    {
      id: 'submit',
      icon: PenTool,
      label: 'Gửi bài',
      path: '/submit',
      color: 'from-orange-500 to-orange-600',
      requireAuth: true
    },
    {
      id: 'dashboard',
      icon: Shield,
      label: 'Dashboard',
      path: '/dashboard',
      color: 'from-indigo-500 to-indigo-600',
      requireAuth: true
    },
    {
      id: 'knowledge',
      icon: BookOpen,
      label: 'Kiến thức',
      path: '/knowledge',
      color: 'from-amber-500 to-amber-600',
      requireAuth: false
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Cài đặt',
      path: '/settings',
      color: 'from-gray-500 to-gray-600',
      requireAuth: true
    }
  ];

  // Filter actions based on auth status
  const availableActions = quickActions.filter(action => 
    !action.requireAuth || user
  );

  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (quickMenuOpen) setQuickMenuOpen(false);
  };

  const toggleQuickMenu = () => {
    setQuickMenuOpen(!quickMenuOpen);
    if (chatOpen) setChatOpen(false);
  };

  const handleActionClick = (action) => {
    navigate(action.path);
    setQuickMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Main Widget Container - Fixed positioning */}
      <div 
        ref={containerRef}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4"
        style={{ margin: '24px' }}
      >
        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              className={cn(
                'w-12 h-12 rounded-full shadow-lg transition-all duration-200',
                'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-xl',
                'border border-gray-200 dark:border-gray-700',
                'flex items-center justify-center'
              )}
              aria-label="Scroll to top"
            >
              <ChevronUp size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Quick Actions Menu */}
        <AnimatePresence>
          {quickMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="flex flex-col space-y-3 mb-4"
            >
              {availableActions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleActionClick(action)}
                  className={cn(
                    'w-12 h-12 rounded-full shadow-lg transition-all duration-200',
                    'flex items-center justify-center text-white',
                    'hover:shadow-xl hover:scale-110',
                    `bg-gradient-to-r ${action.color}`
                  )}
                  title={action.label}
                  aria-label={action.label}
                >
                  <action.icon size={20} />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Widget Buttons Row */}
        <div className="flex items-center space-x-4">
          {/* Quick Menu Button */}
          <motion.button
            ref={quickMenuRef}
            onClick={toggleQuickMenu}
            className={cn(
              'w-14 h-14 rounded-full shadow-xl transition-all duration-300',
              'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
              'text-white transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300/50',
              quickMenuOpen && 'ring-4 ring-blue-300/50 rotate-45'
            )}
            aria-label={quickMenuOpen ? 'Close quick menu' : 'Open quick menu'}
            aria-expanded={quickMenuOpen}
          >
            {quickMenuOpen ? <X size={24} /> : <Plus size={24} />}
          </motion.button>

          {/* Chat Button */}
          <motion.button
            ref={chatButtonRef}
            onClick={toggleChat}
            className={cn(
              'w-14 h-14 rounded-full shadow-xl transition-all duration-300',
              'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
              'text-white transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300/50',
              chatOpen && 'ring-4 ring-purple-300/50'
            )}
            aria-label={chatOpen ? 'Close chat' : 'Open chat'}
            aria-expanded={chatOpen}
          >
            <MessageCircle size={24} />
            
            {/* Notification Dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          </motion.button>
        </div>
      </div>

      {/* Chat Widget */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-40"
            style={{ margin: '24px' }}
          >
            <div className={cn(
              'w-80 h-96 lg:w-96 lg:h-[500px] rounded-xl shadow-2xl overflow-hidden',
              'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            )}>
              <ChatBot
                onClose={() => setChatOpen(false)}
                isFloating={true}
                embedded={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {(chatOpen || quickMenuOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => {
              setChatOpen(false);
              setQuickMenuOpen(false);
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default UnifiedWidgets;
