import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { isEmailVerifiedOrAdmin } from '../../utils/adminUtils';

const EmailVerifiedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Admin users (@factcheck.com) bypass email verification
  // Regular users need email verification
  if (!isEmailVerifiedOrAdmin(user)) {
    return <Navigate to="/email-verification-required" />;
  }

  return children;
};

export default EmailVerifiedRoute;
