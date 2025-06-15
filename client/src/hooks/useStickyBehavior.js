import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import scrollBehaviorManager from '../utils/scrollBehaviorManager';

gsap.registerPlugin(ScrollTrigger);

// Hook for sticky hamburger menu behavior
export const useStickyMenu = (config = {}) => {
  const elementRef = useRef();
  const registrationId = useRef();

  const defaultConfig = {
    compactOnScroll: true,
    compactThreshold: 100,
    fadeOnInactive: true,
    inactiveDelay: 3000,
    magnetic: true,
    magneticStrength: 0.2
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Register with scroll behavior manager
    registrationId.current = scrollBehaviorManager.register(element, {
      ...defaultConfig,
      ...config
    });

    return () => {
      if (registrationId.current) {
        scrollBehaviorManager.unregister(registrationId.current);
      }
    };
  }, [config]);

  return elementRef;
};

// Hook for floating widgets behavior
export const useFloatingWidget = (config = {}) => {
  const elementRef = useRef();
  const registrationId = useRef();

  const defaultConfig = {
    autoHide: true,
    autoHideDelay: 4000,
    fadeOnInactive: true,
    inactiveDelay: 3000,
    showOnScrollUp: true,
    hideOnScrollDown: false
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      gsap.set(element, { opacity: 1, scale: 1 });
      return;
    }

    // Initial entrance animation
    gsap.fromTo(element, {
      y: 20,
      opacity: 0,
      scale: 0.8
    }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: "back.out(1.7)",
      delay: 0.5
    });

    // Register with scroll behavior manager
    registrationId.current = scrollBehaviorManager.register(element, {
      ...defaultConfig,
      ...config
    });

    // Add floating animation
    const floatingTl = gsap.timeline({ repeat: -1, yoyo: true });
    floatingTl.to(element, {
      y: -5,
      duration: 2,
      ease: "sine.inOut"
    });

    return () => {
      floatingTl.kill();
      if (registrationId.current) {
        scrollBehaviorManager.unregister(registrationId.current);
      }
    };
  }, [config]);

  return elementRef;
};

// Hook for scroll-to-top button
export const useScrollToTop = (threshold = 300) => {
  const elementRef = useRef();
  const isVisible = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Initial state
    gsap.set(element, {
      opacity: 0,
      scale: 0.8,
      y: 20
    });

    // Scroll trigger for show/hide
    ScrollTrigger.create({
      start: threshold,
      end: 99999,
      onEnter: () => {
        if (!isVisible.current) {
          isVisible.current = true;
          gsap.to(element, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.4,
            ease: "back.out(1.7)"
          });
        }
      },
      onLeaveBack: () => {
        if (isVisible.current) {
          isVisible.current = false;
          gsap.to(element, {
            opacity: 0,
            scale: 0.8,
            y: 20,
            duration: 0.3,
            ease: "power2.in"
          });
        }
      }
    });

    // Click handler
    const handleClick = () => {
      gsap.to(window, {
        scrollTo: { y: 0 },
        duration: 1,
        ease: "power2.out"
      });

      // Button feedback animation
      gsap.to(element, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });
    };

    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('click', handleClick);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [threshold]);

  return elementRef;
};

// Hook for parallax effect
export const useParallax = (speed = 0.5, direction = 'up') => {
  const elementRef = useRef();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;

    const multiplier = direction === 'up' ? -1 : 1;

    ScrollTrigger.create({
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        const yPos = progress * 100 * speed * multiplier;
        gsap.set(element, { y: yPos });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, [speed, direction]);

  return elementRef;
};

// Hook for magnetic effect
export const useMagnetic = (strength = 0.3) => {
  const elementRef = useRef();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(element, {
        x: x * strength,
        y: y * strength,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return elementRef;
};

// Hook for scroll velocity detection
export const useScrollVelocity = (callback) => {
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollVelocity = () => {
      const currentScrollY = window.scrollY;
      const velocity = currentScrollY - lastScrollY;
      const direction = velocity > 0 ? 'down' : 'up';
      
      callback({
        velocity: Math.abs(velocity),
        direction,
        position: currentScrollY
      });

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestScrollUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollVelocity);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', requestScrollUpdate);
    };
  }, [callback]);
};

// Hook for element visibility on scroll
export const useScrollVisibility = (threshold = 0.1) => {
  const elementRef = useRef();
  const isVisible = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible.current;
        isVisible.current = entry.isIntersecting;

        if (!wasVisible && isVisible.current) {
          // Element became visible
          gsap.fromTo(element, {
            opacity: 0,
            y: 30
          }, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out"
          });
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return elementRef;
};
