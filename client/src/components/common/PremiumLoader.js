import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from '../../utils/gsap';
import { useTheme } from '../../context/ThemeContext';

const PremiumLoader = ({ 
  isLoading = true, 
  message = "Đang tải...", 
  progress = null,
  type = 'default' // 'default', 'minimal', 'dots'
}) => {
  const { isDarkMode } = useTheme();
  const containerRef = useRef();
  const circleRef = useRef();
  const dotsRef = useRef();

  useEffect(() => {
    if (!isLoading || !circleRef.current) return;

    // Main circle rotation
    const rotationTween = gsap.to(circleRef.current, {
      rotation: 360,
      duration: 2,
      ease: "none",
      repeat: -1
    });

    // Dots animation
    if (dotsRef.current?.children) {
      const dotsTween = gsap.to(dotsRef.current.children, {
        scale: 1.5,
        opacity: 0.8,
        duration: 0.6,
        ease: "power2.inOut",
        stagger: 0.2,
        yoyo: true,
        repeat: -1
      });

      return () => {
        rotationTween.kill();
        dotsTween.kill();
      };
    }

    return () => {
      rotationTween.kill();
    };
  }, [isLoading]);

  if (!isLoading) return null;

  const LoaderMinimal = () => (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
    </div>
  );

  const LoaderDots = () => (
    <div ref={dotsRef} className="flex justify-center space-x-2">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          delay: 0
        }}
        className="w-3 h-3 bg-blue-500 rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          delay: 0.3
        }}
        className="w-3 h-3 bg-purple-500 rounded-full"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          delay: 0.6
        }}
        className="w-3 h-3 bg-pink-500 rounded-full"
      />
    </div>
  );

  const LoaderDefault = () => (
    <div className="text-center">
      {/* Main loading circle with proper overflow handling */}
      <div className="relative mb-8 mx-auto w-24 h-24">
        {/* Background circle */}
        <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"></div>
        
        {/* Rotating border */}
        <div 
          ref={circleRef}
          className="relative w-24 h-24 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, #3b82f6 90deg, transparent 360deg)`,
            mask: 'radial-gradient(circle at center, transparent 36px, black 38px)',
            WebkitMask: 'radial-gradient(circle at center, transparent 36px, black 38px)'
          }}
        >
          {/* Inner circle to create donut effect */}
          <div className={`absolute inset-2 rounded-full ${
            isDarkMode ? 'bg-gray-900' : 'bg-white'
          }`}></div>
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Animated dots */}
      <LoaderDots />

      {/* Loading text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6"
      >
        <h3 className={`text-xl font-semibold mb-2 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {message}
        </h3>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Vui lòng đợi trong giây lát...
        </p>
      </motion.div>

      {/* Progress bar */}
      {progress !== null && (
        <div className={`mt-6 w-64 h-2 mx-auto rounded-full overflow-hidden ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}
    </div>
  );

  const renderLoader = () => {
    switch (type) {
      case 'minimal':
        return <LoaderMinimal />;
      case 'dots':
        return <LoaderDots />;
      default:
        return <LoaderDefault />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed inset-0 z-50 flex items-center justify-center ${
          isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
        } backdrop-blur-sm`}
      >
        {renderLoader()}
      </motion.div>
    </AnimatePresence>
  );
};

export default PremiumLoader;
