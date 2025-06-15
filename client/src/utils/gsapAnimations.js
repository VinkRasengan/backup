import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Animation configuration
const ANIMATION_CONFIG = {
  duration: {
    fast: 0.3,
    normal: 0.6,
    slow: 1.2,
    hero: 2.0
  },
  ease: {
    smooth: "power2.out",
    bounce: "back.out(1.7)",
    elastic: "elastic.out(1, 0.3)",
    expo: "expo.out"
  },
  stagger: {
    fast: 0.1,
    normal: 0.2,
    slow: 0.3
  }
};

// Check for reduced motion preference
const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Responsive breakpoints
const getBreakpoint = () => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// GSAP Animation Class
class GSAPAnimations {
  constructor() {
    this.timelines = new Map();
    this.contexts = new Map();
    this.isReducedMotion = prefersReducedMotion();
    
    // Listen for reduced motion changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.isReducedMotion = e.matches;
    });
  }

  // Create animation context
  createContext(name) {
    const ctx = gsap.context(() => {});
    this.contexts.set(name, ctx);
    return ctx;
  }

  // Clean up context
  cleanupContext(name) {
    const ctx = this.contexts.get(name);
    if (ctx) {
      ctx.revert();
      this.contexts.delete(name);
    }
  }

  // Hero Section Animation
  animateHero(container) {
    if (this.isReducedMotion) {
      gsap.set(container.querySelectorAll('[data-animate]'), { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();
    
    // Background gradient particles
    const particles = container.querySelectorAll('.hero-particle');
    if (particles.length > 0) {
      gsap.set(particles, { opacity: 0, scale: 0 });
      tl.to(particles, {
        opacity: 0.6,
        scale: 1,
        duration: ANIMATION_CONFIG.duration.hero,
        stagger: ANIMATION_CONFIG.stagger.slow,
        ease: ANIMATION_CONFIG.ease.smooth
      }, 0);
    }

    // Main title animation
    const title = container.querySelector('[data-animate="title"]');
    if (title) {
      gsap.set(title, { opacity: 0, y: 50 });
      tl.to(title, {
        opacity: 1,
        y: 0,
        duration: ANIMATION_CONFIG.duration.slow,
        ease: ANIMATION_CONFIG.ease.smooth
      }, 0.3);
    }

    // Subtitle animation
    const subtitle = container.querySelector('[data-animate="subtitle"]');
    if (subtitle) {
      gsap.set(subtitle, { opacity: 0, scale: 0.8 });
      tl.to(subtitle, {
        opacity: 1,
        scale: 1,
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.bounce
      }, 0.8);
    }

    // CTA buttons stagger animation
    const buttons = container.querySelectorAll('[data-animate="cta"]');
    if (buttons.length > 0) {
      gsap.set(buttons, { opacity: 0, x: -30 });
      tl.to(buttons, {
        opacity: 1,
        x: 0,
        duration: ANIMATION_CONFIG.duration.normal,
        stagger: ANIMATION_CONFIG.stagger.normal,
        ease: ANIMATION_CONFIG.ease.smooth
      }, 1.2);
    }

    this.timelines.set('hero', tl);
    return tl;
  }

  // Scroll-triggered card animations
  animateCardsOnScroll(selector, options = {}) {
    if (this.isReducedMotion) return;

    const cards = document.querySelectorAll(selector);
    
    cards.forEach((card, index) => {
      gsap.set(card, { opacity: 0, y: 50, scale: 0.9 });
      
      ScrollTrigger.create({
        trigger: card,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: ANIMATION_CONFIG.duration.normal,
            ease: ANIMATION_CONFIG.ease.bounce,
            delay: index * ANIMATION_CONFIG.stagger.fast
          });
        },
        onLeave: () => {
          if (options.reverseOnLeave) {
            gsap.to(card, {
              opacity: 0.7,
              scale: 0.95,
              duration: ANIMATION_CONFIG.duration.fast
            });
          }
        },
        onEnterBack: () => {
          gsap.to(card, {
            opacity: 1,
            scale: 1,
            duration: ANIMATION_CONFIG.duration.fast
          });
        }
      });
    });
  }

  // Statistics counter animation
  animateCounters(selector) {
    if (this.isReducedMotion) return;

    const counters = document.querySelectorAll(selector);
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target || counter.textContent);
      const duration = ANIMATION_CONFIG.duration.hero;
      
      ScrollTrigger.create({
        trigger: counter,
        start: "top 80%",
        onEnter: () => {
          gsap.fromTo(counter, 
            { textContent: 0 },
            {
              textContent: target,
              duration: duration,
              ease: ANIMATION_CONFIG.ease.expo,
              snap: { textContent: 1 },
              onUpdate: function() {
                counter.textContent = Math.ceil(this.targets()[0].textContent).toLocaleString();
              }
            }
          );
        }
      });
    });
  }

  // Hover micro-interactions
  addHoverEffects(selector, options = {}) {
    if (this.isReducedMotion) return;

    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      const hoverTl = gsap.timeline({ paused: true });
      
      hoverTl.to(element, {
        scale: options.scale || 1.05,
        duration: ANIMATION_CONFIG.duration.fast,
        ease: ANIMATION_CONFIG.ease.smooth
      });

      if (options.glow) {
        hoverTl.to(element, {
          boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)",
          duration: ANIMATION_CONFIG.duration.fast
        }, 0);
      }

      element.addEventListener('mouseenter', () => hoverTl.play());
      element.addEventListener('mouseleave', () => hoverTl.reverse());
    });
  }

  // Floating action button animation
  animateFloatingAction(button, menuItems) {
    if (this.isReducedMotion) return;

    let isOpen = false;
    const tl = gsap.timeline({ paused: true });

    // Setup initial states
    gsap.set(menuItems, { 
      opacity: 0, 
      scale: 0, 
      rotation: -180,
      transformOrigin: "center center"
    });

    // Create radial menu animation
    menuItems.forEach((item, index) => {
      const angle = (index * 60) - 90; // Spread items in arc
      const radius = 80;
      const x = Math.cos(angle * Math.PI / 180) * radius;
      const y = Math.sin(angle * Math.PI / 180) * radius;

      tl.to(item, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        x: x,
        y: y,
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.bounce
      }, index * 0.1);
    });

    // Button rotation
    tl.to(button, {
      rotation: 45,
      duration: ANIMATION_CONFIG.duration.normal,
      ease: ANIMATION_CONFIG.ease.smooth
    }, 0);

    button.addEventListener('click', () => {
      if (isOpen) {
        tl.reverse();
      } else {
        tl.play();
      }
      isOpen = !isOpen;
    });

    return tl;
  }

  // Page transition animation
  pageTransition(outElement, inElement, direction = 'left') {
    if (this.isReducedMotion) {
      if (outElement) outElement.style.display = 'none';
      if (inElement) inElement.style.display = 'block';
      return Promise.resolve();
    }

    const tl = gsap.timeline();
    
    if (outElement) {
      tl.to(outElement, {
        opacity: 0,
        x: direction === 'left' ? -100 : 100,
        duration: ANIMATION_CONFIG.duration.fast,
        ease: ANIMATION_CONFIG.ease.smooth
      });
    }

    if (inElement) {
      gsap.set(inElement, { 
        opacity: 0, 
        x: direction === 'left' ? 100 : -100 
      });
      
      tl.to(inElement, {
        opacity: 1,
        x: 0,
        duration: ANIMATION_CONFIG.duration.normal,
        ease: ANIMATION_CONFIG.ease.smooth
      }, 0.2);
    }

    return tl;
  }

  // Responsive animation adjustments
  setupResponsiveAnimations() {
    const mm = gsap.matchMedia();

    // Desktop animations
    mm.add("(min-width: 1024px)", () => {
      this.animateCardsOnScroll('.community-card', { reverseOnLeave: true });
      this.addHoverEffects('.hover-scale', { scale: 1.05, glow: true });
    });

    // Tablet animations
    mm.add("(min-width: 768px) and (max-width: 1023px)", () => {
      this.animateCardsOnScroll('.community-card');
      this.addHoverEffects('.hover-scale', { scale: 1.02 });
    });

    // Mobile animations (simplified)
    mm.add("(max-width: 767px)", () => {
      this.animateCardsOnScroll('.community-card');
      // Disable complex hover effects on mobile
    });

    return mm;
  }

  // Cleanup all animations
  cleanup() {
    this.timelines.forEach(tl => tl.kill());
    this.contexts.forEach(ctx => ctx.revert());
    ScrollTrigger.getAll().forEach(st => st.kill());
    this.timelines.clear();
    this.contexts.clear();
  }

  // Initialize all animations
  init() {
    // Setup responsive animations
    this.setupResponsiveAnimations();
    
    // Initialize counters
    this.animateCounters('[data-counter]');
    
    // Add global hover effects
    this.addHoverEffects('.btn-hover', { scale: 1.05 });
    this.addHoverEffects('.card-hover', { scale: 1.02, glow: true });
    
    console.log('🎨 GSAP Animations initialized');
  }
}

// Export singleton instance
export const gsapAnimations = new GSAPAnimations();
export { ANIMATION_CONFIG };
export default gsapAnimations;
