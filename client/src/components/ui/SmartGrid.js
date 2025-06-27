/**
 * SmartGrid Component
 * Intelligent responsive grid system inspired by Reddit, Facebook, and modern social media
 * Auto-adapts layout based on content type and screen size with enhanced auto-scaling
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useResponsive, getSmartGridConfig } from '../../utils/responsiveDesign';

const SmartGrid = ({
  children,
  type = 'default', // 'posts', 'cards', 'images', 'default'
  gap = 'md',
  animate = true,
  staggerDelay = 0.1,
  className,
  autoScale = true, // New prop for auto-scaling behavior
  minItemWidth = 250, // Minimum item width for auto-scaling
  maxItemWidth = 450, // Maximum item width for auto-scaling
  ...props
}) => {
  const { device, isMobile, isTablet, dimensions } = useResponsive();
  const childrenArray = React.Children.toArray(children);
  const itemCount = childrenArray.length;

  // Enhanced gap configuration
  const getGapClasses = () => {
    const gapMap = {
      sm: isMobile ? 'gap-2' : 'gap-3',
      md: isMobile ? 'gap-3' : 'gap-4',
      lg: isMobile ? 'gap-4' : 'gap-6',
      xl: isMobile ? 'gap-5' : 'gap-8'
    };
    return gapMap[gap] || gapMap.md;
  };

  // Enhanced auto-scaling grid configuration
  const getSmartGridConfig = () => {
    if (!autoScale) {
      // Use traditional configuration if auto-scale is disabled
      return getBasicGridConfig();
    }

    // Calculate optimal columns based on screen width and content
    const screenWidth = dimensions.width;
    const effectiveWidth = screenWidth - (isMobile ? 32 : 64); // Account for padding
    const gapWidth = isMobile ? 12 : 16; // Gap between items

    // Auto-calculate optimal columns
    const calculateOptimalColumns = () => {
      if (itemCount === 0) return 1;

      // For single item, always use 1 column
      if (itemCount === 1) return 1;

      // Calculate how many items can fit
      const itemWidthWithGap = minItemWidth + gapWidth;
      const maxPossibleCols = Math.floor(effectiveWidth / itemWidthWithGap);
      
      // Limit by item count and practical maximums
      const practicalMaxCols = isMobile ? 2 : isTablet ? 3 : 4;
      const optimalCols = Math.min(maxPossibleCols, Math.min(itemCount, practicalMaxCols));

      return Math.max(1, optimalCols);
    };

    const optimalColumns = calculateOptimalColumns();

    return {
      cols: optimalColumns,
      gap: getGapClasses(),
      padding: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-6',
      itemMinWidth: minItemWidth,
      itemMaxWidth: maxItemWidth
    };
  };

  // Fallback basic grid configuration
  const getBasicGridConfig = () => {
    const configs = {
      posts: {
        mobile: { cols: 1, gap: getGapClasses(), padding: 'p-3' },
        tablet: { cols: 1, gap: getGapClasses(), padding: 'p-4' },
        desktop: { cols: 1, gap: getGapClasses(), padding: 'p-6' }
      },
      cards: {
        mobile: { 
          cols: itemCount === 1 ? 1 : Math.min(itemCount, 2), 
          gap: getGapClasses(), 
          padding: 'p-3' 
        },
        tablet: { 
          cols: itemCount <= 2 ? itemCount : Math.min(itemCount, 3), 
          gap: getGapClasses(), 
          padding: 'p-4' 
        },
        desktop: { 
          cols: Math.min(itemCount, 4), 
          gap: getGapClasses(), 
          padding: 'p-6' 
        }
      },
      images: {
        mobile: { 
          cols: itemCount === 1 ? 1 : Math.min(itemCount, 2), 
          gap: 'gap-2', 
          padding: 'p-2' 
        },
        tablet: { 
          cols: Math.min(itemCount, 3), 
          gap: 'gap-3', 
          padding: 'p-3' 
        },
        desktop: { 
          cols: Math.min(itemCount, 4), 
          gap: 'gap-4', 
          padding: 'p-4' 
        }
      },
      default: {
        mobile: { cols: 1, gap: getGapClasses(), padding: 'p-3' },
        tablet: { cols: 2, gap: getGapClasses(), padding: 'p-4' },
        desktop: { cols: 3, gap: getGapClasses(), padding: 'p-6' }
      }
    };

    return configs[type]?.[device] || configs.default[device] || configs.default.mobile;
  };

  const config = autoScale ? getSmartGridConfig() : getBasicGridConfig();
  
  // Generate enhanced grid classes with auto-scaling support
  const getGridClasses = () => {
    const baseClasses = 'grid w-full';
    
    if (autoScale && config.itemMinWidth && config.itemMaxWidth) {
      // Use CSS Grid with auto-fit for true responsive behavior
      return cn(
        baseClasses,
        config.gap,
        className
      );
    }

    // Traditional column-based grid
    const colClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6'
    };

    return cn(
      baseClasses,
      colClasses[config.cols] || 'grid-cols-1',
      config.gap,
      className
    );
  };

  // Generate grid style for auto-scaling
  const getGridStyle = () => {
    if (!autoScale || !config.itemMinWidth || !config.itemMaxWidth) {
      return {};
    }

    return {
      gridTemplateColumns: `repeat(auto-fit, minmax(${config.itemMinWidth}px, ${config.itemMaxWidth}px))`,
      justifyContent: 'center'
    };
  };

  // Enhanced animation variants with responsive timing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? staggerDelay * 0.5 : staggerDelay,
        delayChildren: isMobile ? 0.05 : 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: isMobile ? 10 : 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: isMobile ? 0.3 : 0.4,
        ease: "easeOut"
      }
    }
  };

  // Enhanced hover effects based on device
  const getHoverEffects = () => {
    if (isMobile) {
      return { scale: 0.98 }; // Subtle press effect on mobile
    }
    return { 
      y: -2, 
      scale: 1.02,
      transition: { duration: 0.2 } 
    };
  };

  if (animate) {
    return (
      <motion.div
        className={getGridClasses()}
        style={getGridStyle()}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        {...props}
      >
        {childrenArray.map((child, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={getHoverEffects()}
            whileTap={isMobile ? { scale: 0.95 } : undefined}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div 
      className={getGridClasses()} 
      style={getGridStyle()}
      {...props}
    >
      {children}
    </div>
  );
};

// Enhanced specialized grid components with auto-scaling

export const PostGrid = ({ children, ...props }) => (
  <SmartGrid 
    type="posts" 
    autoScale={true}
    minItemWidth={300}
    maxItemWidth={800}
    {...props}
  >
    {children}
  </SmartGrid>
);

export const CardGrid = ({ children, ...props }) => (
  <SmartGrid 
    type="cards" 
    autoScale={true}
    minItemWidth={250}
    maxItemWidth={400}
    {...props}
  >
    {children}
  </SmartGrid>
);

export const ImageGrid = ({ children, ...props }) => (
  <SmartGrid 
    type="images" 
    autoScale={true}
    minItemWidth={150}
    maxItemWidth={300}
    {...props}
  >
    {children}
  </SmartGrid>
);

// Enhanced Masonry-style grid with better responsive behavior
export const MasonryGrid = ({ 
  children, 
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 'gap-4',
  className,
  autoScale = true,
  ...props 
}) => {
  const { device, dimensions, isMobile } = useResponsive();
  
  // Auto-calculate columns based on content and screen size
  const getOptimalColumns = () => {
    if (!autoScale) {
      return columns[device] || columns.desktop || 4;
    }

    const screenWidth = dimensions.width;
    const minItemWidth = 200; // Minimum width for masonry items
    const effectiveWidth = screenWidth - (isMobile ? 32 : 64);
    const maxCols = Math.floor(effectiveWidth / minItemWidth);
    
    // Respect the original column limits
    const deviceMaxCols = columns[device] || columns.desktop || 4;
    return Math.min(maxCols, deviceMaxCols, React.Children.count(children));
  };

  const cols = getOptimalColumns();

  const getColumnClasses = () => {
    const colClasses = {
      1: 'columns-1',
      2: 'columns-2',
      3: 'columns-3',
      4: 'columns-4',
      5: 'columns-5',
      6: 'columns-6'
    };
    return colClasses[cols] || 'columns-4';
  };

  const getGapClasses = () => {
    if (typeof gap === 'string') return gap;
    
    const gapMap = {
      sm: isMobile ? 'gap-2' : 'gap-3',
      md: isMobile ? 'gap-3' : 'gap-4',
      lg: isMobile ? 'gap-4' : 'gap-6'
    };
    return gapMap[gap] || 'gap-4';
  };

  return (
    <div 
      className={cn(
        getColumnClasses(),
        getGapClasses(),
        'space-y-4',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: isMobile ? 0.3 : 0.4, 
            delay: index * (isMobile ? 0.05 : 0.1),
            ease: "easeOut"
          }}
          whileHover={!isMobile ? { scale: 1.02 } : { scale: 0.98 }}
          className="break-inside-avoid mb-4"
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Enhanced Auto-sizing grid with smarter calculations
export const AutoGrid = ({ 
  children, 
  minItemWidth = 280,
  maxItemWidth = 400,
  gap = 'gap-6',
  className,
  ...props 
}) => {
  const { dimensions, isMobile, isTablet } = useResponsive();
  
  // Enhanced column calculation with better spacing
  const calculateColumns = () => {
    const containerWidth = dimensions.width - (isMobile ? 32 : isTablet ? 48 : 64);
    const gapWidth = isMobile ? 12 : isTablet ? 16 : 24;
    const itemWidthWithGap = minItemWidth + gapWidth;
    
    const maxCols = Math.floor(containerWidth / itemWidthWithGap);
    const childCount = React.Children.count(children);
    
    // Ensure we don't have more columns than items
    const optimalCols = Math.min(maxCols, childCount);
    
    // Minimum 1, maximum 6 columns
    return Math.max(1, Math.min(optimalCols, 6));
  };

  const cols = calculateColumns();

  // Calculate actual item width for better distribution
  const getActualItemWidth = () => {
    const containerWidth = dimensions.width - (isMobile ? 32 : isTablet ? 48 : 64);
    const gapWidth = (cols - 1) * (isMobile ? 12 : isTablet ? 16 : 24);
    const availableWidth = containerWidth - gapWidth;
    const itemWidth = availableWidth / cols;
    
    // Clamp between min and max
    return Math.min(Math.max(itemWidth, minItemWidth), maxItemWidth);
  };

  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, minmax(${minItemWidth}px, ${Math.floor(getActualItemWidth())}px))`,
    justifyContent: cols * minItemWidth > dimensions.width - 64 ? 'flex-start' : 'center'
  };

  const getGapClasses = () => {
    if (typeof gap === 'string') return gap;
    
    return isMobile ? 'gap-3' : isTablet ? 'gap-4' : 'gap-6';
  };

  return (
    <motion.div
      className={cn('grid', getGapClasses(), className)}
      style={gridStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: isMobile ? 0.3 : 0.4, 
            delay: index * (isMobile ? 0.05 : 0.1),
            ease: "easeOut"
          }}
          whileHover={!isMobile ? { 
            scale: 1.02,
            transition: { duration: 0.2 }
          } : { 
            scale: 0.98,
            transition: { duration: 0.1 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SmartGrid;
