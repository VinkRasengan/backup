import React from 'react';
import { cn } from '../../utils/cn';

const ChatInput = React.forwardRef(({
  className,
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled,
  maxLength,
  ...props
}, ref) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <input
      ref={ref}
      type="text"
      value={value || ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      autoComplete="off"
      spellCheck="false"
      className={cn(
        'flex h-11 w-full rounded-lg border-2 px-4 py-2 text-sm',
        'transition-all duration-200',
        'placeholder:text-gray-400 dark:placeholder:text-gray-500',
        'focus:outline-none focus:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        // Background colors
        'bg-white dark:bg-gray-800',
        'text-gray-900 dark:text-gray-100',
        // Border and focus states
        'border-gray-200 dark:border-gray-600',
        'focus:border-blue-500 dark:focus:border-blue-400',
        'focus:ring-blue-500/20 dark:focus:ring-blue-400/20',
        // Hover effects
        'hover:border-gray-300 dark:hover:border-gray-500',
        className
      )}
      {...props}
    />
  );
});

ChatInput.displayName = 'ChatInput';

export { ChatInput };
