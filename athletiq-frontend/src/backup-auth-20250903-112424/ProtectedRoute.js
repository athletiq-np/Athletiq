import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';

/**
 * Protected route component that checks authentication and role permissions
 */
const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requiredUserTypes = [],
  fallbackPath = '/login' 
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate 
      to={fallbackPath} 
      state={{ from: location }} 
      replace 
    />;
  }

  // Check role permissions if specified
  if (requiredRoles.length > 0) {
    const userRole = user.role?.toLowerCase();
    // Check for both exact role and aliases
    const roleAliases = {
      'superadmin': ['superadmin', 'super_admin', 'super-admin', 'admin'],
      'admin': ['admin', 'administrator'],
      'schooladmin': ['schooladmin', 'school_admin', 'school-admin'],
    };

    const hasRequiredRole = requiredRoles.some(requiredRole => {
      const normalizedRequiredRole = requiredRole.toLowerCase();
      // Check direct match
      if (userRole === normalizedRequiredRole) return true;
      // Check aliases
      const aliases = roleAliases[normalizedRequiredRole] || [];
      return aliases.includes(userRole);
    });
    
    if (!hasRequiredRole) {
      console.log('Unauthorized access - Missing required role:', { 
        requiredRoles, 
        userRole,
        user
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check user type permissions if specified
  if (requiredUserTypes.length > 0) {
    const userType = user.user_type?.toLowerCase();
    const hasRequiredUserType = requiredUserTypes.some(type => 
      type.toLowerCase() === userType
    );
    
    if (!hasRequiredUserType) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;