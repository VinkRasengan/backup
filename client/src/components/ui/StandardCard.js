import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Unified card variants
const cardVariants = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg',
  floating: 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl',
  gradient: 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700',
  interactive: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer'
};

const cardSizes = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10'
};

const cardRounding = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl'
};

const StandardCard = React.forwardRef(({ 
  className, 
  variant = 'default',
  size = 'md',
  rounded = 'md',
  animate = true,
  children,
  onClick,
  ...props 
}, ref) => {  const cardClasses = cn(
    'relative overflow-hidden',
    cardVariants[variant],
    cardSizes[size],
    cardRounding[rounded],
    onClick && 'cursor-pointer',
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        whileHover={onClick ? { scale: 1.02 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
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
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
});

StandardCard.displayName = 'StandardCard';

// PropTypes validation
StandardCard.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'elevated', 'floating', 'gradient', 'interactive']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  rounded: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  animate: PropTypes.bool,
  children: PropTypes.node,
  onClick: PropTypes.func
};

// Specialized card components
const StatsCard = ({ icon: Icon, label, value, suffix, trend, color = 'blue', ...props }) => (
  <StandardCard variant="elevated" className="text-center group hover:shadow-lg transition-all duration-300" {...props}>
    <div className="flex items-center justify-center mb-4">
      <div className={cn(
        'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110',
        `bg-${color}-100 dark:bg-${color}-900/50 text-${color}-600 dark:text-${color}-400`
      )}>
        <Icon size={24} />
      </div>
    </div>
    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
      {value}
      {suffix && <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">{suffix}</span>}
    </div>
    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
    {trend && (
      <div className={cn(
        'mt-2 text-xs flex items-center justify-center gap-1',
        trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
      )}>
        <span>{trend.value}</span>
        <span>{trend.label}</span>
      </div>
    )}
  </StandardCard>
);

// PropTypes for StatsCard
StatsCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  suffix: PropTypes.string,
  trend: PropTypes.shape({
    direction: PropTypes.oneOf(['up', 'down']),
    value: PropTypes.string,
    label: PropTypes.string
  }),
  color: PropTypes.string
};

const FeatureCard = ({ icon: Icon, title, description, color = 'blue', ...props }) => (
  <StandardCard 
    variant="interactive" 
    className="group text-center hover:shadow-xl transition-all duration-300"
    {...props}
  >
    <div className="relative z-10">
      <div className={cn(
        'w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg',
        `bg-gradient-to-br from-${color}-100 to-${color}-200 dark:from-${color}-900 dark:to-${color}-800 text-${color}-600 dark:text-${color}-400`
      )}>
        <Icon size={28} />
      </div>
      <h3 className={cn(
        'text-xl font-bold mb-4 transition-colors duration-300',
        'text-gray-900 dark:text-white group-hover:text-' + color + '-600 dark:group-hover:text-' + color + '-400'
      )}>
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
      {/* Animated progress bar */}
      <div className="mt-6 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1 overflow-hidden">
        <div className={cn(
          'h-full rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000 ease-out',
          `bg-gradient-to-r from-${color}-500 to-${color}-600`
        )}></div>
      </div>
    </div>
    {/* Background gradient overlay */}
    <div className={cn(
      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
      `bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20`
    )}></div>
    {/* Animated background circles */}
    <div className={cn(
      'absolute -top-4 -right-4 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500',
      `bg-gradient-to-br from-${color}-400/20 to-${color}-500/20`
    )}></div>
  </StandardCard>
);

// PropTypes for FeatureCard
FeatureCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  color: PropTypes.string
};

const ActionCard = ({ icon: Icon, title, description, color = 'blue', children, ...props }) => (
  <StandardCard 
    variant="interactive"
    className="group overflow-hidden hover:shadow-xl transition-all duration-300"
    {...props}
  >
    <div className="relative z-10">
      <div className={cn(
        'w-16 h-16 mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6',
        `bg-gradient-to-br from-${color}-500 to-${color}-600 text-white shadow-lg`
      )}>
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-yellow-300 transition-colors duration-300">
        {title}
      </h3>
      <p className="text-white/90 text-lg leading-relaxed">
        {description}
      </p>
      {children}
    </div>
    {/* Animated background overlay */}
    <div className={cn(
      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
      `bg-gradient-to-br from-${color}-400 to-${color}-700`
    )}></div>
    {/* Decorative elements */}
    <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
  </StandardCard>
);

// PropTypes for ActionCard
ActionCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  color: PropTypes.string,
  children: PropTypes.node
};

export { StandardCard, StatsCard, FeatureCard, ActionCard };
export default StandardCard;
