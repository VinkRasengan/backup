import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Optimized GSAP configuration for performance
gsap.config({
  nullTargetWarn: false,
  trialWarn: false,
  force3D: true, // Force hardware acceleration
  autoSleep: 30, // Auto-sleep after 30 seconds for better performance
  units: { left: "px", top: "px" } // Optimize units
});

// Performance optimizations
gsap.ticker.lagSmoothing(500, 33); // Smooth out lag spikes
ScrollTrigger.config({
  autoRefreshEvents: "visibilitychange,DOMContentLoaded,load", // Reduce refresh events
  ignoreMobileResize: true // Better mobile performance
});

// Common animation presets - optimized for performance
export const gsapPresets = {
  // Fade animations with hardware acceleration
  fadeIn: {
    from: { opacity: 0, y: 30, force3D: true },
    to: { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", force3D: true }
  },
  fadeInUp: {
    from: { opacity: 0, y: 50, force3D: true },
    to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", force3D: true }
  },
  fadeInLeft: {
    from: { opacity: 0, x: -50, force3D: true },
    to: { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", force3D: true }
  },
  fadeInRight: {
    from: { opacity: 0, x: 50, force3D: true },
    to: { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", force3D: true }
  },
  
  // Scale animations
  scaleIn: {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" }
  },
  scaleInBounce: {
    from: { opacity: 0, scale: 0.3 },
    to: { opacity: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }
  },
  
  // Slide animations
  slideInUp: {
    from: { y: 100, opacity: 0 },
    to: { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
  },
  slideInDown: {
    from: { y: -100, opacity: 0 },
    to: { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
  },
  
  // Stagger animations
  staggerFadeIn: {
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.1 }
  },
  staggerSlideIn: {
    from: { opacity: 0, x: -30 },
    to: { opacity: 1, x: 0, duration: 0.5, ease: "power2.out", stagger: 0.15 }
  }
};

// Animation utilities
export const gsapUtils = {
  // Animate element with preset
  animate: (element, preset, options = {}) => {
    if (!element || !gsapPresets[preset]) return null;
    
    const animation = gsapPresets[preset];
    gsap.set(element, animation.from);
    return gsap.to(element, { ...animation.to, ...options });
  },
  
  // Create timeline
  timeline: (options = {}) => {
    return gsap.timeline(options);
  },
  
  // Scroll trigger animation
  scrollTrigger: (element, animation, options = {}) => {
    return gsap.fromTo(element, animation.from, {
      ...animation.to,
      scrollTrigger: {
        trigger: element,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none reverse",
        ...options
      }
    });
  },
  
  // Hover animations
  hover: (element, hoverAnimation, leaveAnimation) => {
    if (!element) return;
    
    element.addEventListener('mouseenter', () => {
      gsap.to(element, hoverAnimation);
    });
    
    element.addEventListener('mouseleave', () => {
      gsap.to(element, leaveAnimation);
    });
  },
  
  // Loading animation
  loading: (element) => {
    return gsap.to(element, {
      rotation: 360,
      duration: 1,
      ease: "none",
      repeat: -1
    });
  },
  
  // Text typing effect
  typeText: (element, text, options = {}) => {
    return gsap.to(element, {
      text: text,
      duration: options.duration || 2,
      ease: "none",
      ...options
    });
  },
  
  // Counter animation
  counter: (element, endValue, options = {}) => {
    const obj = { value: 0 };
    return gsap.to(obj, {
      value: endValue,
      duration: options.duration || 2,
      ease: "power2.out",
      onUpdate: () => {
        element.textContent = Math.round(obj.value);
      },
      ...options
    });
  }
};

// Page transition utilities
export const pageTransitions = {
  fadeTransition: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 }
  },
  
  slideTransition: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
    transition: { duration: 0.4, ease: "power2.out" }
  }
};

// Cleanup function
export const cleanupGSAP = () => {
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  gsap.killTweensOf("*");
};

export { gsap, ScrollTrigger };
