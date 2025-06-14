// Accessibility utilities for enterprise-level compliance

// ARIA live region manager
class LiveRegionManager {
  constructor() {
    this.regions = new Map();
    this.init();
  }

  init() {
    // Create default live regions if they don't exist
    this.createRegion('polite', 'polite');
    this.createRegion('assertive', 'assertive');
    this.createRegion('status', 'polite', 'status');
  }

  createRegion(id, politeness, role = 'region') {
    if (this.regions.has(id)) return;

    const region = document.createElement('div');
    region.id = `live-region-${id}`;
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', role);
    region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    
    document.body.appendChild(region);
    this.regions.set(id, region);
  }

  announce(message, politeness = 'polite') {
    const region = this.regions.get(politeness);
    if (region) {
      // Clear and set message to ensure it's announced
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  announceError(message) {
    this.announce(message, 'assertive');
  }

  announceStatus(message) {
    this.announce(message, 'status');
  }
}

// Global live region manager
export const liveRegionManager = new LiveRegionManager();

// Focus management utilities
export const focusUtils = {
  // Trap focus within an element
  trapFocus: (element) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  // Get all focusable elements within a container
  getFocusableElements: (container) => {
    return container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    );
  },

  // Save and restore focus
  saveFocus: () => {
    return document.activeElement;
  },

  restoreFocus: (element) => {
    if (element && element.focus) {
      element.focus();
    }
  },

  // Move focus to element with announcement
  moveFocusTo: (element, announcement) => {
    if (element && element.focus) {
      element.focus();
      if (announcement) {
        liveRegionManager.announce(announcement);
      }
    }
  }
};

// Keyboard navigation utilities
export const keyboardUtils = {
  // Common key codes
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    TAB: 'Tab'
  },

  // Handle arrow key navigation in lists
  handleArrowNavigation: (e, items, currentIndex, onIndexChange) => {
    let newIndex = currentIndex;

    switch (e.key) {
      case keyboardUtils.keys.ARROW_UP:
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case keyboardUtils.keys.ARROW_DOWN:
        e.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case keyboardUtils.keys.HOME:
        e.preventDefault();
        newIndex = 0;
        break;
      case keyboardUtils.keys.END:
        e.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return;
    }

    onIndexChange(newIndex);
    if (items[newIndex] && items[newIndex].focus) {
      items[newIndex].focus();
    }
  }
};

// Screen reader utilities
export const screenReaderUtils = {
  // Check if screen reader is likely active
  isScreenReaderActive: () => {
    // This is a heuristic - not 100% accurate
    return (
      window.navigator.userAgent.includes('NVDA') ||
      window.navigator.userAgent.includes('JAWS') ||
      window.speechSynthesis?.getVoices().length > 0 ||
      window.navigator.maxTouchPoints === 0
    );
  },

  // Announce text to screen readers
  announce: (text, priority = 'polite') => {
    liveRegionManager.announce(text, priority);
  },

  // Create descriptive text for complex UI elements
  createDescription: (element, context = {}) => {
    const descriptions = [];
    
    if (element.tagName === 'BUTTON') {
      descriptions.push('button');
    }
    
    if (element.disabled) {
      descriptions.push('disabled');
    }
    
    if (element.getAttribute('aria-expanded') === 'true') {
      descriptions.push('expanded');
    } else if (element.getAttribute('aria-expanded') === 'false') {
      descriptions.push('collapsed');
    }
    
    if (context.position) {
      descriptions.push(`${context.position.current} of ${context.position.total}`);
    }
    
    return descriptions.join(', ');
  }
};

// Color contrast utilities
export const contrastUtils = {
  // Calculate relative luminance
  getLuminance: (r, g, b) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1, color2) => {
    const l1 = contrastUtils.getLuminance(...color1);
    const l2 = contrastUtils.getLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1, color2, level = 'AA', size = 'normal') => {
    const ratio = contrastUtils.getContrastRatio(color1, color2);
    const requirements = {
      'AA': { normal: 4.5, large: 3 },
      'AAA': { normal: 7, large: 4.5 }
    };
    return ratio >= requirements[level][size];
  }
};

// Motion preferences
export const motionUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get safe animation duration based on user preference
  getSafeAnimationDuration: (normalDuration) => {
    return motionUtils.prefersReducedMotion() ? 0.1 : normalDuration;
  },

  // Create motion-safe animation config
  createSafeAnimation: (animation) => {
    if (motionUtils.prefersReducedMotion()) {
      return {
        ...animation,
        duration: 0.1,
        transition: { duration: 0.1 }
      };
    }
    return animation;
  }
};

// Accessibility testing utilities (development only)
export const a11yTesting = {
  // Check for common accessibility issues
  auditPage: () => {
    if (process.env.NODE_ENV !== 'development') return;

    const issues = [];

    // Check for images without alt text
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images missing alt text`);
    }

    // Check for buttons without accessible names
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    const buttonsWithoutText = Array.from(buttons).filter(btn => !btn.textContent.trim());
    if (buttonsWithoutText.length > 0) {
      issues.push(`${buttonsWithoutText.length} buttons without accessible names`);
    }

    // Check for form inputs without labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id;
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (inputsWithoutLabels.length > 0) {
      issues.push(`${inputsWithoutLabels.length} form inputs without labels`);
    }

    // Check for low contrast (simplified check)
    const elements = document.querySelectorAll('*');
    let lowContrastCount = 0;
    Array.from(elements).forEach(el => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      // This is a simplified check - in practice you'd want a more robust solution
      if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
        lowContrastCount++;
      }
    });

    if (issues.length > 0) {
      console.warn('Accessibility issues found:', issues);
    } else {
      console.log('No obvious accessibility issues found');
    }

    return issues;
  }
};

// Initialize accessibility features
export const initAccessibility = () => {
  // Set up global keyboard navigation
  document.addEventListener('keydown', (e) => {
    // Skip to main content with Alt+M
    if (e.altKey && e.key === 'm') {
      const main = document.querySelector('main, [role="main"]');
      if (main) {
        main.focus();
        main.scrollIntoView();
        liveRegionManager.announce('Skipped to main content');
      }
    }
  });

  // Announce page changes for SPAs
  let currentPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      const title = document.title;
      liveRegionManager.announce(`Navigated to ${title}`);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Run accessibility audit in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      a11yTesting.auditPage();
    }, 2000);
  }
};
