import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, MessageCircle, X, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import ChatBot from '../ChatBot/ChatBot';

/**
 * FloatingActions - Fixed bottom-right floating action buttons
 * Features: Chat widget, Add menu, Scroll to top, Mobile optimized
 */
const FloatingActions = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  
  // Widget states
  const [chatOpen, setChatOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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
    setAddMenuOpen(false);
  }, [location.pathname]);

  // Don't show on login/register pages
  if (!user || ['/login', '/register'].includes(location.pathname)) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (addMenuOpen) setAddMenuOpen(false);
  };

  const toggleAddMenu = () => {
    setAddMenuOpen(!addMenuOpen);
    if (chatOpen) setChatOpen(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <>
      {/* Fixed Container - Bottom Right with 24px margin */}
      <div 
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
                'w-12 h-12 rounded-full shadow-lg transition-all duration-300',
                'bg-gray-600 hover:bg-gray-700 text-white',
                'dark:bg-gray-700 dark:hover:bg-gray-600',
                'transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-gray-300/50',
                'group'
              )}
              aria-label="Scroll to top"
              title="Scroll to top"
            >
              <ChevronUp size={20} className="mx-auto group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Add Menu Dropdown */}
        <AnimatePresence>
          {addMenuOpen && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-col items-end space-y-3 mb-2"
            >
              <motion.div variants={itemVariants}>
                <Link
                  to="/submit"
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-full shadow-lg transition-all duration-300',
                    'bg-green-500 hover:bg-green-600 text-white',
                    'transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300/50',
                    'group'
                  )}
                  aria-label="Submit new article"
                  title="Submit new article"
                >
                  <span className="text-sm font-medium whitespace-nowrap">Submit Article</span>
                  <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </Link>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <Link
                  to="/check"
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-full shadow-lg transition-all duration-300',
                    'bg-blue-500 hover:bg-blue-600 text-white',
                    'transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300/50',
                    'group'
                  )}
                  aria-label="Check link credibility"
                  title="Check link credibility"
                >
                  <span className="text-sm font-medium whitespace-nowrap">Check Link</span>
                  <Search size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Action Buttons */}
        <div className="flex flex-col space-y-3">
          {/* Add Button - Mobile: Only icon, Desktop: Full button */}
          <button
            onClick={toggleAddMenu}
            className={cn(
              'w-14 h-14 rounded-full shadow-xl transition-all duration-300 group',
              'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
              'text-white transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300/50',
              addMenuOpen && 'rotate-45 ring-4 ring-blue-300/50'
            )}
            aria-label={addMenuOpen ? 'Close add menu' : 'Open add menu'}
            aria-expanded={addMenuOpen}
            title={addMenuOpen ? 'Close add menu' : 'Add new content'}
          >
            {addMenuOpen ? (
              <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            ) : (
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            )}
          </button>

          {/* Chat Button */}
          <button
            onClick={toggleChat}
            className={cn(
              'w-14 h-14 rounded-full shadow-xl transition-all duration-300 group relative',
              'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700',
              'text-white transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300/50',
              chatOpen && 'ring-4 ring-purple-300/50'
            )}
            aria-label={chatOpen ? 'Close chat' : 'Open chat assistant'}
            aria-expanded={chatOpen}
            title={chatOpen ? 'Close chat' : 'Chat with AI assistant'}
          >
            <MessageCircle size={24} className="group-hover:scale-110 transition-transform duration-300" />
            
            {/* Notification Dot */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse">
              <span className="sr-only">New messages available</span>
            </div>
          </button>
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
        {(chatOpen || addMenuOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => {
              setChatOpen(false);
              setAddMenuOpen(false);
            }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingActions;
