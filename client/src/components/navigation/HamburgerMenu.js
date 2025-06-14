import React from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import PropTypes from 'prop-types';

const HamburgerMenu = React.memo(({ isOpen, onClick, className = '' }) => {
  return (
    <motion.button
      onClick={onClick}      className={`
        hamburger-menu fixed top-4 left-4 z-50 p-3 rounded-lg 
        bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700
        text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100
        hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isOpen ? 'Đóng menu' : 'Mở menu'}
    >
      <motion.div
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Menu size={20} />
      </motion.div>
    </motion.button>
  );
});

HamburgerMenu.displayName = 'HamburgerMenu';

HamburgerMenu.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default HamburgerMenu;
