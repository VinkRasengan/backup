import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Responsive breakpoints
export const breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536
};

// Get current breakpoint
export const getCurrentBreakpoint = () => {
  const width = window.innerWidth;
  if (width < breakpoints.mobile) return 'mobile';
  if (width < breakpoints.tablet) return 'tablet';
  if (width < breakpoints.desktop) return 'desktop';
  return 'wide';
};

// Advanced animation configurations
export const animationConfigs = {
  // Page entrance animations
  pageEntrance: {
    mobile: {
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out"
    },
    tablet: {
      duration: 0.6,
      stagger: 0.15,
      ease: "power3.out"
    },
    desktop: {
      duration: 0.5,
      stagger: 0.2,
      ease: "power3.out"
    }
  },
  
  // Scroll-triggered animations
  scrollTrigger: {
    mobile: {
      start: "top 90%",
      end: "bottom 10%",
      scrub: 1
    },
    tablet: {
      start: "top 85%",
      end: "bottom 15%",
      scrub: 0.5
    },
    desktop: {
      start: "top 80%",
      end: "bottom 20%",
      scrub: 0.3
    }
  },
  
  // Hover animations
  hover: {
    mobile: {
      scale: 1.02,
      duration: 0.3
    },
    tablet: {
      scale: 1.05,
      duration: 0.25,
      y: -5
    },
    desktop: {
      scale: 1.08,
      duration: 0.2,
      y: -8
    }
  }
};

// Advanced timeline creator
export class AdvancedTimeline {
  constructor(options = {}) {
    this.tl = gsap.timeline(options);
    this.breakpoint = getCurrentBreakpoint();
    this.elements = new Map();
  }

  // Add element with responsive config
  addElement(element, animationType, customConfig = {}) {
    const config = {
      ...animationConfigs[animationType][this.breakpoint],
      ...customConfig
    };
    
    this.elements.set(element, { animationType, config });
    return this;
  }

  // Create coordinated entrance animation
  createEntranceSequence(elements, options = {}) {
    const config = animationConfigs.pageEntrance[this.breakpoint];
    
    // Set initial states
    gsap.set(elements, { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    });

    // Create entrance timeline
    this.tl
      .to(elements, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: config.duration,
        stagger: config.stagger,
        ease: config.ease,
        ...options
      });

    return this;
  }

  // Create scroll-triggered sequence
  createScrollSequence(trigger, elements, options = {}) {
    const config = animationConfigs.scrollTrigger[this.breakpoint];
    
    ScrollTrigger.create({
      trigger,
      start: config.start,
      end: config.end,
      animation: this.tl,
      toggleActions: "play none none reverse",
      ...options
    });

    return this;
  }

  // Create parallax effect
  createParallax(elements, intensity = 1) {
    const config = animationConfigs.scrollTrigger[this.breakpoint];
    
    elements.forEach((element, index) => {
      const speed = intensity * (index + 1) * 0.1;
      
      gsap.to(element, {
        yPercent: -50 * speed,
        ease: "none",
        scrollTrigger: {
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          scrub: config.scrub
        }
      });
    });

    return this;
  }

  // Create morphing text animation
  createTextMorph(element, texts, options = {}) {
    const defaultOptions = {
      duration: 2,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true
    };

    texts.forEach((text, index) => {
      this.tl.to(element, {
        text: text,
        duration: defaultOptions.duration,
        ease: defaultOptions.ease,
        delay: index * defaultOptions.duration,
        ...options
      }, index * defaultOptions.duration);
    });

    return this;
  }

  // Create magnetic hover effect
  createMagneticHover(elements) {
    elements.forEach(element => {
      const config = animationConfigs.hover[this.breakpoint];
      
      element.addEventListener('mouseenter', () => {
        gsap.to(element, {
          scale: config.scale,
          y: config.y || 0,
          duration: config.duration,
          ease: "power2.out"
        });
      });

      element.addEventListener('mouseleave', () => {
        gsap.to(element, {
          scale: 1,
          y: 0,
          duration: config.duration,
          ease: "power2.out"
        });
      });

      // Mouse move effect for desktop
      if (this.breakpoint === 'desktop') {
        element.addEventListener('mousemove', (e) => {
          const rect = element.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          
          gsap.to(element, {
            x: x * 0.1,
            y: y * 0.1,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      }
    });

    return this;
  }

  // Create staggered reveal animation
  createStaggeredReveal(elements, direction = 'up', options = {}) {
    const directions = {
      up: { y: 50 },
      down: { y: -50 },
      left: { x: -50 },
      right: { x: 50 },
      scale: { scale: 0.8 }
    };

    const config = animationConfigs.pageEntrance[this.breakpoint];
    
    gsap.set(elements, { 
      opacity: 0, 
      ...directions[direction]
    });

    this.tl.to(elements, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: config.duration,
      stagger: config.stagger,
      ease: config.ease,
      ...options
    });

    return this;
  }

  // Play timeline
  play() {
    this.tl.play();
    return this;
  }

  // Pause timeline
  pause() {
    this.tl.pause();
    return this;
  }

  // Kill timeline and cleanup
  kill() {
    this.tl.kill();
    ScrollTrigger.getAll().forEach(st => st.kill());
    return this;
  }
}

// Utility functions for responsive animations
export const createResponsiveAnimation = (element, animations) => {
  const breakpoint = getCurrentBreakpoint();
  const animation = animations[breakpoint] || animations.desktop;
  
  return gsap.to(element, animation);
};

// Prefers reduced motion check
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Create accessible animations
export const createAccessibleAnimation = (element, animation) => {
  if (prefersReducedMotion()) {
    // Set final state without animation
    gsap.set(element, animation.to || animation);
    return null;
  }
  
  return gsap.to(element, animation);
};

// Batch animation creator
export const createBatchAnimations = (animations) => {
  const batch = [];
  
  animations.forEach(({ element, animation, delay = 0 }) => {
    setTimeout(() => {
      if (!prefersReducedMotion()) {
        batch.push(gsap.to(element, animation));
      }
    }, delay * 1000);
  });
  
  return batch;
};

// Performance optimized scroll animations
export const createOptimizedScrollAnimation = (elements, options = {}) => {
  if (prefersReducedMotion()) return null;
  
  const config = animationConfigs.scrollTrigger[getCurrentBreakpoint()];
  
  return ScrollTrigger.batch(elements, {
    onEnter: (elements) => {
      gsap.fromTo(elements, 
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1,
          ease: "power2.out",
          ...options
        }
      );
    },
    onLeave: (elements) => {
      gsap.to(elements, { opacity: 0.3, duration: 0.3 });
    },
    onEnterBack: (elements) => {
      gsap.to(elements, { opacity: 1, duration: 0.3 });
    },
    start: config.start,
    end: config.end
  });
};

export default AdvancedTimeline;
