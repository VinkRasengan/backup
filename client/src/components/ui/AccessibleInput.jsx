import React, { forwardRef, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';

const AccessibleInput = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  hint,
  required = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  inputClassName = '',
  showPasswordToggle = false,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  'aria-describedby': ariaDescribedBy,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();
  const successId = useId();

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getStatusIcon = () => {
    if (error) return AlertCircle;
    if (success) return CheckCircle;
    return null;
  };

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (success) return 'text-green-500';
    return 'text-gray-400';
  };

  const getBorderColor = () => {
    if (error) return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    if (success) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    if (isFocused) return 'border-blue-500 focus:border-blue-500 focus:ring-blue-500';
    return 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';
  };

  const StatusIcon = getStatusIcon();

  // Build aria-describedby
  const describedByIds = [];
  if (hint) describedByIds.push(hintId);
  if (error) describedByIds.push(errorId);
  if (success) describedByIds.push(successId);
  if (ariaDescribedBy) describedByIds.push(ariaDescribedBy);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>
        )}

        {/* Input Field */}
        <motion.input
          ref={ref}
          id={inputId}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedByIds.length > 0 ? describedByIds.join(' ') : undefined}
          className={`
            w-full px-3 py-2.5 
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            border rounded-lg
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-opacity-20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${LeftIcon ? 'pl-10' : ''}
            ${(RightIcon || StatusIcon || (type === 'password' && showPasswordToggle)) ? 'pr-10' : ''}
            ${getBorderColor()}
            ${inputClassName}
          `}
          initial={false}
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.1 }}
          {...props}
        />

        {/* Right Side Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
          {/* Status Icon */}
          {StatusIcon && (
            <StatusIcon 
              className={`w-5 h-5 ${getStatusColor()}`} 
              aria-hidden="true"
            />
          )}

          {/* Password Toggle */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:text-gray-600 dark:focus:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Custom Right Icon */}
          {RightIcon && !StatusIcon && (
            <RightIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Messages */}
      <AnimatePresence mode="wait">
        {/* Hint */}
        {hint && !error && !success && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id={hintId}
            className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{hint}</span>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id={errorId}
            className="flex items-start space-x-2 text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Success */}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id={successId}
            className="flex items-start space-x-2 text-sm text-green-600 dark:text-green-400"
            role="status"
          >
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Count */}
      {maxLength && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {value?.length || 0}/{maxLength}
        </div>
      )}
    </div>
  );
});

AccessibleInput.displayName = 'AccessibleInput';

export default AccessibleInput;
