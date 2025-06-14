import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Plus, X, Minimize2 } from 'lucide-react';
import { gsap } from '../../utils/gsap';
import ChatBot from '../ChatBot/ChatBot';
import FloatingActionButton from '../common/FloatingActionButton';

const WidgetManager = () => {
  const location = useLocation();
  const [chatExpanded, setChatExpanded] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [widgetPositions, setWidgetPositions] = useState({
    chat: { bottom: 20, right: 20 },
    fab: { bottom: 20, right: 90 }
  });
  
  const chatRef = useRef();
  const fabRef = useRef();
  const containerRef = useRef();

  // Handle widget collision and positioning
  useEffect(() => {
    const updatePositions = () => {
      const isMobile = window.innerWidth <= 768;
      const isChatPage = location.pathname === '/chat';
      
      if (isMobile) {
        // Stack widgets vertically on mobile
        setWidgetPositions({
          chat: { bottom: 20, right: 20 },
          fab: { bottom: chatExpanded ? 400 : 90, right: 20 }
        });
      } else {
        // Side by side on desktop
        setWidgetPositions({
          chat: { bottom: 20, right: 20 },
          fab: { bottom: 20, right: chatExpanded ? 420 : 90 }
        });
      }
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [chatExpanded, location.pathname]);

  // Animate widget interactions
  const handleChatToggle = () => {
    const newState = !chatExpanded;
    setChatExpanded(newState);
    
    if (newState && fabExpanded) {
      setFabExpanded(false);
    }
    
    // Animate FAB position change
    if (fabRef.current) {
      gsap.to(fabRef.current, {
        x: newState ? (window.innerWidth <= 768 ? 0 : -330) : 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  };

  const handleFabToggle = () => {
    const newState = !fabExpanded;
    setFabExpanded(newState);
    
    if (newState && chatExpanded) {
      setChatExpanded(false);
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50">
      {/* Chat Widget */}
      <motion.div
        ref={chatRef}
        className="fixed pointer-events-auto"
        style={{
          bottom: widgetPositions.chat.bottom,
          right: widgetPositions.chat.right,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <div className="relative">
          {/* Chat Toggle Button */}
          <motion.button
            onClick={handleChatToggle}
            className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {chatExpanded ? (
                <motion.div
                  key="minimize"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -180, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Minimize2 size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageCircle size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Chat Panel */}
          <AnimatePresence>
            {chatExpanded && (
              <motion.div
                className="absolute bottom-16 right-0 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                initial={{ scale: 0, opacity: 0, transformOrigin: "bottom right" }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "back.out(1.7)" }}
              >
                <ChatBot embedded={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* FAB Widget */}
      <motion.div
        ref={fabRef}
        className="fixed pointer-events-auto"
        style={{
          bottom: widgetPositions.fab.bottom,
          right: widgetPositions.fab.right,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      >
        <div className="relative">
          {/* FAB Toggle Button */}
          <motion.button
            onClick={handleFabToggle}
            className="w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {fabExpanded ? (
                <motion.div
                  key="close"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -180, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* FAB Menu */}
          <AnimatePresence>
            {fabExpanded && (
              <motion.div
                className="absolute bottom-16 right-0 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                initial={{ scale: 0, opacity: 0, transformOrigin: "bottom right" }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "back.out(1.7)" }}
              >
                <FloatingActionButton embedded={true} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mobile overlay when widgets are expanded */}
      <AnimatePresence>
        {(chatExpanded || fabExpanded) && window.innerWidth <= 768 && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setChatExpanded(false);
              setFabExpanded(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WidgetManager;
