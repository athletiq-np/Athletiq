/**
 * Role-Based Router
 * Handles automatic routing based on user roles and authentication status
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES, AUTH_CONFIG } from '@/config/auth.config';

/**
 * RoleBasedRouter - Automatically routes users based on their role
 */
export function RoleBasedRouter() {
  const { isAuthenticated, user, loading, isInitialized } = useAuth();
  const location = useLocation();

  // Show loading while authentication is being verified
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate 
      to="/login" 
      state={{ from: location.pathname }}
      replace 
    />;
  }

  // If authenticated but no user data, redirect to login
  if (!user || !user.role) {
    return <Navigate 
      to="/login" 
      state={{ from: location.pathname }}
      replace 
    />;
  }

  // Route based on user role
  const redirectPath = getRoleBasedRedirect(user.role);
  
  return <Navigate to={redirectPath} replace />;
}

/**
 * Get redirect path based on user role
 */
function getRoleBasedRedirect(role) {
  // Normalize role to lowercase for comparison
  const normalizedRole = role?.toLowerCase();
  
  switch (normalizedRole) {
    case 'super_admin':
    case 'superadmin':
    case 'super-admin':
      return '/admin';
      
    case 'school_admin':
    case 'schooladmin':
    case 'school-admin':
      return '/school';
      
    case 'athlete':
      return '/athlete/dashboard';
      
    case 'guardian':
      return '/guardian/dashboard';
      
    case 'viewer':
      return '/viewer/dashboard';
      
    case 'admin':
      return '/admin';
      
    case 'organization':
    case 'org':
      return '/organization/dashboard';
      
    default:
      // Fallback to general dashboard or login
      console.warn('Unknown role for redirect:', role);
      return '/dashboard';
  }
}

/**
 * RedirectToDashboard - Component that redirects to appropriate dashboard
 */
export function RedirectToDashboard() {
  const { user, getRedirectPath } = useAuth();
  const redirectPath = getRedirectPath();
  
  return <Navigate to={redirectPath} replace />;
}

/**
 * LoginRedirect - Handles redirect after login
 */
export function LoginRedirect() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get intended destination from state or use role-based redirect
  const from = location.state?.from;
  const redirectPath = from || getRoleBasedRedirect(user?.role);
  
  return <Navigate to={redirectPath} replace />;
}

export default RoleBasedRouter;