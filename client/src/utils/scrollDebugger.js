/**
 * Scroll Debugger Utility
 * Helps identify and fix scroll conflicts in the application
 */

class ScrollDebugger {
  constructor() {
    this.scrollableElements = [];
    this.isDebugging = false;
  }

  /**
   * Start debugging scroll issues
   */
  startDebugging() {
    if (this.isDebugging) return;
    
    this.isDebugging = true;
    console.log('🔍 Starting scroll debugging...');
    
    // Find all scrollable elements
    this.findScrollableElements();
    
    // Log scroll conflicts
    this.logScrollConflicts();
    
    // Add visual indicators
    this.addVisualIndicators();
    
    // Monitor scroll events
    this.monitorScrollEvents();
  }

  /**
   * Stop debugging
   */
  stopDebugging() {
    this.isDebugging = false;
    this.removeVisualIndicators();
    console.log('✅ Scroll debugging stopped');
  }

  /**
   * Find all elements that can scroll
   */
  findScrollableElements() {
    const allElements = document.querySelectorAll('*');
    this.scrollableElements = [];

    allElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const hasVerticalScroll = style.overflowY === 'auto' || style.overflowY === 'scroll';
      const hasHorizontalScroll = style.overflowX === 'auto' || style.overflowX === 'scroll';
      
      if (hasVerticalScroll || hasHorizontalScroll) {
        this.scrollableElements.push({
          element,
          tag: element.tagName.toLowerCase(),
          id: element.id || 'no-id',
          classes: element.className || 'no-classes',
          overflowY: style.overflowY,
          overflowX: style.overflowX,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          hasVerticalScrollbar: element.scrollHeight > element.clientHeight,
          hasHorizontalScrollbar: element.scrollWidth > element.clientWidth
        });
      }
    });

    console.log(`Found ${this.scrollableElements.length} scrollable elements:`, this.scrollableElements);
  }

  /**
   * Log potential scroll conflicts
   */
  logScrollConflicts() {
    const conflicts = this.scrollableElements.filter(item => 
      item.hasVerticalScrollbar && item.tag !== 'body'
    );

    if (conflicts.length > 1) {
      console.warn('⚠️ Multiple vertical scroll containers detected:', conflicts);
      console.warn('This may cause dual scrollbar issues!');
    }

    // Check for nested scrollable elements
    conflicts.forEach(item => {
      const parent = item.element.parentElement;
      const parentScrollable = this.scrollableElements.find(p => p.element === parent);
      
      if (parentScrollable) {
        console.warn('⚠️ Nested scroll containers detected:', {
          child: item,
          parent: parentScrollable
        });
      }
    });
  }

  /**
   * Add visual indicators to scrollable elements
   */
  addVisualIndicators() {
    this.scrollableElements.forEach((item, index) => {
      if (item.element === document.body) return;
      
      const indicator = document.createElement('div');
      indicator.className = 'scroll-debug-indicator';
      indicator.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        background: red;
        color: white;
        padding: 2px 6px;
        font-size: 10px;
        z-index: 10000;
        pointer-events: none;
      `;
      indicator.textContent = `SCROLL-${index}`;
      
      item.element.style.position = 'relative';
      item.element.style.border = '2px solid red';
      item.element.appendChild(indicator);
    });
  }

  /**
   * Remove visual indicators
   */
  removeVisualIndicators() {
    document.querySelectorAll('.scroll-debug-indicator').forEach(indicator => {
      indicator.remove();
    });
    
    this.scrollableElements.forEach(item => {
      item.element.style.border = '';
    });
  }

  /**
   * Monitor scroll events
   */
  monitorScrollEvents() {
    this.scrollableElements.forEach((item, index) => {
      item.element.addEventListener('scroll', () => {
        console.log(`📜 Scroll event on element ${index}:`, {
          tag: item.tag,
          id: item.id,
          scrollTop: item.element.scrollTop,
          scrollLeft: item.element.scrollLeft
        });
      });
    });
  }

  /**
   * Fix common scroll issues automatically
   */
  autoFix() {
    console.log('🔧 Attempting to auto-fix scroll issues...');
    
    // Remove overflow from all elements except body
    this.scrollableElements.forEach(item => {
      if (item.element !== document.body && item.element.tagName !== 'HTML') {
        item.element.style.overflow = 'visible';
        item.element.style.overflowY = 'visible';
        item.element.style.overflowX = 'hidden';
      }
    });

    // Ensure body handles all scrolling
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    console.log('✅ Auto-fix applied');
    
    // Re-scan after fix
    setTimeout(() => {
      this.findScrollableElements();
      this.logScrollConflicts();
    }, 100);
  }

  /**
   * Generate report
   */
  generateReport() {
    const report = {
      totalScrollableElements: this.scrollableElements.length,
      verticalScrollers: this.scrollableElements.filter(item => item.hasVerticalScrollbar),
      horizontalScrollers: this.scrollableElements.filter(item => item.hasHorizontalScrollbar),
      potentialConflicts: this.scrollableElements.filter(item => 
        item.hasVerticalScrollbar && item.tag !== 'body'
      ).length
    };

    console.log('📊 Scroll Debug Report:', report);
    return report;
  }
}

// Create global instance
window.scrollDebugger = new ScrollDebugger();

// Add keyboard shortcut to toggle debugging
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    if (window.scrollDebugger.isDebugging) {
      window.scrollDebugger.stopDebugging();
    } else {
      window.scrollDebugger.startDebugging();
    }
  }
  
  // Auto-fix shortcut
  if (e.ctrlKey && e.shiftKey && e.key === 'F') {
    e.preventDefault();
    window.scrollDebugger.autoFix();
  }
});

export default ScrollDebugger;
