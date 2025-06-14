import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

/**
 * StickyHeroButtons - Buttons that stick to top when hero section scrolls out
 * Features: Intersection Observer, smooth transitions, responsive design
 */
const StickyHeroButtons = ({ heroRef, className }) => {
  const { user } = useAuth();
  const [isSticky, setIsSticky] = useState(false);
  const [heroHeight, setHeroHeight] = useState(0);
  const buttonsRef = useRef(null);

  useEffect(() => {
    if (!heroRef?.current) return;

    const heroElement = heroRef.current;
    
    // Get hero height
    const updateHeroHeight = () => {
      setHeroHeight(heroElement.offsetHeight);
    };
    
    updateHeroHeight();
    window.addEventListener('resize', updateHeroHeight);

    // Intersection Observer for sticky behavior
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When hero is not visible, make buttons sticky
        setIsSticky(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '-100px 0px 0px 0px', // Trigger 100px before hero disappears
        threshold: 0
      }
    );

    observer.observe(heroElement);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeroHeight);
    };
  }, [heroRef]);

  // Animation variants
  const stickyVariants = {
    hidden: {
      y: -100,
      opacity: 0,
      scale: 0.8
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    }
  };

  const buttonVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isSticky && (
        <motion.div
          ref={buttonsRef}
          variants={stickyVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={cn(
            'fixed top-20 left-1/2 transform -translate-x-1/2 z-40',
            'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm',
            'border border-gray-200 dark:border-gray-700 rounded-2xl',
            'shadow-lg px-6 py-4',
            className
          )}
          style={{
            // Ensure it appears after header
            top: '80px'
          }}
        >
          <div className="flex flex-wrap gap-4 justify-center">
            <motion.div variants={buttonVariants}>
              <Link
                to="/check"
                className={cn(
                  'group relative px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm',
                  'hover:bg-blue-700 transition-all duration-300 flex items-center gap-2',
                  'shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105',
                  'focus:outline-none focus:ring-4 focus:ring-blue-300/50'
                )}
                aria-label="Check link credibility now"
              >
                <Search size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                <span>Kiểm Tra Ngay</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              </Link>
            </motion.div>

            {user ? (
              <motion.div variants={buttonVariants}>
                <Link
                  to="/dashboard"
                  className={cn(
                    'group relative px-6 py-3 bg-transparent border-2 border-blue-600 text-blue-600',
                    'rounded-xl font-semibold text-sm hover:bg-blue-600 hover:text-white',
                    'transition-all duration-300 flex items-center gap-2',
                    'shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105',
                    'focus:outline-none focus:ring-4 focus:ring-blue-300/50'
                  )}
                  aria-label="View your dashboard"
                >
                  <BarChart3 size={18} className="group-hover:scale-110 transition-transform duration-300" />
                  <span>Dashboard</span>
                </Link>
              </motion.div>
            ) : (
              <motion.div variants={buttonVariants}>
                <Link
                  to="/register"
                  className={cn(
                    'group relative px-6 py-3 bg-transparent border-2 border-blue-600 text-blue-600',
                    'rounded-xl font-semibold text-sm hover:bg-blue-600 hover:text-white',
                    'transition-all duration-300 flex items-center gap-2',
                    'shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105',
                    'focus:outline-none focus:ring-4 focus:ring-blue-300/50'
                  )}
                  aria-label="Register for free account"
                >
                  <span>Đăng Ký Miễn Phí</span>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Floating indicator */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyHeroButtons;
