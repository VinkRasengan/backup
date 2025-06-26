/**
 * SmartCard Component
 * Intelligent responsive card system inspired by modern social media platforms
 * Auto-adapts styling, spacing, and interactions based on device and content type
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useResponsive, getSmartSpacing, getSmartFontSizes } from '../../utils/responsiveDesign';

const SmartCard = React.forwardRef(({
  children,
  type = 'default', // 'post', 'profile', 'media', 'action', 'default'
  variant = 'elevated', // 'flat', 'elevated', 'outlined', 'ghost'
  interactive = false,
  hover = true,
  animate = true,
  className,
  onClick,
  ...props
}, ref) => {
  const { device, isMobile } = useResponsive();
  const spacing = getSmartSpacing(device);
  const fontSizes = getSmartFontSizes(device);

  // Get card configuration based on type and device
  const getCardConfig = () => {
    const configs = {
      post: {
        mobile: {
          padding: 'p-3',
          rounded: 'rounded-lg',
          shadow: 'shadow-sm',
          border: 'border'
        },
        tablet: {
          padding: 'p-4',
          rounded: 'rounded-xl',
          shadow: 'shadow-md',
          border: 'border'
        },
        desktop: {
          padding: 'p-6',
          rounded: 'rounded-xl',
          shadow: 'shadow-lg',
          border: 'border'
        }
      },
      profile: {
        mobile: {
          padding: 'p-4',
          rounded: 'rounded-xl',
          shadow: 'shadow-md',
          border: 'border-2'
        },
        tablet: {
          padding: 'p-6',
          rounded: 'rounded-2xl',
          shadow: 'shadow-lg',
          border: 'border-2'
        },
        desktop: {
          padding: 'p-8',
          rounded: 'rounded-2xl',
          shadow: 'shadow-xl',
          border: 'border-2'
        }
      },
      media: {
        mobile: {
          padding: 'p-2',
          rounded: 'rounded-lg',
          shadow: 'shadow-sm',
          border: 'border-0'
        },
        tablet: {
          padding: 'p-3',
          rounded: 'rounded-xl',
          shadow: 'shadow-md',
          border: 'border-0'
        },
        desktop: {
          padding: 'p-4',
          rounded: 'rounded-xl',
          shadow: 'shadow-lg',
          border: 'border-0'
        }
      },
      action: {
        mobile: {
          padding: 'p-3',
          rounded: 'rounded-lg',
          shadow: 'shadow-md',
          border: 'border-2'
        },
        tablet: {
          padding: 'p-4',
          rounded: 'rounded-xl',
          shadow: 'shadow-lg',
          border: 'border-2'
        },
        desktop: {
          padding: 'p-6',
          rounded: 'rounded-xl',
          shadow: 'shadow-xl',
          border: 'border-2'
        }
      },
      default: {
        mobile: {
          padding: 'p-4',
          rounded: 'rounded-lg',
          shadow: 'shadow-sm',
          border: 'border'
        },
        tablet: {
          padding: 'p-6',
          rounded: 'rounded-xl',
          shadow: 'shadow-md',
          border: 'border'
        },
        desktop: {
          padding: 'p-6',
          rounded: 'rounded-xl',
          shadow: 'shadow-lg',
          border: 'border'
        }
      }
    };

    return configs[type]?.[device] || configs.default[device];
  };

  const config = getCardConfig();

  // Get variant styles
  const getVariantStyles = () => {
    const variants = {
      flat: 'bg-white dark:bg-gray-800',
      elevated: 'bg-white dark:bg-gray-800 shadow-sm hover:shadow-md',
      outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
      ghost: 'bg-gray-50/50 dark:bg-gray-800/30 border-0'
    };

    return variants[variant] || variants.elevated;
  };

  // Get interaction styles
  const getInteractionStyles = () => {
    if (!interactive && !onClick) return '';
    
    return cn(
      'cursor-pointer transition-all duration-200',
      hover && 'hover:shadow-lg hover:-translate-y-1',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      'active:scale-[0.98]'
    );
  };

  // Animation variants
  const cardVariants = {
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

  const hoverVariants = {
    hover: {
      y: hover ? -4 : 0,
      scale: interactive ? 1.02 : 1,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const cardClasses = cn(
    'relative overflow-hidden transition-all duration-300',
    config.padding,
    config.rounded,
    config.border,
    getVariantStyles(),
    getInteractionStyles(),
    'border-gray-200 dark:border-gray-700',
    className
  );

  const handleKeyDown = (event) => {
    if (onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick(event);
    }
  };

  if (animate) {
    return (
      <motion.div
        ref={ref}
        className={cardClasses}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        {...hoverVariants}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={interactive || onClick ? 0 : undefined}
        role={interactive || onClick ? 'button' : undefined}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={interactive || onClick ? 0 : undefined}
      role={interactive || onClick ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

SmartCard.displayName = 'SmartCard';

// Specialized card components

export const PostCard = React.forwardRef((props, ref) => (
  <SmartCard ref={ref} type="post" {...props} />
));
PostCard.displayName = 'PostCard';

export const ProfileCard = React.forwardRef((props, ref) => (
  <SmartCard ref={ref} type="profile" {...props} />
));
ProfileCard.displayName = 'ProfileCard';

export const MediaCard = React.forwardRef((props, ref) => (
  <SmartCard ref={ref} type="media" variant="flat" {...props} />
));
MediaCard.displayName = 'MediaCard';

export const ActionCard = React.forwardRef((props, ref) => (
  <SmartCard ref={ref} type="action" interactive hover {...props} />
));
ActionCard.displayName = 'ActionCard';

// Card header component with responsive typography
export const CardHeader = ({ 
  title, 
  subtitle, 
  action,
  className,
  ...props 
}) => {
  const { device } = useResponsive();
  const fontSizes = getSmartFontSizes(device);
  const spacing = getSmartSpacing(device);

  return (
    <div className={cn('flex items-start justify-between', spacing.element, className)} {...props}>
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={cn(fontSizes.title, 'text-gray-900 dark:text-white truncate')}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className={cn(fontSizes.body, 'text-gray-600 dark:text-gray-400 mt-1')}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
};

// Card content component with responsive spacing
export const CardContent = ({ 
  children, 
  className,
  ...props 
}) => {
  const { device } = useResponsive();
  const spacing = getSmartSpacing(device);

  return (
    <div className={cn(spacing.element, className)} {...props}>
      {children}
    </div>
  );
};

// Card footer component with responsive actions
export const CardFooter = ({ 
  children, 
  className,
  ...props 
}) => {
  const { device } = useResponsive();
  const spacing = getSmartSpacing(device);

  return (
    <div className={cn('flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700', className)} {...props}>
      {children}
    </div>
  );
};

export default SmartCard;
