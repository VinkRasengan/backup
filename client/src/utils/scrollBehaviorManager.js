import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

class ScrollBehaviorManager {
  constructor() {
    this.elements = new Map();
    this.scrollDirection = 'down';
    this.lastScrollY = 0;
    this.scrollVelocity = 0;
    this.isScrolling = false;
    this.scrollTimeout = null;
    
    this.init();
  }

  init() {
    // Enhanced scroll detection
    let ticking = false;
    
    const updateScrollInfo = () => {
      const currentScrollY = window.scrollY;
      this.scrollVelocity = currentScrollY - this.lastScrollY;
      this.scrollDirection = this.scrollVelocity > 0 ? 'down' : 'up';
      this.lastScrollY = currentScrollY;
      this.isScrolling = true;
      
      // Clear existing timeout
      clearTimeout(this.scrollTimeout);
      
      // Set scroll end timeout
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false;
        this.onScrollEnd();
      }, 150);
      
      ticking = false;
    };

    const requestScrollUpdate = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollInfo);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  }

  // Register element for scroll behavior
  register(element, config = {}) {
    const elementId = this.generateId();
    
    const defaultConfig = {
      hideOnScrollDown: false,
      showOnScrollUp: false,
      fadeOnInactive: false,
      inactiveDelay: 3000,
      compactOnScroll: false,
      compactThreshold: 100,
      parallax: false,
      parallaxSpeed: 0.5,
      magnetic: false,
      magneticStrength: 0.3,
      autoHide: false,
      autoHideDelay: 5000
    };

    const finalConfig = { ...defaultConfig, ...config };
    
    this.elements.set(elementId, {
      element,
      config: finalConfig,
      isVisible: true,
      isCompact: false,
      timeline: gsap.timeline({ paused: true })
    });

    this.setupElementBehavior(elementId);
    
    return elementId;
  }

  setupElementBehavior(elementId) {
    const elementData = this.elements.get(elementId);
    if (!elementData) return;

    const { element, config } = elementData;

    // Hide/Show on scroll direction
    if (config.hideOnScrollDown || config.showOnScrollUp) {
      ScrollTrigger.create({
        start: 0,
        end: 99999,
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          
          if (config.hideOnScrollDown && velocity > 300) {
            this.hideElement(elementId);
          } else if (config.showOnScrollUp && velocity < -300) {
            this.showElement(elementId);
          }
        }
      });
    }

    // Compact mode on scroll
    if (config.compactOnScroll) {
      ScrollTrigger.create({
        start: config.compactThreshold,
        end: 99999,
        onEnter: () => this.compactElement(elementId),
        onLeaveBack: () => this.expandElement(elementId)
      });
    }

    // Parallax effect
    if (config.parallax) {
      ScrollTrigger.create({
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const yPos = progress * 100 * config.parallaxSpeed;
          gsap.set(element, { y: -yPos });
        }
      });
    }

    // Magnetic effect
    if (config.magnetic) {
      this.addMagneticEffect(element, config.magneticStrength);
    }

    // Auto-hide behavior
    if (config.autoHide) {
      this.setupAutoHide(elementId);
    }

    // Fade on inactive
    if (config.fadeOnInactive) {
      this.setupFadeOnInactive(elementId);
    }
  }

  hideElement(elementId, duration = 0.3) {
    const elementData = this.elements.get(elementId);
    if (!elementData || !elementData.isVisible) return;

    elementData.isVisible = false;
    
    gsap.to(elementData.element, {
      y: -20,
      opacity: 0.3,
      scale: 0.9,
      duration,
      ease: "power2.out"
    });
  }

  showElement(elementId, duration = 0.4) {
    const elementData = this.elements.get(elementId);
    if (!elementData || elementData.isVisible) return;

    elementData.isVisible = true;
    
    gsap.to(elementData.element, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration,
      ease: "back.out(1.7)"
    });
  }

  compactElement(elementId) {
    const elementData = this.elements.get(elementId);
    if (!elementData || elementData.isCompact) return;

    elementData.isCompact = true;
    
    gsap.to(elementData.element, {
      scale: 0.85,
      opacity: 0.9,
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      duration: 0.4,
      ease: "power2.out"
    });
  }

  expandElement(elementId) {
    const elementData = this.elements.get(elementId);
    if (!elementData || !elementData.isCompact) return;

    elementData.isCompact = false;
    
    gsap.to(elementData.element, {
      scale: 1,
      opacity: 1,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      duration: 0.4,
      ease: "power2.out"
    });
  }

  setupAutoHide(elementId) {
    const elementData = this.elements.get(elementId);
    if (!elementData) return;

    let hideTimeout;

    const resetHideTimer = () => {
      clearTimeout(hideTimeout);
      this.showElement(elementId);
      
      hideTimeout = setTimeout(() => {
        if (window.scrollY > 200) {
          this.fadeElement(elementId, 0.5);
        }
      }, elementData.config.autoHideDelay);
    };

    window.addEventListener('scroll', resetHideTimer, { passive: true });
    elementData.element.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
      this.showElement(elementId);
    });
  }

  setupFadeOnInactive(elementId) {
    const elementData = this.elements.get(elementId);
    if (!elementData) return;

    let fadeTimeout;

    const resetFadeTimer = () => {
      clearTimeout(fadeTimeout);
      gsap.to(elementData.element, { opacity: 1, duration: 0.3 });
      
      fadeTimeout = setTimeout(() => {
        if (this.isScrolling) return;
        gsap.to(elementData.element, { 
          opacity: 0.6, 
          duration: 1,
          ease: "power2.out"
        });
      }, elementData.config.inactiveDelay);
    };

    window.addEventListener('scroll', resetFadeTimer, { passive: true });
    elementData.element.addEventListener('mouseenter', resetFadeTimer);
  }

  fadeElement(elementId, opacity = 0.5, duration = 1) {
    const elementData = this.elements.get(elementId);
    if (!elementData) return;

    gsap.to(elementData.element, {
      opacity,
      duration,
      ease: "power2.out"
    });
  }

  addMagneticEffect(element, strength = 0.3) {
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
  }

  onScrollEnd() {
    // Custom logic when scrolling ends
    this.elements.forEach((elementData, elementId) => {
      if (elementData.config.fadeOnInactive) {
        // Trigger fade on inactive after scroll ends
      }
    });
  }

  // Utility methods
  generateId() {
    return `scroll-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  unregister(elementId) {
    const elementData = this.elements.get(elementId);
    if (elementData) {
      elementData.timeline.kill();
      this.elements.delete(elementId);
    }
  }

  cleanup() {
    this.elements.forEach((elementData) => {
      elementData.timeline.kill();
    });
    this.elements.clear();
    ScrollTrigger.getAll().forEach(st => st.kill());
  }

  // Public API methods
  setScrollDirection(direction) {
    this.scrollDirection = direction;
  }

  getScrollInfo() {
    return {
      direction: this.scrollDirection,
      velocity: this.scrollVelocity,
      position: this.lastScrollY,
      isScrolling: this.isScrolling
    };
  }
}

// Export singleton instance
export const scrollBehaviorManager = new ScrollBehaviorManager();
export default scrollBehaviorManager;
