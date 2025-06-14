import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from '../utils/gsap';
import { useTheme } from '../context/ThemeContext';

const PageTransition = ({ children }) => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const containerRef = useRef();
  const overlayRef = useRef();
  const contentRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    const content = contentRef.current;

    if (!container || !overlay || !content) return;

    // Page transition animation
    const tl = gsap.timeline();

    // Entry animation
    tl.set(overlay, {
      scaleX: 0,
      transformOrigin: 'left center'
    })
    .set(content, {
      opacity: 0,
      y: 50
    })
    .to(overlay, {
      scaleX: 1,
      duration: 0.6,
      ease: 'power2.inOut'
    })
    .to(overlay, {
      scaleX: 0,
      transformOrigin: 'right center',
      duration: 0.6,
      ease: 'power2.inOut'
    })
    .to(content, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.3');

    return () => tl.kill();
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="relative">
      {/* Transition overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 z-50 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900' 
            : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
        }`}
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Page content */}
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default PageTransition;
