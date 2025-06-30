import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ 
  icon: Icon, 
  value, 
  label, 
  color = 'blue',
  trend = null,
  isLoading = false,
  className = ''
}) => {
  // Color variants for consistent theming
  const colorVariants = {
    blue: {
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600',
      text: 'text-blue-600',
      lightBg: 'bg-blue-50',
      darkBg: 'dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800'
    },
    green: {
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600',
      text: 'text-green-600',
      lightBg: 'bg-green-50',
      darkBg: 'dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800'
    },
    purple: {
      bg: 'bg-purple-500',
      hover: 'hover:bg-purple-600',
      text: 'text-purple-600',
      lightBg: 'bg-purple-50',
      darkBg: 'dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800'
    },
    orange: {
      bg: 'bg-orange-500',
      hover: 'hover:bg-orange-600',
      text: 'text-orange-600',
      lightBg: 'bg-orange-50',
      darkBg: 'dark:bg-orange-900/20',
      border: 'border-orange-200 dark:border-orange-800'
    }
  };

  const variant = colorVariants[color] || colorVariants.blue;

  if (isLoading) {
    return (
      <div className={`
        relative overflow-hidden
        bg-white dark:bg-gray-800 
        rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
        p-6 
        ${className}
      `}>
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={`
        group relative overflow-hidden
        bg-white dark:bg-gray-800 
        rounded-xl shadow-sm hover:shadow-lg
        border ${variant.border}
        p-6 
        transition-all duration-300 ease-out
        cursor-pointer
        ${className}
      `}
    >
      {/* Background gradient overlay */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-5 
        ${variant.lightBg} ${variant.darkBg}
        transition-opacity duration-300
      `} />
      
      {/* Decorative corner accent */}
      <div className={`
        absolute top-0 right-0 w-20 h-20 
        ${variant.bg} opacity-5
        rounded-bl-full transform translate-x-6 -translate-y-6
        group-hover:scale-110 transition-transform duration-300
      `} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`
          w-12 h-12 rounded-full 
          ${variant.bg} ${variant.hover}
          flex items-center justify-center mb-4
          group-hover:scale-110 transition-all duration-300
          shadow-sm
        `}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Value */}
        <div className="mb-2">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </h3>
          {trend && (
            <div className={`
              text-xs font-medium mt-1
              ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}
            `}>
              {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
            </div>
          )}
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {label}
        </p>
      </div>

      {/* Hover effect line */}
      <div className={`
        absolute bottom-0 left-0 h-1 w-0 
        ${variant.bg}
        group-hover:w-full transition-all duration-300
      `} />
    </motion.div>
  );
};

export default StatsCard;
