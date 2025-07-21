import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { isAdminUser } from '../../utils/adminUtils';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin (@factcheck.com email)
  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
