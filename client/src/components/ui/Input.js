import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({
  className,
  type = 'text',
  error,
  label,
  placeholder,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  value,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  // Check if input has value on mount and when value prop changes
  useEffect(() => {
    setHasValue(Boolean(value || props.defaultValue));
  }, [value, props.defaultValue]);

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  // Enhanced placeholder logic - always show placeholder when focused or no label exists
  const effectivePlaceholder = !label ? placeholder : (isFocused ? placeholder : '');
  const shouldShowFloatingLabel = label && (isFocused || hasValue);

  return (
    <div className="relative">
      {/* Floating Label */}
      {label && (
        <motion.label
          className={cn(
            'absolute text-sm transition-all duration-200 pointer-events-none z-10',
            shouldShowFloatingLabel
              ? 'top-2 left-3 text-xs text-blue-600 dark:text-blue-400 font-medium'
              : 'top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400',
            Icon && !shouldShowFloatingLabel && 'left-10',
            Icon && shouldShowFloatingLabel && 'left-10',
            !Icon && 'left-3',
            error && shouldShowFloatingLabel && 'text-red-600 dark:text-red-400'
          )}
          animate={{
            scale: shouldShowFloatingLabel ? 0.85 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {label}
        </motion.label>
      )}

      <div className="relative">
        {/* Left Icon */}
        {Icon && (
          <div className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200',
            isFocused ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500',
            error && 'text-red-500 dark:text-red-400'
          )}>
            <Icon size={20} />
          </div>
        )}

        {/* Input Field */}
        <motion.input
          ref={ref}
          type={type}
          value={value}
          className={cn(
            'flex h-12 w-full rounded-lg border-2 px-3 py-2 text-sm',
            'transition-all duration-200',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:transition-opacity placeholder:duration-200',
            'focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Background colors with dark mode support
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-gray-100',
            // Border and focus states
            error
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/20'
              : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
            // Padding adjustments
            Icon && 'pl-10',
            RightIcon && 'pr-10',
            label && 'pt-6 pb-2',
            // Hover effects
            !error && 'hover:border-gray-300 dark:hover:border-gray-500',
            className
          )}
          placeholder={effectivePlaceholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          whileFocus={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          {...props}
        />

        {/* Right Icon */}
        {RightIcon && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={onRightIconClick}
          >
            <RightIcon size={20} />
          </button>
        )}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
