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
    // Try to rehydrate user from localStorage before calling initializeAuth
    const storedUser = localStorage.getItem('athletiq_user') || localStorage.getItem(AUTH_KEYS.USER);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
    initializeAuth();
  }, []);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      logger.group('Auth Initialization');
      logger.debug('Checking for existing session...');
      
      // Check for stored user data
      const storedUser = localStorage.getItem('athletiq_user') || localStorage.getItem(AUTH_KEYS.USER);
      const token = localStorage.getItem('athletiq_token') || localStorage.getItem(AUTH_KEYS.TOKEN);
      
      if (storedUser && token) {
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Check if token is valid
          if (authService.isAuthenticated()) {
            logger.debug('Valid session found:', { user: parsedUser });
            setUser(parsedUser);
            
            // Try to refresh token in background to extend session
            authService.refreshToken().catch(err => {
              logger.warn('Background token refresh failed:', err);
              // Don't clear auth on background refresh failure
            });
          } else {
            // Token invalid, try to refresh
            logger.debug('Token expired, attempting refresh...');
            try {
              await authService.refreshToken();
              // Refresh successful, keep user logged in
              setUser(parsedUser);
              logger.debug('Token refresh successful');
            } catch (refreshErr) {
              logger.debug('Token refresh failed, clearing session');
              authService.clearAuthData();
              setUser(null);
            }
          }
        } catch (parseError) {
          logger.error('Failed to parse stored user data:', parseError);
          authService.clearAuthData();
          setUser(null);
        }
      } else {
        logger.debug('No stored session found');
        authService.clearAuthData();
        setUser(null);
      }
    } catch (err) {
      logger.error('Auth initialization failed:', err);
      setError(err.message);
      // Clear potentially corrupted auth data
      authService.clearAuthData();
      setUser(null);
    } finally {
      logger.groupEnd();
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
      
      // Persist user and refresh token in localStorage for rehydration
      if (loggedInUser) {
        localStorage.setItem('athletiq_user', JSON.stringify(loggedInUser));
      }
      if (result.refresh_token) {
        localStorage.setItem('athletiq_refresh_token', result.refresh_token);
      }
      if (result.access) {
        localStorage.setItem('athletiq_token', result.access);
      }
      
      logger.debug('User data persisted to localStorage');
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
      // Clear authentication service data
      authService.logout();
      
      // Clear local state
      setUser(null);
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem('athletiq_user');
      localStorage.removeItem('athletiq_token');
      localStorage.removeItem('athletiq_refresh_token');
      
      logger.debug('User logged out successfully');
    } catch (err) {
      logger.error('Logout error:', err);
      // Even if logout fails, clear local state
      setUser(null);
      authService.clearAuthData();
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
    // Don't rely on user state during loading
    if (loading) {
      logger.debug('Still loading - authentication check deferred');
      return false;
    }
    
    // Primary check: use the auth service which checks tokens properly
    const serviceAuthenticated = authService.isAuthenticated();
    
    if (!serviceAuthenticated) {
      logger.debug('Auth service reports not authenticated');
      return false;
    }
    
    // Secondary check: ensure we have user data
    if (!user) {
      logger.debug('No user data but token exists - attempting to recover user');
      // Try to get user from storage
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        // We'll let the auth initialization handle setting the user
        return true; // Token is valid, user will be loaded
      }
      return false;
    }
    
    logger.debug('User is authenticated with valid token and user data');
    return true;
  }, [user, loading]);

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
  const navigate = useNavigate();

  useEffect(() => {
    if (pendingNavigation) {
      const { path, options } = pendingNavigation;
      logger.debug('Executing pending navigation to:', path);
      navigate(path, options);
      setPendingNavigation(null);
    }
  }, [pendingNavigation, navigate]);

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
