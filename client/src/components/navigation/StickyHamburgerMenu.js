import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import StickyNavigationMenu from './StickyNavigationMenu';

gsap.registerPlugin(ScrollTrigger);

const StickyHamburgerMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef();
  const iconRef = useRef();
  const { isDarkMode } = useTheme();
  
  let lastScroll = 0;
  let scrollTimeout;

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

    // Initial setup
    gsap.set(menuElement, {
      scale: 1,
      opacity: 1,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
    });

    // Enhanced scroll handler with sticky follow behavior
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      const scrollDirection = currentScroll > lastScroll ? 'down' : 'up';
      const scrollVelocity = Math.abs(currentScroll - lastScroll);

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Sticky follow effect - menu moves slightly with scroll
      const followOffset = Math.min(currentScroll * 0.01, 10); // Max 10px follow

      if (currentScroll > 100) {
        setIsScrolled(true);

        if (scrollDirection === 'down') {
          // Scrolling down - compact mode with follow
          gsap.to(menuElement, {
            scale: 0.85,
            opacity: 0.9,
            y: followOffset + 5, // Follow scroll + extra offset
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            duration: 0.4,
            ease: "power2.out"
          });
        } else {
          // Scrolling up - normal mode with follow
          gsap.to(menuElement, {
            scale: 1,
            opacity: 1,
            y: followOffset,
            boxShadow: "0 6px 25px rgba(0,0,0,0.15)",
            duration: 0.4,
            ease: "power2.out"
          });
        }

        // Fast scroll behavior
        if (scrollVelocity > 15) {
          if (scrollDirection === 'down') {
            // Fast scroll down - menu slides down more
            gsap.to(menuElement, {
              y: followOffset + 15,
              scale: 0.8,
              duration: 0.2,
              ease: "power2.out"
            });
          } else {
            // Fast scroll up - menu bounces up
            gsap.to(menuElement, {
              y: Math.max(followOffset - 5, 0),
              scale: 1.05,
              duration: 0.3,
              ease: "back.out(1.7)"
            });
          }
        }
      } else {
        setIsScrolled(false);
        // At top - reset to original state
        gsap.to(menuElement, {
          scale: 1,
          opacity: 1,
          y: 0, // Reset position
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          duration: 0.4,
          ease: "power2.out"
        });
      }

      // Auto-hide after 3 seconds of no scrolling
      scrollTimeout = setTimeout(() => {
        if (currentScroll > 200 && !isMenuOpen) {
          gsap.to(menuElement, {
            opacity: 0.6,
            duration: 1,
            ease: "power2.out"
          });
        }
      }, 3000);

      lastScroll = currentScroll;
    };

    // Scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Hover effects
    const handleMouseEnter = () => {
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
    };

    const handleMouseLeave = () => {
      gsap.to(iconElement, {
        rotation: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    menuElement.addEventListener('mouseenter', handleMouseEnter);
    menuElement.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      menuElement.removeEventListener('mouseenter', handleMouseEnter);
      menuElement.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(scrollTimeout);
    };
  }, [isMenuOpen]);

  // Menu toggle animation
  const toggleMenu = () => {
    const iconElement = iconRef.current;
    
    if (!iconElement) return;
    
    setIsMenuOpen(!isMenuOpen);
    
    // Icon rotation animation
    gsap.to(iconElement, {
      rotation: isMenuOpen ? 0 : 180,
      scale: isMenuOpen ? 1 : 1.1,
      duration: 0.4,
      ease: "back.out(1.7)"
    });

    // Menu button pulse effect
    gsap.to(menuRef.current, {
      scale: 0.95,
      duration: 0.1,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
  };

  // ScrollTrigger for parallax follow behavior
  useEffect(() => {
    const menuElement = menuRef.current;
    if (!menuElement) return;

    // Parallax follow effect
    ScrollTrigger.create({
      start: 0,
      end: 99999,
      scrub: 0.3, // Smooth following
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        const scrollY = window.scrollY;

        // Calculate follow offset (menu moves slower than scroll)
        const followY = scrollY * 0.008; // 0.8% of scroll distance
        const maxFollow = 8; // Maximum follow distance
        const clampedFollow = Math.min(followY, maxFollow);

        // Apply subtle parallax effect
        gsap.set(menuElement, {
          y: clampedFollow
        });

        // Velocity-based behavior
        if (velocity < -400) {
          // Very fast scroll up - menu bounces to attention
          gsap.to(menuElement, {
            scale: 1.1,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(menuElement, {
                scale: isScrolled ? 0.85 : 1,
                duration: 0.3,
                ease: "power2.out"
              });
            }
          });
        } else if (velocity > 400) {
          // Very fast scroll down - menu shrinks more
          gsap.to(menuElement, {
            scale: 0.75,
            opacity: 0.8,
            duration: 0.2,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(menuElement, {
                scale: 0.85,
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
  }, [isScrolled]);

  return (
    <>
      {/* Sticky Hamburger Menu */}
      <button
        ref={menuRef}
        className={`fixed top-4 right-4 z-50 w-14 h-14 rounded-full cursor-pointer transition-colors duration-300 ${
          isDarkMode
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-white hover:bg-gray-50'
        } ${isScrolled ? 'backdrop-blur-md bg-opacity-90' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
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
                size={24} 
                className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}
              />
            ) : (
              <Menu 
                size={24} 
                className={`transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`}
              />
            )}
          </div>
        </div>

        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-blue-500 opacity-0 scale-0 transition-all duration-300 pointer-events-none" />
        
        {/* Pulse indicator when scrolled */}
        {isScrolled && !isMenuOpen && (
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
        )}
      </button>

      {/* Navigation Menu */}
      <StickyNavigationMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
    </>
  );
};

export default StickyHamburgerMenu;
