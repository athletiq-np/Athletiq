import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '@/services/auth.service';
import { AUTH_KEYS } from '@/utils/authKeys';
import { logger } from '@/utils/logger';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    logger.debug('Initializing auth...');
    initializeAuth();
  }, []);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('Checking for existing session...');
      
      // Use the enhanced auth initialization method
      const authResult = await authService.initializeAuth();
      
      if (authResult.isAuthenticated && authResult.user) {
        logger.debug('User session found and validated:', { user: authResult.user });
        setUser(authResult.user);
      } else {
        logger.debug('No valid session found');
        setUser(null);
      }
    } catch (err) {
      logger.error('Auth initialization failed:', err);
      setError(err.message);
      setUser(null);
      // Clear any potentially stale auth data
      authService.clearAuthData();
    } finally {
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      logger.group('User Login');
      logger.debug('Attempting login for:', email);
      
      const result = await authService.login(email, password);
      const loggedInUser = result.user;
      logger.info('Login successful', { userId: loggedInUser?.id });
      setUser(loggedInUser);
      
      // Queue the navigation
      const from = window.location.state?.from?.pathname || '/';
      logger.debug('Queueing navigation to:', from);
      setPendingNavigation({ path: from });
      
      return loggedInUser;
    } catch (err) {
      logger.error('Login failed:', err);
      setError(err.message);
      throw err;
    } finally {
      logger.groupEnd();
      setLoading(false);
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    logger.info('Logging out user');
    try {
      authService.logout();
      setUser(null);
      logger.debug('User logged out, queueing redirect to login');
      setPendingNavigation({ path: '/login' });
    } catch (err) {
      logger.error('Logout error:', err);
      throw err;
    }
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    const hasRole = user?.roles?.includes(role) || false;
    logger.debug(`Checking if user has role '${role}':`, hasRole);
    return hasRole;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles) => {
    const hasAny = user && roles?.length ? roles.some(role => hasRole(role)) : false;
    logger.debug(`Checking if user has any of roles [${roles}]:`, hasAny);
    return hasAny;
  }, [user, hasRole]);

  // Check if user has all specified roles
  const hasAllRoles = useCallback((roles) => {
    const hasAll = user && roles?.length ? roles.every(role => hasRole(role)) : false;
    logger.debug(`Checking if user has all roles [${roles}]:`, hasAll);
    return hasAll;
  }, [user, hasRole]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    const authenticated = !!user && authService.isAuthenticated();
    logger.debug(`User is ${authenticated ? '' : 'not '}authenticated`);
    return authenticated;
  }, [user]);

  // Context value
  const value = {
    user,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    initializeAuth,
  };

  // Use effect to handle pending navigation
  useEffect(() => {
    if (pendingNavigation) {
      const { path, options } = pendingNavigation;
      logger.debug('Executing pending navigation to:', path);
      window.location.href = path;
      setPendingNavigation(null);
    }
  }, [pendingNavigation]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (process.env.NODE_ENV !== 'production') {
    // Only check this in development to avoid performance impact in production
    if (!context) {
      console.error(
        'useAuth must be used within an AuthProvider. ' +
        'Make sure your app is wrapped with <AuthProvider> component.'
      );
    }
  }

  if (!context) {
    // In production, we'll return a mock context to prevent crashes
    console.warn('Auth context not available - using mock context');
    return {
      user: null,
      loading: false,
      error: new Error('Auth context not available'),
      isAuthenticated: () => false,
      login: () => Promise.reject(new Error('Auth context not available')),
      logout: () => {},
      hasRole: () => false,
      hasAnyRole: () => false,
      hasAllRoles: () => false,
      initializeAuth: () => Promise.resolve(),
    };
  }

  return context;
};

export default useAuth;
