/**
 * Protected Route Component
 * Handles authentication and authorization for routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES, isAuthorized } from '@/config/auth.config';

// Loading component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
  </div>
);

// Unauthorized component
const UnauthorizedScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-700 mb-4">403</h1>
      <p className="text-xl text-gray-600 mb-8">You don't have permission to access this page.</p>
      <button 
        onClick={() => window.history.back()}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Go Back
      </button>
    </div>
  </div>
);

/**
 * ProtectedRoute - Protects routes based on authentication and authorization
 */
export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  redirectTo = '/login',
  showUnauthorized = true 
}) {
  const { isAuthenticated, user, loading, isInitialized } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being verified
  if (!isInitialized || loading) {
    return <LoadingScreen />;
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate 
      to={redirectTo} 
      state={{ from: location.pathname }}
      replace 
    />;
  }

  // Check authorization if roles are specified
  if (allowedRoles.length > 0 && user && !isAuthorized(user.role, allowedRoles)) {
    if (showUnauthorized) {
      return <UnauthorizedScreen />;
    } else {
      return <Navigate 
        to="/unauthorized" 
        state={{ from: location.pathname }}
        replace 
      />;
    }
  }

  return children;
}

/**
 * PublicRoute - For routes that should only be accessible to non-authenticated users
 */
export function PublicRoute({ children, redirectTo = '/' }) {
  const { isAuthenticated, loading, isInitialized, getRedirectPath } = useAuth();

  // Show loading while authentication is being verified
  if (!isInitialized || loading) {
    return <LoadingScreen />;
  }

  // If user is authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    const redirectPath = getRedirectPath();
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

/**
 * RoleBasedRoute - Routes that are only accessible to specific roles
 */
export function RoleBasedRoute({ children, allowedRoles, fallbackRoute = '/unauthorized' }) {
  return (
    <ProtectedRoute 
      allowedRoles={allowedRoles}
      redirectTo={fallbackRoute}
      showUnauthorized={false}
    >
      {children}
    </ProtectedRoute>
  );
}

/**
 * AdminRoute - Shortcut for admin-only routes
 */
export function AdminRoute({ children }) {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN, USER_ROLES.SCHOOL_ADMIN]}>
      {children}
    </RoleBasedRoute>
  );
}

/**
 * SuperAdminRoute - Shortcut for super admin only routes
 */
export function SuperAdminRoute({ children }) {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]}>
      {children}
    </RoleBasedRoute>
  );
}

/**
 * AthleteRoute - Shortcut for athlete routes
 */
export function AthleteRoute({ children }) {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.ATHLETE]}>
      {children}
    </RoleBasedRoute>
  );
}

/**
 * GuardianRoute - Shortcut for guardian routes  
 */
export function GuardianRoute({ children }) {
  return (
    <RoleBasedRoute allowedRoles={[USER_ROLES.GUARDIAN]}>
      {children}
    </RoleBasedRoute>
  );
}

export default ProtectedRoute;