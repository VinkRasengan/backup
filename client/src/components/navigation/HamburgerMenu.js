import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import PropTypes from 'prop-types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useResponsive } from '../../utils/responsiveDesign';

gsap.registerPlugin(ScrollTrigger);

const HamburgerMenu = React.memo(({ isOpen, onClick, className = '' }) => {
  const menuRef = useRef();
  const { device, isMobile, isTablet, dimensions } = useResponsive();

  // Enhanced responsive button configuration
  const getMenuConfig = () => {
    if (isMobile) {
      return {
        size: dimensions.width < 375 ? 'w-11 h-11 p-2' : 'w-12 h-12 p-3', // Smaller on very small screens
        position: 'top-3 left-3', // Closer to edge on mobile
        iconSize: dimensions.width < 375 ? 18 : 20,
        zIndex: 'z-50'
      };
    } else if (isTablet) {
      return {
        size: 'w-14 h-14 p-3.5', // Larger on tablet
        position: 'top-4 left-4',
        iconSize: 22,
        zIndex: 'z-50'
      };
    } else {
      return {
        size: 'w-16 h-16 p-4', // Largest on desktop
        position: 'top-5 left-5',
        iconSize: 24,
        zIndex: 'z-50'
      };
    }
  };

  const menuConfig = getMenuConfig();

  useEffect(() => {
    const menuElement = menuRef.current;
    if (!menuElement) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Set final state without animation - always visible with responsive positioning
      gsap.set(menuElement, {
        opacity: 1,
        scale: 1,
        y: 0,
        position: 'fixed',
        zIndex: 51
      });
      return;
    }

    // Responsive initial setup - ensure it's always visible and sticky
    const initialScale = isMobile ? 0.95 : 1;
    gsap.set(menuElement, {
      scale: initialScale,
      opacity: 1,
      y: 0,
      position: 'fixed',
      zIndex: 51
    });

    // Enhanced responsive scroll behavior
    let scrollTrigger = ScrollTrigger.create({
      start: 0,
      end: 99999,
      scrub: false, // Remove scrub for immediate response
      onUpdate: (self) => {
        const velocity = self.getVelocity();

        // Always ensure visibility
        gsap.set(menuElement, {
          opacity: 1,
          display: 'block',
          visibility: 'visible'
        });

        // Responsive scroll effects based on velocity
        if (Math.abs(velocity) > 500) {
          const targetScale = isMobile ? 0.9 : 0.98;
          const bounceScale = isMobile ? 0.95 : 1;
          
          gsap.to(menuElement, {
            scale: targetScale,
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(menuElement, {
                scale: bounceScale,
                duration: 0.2,
                ease: "back.out(1.7)"
              });
            }
          });
        }
      }
    });

    // Enhanced scroll listener with responsive behavior
    const handleScroll = () => {
      if (menuElement) {
        const currentScroll = window.scrollY;
        
        // Responsive scaling based on scroll position
        let scale = initialScale;
        if (currentScroll > 100) {
          scale = isMobile ? 0.85 : 0.95;
        }

        // Force visibility with responsive scaling on every scroll
        gsap.set(menuElement, {
          opacity: currentScroll > 300 ? (isMobile ? 0.8 : 0.9) : 1,
          scale: scale,
          display: 'block',
          visibility: 'visible',
          position: 'fixed',
          zIndex: 51
        });
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Responsive hover effects (only on non-touch devices)
    const handleMouseEnter = () => {
      if (!isMobile) {
        gsap.to(menuElement, {
          scale: 1.1,
          duration: 0.2,
          ease: "power2.out"
        });
      }
    };

    const handleMouseLeave = () => {
      if (!isMobile) {
        gsap.to(menuElement, {
          scale: initialScale,
          duration: 0.2,
          ease: "power2.out"
        });
      }
    };

    // Only add hover effects on non-mobile devices
    if (!isMobile) {
      menuElement.addEventListener('mouseenter', handleMouseEnter);
      menuElement.addEventListener('mouseleave', handleMouseLeave);
    }

    // Cleanup
    return () => {
      if (scrollTrigger) {
        scrollTrigger.kill();
      }
      window.removeEventListener('scroll', handleScroll);
      if (!isMobile) {
        menuElement.removeEventListener('mouseenter', handleMouseEnter);
        menuElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [device, isMobile, isTablet, dimensions]);

  // Enhanced responsive click animation
  const handleClick = () => {
    const menuElement = menuRef.current;
    if (menuElement && onClick) {
      // Responsive click feedback
      const clickScale = isMobile ? 0.9 : 0.95;
      
      gsap.to(menuElement, {
        scale: clickScale,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.to(menuElement, {
            scale: isMobile ? 0.95 : 1,
            duration: 0.2,
            ease: "back.out(1.7)"
          });
        }
      });
      
      onClick();
    }
  };

  return (
    <motion.button
      ref={menuRef}
      onClick={handleClick}
      className={`
        hamburger-menu fixed ${menuConfig.position} ${menuConfig.zIndex} ${menuConfig.size} rounded-lg
        bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700
        text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
        hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      whileHover={!isMobile ? { scale: 1.05 } : undefined}
      whileTap={{ scale: isMobile ? 0.9 : 0.95 }}
      aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <motion.div
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex items-center justify-center w-full h-full"
      >
        <Menu size={menuConfig.iconSize} />
      </motion.div>

      {/* Enhanced ripple effect for touch feedback */}
      <div className="absolute inset-0 rounded-lg bg-blue-500 opacity-0 scale-0 transition-all duration-300 pointer-events-none" />
      
      {/* Mobile-only touch indicator */}
      {isMobile && isOpen && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      )}

      {/* Scroll indicator for responsive feedback */}
      {!isMobile && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-purple-500 opacity-0"
          animate={{ opacity: isOpen ? 0.1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
});

HamburgerMenu.displayName = 'HamburgerMenu';

HamburgerMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default HamburgerMenu;
