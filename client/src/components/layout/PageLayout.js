import React from 'react';
import { cn } from '../../utils/cn';

/**
 * PageLayout - Wrapper for individual pages with consistent spacing and structure
 * Provides sticky headers, proper content areas, and responsive design
 */
const PageLayout = ({ 
  children, 
  title,
  subtitle,
  actions,
  stickyHeader = false,
  maxWidth = '6xl',
  padding = 'lg',
  className,
  headerClassName,
  contentClassName,
  ...props 
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-6 lg:p-8',
    xl: 'p-8 lg:p-12'
  };

  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div 
      id="main-content"
      className={cn(
        'min-h-screen',
        className
      )}
      {...props}
    >
      {/* Page Header */}
      {(title || subtitle || actions) && (
        <header 
          className={cn(
            'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
            stickyHeader && 'sticky top-16 z-30',
            headerClassName
          )}
        >
          <div className={cn(
            'mx-auto',
            maxWidthClasses[maxWidth],
            paddingClasses[padding]
          )}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm lg:text-base text-gray-600 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {actions && (
                <div className="ml-4 flex items-center space-x-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Page Content */}
      <div 
        className={cn(
          'mx-auto',
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * SectionLayout - For organizing content within pages
 */
export const SectionLayout = ({ 
  children, 
  title, 
  subtitle,
  actions,
  spacing = 'lg',
  className,
  ...props 
}) => {
  const spacingClasses = {
    sm: 'mb-6',
    md: 'mb-8',
    lg: 'mb-12',
    xl: 'mb-16'
  };

  return (
    <section 
      className={cn(
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm lg:text-base text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="ml-4 flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      )}
      
      {children}
    </section>
  );
};

/**
 * CardLayout - For card-based content with consistent styling
 */
export const CardLayout = ({ 
  children, 
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  className,
  ...props 
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl'
  };

  return (
    <div 
      className={cn(
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        paddingClasses[padding],
        shadowClasses[shadow],
        roundedClasses[rounded],
        'transition-colors duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * GridLayout - Responsive grid system
 */
export const GridLayout = ({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className,
  ...props 
}) => {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  return (
    <div 
      className={cn(
        'grid',
        gridCols[cols.sm] || 'grid-cols-1',
        `md:${gridCols[cols.md] || gridCols[cols.sm] || 'grid-cols-2'}`,
        `lg:${gridCols[cols.lg] || gridCols[cols.md] || 'grid-cols-3'}`,
        `xl:${gridCols[cols.xl] || gridCols[cols.lg] || 'grid-cols-4'}`,
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default PageLayout;
