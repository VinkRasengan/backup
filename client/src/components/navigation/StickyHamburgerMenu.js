import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import StickyNavigationMenu from './StickyNavigationMenu';
import { useResponsive } from '../../utils/responsiveDesign';

gsap.registerPlugin(ScrollTrigger);

const StickyHamburgerMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef();
  const iconRef = useRef();
  const { isDarkMode } = useTheme();
  const { device, isMobile, isTablet, dimensions } = useResponsive();
  
  let lastScroll = 0;
  let scrollTimeout;

  // Get responsive button size and positioning
  const getMenuConfig = () => {
    if (isMobile) {
      return {
        size: dimensions.width < 375 ? 'w-12 h-12' : 'w-14 h-14', // Smaller on very small screens
        position: 'top-3 right-3', // Closer to edge on mobile
        iconSize: dimensions.width < 375 ? 20 : 24,
        zIndex: 'z-50'
      };
    } else if (isTablet) {
      return {
        size: 'w-16 h-16', // Larger on tablet
        position: 'top-4 right-4',
        iconSize: 26,
        zIndex: 'z-50'
      };
    } else {
      return {
        size: 'w-18 h-18', // Largest on desktop
        position: 'top-5 right-5',
        iconSize: 28,
        zIndex: 'z-50'
      };
    }
  };

  const menuConfig = getMenuConfig();

  useEffect(() => {
    const menuElement = menuRef.current;
    const iconElement = iconRef.current;
    
    if (!menuElement || !iconElement) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Set final state without animation
      gsap.set(menuElement, { opacity: 1, scale: 1 });
      return;
    }

    // Responsive initial setup
    const initialScale = isMobile ? 0.9 : 1;
    gsap.set(menuElement, {
      scale: initialScale,
      opacity: 1,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    });

    // Enhanced responsive scroll handler
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const scrollDirection = currentScroll > lastScroll ? 'down' : 'up';
      const scrollVelocity = Math.abs(currentScroll - lastScroll);

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Responsive scaling based on device and scroll
      const getScrollScale = () => {
        if (isMobile) {
          return scrollDirection === 'down' ? 0.75 : 0.9;
        } else if (isTablet) {
          return scrollDirection === 'down' ? 0.85 : 0.95;
        } else {
          return scrollDirection === 'down' ? 0.85 : 1;
        }
      };

      // Adaptive follow offset based on screen size
      const followOffset = Math.min(currentScroll * (isMobile ? 0.005 : 0.01), isMobile ? 5 : 10);

      if (currentScroll > 100) {
        setIsScrolled(true);

        if (scrollDirection === 'down') {
          // Scrolling down - compact mode with follow
          gsap.to(menuElement, {
            scale: getScrollScale(),
            opacity: isMobile ? 0.8 : 0.9,
            y: followOffset + (isMobile ? 3 : 5),
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            duration: 0.4,
            ease: "power2.out"
          });
        } else {
          // Scrolling up - normal mode with follow
          gsap.to(menuElement, {
            scale: getScrollScale(),
            opacity: 1,
            y: followOffset,
            boxShadow: "0 6px 25px rgba(0,0,0,0.15)",
            duration: 0.4,
            ease: "power2.out"
          });
        }

        // Responsive fast scroll behavior
        if (scrollVelocity > 15) {
          if (scrollDirection === 'down') {
            // Fast scroll down - more aggressive scaling on mobile
            gsap.to(menuElement, {
              y: followOffset + (isMobile ? 10 : 15),
              scale: isMobile ? 0.7 : 0.8,
              duration: 0.2,
              ease: "power2.out"
            });
          } else {
            // Fast scroll up - bounce effect adjusted for screen size
            gsap.to(menuElement, {
              y: Math.max(followOffset - (isMobile ? 3 : 5), 0),
              scale: isMobile ? 0.95 : 1.05,
              duration: 0.3,
              ease: "back.out(1.7)"
            });
          }
        }
      } else {
        setIsScrolled(false);
        // At top - reset to device-appropriate state
        gsap.to(menuElement, {
          scale: initialScale,
          opacity: 1,
          y: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          duration: 0.4,
          ease: "power2.out"
        });
      }

      // Auto-hide timeout adjusted for device
      scrollTimeout = setTimeout(() => {
        if (currentScroll > 200 && !isMenuOpen) {
          gsap.to(menuElement, {
            opacity: isMobile ? 0.5 : 0.6,
            duration: 1,
            ease: "power2.out"
          });
        }
      }, isMobile ? 2000 : 3000); // Shorter timeout on mobile

      lastScroll = currentScroll;
    };

    // Scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Responsive hover effects
    const handleMouseEnter = () => {
      if (!isMobile) { // Only on non-touch devices
        gsap.to(iconElement, {
          rotation: 5,
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out"
        });
        
        gsap.to(menuElement, {
          opacity: 1,
          duration: 0.3
        });
      }
    };

    const handleMouseLeave = () => {
      if (!isMobile) {
        gsap.to(iconElement, {
          rotation: 0,
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      }
    };

    if (!isMobile) {
      menuElement.addEventListener('mouseenter', handleMouseEnter);
      menuElement.addEventListener('mouseleave', handleMouseLeave);
    }

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (!isMobile) {
        menuElement.removeEventListener('mouseenter', handleMouseEnter);
        menuElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      clearTimeout(scrollTimeout);
    };
  }, [isMenuOpen, device, isMobile, isTablet, dimensions]);

  // Menu toggle animation with responsive scaling
  const toggleMenu = () => {
    const iconElement = iconRef.current;
    
    if (!iconElement) return;
    
    setIsMenuOpen(!isMenuOpen);
    
    // Responsive icon rotation animation
    gsap.to(iconElement, {
      rotation: isMenuOpen ? 0 : 180,
      scale: isMenuOpen ? 1 : (isMobile ? 1.05 : 1.1),
      duration: 0.4,
      ease: "back.out(1.7)"
    });

    // Responsive menu button pulse effect
    gsap.to(menuRef.current, {
      scale: isMobile ? 0.92 : 0.95,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
  };

  // Enhanced ScrollTrigger for responsive parallax follow behavior
  useEffect(() => {
    const menuElement = menuRef.current;
    if (!menuElement) return;

    // Responsive parallax follow effect
    ScrollTrigger.create({
      start: 0,
      end: 99999,
      scrub: 0.3,
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        const scrollY = window.scrollY;

        // Responsive follow calculations
        const followMultiplier = isMobile ? 0.005 : 0.008;
        const maxFollow = isMobile ? 5 : 8;
        
        const followY = scrollY * followMultiplier;
        const clampedFollow = Math.min(followY, maxFollow);

        // Apply responsive parallax effect
        gsap.set(menuElement, {
          y: clampedFollow
        });

        // Responsive velocity-based behavior
        const velocityThreshold = isMobile ? 300 : 400;
        
        if (velocity < -velocityThreshold) {
          // Very fast scroll up - responsive bounce
          gsap.to(menuElement, {
            scale: isMobile ? 1.05 : 1.1,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(menuElement, {
                scale: isScrolled ? (isMobile ? 0.75 : 0.85) : (isMobile ? 0.9 : 1),
                duration: 0.3,
                ease: "power2.out"
              });
            }
          });
        } else if (velocity > velocityThreshold) {
          // Very fast scroll down - responsive shrink
          gsap.to(menuElement, {
            scale: isMobile ? 0.65 : 0.75,
            opacity: 0.8,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(menuElement, {
                scale: isMobile ? 0.75 : 0.85,
                opacity: 0.9,
                duration: 0.3,
                ease: "power2.out"
              });
            }
          });
        }
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [isScrolled, device, isMobile]);

  return (
    <>
      {/* Responsive Sticky Hamburger Menu */}
      <button
        ref={menuRef}
        className={`fixed ${menuConfig.position} ${menuConfig.zIndex} ${menuConfig.size} rounded-full cursor-pointer transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-white hover:bg-gray-50'
        } ${isScrolled ? 'backdrop-blur-md bg-opacity-90' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
        shadow-lg hover:shadow-xl transition-shadow duration-300`}
        onClick={toggleMenu}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleMenu();
          }
        }}
        aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'}
        aria-expanded={isMenuOpen}
        style={{
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div ref={iconRef}>
            {isMenuOpen ? (
              <X 
                size={menuConfig.iconSize} 
                className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}
              />
            ) : (
              <Menu 
                size={menuConfig.iconSize} 
                className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}
              />
            )}
          </div>
        </div>

        {/* Enhanced ripple effect */}
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-0 scale-0 transition-all duration-300 pointer-events-none" />
        
        {/* Responsive pulse indicator when scrolled */}
        {isScrolled && !isMenuOpen && (
          <div className={`absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20 ${
            isMobile ? 'animate-pulse' : 'animate-ping'
          }`} />
        )}

        {/* Mobile-only active indicator */}
        {isMobile && isMenuOpen && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Enhanced Navigation Menu with responsive sizing */}
      <StickyNavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        device={device}
        isMobile={isMobile}
      />
    </>
  );
};

export default StickyHamburgerMenu;
