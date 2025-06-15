import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, MessageCircle, X, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import ChatBot from '../ChatBot/ChatBot';
import { gsap, ScrollTrigger } from '../../utils/gsap';
import { useGSAP } from '../../hooks/useGSAP';

/**
 * FloatingActions - Fixed bottom-right floating action buttons
 * Features: Chat widget, Add menu, Scroll to top, Mobile optimized
 */
const FloatingActions = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Widget states
  const [chatOpen, setChatOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Refs for GSAP animations
  const containerRef = useRef(null);
  const chatButtonRef = useRef(null);
  const addButtonRef = useRef(null);
  const scrollTopRef = useRef(null);

  // GSAP scroll-triggered animations
  useGSAP(() => {
    if (!containerRef.current) return;

    // Initial entrance animation
    gsap.fromTo(containerRef.current,
      { opacity: 0, scale: 0.8, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.7)", delay: 1 }
    );

    // Floating animation for buttons
    gsap.to(chatButtonRef.current, {
      y: -3,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

    gsap.to(addButtonRef.current, {
      y: -3,
      duration: 2.5,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      delay: 0.5
    });

    // Scroll-triggered hide/show behavior
    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        if (velocity < -300) {
          // Scrolling down fast - hide widgets
          gsap.to(containerRef.current, {
            x: 100,
            opacity: 0.7,
            duration: 0.3,
            ease: "power2.out"
          });
        } else if (velocity > 300) {
          // Scrolling up fast - show widgets
          gsap.to(containerRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      }
    });

  }, []);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 400;
      setShowScrollTop(shouldShow);

      // GSAP animation for scroll top button
      if (scrollTopRef.current) {
        gsap.to(scrollTopRef.current, {
          scale: shouldShow ? 1 : 0,
          opacity: shouldShow ? 1 : 0,
          duration: 0.3,
          ease: "back.out(1.7)"
        });
      }
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
    const newState = !chatOpen;
    setChatOpen(newState);
    if (addMenuOpen) setAddMenuOpen(false);

    // GSAP animation for chat button
    if (chatButtonRef.current) {
      gsap.to(chatButtonRef.current, {
        scale: newState ? 1.1 : 1,
        rotation: newState ? 360 : 0,
        duration: 0.4,
        ease: "back.out(1.7)"
      });
    }
  };

  const toggleAddMenu = () => {
    const newState = !addMenuOpen;
    setAddMenuOpen(newState);
    if (chatOpen) setChatOpen(false);

    // GSAP animation for add button
    if (addButtonRef.current) {
      gsap.to(addButtonRef.current, {
        rotation: newState ? 45 : 0,
        scale: newState ? 1.1 : 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      });
    }
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
        ref={containerRef}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4"
        style={{ margin: '24px' }}
      >
        
        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              ref={scrollTopRef}
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
            ref={addButtonRef}
            onClick={toggleAddMenu}
            className={cn(
              'w-14 h-14 rounded-full shadow-xl transition-all duration-300 group',
              'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
              'text-white transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300/50',
              addMenuOpen && 'ring-4 ring-blue-300/50'
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
            ref={chatButtonRef}
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
