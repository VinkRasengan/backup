import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, MessageCircle, X, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';
import ChatBot from '../ChatBot/ChatBot';

/**
 * FloatingWidgets - Fixed position widgets that follow scroll
 * Includes chat widget, add button, and scroll to top
 */
const FloatingWidgets = () => {
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

  return (
    <>
      {/* Floating Action Buttons Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
        
        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className={cn(
              'w-12 h-12 rounded-full shadow-lg transition-all duration-300',
              'bg-gray-600 hover:bg-gray-700 text-white',
              'dark:bg-gray-700 dark:hover:bg-gray-600',
              'transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-gray-300/50'
            )}
            aria-label="Scroll to top"
          >
            <ChevronUp size={20} className="mx-auto" />
          </button>
        )}

        {/* Add Menu */}
        {addMenuOpen && (
          <div className="flex flex-col items-end space-y-3 mb-2">
            <Link
              to="/submit"
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-full shadow-lg transition-all duration-300',
                'bg-green-500 hover:bg-green-600 text-white',
                'transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300/50'
              )}
              aria-label="Submit new link"
            >
              <span className="text-sm font-medium whitespace-nowrap">Submit Link</span>
              <Plus size={18} />
            </Link>
            
            <Link
              to="/check"
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-full shadow-lg transition-all duration-300',
                'bg-blue-500 hover:bg-blue-600 text-white',
                'transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300/50'
              )}
              aria-label="Check new link"
            >
              <span className="text-sm font-medium whitespace-nowrap">Check Link</span>
              <Plus size={18} />
            </Link>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={toggleAddMenu}
          className={cn(
            'w-14 h-14 rounded-full shadow-xl transition-all duration-300',
            'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
            'text-white transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300/50',
            addMenuOpen && 'rotate-45'
          )}
          aria-label={addMenuOpen ? 'Close add menu' : 'Open add menu'}
          aria-expanded={addMenuOpen}
        >
          {addMenuOpen ? <X size={24} /> : <Plus size={24} />}
        </button>

        {/* Chat Button */}
        <button
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
        </button>
      </div>

      {/* Chat Widget */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-40">
          <div className={cn(
            'w-80 h-96 lg:w-96 lg:h-[500px] rounded-2xl shadow-2xl overflow-hidden',
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
            'transform transition-all duration-300 ease-out',
            'animate-in slide-in-from-bottom-4 fade-in-0'
          )}>
            <ChatBot 
              embedded={true}
              onClose={() => setChatOpen(false)}
              isFloating={true}
            />
          </div>
        </div>
      )}

      {/* Backdrop for mobile */}
      {(chatOpen || addMenuOpen) && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => {
            setChatOpen(false);
            setAddMenuOpen(false);
          }}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default FloatingWidgets;
