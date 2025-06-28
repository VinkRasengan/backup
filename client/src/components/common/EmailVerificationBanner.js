import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import { Mail, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const EmailVerificationBanner = ({ onDismiss }) => {
  const { user, resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Don't show banner if user is verified or not logged in
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 m-4 flex items-center justify-between shadow-sm"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
          <Mail size={20} />
        </div>
        <div className="flex-1">
          <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold text-sm mb-1">
            Email Verification Required
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Please verify your email address to access all features. Check your inbox for a verification link.
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handleResendEmail}
          disabled={isResending}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw 
            size={16} 
            className={isResending ? 'animate-spin' : ''} 
          />
          {isResending ? 'Sending...' : 'Resend'}
        </button>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/30 p-2 rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// PropTypes validation
EmailVerificationBanner.propTypes = {
  onDismiss: PropTypes.func
};

export default EmailVerificationBanner;
