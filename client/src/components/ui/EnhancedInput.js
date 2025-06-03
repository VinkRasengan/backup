import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

const EnhancedInput = React.forwardRef(({
  className,
  type = 'text',
  error,
  label,
  placeholder,
  icon: Icon,
  rightIcon: RightIcon,
  onRightIconClick,
  value,
  helperText,
  required = false,
  showFieldName = true,
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

  const shouldShowFloatingLabel = label && (isFocused || hasValue);
  const shouldShowFieldName = showFieldName && label && !isFocused && !hasValue;

  return (
    <div className="relative space-y-1">
      {/* Field Name Display */}
      <AnimatePresence>
        {shouldShowFieldName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-sm text-gray-600 mb-1"
          >
            {Icon && <Icon size={16} className="text-gray-400" />}
            <span>
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Floating Label */}
        {label && (
          <motion.label
            className={cn(
              'absolute text-sm transition-all duration-200 pointer-events-none z-10',
              shouldShowFloatingLabel
                ? 'top-2 left-3 text-xs text-blue-600 font-medium'
                : 'top-1/2 -translate-y-1/2 text-gray-500 opacity-0',
              Icon && shouldShowFloatingLabel && 'left-10',
              error && shouldShowFloatingLabel && 'text-red-600'
            )}
            animate={{
              scale: shouldShowFloatingLabel ? 0.85 : 1,
              opacity: shouldShowFloatingLabel ? 1 : 0,
            }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {label}
            {required && shouldShowFloatingLabel && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </motion.label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {Icon && (
            <div className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200',
              isFocused ? 'text-blue-500' : 'text-gray-400',
              error && 'text-red-500'
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
              'flex h-12 w-full rounded-lg border-2 bg-white px-3 py-2 text-sm',
              'transition-all duration-200',
              'placeholder:text-gray-400 placeholder:transition-opacity placeholder:duration-200',
              'focus:outline-none focus:ring-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Border and focus states
              error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20',
              // Padding adjustments
              Icon && 'pl-10',
              RightIcon && 'pr-10',
              shouldShowFloatingLabel && 'pt-6 pb-2',
              // Hover effects
              !error && 'hover:border-gray-300',
              className
            )}
            placeholder={isFocused ? placeholder : ''}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={onRightIconClick}
            >
              <RightIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">
          {helperText}
        </p>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-red-600 flex items-center gap-1 mt-1"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

EnhancedInput.displayName = 'EnhancedInput';

export { EnhancedInput };
