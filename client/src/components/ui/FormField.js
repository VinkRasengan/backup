import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './Input';
import { cn } from '../../utils/cn';

const FormField = React.forwardRef(({
  label,
  description,
  required = false,
  className,
  error,
  children,
  ...props
}, ref) => {
  return (
    <div className={cn('space-y-1', className)}>
      {/* Field Label with Required Indicator */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
          {description && (
            <span className="text-xs text-gray-500">
              {description}
            </span>
          )}
        </div>
      )}

      {/* Input Field */}
      {children || (
        <Input
          ref={ref}
          label={label}
          error={error}
          {...props}
        />
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-red-600 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

FormField.displayName = 'FormField';

export { FormField };
