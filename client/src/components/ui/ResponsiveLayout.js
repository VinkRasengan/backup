import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Standardized grid system with responsive breakpoints
const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
};

const gridGaps = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-10'
};

const containerPadding = {
  sm: 'px-4',
  md: 'px-6',
  lg: 'px-8',
  xl: 'px-10'
};

const containerMaxWidth = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full'
};

// Standard responsive grid component
const ResponsiveGrid = ({ 
  cols = 3, 
  gap = 'md', 
  className,
  animate = true,
  staggerDelay = 0.1,
  children,
  ...props 
}) => {
  const gridClasses = cn(
    'grid',
    gridCols[cols],
    gridGaps[gap],
    className
  );

  if (animate) {
    return (
      <motion.div
        className={gridClasses}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        {...props}
      >
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * staggerDelay 
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

// Standard container with responsive padding and max-width
const ResponsiveContainer = ({ 
  size = 'lg',
  padding = 'md',
  className,
  children,
  ...props 
}) => {
  const containerClasses = cn(
    'mx-auto',
    containerMaxWidth[size],
    containerPadding[padding],
    className
  );

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
};

// Standard section with consistent spacing
const Section = ({ 
  className,
  padding = 'py-16',
  background = 'bg-white dark:bg-gray-900',
  children,
  ...props 
}) => {
  const sectionClasses = cn(
    padding,
    background,
    className
  );

  return (
    <section className={sectionClasses} {...props}>
      {children}
    </section>
  );
};

// Standard layout patterns
const StatsGridLayout = ({ children, ...props }) => (
  <ResponsiveGrid cols={4} gap="md" {...props}>
    {children}
  </ResponsiveGrid>
);

const FeatureGridLayout = ({ children, ...props }) => (
  <ResponsiveGrid cols={3} gap="lg" {...props}>
    {children}
  </ResponsiveGrid>
);

const ActionGridLayout = ({ children, ...props }) => (
  <ResponsiveGrid cols={2} gap="md" {...props}>
    {children}
  </ResponsiveGrid>
);

// Dashboard layout with sidebar
const DashboardLayout = ({ 
  sidebar, 
  main, 
  sidebarSpan = 1, 
  mainSpan = 2,
  gap = 'lg',
  className,
  ...props 
}) => {
  const layoutClasses = cn(
    'grid grid-cols-1 lg:grid-cols-3',
    gridGaps[gap],
    className
  );

  return (
    <div className={layoutClasses} {...props}>
      {main && (
        <div className={`lg:col-span-${mainSpan}`}>
          {main}
        </div>
      )}
      {sidebar && (
        <div className={`lg:col-span-${sidebarSpan}`}>
          {sidebar}
        </div>
      )}
    </div>
  );
};

// Content layout with proper spacing
const ContentLayout = ({ 
  title, 
  subtitle, 
  children, 
  headerClassName,
  containerSize = 'lg',
  ...props 
}) => (
  <ResponsiveContainer size={containerSize} {...props}>
    {(title || subtitle) && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn('text-center mb-12', headerClassName)}
      >
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {subtitle}
          </p>
        )}
      </motion.div>
    )}
    {children}
  </ResponsiveContainer>
);

export {
  ResponsiveGrid,
  ResponsiveContainer,
  Section,
  StatsGridLayout,
  FeatureGridLayout,
  ActionGridLayout,
  DashboardLayout,
  ContentLayout
};

export default ResponsiveGrid;
