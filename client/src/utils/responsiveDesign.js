/**
 * Enhanced Responsive Design System
 * Inspired by Reddit, Facebook, and modern social media platforms
 * Auto-scaling components with intelligent breakpoints
 */

import React from 'react';

// Enhanced breakpoint system (following modern standards)
export const breakpoints = {
  xs: 320,   // Small phones
  sm: 640,   // Large phones
  md: 768,   // Tablets
  lg: 1024,  // Small laptops
  xl: 1280,  // Large laptops
  '2xl': 1536, // Desktop
  '3xl': 1920  // Large desktop
};

// Device detection utilities
export const deviceTypes = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  desktop: { min: 1024, max: Infinity }
};

// Get current device type
export const getCurrentDevice = () => {
  const width = window.innerWidth;
  if (width <= deviceTypes.mobile.max) return 'mobile';
  if (width <= deviceTypes.tablet.max) return 'tablet';
  return 'desktop';
};

// Get current breakpoint
export const getCurrentBreakpoint = () => {
  const width = window.innerWidth;
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints['2xl']) return 'xl';
  if (width < breakpoints['3xl']) return '2xl';
  return '3xl';
};

// Responsive hook for components
export const useResponsive = () => {
  const [device, setDevice] = React.useState(getCurrentDevice());
  const [breakpoint, setBreakpoint] = React.useState(getCurrentBreakpoint());
  const [dimensions, setDimensions] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  React.useEffect(() => {
    const handleResize = () => {
      const newDevice = getCurrentDevice();
      const newBreakpoint = getCurrentBreakpoint();
      const newDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      setDevice(newDevice);
      setBreakpoint(newBreakpoint);
      setDimensions(newDimensions);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    device,
    breakpoint,
    dimensions,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isSmallScreen: dimensions.width < breakpoints.lg
  };
};

// Smart grid system (Reddit/Facebook style)
export const getSmartGridConfig = (itemCount, device = getCurrentDevice()) => {
  const configs = {
    mobile: {
      1: { cols: 1, gap: 'gap-3', padding: 'p-3' },
      2: { cols: 1, gap: 'gap-3', padding: 'p-3' },
      3: { cols: 1, gap: 'gap-3', padding: 'p-3' },
      4: { cols: 2, gap: 'gap-2', padding: 'p-2' },
      default: { cols: 2, gap: 'gap-2', padding: 'p-2' }
    },
    tablet: {
      1: { cols: 1, gap: 'gap-4', padding: 'p-4' },
      2: { cols: 2, gap: 'gap-4', padding: 'p-4' },
      3: { cols: 2, gap: 'gap-4', padding: 'p-4' },
      4: { cols: 2, gap: 'gap-3', padding: 'p-3' },
      default: { cols: 3, gap: 'gap-3', padding: 'p-3' }
    },
    desktop: {
      1: { cols: 1, gap: 'gap-6', padding: 'p-6' },
      2: { cols: 2, gap: 'gap-6', padding: 'p-6' },
      3: { cols: 3, gap: 'gap-6', padding: 'p-6' },
      4: { cols: 4, gap: 'gap-4', padding: 'p-4' },
      default: { cols: 4, gap: 'gap-4', padding: 'p-4' }
    }
  };

  const deviceConfig = configs[device];
  return deviceConfig[itemCount] || deviceConfig.default;
};

// Smart image layout (Facebook/Instagram style)
export const getSmartImageLayout = (imageCount, device = getCurrentDevice()) => {
  const layouts = {
    mobile: {
      1: {
        container: "w-full",
        imageClass: "w-full h-48 sm:h-56 object-cover rounded-lg",
        layout: "single"
      },
      2: {
        container: "grid grid-cols-2 gap-1",
        imageClass: "w-full h-32 sm:h-36 object-cover rounded",
        layout: "dual"
      },
      3: {
        container: "grid grid-cols-2 gap-1 h-36",
        imageClass: {
          first: "w-full h-full object-cover rounded col-span-1 row-span-2",
          others: "w-full h-full object-cover rounded"
        },
        layout: "triple"
      },
      4: {
        container: "grid grid-cols-2 gap-1",
        imageClass: "w-full h-24 sm:h-28 object-cover rounded",
        layout: "quad"
      }
    },
    tablet: {
      1: {
        container: "w-full",
        imageClass: "w-full h-64 md:h-80 object-cover rounded-lg",
        layout: "single"
      },
      2: {
        container: "grid grid-cols-2 gap-2",
        imageClass: "w-full h-40 md:h-48 object-cover rounded-lg",
        layout: "dual"
      },
      3: {
        container: "grid grid-cols-2 gap-2 h-48",
        imageClass: {
          first: "w-full h-full object-cover rounded-lg",
          others: "w-full h-full object-cover rounded-lg"
        },
        layout: "triple"
      },
      4: {
        container: "grid grid-cols-2 gap-2",
        imageClass: "w-full h-32 md:h-40 object-cover rounded-lg",
        layout: "quad"
      }
    },
    desktop: {
      1: {
        container: "w-full",
        imageClass: "w-full max-h-96 object-cover rounded-xl",
        layout: "single"
      },
      2: {
        container: "grid grid-cols-2 gap-3",
        imageClass: "w-full h-56 lg:h-64 object-cover rounded-xl",
        layout: "dual"
      },
      3: {
        container: "grid grid-cols-2 gap-3 h-64",
        imageClass: {
          first: "w-full h-full object-cover rounded-xl",
          others: "w-full h-full object-cover rounded-xl"
        },
        layout: "triple"
      },
      4: {
        container: "grid grid-cols-2 gap-3",
        imageClass: "w-full h-48 lg:h-56 object-cover rounded-xl",
        layout: "quad"
      }
    }
  };

  const deviceLayouts = layouts[device];
  return deviceLayouts[Math.min(imageCount, 4)] || deviceLayouts[4];
};

// Smart text truncation (Reddit style)
export const getSmartTextConfig = (device = getCurrentDevice()) => {
  return {
    mobile: {
      title: { maxLength: 60, lines: 2 },
      content: { maxLength: 120, lines: 3 },
      comment: { maxLength: 100, lines: 2 }
    },
    tablet: {
      title: { maxLength: 80, lines: 2 },
      content: { maxLength: 200, lines: 4 },
      comment: { maxLength: 150, lines: 3 }
    },
    desktop: {
      title: { maxLength: 120, lines: 3 },
      content: { maxLength: 300, lines: 5 },
      comment: { maxLength: 250, lines: 4 }
    }
  }[device];
};

// Smart spacing system
export const getSmartSpacing = (device = getCurrentDevice()) => {
  return {
    mobile: {
      container: 'px-3 py-2',
      card: 'p-3 mb-2',
      section: 'mb-4',
      element: 'mb-2'
    },
    tablet: {
      container: 'px-4 py-3',
      card: 'p-4 mb-3',
      section: 'mb-6',
      element: 'mb-3'
    },
    desktop: {
      container: 'px-6 py-4',
      card: 'p-6 mb-4',
      section: 'mb-8',
      element: 'mb-4'
    }
  }[device];
};

// Smart font sizes
export const getSmartFontSizes = (device = getCurrentDevice()) => {
  return {
    mobile: {
      title: 'text-base font-semibold',
      subtitle: 'text-sm font-medium',
      body: 'text-sm',
      caption: 'text-xs',
      meta: 'text-xs'
    },
    tablet: {
      title: 'text-lg font-semibold',
      subtitle: 'text-base font-medium',
      body: 'text-sm',
      caption: 'text-sm',
      meta: 'text-xs'
    },
    desktop: {
      title: 'text-xl font-semibold',
      subtitle: 'text-lg font-medium',
      body: 'text-base',
      caption: 'text-sm',
      meta: 'text-sm'
    }
  }[device];
};

// Export React hook
