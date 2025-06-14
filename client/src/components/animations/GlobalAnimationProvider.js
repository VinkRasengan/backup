import React, { createContext, useContext, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import gsapAnimations from '../../utils/gsapAnimations';
import responsiveAnimations from '../../utils/responsiveAnimations';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Animation context
const AnimationContext = createContext();

export const useAnimations = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimations must be used within AnimationProvider');
  }
  return context;
};

const GlobalAnimationProvider = ({ children }) => {
  const initialized = useRef(false);
  const animationInstances = useRef(new Map());

  useEffect(() => {
    if (initialized.current) return;
    
    // Initialize GSAP configuration
    gsap.config({
      force3D: true,
      nullTargetWarn: false
    });

    // Set up performance optimizations
    gsap.ticker.lagSmoothing(0);
    
    // Initialize animation systems
    gsapAnimations.init();
    responsiveAnimations.optimizeForPerformance();
    responsiveAnimations.addFocusAnimations();

    // Global scroll refresh
    ScrollTrigger.refresh();

    initialized.current = true;

    console.log('🎨 Global Animation System Initialized');

    // Cleanup on unmount
    return () => {
      gsapAnimations.cleanup();
      responsiveAnimations.cleanup();
      ScrollTrigger.getAll().forEach(st => st.kill());
      gsap.killTweensOf("*");
    };
  }, []);

  // Animation utilities
  const animationUtils = {
    // Create a new animation instance
    create: (name, element, config) => {
      const animation = gsap.to(element, config);
      animationInstances.current.set(name, animation);
      return animation;
    },

    // Get existing animation
    get: (name) => {
      return animationInstances.current.get(name);
    },

    // Kill specific animation
    kill: (name) => {
      const animation = animationInstances.current.get(name);
      if (animation) {
        animation.kill();
        animationInstances.current.delete(name);
      }
    },

    // Batch animations
    batch: (elements, config) => {
      return gsap.to(elements, config);
    },

    // Timeline creation
    timeline: (config = {}) => {
      return gsap.timeline(config);
    },

    // Scroll-triggered animation
    scrollTrigger: (config) => {
      return ScrollTrigger.create(config);
    },

    // Responsive animation
    responsive: (config) => {
      const mm = gsap.matchMedia();
      
      if (config.desktop) {
        mm.add("(min-width: 1024px)", config.desktop);
      }
      
      if (config.tablet) {
        mm.add("(min-width: 768px) and (max-width: 1023px)", config.tablet);
      }
      
      if (config.mobile) {
        mm.add("(max-width: 767px)", config.mobile);
      }
      
      return mm;
    },

    // Accessibility-aware animation
    accessible: (element, config) => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        if (config.to) {
          gsap.set(element, config.to);
        }
        return null;
      }
      
      return gsap.to(element, config);
    },

    // Performance-optimized animation
    optimized: (element, config) => {
      // Add will-change property
      gsap.set(element, { willChange: 'transform' });
      
      const animation = gsap.to(element, {
        ...config,
        onComplete: () => {
          // Remove will-change after animation
          gsap.set(element, { willChange: 'auto' });
          if (config.onComplete) config.onComplete();
        }
      });
      
      return animation;
    },

    // Stagger animation helper
    stagger: (elements, config, staggerConfig = {}) => {
      return gsap.to(elements, {
        ...config,
        stagger: {
          amount: 0.5,
          from: "start",
          ...staggerConfig
        }
      });
    },

    // Magnetic effect
    magnetic: (element, strength = 0.3) => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(element, {
          x: x * strength,
          y: y * strength,
          duration: 0.3,
          ease: "power2.out"
        });
      });

      element.addEventListener('mouseleave', () => {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.3)"
        });
      });
    },

    // Parallax effect
    parallax: (element, speed = 0.5) => {
      return ScrollTrigger.create({
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const yPos = progress * 100 * speed;
          gsap.set(element, { y: -yPos });
        }
      });
    },

    // Text animation
    typewriter: (element, text, config = {}) => {
      const duration = config.duration || 2;
      const cursor = config.cursor !== false;
      
      gsap.set(element, { text: "" });
      
      const tl = gsap.timeline();
      
      tl.to(element, {
        text: text,
        duration: duration,
        ease: "none"
      });
      
      if (cursor) {
        tl.to(element, {
          text: text + "|",
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: "none"
        });
      }
      
      return tl;
    },

    // Counter animation
    counter: (element, target, config = {}) => {
      const duration = config.duration || 2;
      const obj = { value: 0 };
      
      return gsap.to(obj, {
        value: target,
        duration: duration,
        ease: "power2.out",
        onUpdate: () => {
          element.textContent = Math.ceil(obj.value).toLocaleString();
        },
        ...config
      });
    },

    // Refresh ScrollTrigger
    refresh: () => {
      ScrollTrigger.refresh();
    },

    // Global cleanup
    cleanup: () => {
      animationInstances.current.forEach(animation => animation.kill());
      animationInstances.current.clear();
      gsapAnimations.cleanup();
      responsiveAnimations.cleanup();
    }
  };

  return (
    <AnimationContext.Provider value={animationUtils}>
      {children}
    </AnimationContext.Provider>
  );
};

export default GlobalAnimationProvider;
