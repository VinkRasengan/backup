import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import PropTypes from 'prop-types';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HamburgerMenu = React.memo(({ isOpen, onClick, className = '' }) => {
  const menuRef = useRef();

  useEffect(() => {
    const menuElement = menuRef.current;
    if (!menuElement) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Set final state without animation - always visible
      gsap.set(menuElement, {
        opacity: 1,
        scale: 1,
        y: 0,
        position: 'fixed',
        top: '1rem',
        left: '1rem',
        zIndex: 51
      });
      return;
    }

    // Initial setup - ensure it's always visible and sticky
    gsap.set(menuElement, {
      scale: 1,
      opacity: 1,
      y: 0,
      position: 'fixed',
      top: '1rem',
      left: '1rem',
      zIndex: 51
    });

    // Enhanced scroll behavior - always keep visible
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

        // Subtle hover effect on fast scroll
        if (Math.abs(velocity) > 500) {
          gsap.to(menuElement, {
            scale: 0.98,
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(menuElement, {
                scale: 1,
                duration: 0.2,
                ease: "back.out(1.7)"
              });
            }
          });
        }
      }
    });

    // Additional scroll listener to ensure always visible
    const handleScroll = () => {
      if (menuElement) {
        // Force visibility on every scroll
        gsap.set(menuElement, {
          opacity: 1,
          scale: 1,
          display: 'block',
          visibility: 'visible',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 51
        });
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    return () => {
      if (scrollTrigger) {
        scrollTrigger.kill();
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <motion.button
      ref={menuRef}
      onClick={onClick}
      className={`
        hamburger-menu fixed top-4 left-4 z-50 p-3 rounded-lg
        bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700
        text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
        hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
    >
      <motion.div
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Menu size={20} />
      </motion.div>
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
