import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

const PageTransition = ({ children, className = '' }) => {
  const location = useLocation();
  const containerRef = useRef();
  const overlayRef = useRef();

  useEffect(() => {
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Page enter animation
      const tl = gsap.timeline();
      
      // Slide overlay from left to right
      tl.fromTo(overlayRef.current, {
        x: '-100%'
      }, {
        x: '0%',
        duration: 0.5,
        ease: "power3.inOut"
      });

      // Fade in content
      tl.fromTo(containerRef.current, {
        opacity: 0,
        y: 30
      }, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power3.out"
      }, 0.3);

      // Slide overlay out
      tl.to(overlayRef.current, {
        x: '100%',
        duration: 0.5,
        ease: "power3.inOut"
      }, 0.8);

    }, containerRef);

    return () => ctx.revert();
  }, [location.pathname]);

  return (
    <div className={`relative ${className}`}>
      {/* Transition Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-gradient-to-r from-blue-500 to-purple-600 z-50 pointer-events-none"
        style={{ transform: 'translateX(-100%)' }}
      />

      {/* Page Content */}
      <div ref={containerRef} className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Route-specific transition variants
export const routeTransitions = {
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  },
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  },
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-100%', opacity: 0 }
  },
  slideDown: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  scale: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.2, opacity: 0 }
  }
};

// Enhanced page transition with GSAP
export const GSAPPageTransition = ({ 
  children, 
  transitionType = 'slide',
  duration = 0.6,
  className = ''
}) => {
  const location = useLocation();
  const containerRef = useRef();
  const currentPageRef = useRef();
  const nextPageRef = useRef();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
      }
      return;
    }

    const ctx = gsap.context(() => {
      const container = containerRef.current;
      if (!container) return;

      const transitions = {
        slide: () => {
          const tl = gsap.timeline();
          
          tl.fromTo(container, {
            x: '100%'
          }, {
            x: '0%',
            duration: duration,
            ease: "power3.out"
          });

          return tl;
        },
        
        fade: () => {
          const tl = gsap.timeline();
          
          tl.fromTo(container, {
            opacity: 0,
            y: 20
          }, {
            opacity: 1,
            y: 0,
            duration: duration,
            ease: "power3.out"
          });

          return tl;
        },

        scale: () => {
          const tl = gsap.timeline();
          
          tl.fromTo(container, {
            scale: 0.9,
            opacity: 0
          }, {
            scale: 1,
            opacity: 1,
            duration: duration,
            ease: "back.out(1.7)"
          });

          return tl;
        },

        flip: () => {
          const tl = gsap.timeline();
          
          tl.fromTo(container, {
            rotationY: 90,
            opacity: 0
          }, {
            rotationY: 0,
            opacity: 1,
            duration: duration,
            ease: "power3.out"
          });

          return tl;
        }
      };

      const transition = transitions[transitionType] || transitions.fade;
      transition();

    }, containerRef);

    return () => ctx.revert();
  }, [location.pathname, transitionType, duration]);

  return (
    <div ref={containerRef} className={`page-transition ${className}`}>
      {children}
    </div>
  );
};

// Loading transition component
export const LoadingTransition = ({ isLoading, children }) => {
  const loaderRef = useRef();
  const contentRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isLoading) {
        // Show loader
        gsap.to(loaderRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });

        gsap.to(contentRef.current, {
          opacity: 0.3,
          scale: 0.95,
          duration: 0.3,
          ease: "power2.out"
        });
      } else {
        // Hide loader
        gsap.to(loaderRef.current, {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          ease: "power2.in"
        });

        gsap.to(contentRef.current, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "power2.out",
          delay: 0.1
        });
      }
    });

    return () => ctx.revert();
  }, [isLoading]);

  return (
    <div className="relative">
      {/* Loading Overlay */}
      <div
        ref={loaderRef}
        className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center opacity-0"
        style={{ pointerEvents: isLoading ? 'auto' : 'none' }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Đang tải...</p>
        </div>
      </div>

      {/* Content */}
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default PageTransition;
