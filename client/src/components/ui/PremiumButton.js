import React, { useRef, useEffect } from 'react';
import { gsap } from '../../utils/gsap';
import { cn } from '../../utils/cn';

const PremiumButton = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  ...props 
}) => {
  const buttonRef = useRef();
  const rippleRef = useRef();
  const glowRef = useRef();
  const contentRef = useRef();

  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg hover:shadow-xl',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white',
    ghost: 'text-blue-500 hover:bg-blue-50'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || disabled) return;

    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        y: -2,
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(glowRef.current, {
        opacity: 0.6,
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "elastic.out(1, 0.3)"
      });

      gsap.to(glowRef.current, {
        opacity: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseDown = () => {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out"
      });
    };

    const handleMouseUp = () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.2,
        ease: "back.out(1.7)"
      });
    };

    const handleClick = (e) => {
      // Ripple effect
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      gsap.set(rippleRef.current, {
        x: x,
        y: y,
        scale: 0,
        opacity: 0.6
      });

      gsap.to(rippleRef.current, {
        scale: 4,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
      });

      if (onClick) onClick(e);
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mousedown', handleMouseDown);
    button.addEventListener('mouseup', handleMouseUp);
    button.addEventListener('click', handleClick);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mousedown', handleMouseDown);
      button.removeEventListener('mouseup', handleMouseUp);
      button.removeEventListener('click', handleClick);
    };
  }, [disabled, onClick]);

  // Loading animation
  useEffect(() => {
    if (loading && contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0.6,
        duration: 0.3
      });
    } else if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 1,
        duration: 0.3
      });
    }
  }, [loading]);

  return (
    <button
      ref={buttonRef}
      className={cn(
        'relative overflow-hidden rounded-xl font-semibold transition-all duration-300 transform-gpu',
        'focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {/* Glow effect */}
      <div
        ref={glowRef}
        className="absolute inset-0 bg-white opacity-0 rounded-xl"
        style={{ filter: 'blur(8px)' }}
      />

      {/* Ripple effect */}
      <div
        ref={rippleRef}
        className="absolute w-4 h-4 bg-white rounded-full opacity-0 pointer-events-none"
        style={{ transform: 'translate(-50%, -50%)' }}
      />

      {/* Content */}
      <div ref={contentRef} className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </div>

      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transform -skew-x-12 -translate-x-full hover:translate-x-full transition-all duration-700" />
    </button>
  );
};

export default PremiumButton;
