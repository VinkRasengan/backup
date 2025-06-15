import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Responsive animation manager
class ResponsiveAnimationManager {
  constructor() {
    this.matchMedia = gsap.matchMedia();
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.contexts = new Map();
    
    // Listen for reduced motion changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      if (e.matches) {
        this.disableAllAnimations();
      }
    });

    this.init();
  }

  init() {
    // Desktop animations (1024px+)
    this.matchMedia.add("(min-width: 1024px)", () => {
      if (this.prefersReducedMotion) return;

      // Enhanced animations for desktop
      this.enableDesktopAnimations();
    });

    // Tablet animations (768px - 1023px)
    this.matchMedia.add("(min-width: 768px) and (max-width: 1023px)", () => {
      if (this.prefersReducedMotion) return;

      // Moderate animations for tablet
      this.enableTabletAnimations();
    });

    // Mobile animations (max 767px)
    this.matchMedia.add("(max-width: 767px)", () => {
      if (this.prefersReducedMotion) return;

      // Simplified animations for mobile
      this.enableMobileAnimations();
    });
  }

  enableDesktopAnimations() {
    const ctx = gsap.context(() => {
      // Complex hover effects
      this.addHoverEffects('.card-hover', {
        scale: 1.05,
        y: -10,
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        duration: 0.3
      });

      // Parallax effects
      this.addParallaxEffects('.parallax-element', 0.5);

      // Complex scroll animations
      this.addScrollAnimations('.scroll-animate', {
        from: { opacity: 0, y: 60, rotationX: 15 },
        to: { opacity: 1, y: 0, rotationX: 0, duration: 0.8, ease: "power3.out" }
      });

      // Magnetic cursor effects
      this.addMagneticEffects('.magnetic');

    });

    this.contexts.set('desktop', ctx);
  }

  enableTabletAnimations() {
    const ctx = gsap.context(() => {
      // Moderate hover effects
      this.addHoverEffects('.card-hover', {
        scale: 1.02,
        y: -5,
        boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
        duration: 0.3
      });

      // Simple scroll animations
      this.addScrollAnimations('.scroll-animate', {
        from: { opacity: 0, y: 30 },
        to: { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      });

    });

    this.contexts.set('tablet', ctx);
  }

  enableMobileAnimations() {
    const ctx = gsap.context(() => {
      // Minimal hover effects (touch-friendly)
      this.addTouchEffects('.card-hover');

      // Simple fade-in animations
      this.addScrollAnimations('.scroll-animate', {
        from: { opacity: 0 },
        to: { opacity: 1, duration: 0.4, ease: "power1.out" }
      });

      // Disable complex animations that might cause performance issues
      gsap.set('.parallax-element', { clearProps: "all" });

    });

    this.contexts.set('mobile', ctx);
  }

  addHoverEffects(selector, config) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      const hoverTl = gsap.timeline({ paused: true });
      
      hoverTl.to(element, config);

      element.addEventListener('mouseenter', () => hoverTl.play());
      element.addEventListener('mouseleave', () => hoverTl.reverse());
    });
  }

  addTouchEffects(selector) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      element.addEventListener('touchstart', () => {
        gsap.to(element, {
          scale: 0.98,
          duration: 0.1,
          ease: "power2.out"
        });
      });

      element.addEventListener('touchend', () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        });
      });
    });
  }

  addParallaxEffects(selector, speed = 0.5) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      ScrollTrigger.create({
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
    });
  }

  addScrollAnimations(selector, config) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element, index) => {
      gsap.set(element, config.from);
      
      ScrollTrigger.create({
        trigger: element,
        start: "top 80%",
        onEnter: () => {
          gsap.to(element, {
            ...config.to,
            delay: index * 0.1
          });
        }
      });
    });
  }

  addMagneticEffects(selector) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(element, {
          x: x * 0.3,
          y: y * 0.3,
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
    });
  }

  disableAllAnimations() {
    // Kill all GSAP animations
    gsap.killTweensOf("*");
    ScrollTrigger.getAll().forEach(st => st.kill());
    
    // Clear all contexts
    this.contexts.forEach(ctx => ctx.revert());
    this.contexts.clear();
    
    // Set all elements to their final state
    gsap.set("*", { clearProps: "all" });
    
    console.log('🚫 All animations disabled due to reduced motion preference');
  }

  // Performance optimization
  optimizeForPerformance() {
    // Use will-change for animated elements
    gsap.set('.gsap-animate', { willChange: 'transform' });
    
    // Batch DOM reads/writes
    gsap.ticker.lagSmoothing(0);
    
    // Use transform3d for hardware acceleration
    gsap.config({ force3D: true });
  }

  // Accessibility helpers
  addFocusAnimations() {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
      element.addEventListener('focus', () => {
        if (!this.prefersReducedMotion) {
          gsap.to(element, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out"
          });
        }
        
        // Always show focus outline
        element.style.outline = '2px solid #3b82f6';
        element.style.outlineOffset = '2px';
      });

      element.addEventListener('blur', () => {
        if (!this.prefersReducedMotion) {
          gsap.to(element, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        }
        
        element.style.outline = '';
        element.style.outlineOffset = '';
      });
    });
  }

  // Cleanup method
  cleanup() {
    this.matchMedia.revert();
    this.contexts.forEach(ctx => ctx.revert());
    this.contexts.clear();
    ScrollTrigger.getAll().forEach(st => st.kill());
  }
}

// Export singleton instance
export const responsiveAnimations = new ResponsiveAnimationManager();

// Utility functions
export const createResponsiveAnimation = (config) => {
  const mm = gsap.matchMedia();
  
  // Desktop
  if (config.desktop) {
    mm.add("(min-width: 1024px)", config.desktop);
  }
  
  // Tablet
  if (config.tablet) {
    mm.add("(min-width: 768px) and (max-width: 1023px)", config.tablet);
  }
  
  // Mobile
  if (config.mobile) {
    mm.add("(max-width: 767px)", config.mobile);
  }
  
  return mm;
};

export const addAccessibleAnimation = (element, animation) => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (prefersReducedMotion) {
    // Set final state immediately
    if (animation.to) {
      gsap.set(element, animation.to);
    }
    return null;
  }
  
  return gsap.to(element, animation);
};

export default responsiveAnimations;
