import { useEffect, useRef, useCallback } from 'react';
import { gsap, gsapUtils, gsapPresets } from '../utils/gsap';
import { performanceMonitor, performanceUtils } from '../utils/performance';
import { AdvancedTimeline, getCurrentBreakpoint, prefersReducedMotion, createResponsiveAnimation } from '../utils/advancedAnimations';

// Main GSAP hook with performance optimizations
export const useGSAP = (animationFn, dependencies = [], options = {}) => {
  const ref = useRef();
  const animationRef = useRef();
  const animationIdRef = useRef();

  const createAnimation = useCallback(() => {
    if (!ref.current || !animationFn) return;

    // Kill previous animation if exists
    if (animationRef.current) {
      animationRef.current.kill();
      if (animationIdRef.current && process.env.NODE_ENV === 'development') {
        performanceMonitor.unregisterAnimation(animationRef.current);
      }
    }

    // Check for reduced motion preference
    if (performanceUtils.prefersReducedMotion() && options.skipOnReducedMotion) {
      return;
    }

    // Get optimized animation config
    const optimizedConfig = performanceUtils.getOptimizedAnimationConfig();

    // Create new animation with performance optimizations
    animationRef.current = animationFn(ref.current, { gsap, optimizedConfig });

    // Register for performance monitoring in development
    if (animationRef.current && process.env.NODE_ENV === 'development') {
      animationIdRef.current = Math.random().toString(36).substring(2, 11);
      performanceMonitor.registerAnimation(animationRef.current, options.name || 'useGSAP');
    }
  }, [animationFn, options.skipOnReducedMotion, options.name]);

  useEffect(() => {
    // Debounce animation creation for better performance
    const debouncedCreate = performanceUtils.debounce(createAnimation, 16);
    debouncedCreate();

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
        if (animationIdRef.current && process.env.NODE_ENV === 'development') {
          performanceMonitor.unregisterAnimation(animationRef.current);
        }
      }
    };
  }, dependencies);

  return ref;
};

// Scroll trigger hook
export const useScrollTrigger = (animationConfig, options = {}) => {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;

    const animation = gsapUtils.scrollTrigger(ref.current, animationConfig, options);

    return () => {
      if (animation && animation.scrollTrigger) {
        animation.scrollTrigger.kill();
      }
      if (animation) {
        animation.kill();
      }
    };
  }, []);

  return ref;
};

// Fade in animation hook
export const useFadeIn = (preset = 'fadeIn', delay = 0) => {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;

    const animation = gsapUtils.animate(ref.current, preset, { delay });

    return () => {
      if (animation) animation.kill();
    };
  }, [preset, delay]);

  return ref;
};

// Stagger animation hook for lists
export const useStaggerAnimation = (preset = 'staggerFadeIn', trigger = true) => {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current || !trigger) return;

    const children = ref.current.children;
    if (children.length === 0) return;

    const animation = gsapPresets[preset];
    if (!animation) return;

    gsap.set(children, animation.from);
    const tween = gsap.to(children, animation.to);

    return () => {
      if (tween) tween.kill();
    };
  }, [preset, trigger]);

  return ref;
};

// Hover animation hook
export const useHoverAnimation = (hoverConfig, leaveConfig) => {
  const ref = useRef();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => {
      gsap.to(element, hoverConfig);
    };

    const handleMouseLeave = () => {
      gsap.to(element, leaveConfig);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hoverConfig, leaveConfig]);

  return ref;
};

// Counter animation hook
export const useCounterAnimation = (endValue, options = {}) => {
  const ref = useRef();
  const animationRef = useRef();

  const startAnimation = useCallback(() => {
    if (!ref.current) return;

    if (animationRef.current) {
      animationRef.current.kill();
    }

    animationRef.current = gsapUtils.counter(ref.current, endValue, options);
  }, [endValue, options]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, []);

  return [ref, startAnimation];
};

// Timeline hook
export const useTimeline = (timelineConfig, dependencies = []) => {
  const timelineRef = useRef();

  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    timelineRef.current = gsap.timeline();
    
    if (timelineConfig) {
      timelineConfig(timelineRef.current);
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, dependencies);

  return timelineRef.current;
};

// Loading animation hook
export const useLoadingAnimation = (isLoading) => {
  const ref = useRef();
  const animationRef = useRef();

  useEffect(() => {
    if (!ref.current) return;

    if (isLoading) {
      animationRef.current = gsapUtils.loading(ref.current);
    } else {
      if (animationRef.current) {
        animationRef.current.kill();
        gsap.set(ref.current, { rotation: 0 });
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [isLoading]);

  return ref;
};

// Text typing animation hook
export const useTypeText = (text, options = {}) => {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current || !text) return;

    const animation = gsapUtils.typeText(ref.current, text, options);

    return () => {
      if (animation) animation.kill();
    };
  }, [text, options]);

  return ref;
};

// Intersection observer with GSAP
export const useIntersectionAnimation = (animationConfig, options = {}) => {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const animation = gsapPresets[animationConfig];
            if (animation) {
              gsap.fromTo(entry.target, animation.from, animation.to);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [animationConfig, options]);

  return ref;
};

// Advanced Timeline Hook
export const useAdvancedTimeline = (options = {}) => {
  const timelineRef = useRef();

  useEffect(() => {
    timelineRef.current = new AdvancedTimeline(options);

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return timelineRef.current;
};

// Responsive Animation Hook
export const useResponsiveAnimation = (animations, dependencies = []) => {
  const ref = useRef();
  const animationRef = useRef();

  useEffect(() => {
    if (!ref.current) return;

    if (animationRef.current) {
      animationRef.current.kill();
    }

    animationRef.current = createResponsiveAnimation(ref.current, animations);

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, dependencies);

  return ref;
};

// Breakpoint-aware Animation Hook
export const useBreakpointAnimation = (animationFn, dependencies = []) => {
  const ref = useRef();
  const animationRef = useRef();
  const currentBreakpoint = useRef(getCurrentBreakpoint());

  useEffect(() => {
    const handleResize = () => {
      const newBreakpoint = getCurrentBreakpoint();
      if (newBreakpoint !== currentBreakpoint.current) {
        currentBreakpoint.current = newBreakpoint;

        if (animationRef.current) {
          animationRef.current.kill();
        }

        if (ref.current && animationFn) {
          animationRef.current = animationFn(ref.current, newBreakpoint);
        }
      }
    };

    // Initial animation
    if (ref.current && animationFn) {
      animationRef.current = animationFn(ref.current, currentBreakpoint.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, dependencies);

  return ref;
};

// Magnetic Hover Effect Hook
export const useMagneticHover = (intensity = 1) => {
  const ref = useRef();

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(element, {
        x: x * intensity * 0.1,
        y: y * intensity * 0.1,
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
  }, [intensity]);

  return ref;
};

// Parallax Effect Hook
export const useParallax = (speed = 0.5, direction = 'vertical') => {
  const ref = useRef();

  useEffect(() => {
    const element = ref.current;
    if (!element || prefersReducedMotion()) return;

    const animation = gsap.to(element, {
      [direction === 'vertical' ? 'yPercent' : 'xPercent']: -50 * speed,
      ease: "none",
      scrollTrigger: {
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });

    return () => {
      if (animation && animation.scrollTrigger) {
        animation.scrollTrigger.kill();
      }
      if (animation) {
        animation.kill();
      }
    };
  }, [speed, direction]);

  return ref;
};
