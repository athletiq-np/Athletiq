import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

/**
 * Role-based routing component that redirects users to appropriate dashboards
 * based on their role after successful authentication.
 */
const RoleBasedRouter = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Define role-based redirect paths
  const getRoleBasedPath = (role, userType) => {
    // Handle different user types
    if (userType === 'guardian') {
      return '/guardian';
    }
    
    if (userType === 'athlete') {
      return '/athlete/profile';
    }
    
    // Handle admin/system user roles
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return '/admin';
      case 'schooladmin':
        return '/school';
      case 'coach':
        return '/coach/dashboard';
      case 'referee':
        return '/referee/dashboard';
      case 'organization':
        return '/organization/dashboard';
      default:
        return '/dashboard';
    }
  };

  const redirectPath = getRoleBasedPath(user.role, user.user_type);
  
  // If current path doesn't match expected role path, redirect
  if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default RoleBasedRouter;