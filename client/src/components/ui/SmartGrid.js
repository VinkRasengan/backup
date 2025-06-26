/**
 * SmartGrid Component
 * Intelligent responsive grid system inspired by Reddit, Facebook, and modern social media
 * Auto-adapts layout based on content type and screen size
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
  ...props
}) => {
  const { device, isMobile, isTablet } = useResponsive();
  const childrenArray = React.Children.toArray(children);
  const itemCount = childrenArray.length;

  // Get smart grid configuration based on content type and device
  const getGridConfig = () => {
    const configs = {
      posts: {
        mobile: { cols: 1, gap: 'gap-3', padding: 'p-3' },
        tablet: { cols: 1, gap: 'gap-4', padding: 'p-4' },
        desktop: { cols: 1, gap: 'gap-6', padding: 'p-6' }
      },
      cards: {
        mobile: { 
          cols: itemCount === 1 ? 1 : 2, 
          gap: 'gap-3', 
          padding: 'p-3' 
        },
        tablet: { 
          cols: itemCount <= 2 ? itemCount : 3, 
          gap: 'gap-4', 
          padding: 'p-4' 
        },
        desktop: { 
          cols: Math.min(itemCount, 4), 
          gap: 'gap-6', 
          padding: 'p-6' 
        }
      },
      images: {
        mobile: { 
          cols: itemCount === 1 ? 1 : 2, 
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
      default: getSmartGridConfig(itemCount, device)
    };

    return configs[type]?.[device] || configs.default;
  };

  const config = getGridConfig();
  
  // Generate grid classes
  const getGridClasses = () => {
    const baseClasses = 'grid';
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  if (animate) {
    return (
      <motion.div
        className={getGridClasses()}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        {...props}
      >
        {childrenArray.map((child, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ 
              y: -2, 
              transition: { duration: 0.2 } 
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div className={getGridClasses()} {...props}>
      {children}
    </div>
  );
};

// Specialized grid components for different content types

export const PostGrid = ({ children, ...props }) => (
  <SmartGrid type="posts" {...props}>
    {children}
  </SmartGrid>
);

export const CardGrid = ({ children, ...props }) => (
  <SmartGrid type="cards" {...props}>
    {children}
  </SmartGrid>
);

export const ImageGrid = ({ children, ...props }) => (
  <SmartGrid type="images" {...props}>
    {children}
  </SmartGrid>
);

// Masonry-style grid for Pinterest-like layouts
export const MasonryGrid = ({ 
  children, 
  columns = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 'gap-4',
  className,
  ...props 
}) => {
  const { device } = useResponsive();
  const cols = columns[device] || columns.desktop || 4;

  const getColumnClasses = () => {
    const colClasses = {
      2: 'columns-2',
      3: 'columns-3',
      4: 'columns-4',
      5: 'columns-5',
      6: 'columns-6'
    };
    return colClasses[cols] || 'columns-4';
  };

  return (
    <div 
      className={cn(
        getColumnClasses(),
        gap,
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
            duration: 0.4, 
            delay: index * 0.1,
            ease: "easeOut"
          }}
          className="break-inside-avoid mb-4"
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
};

// Auto-sizing grid that adapts to content
export const AutoGrid = ({ 
  children, 
  minItemWidth = 280,
  maxItemWidth = 400,
  gap = 'gap-6',
  className,
  ...props 
}) => {
  const { dimensions } = useResponsive();
  
  // Calculate optimal number of columns based on container width
  const calculateColumns = () => {
    const containerWidth = dimensions.width - 64; // Account for padding
    const itemWidthWithGap = minItemWidth + 24; // Add gap
    const maxCols = Math.floor(containerWidth / itemWidthWithGap);
    return Math.max(1, Math.min(maxCols, React.Children.count(children)));
  };

  const cols = calculateColumns();

  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, minmax(${minItemWidth}px, ${maxItemWidth}px))`,
    justifyContent: 'center'
  };

  return (
    <motion.div
      className={cn('grid', gap, className)}
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
            duration: 0.4, 
            delay: index * 0.1,
            ease: "easeOut"
          }}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default SmartGrid;
