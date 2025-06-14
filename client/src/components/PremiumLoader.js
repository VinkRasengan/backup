import React, { useEffect, useRef } from 'react';
import { gsap } from '../utils/gsap';
import { useTheme } from '../context/ThemeContext';

const PremiumLoader = ({ isLoading = true, message = "Đang tải..." }) => {
  const { isDarkMode } = useTheme();
  const containerRef = useRef();
  const dotsRef = useRef();
  const textRef = useRef();
  const circleRef = useRef();
  const pulseRef = useRef();

  useEffect(() => {
    if (!isLoading) return;

    const tl = gsap.timeline({ repeat: -1 });

    // Animated dots
    tl.to(dotsRef.current?.children || [], {
      scale: 1.5,
      opacity: 0.8,
      duration: 0.6,
      ease: "power2.inOut",
      stagger: 0.2,
      yoyo: true,
      repeat: 1
    })

    // Rotating circle
    .to(circleRef.current, {
      rotation: 360,
      duration: 2,
      ease: "none",
      repeat: -1
    }, 0)

    // Pulsing effect
    .to(pulseRef.current, {
      scale: 1.2,
      opacity: 0.6,
      duration: 1.5,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    }, 0)

    // Text animation
    .to(textRef.current, {
      opacity: 0.7,
      y: -5,
      duration: 1,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    }, 0);

    return () => tl.kill();
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'
      } backdrop-blur-sm`}
    >
      <div className="text-center">
        {/* Main loading circle */}
        <div className="relative mb-8">
          <div 
            ref={pulseRef}
            className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-30"
          ></div>
          <div 
            ref={circleRef}
            className="relative w-24 h-24 mx-auto rounded-full border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 p-1"
          >
            <div className={`w-full h-full rounded-full ${
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}></div>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1"></div>
          </div>
        </div>

        {/* Animated dots */}
        <div ref={dotsRef} className="flex justify-center space-x-2 mb-6">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
        </div>

        {/* Loading text */}
        <div ref={textRef}>
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
        </div>

        {/* Progress bar */}
        <div className={`mt-6 w-64 h-1 mx-auto rounded-full overflow-hidden ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLoader;
