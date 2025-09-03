/**
 * Unified Authentication Context and Hook
 * Single source for authentication state management
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { authStorage, AUTH_CONFIG, USER_ROLES } from '@/config/auth.config';
import { logger } from '@/utils/logger';

// Authentication state shape
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
  isInitialized: false,
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  INITIALIZE: 'INITIALIZE',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer for authentication state
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error, // Clear error when loading starts
      };
      
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null,
        isInitialized: true,
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
        isInitialized: true,
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
      
    case AUTH_ACTIONS.INITIALIZE:
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        user: action.payload.user,
        loading: false,
        isInitialized: true,
      };
      
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      logger.info('🔍 Initializing authentication state');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Check if user is authenticated
      const authResult = await authService.verifyAuth();
      
      if (authResult.isAuthenticated) {
        logger.info('✅ User is authenticated');
        dispatch({
          type: AUTH_ACTIONS.INITIALIZE,
          payload: {
            isAuthenticated: true,
            user: authResult.user,
          },
        });
      } else {
        logger.info('❌ User is not authenticated');
        dispatch({
          type: AUTH_ACTIONS.INITIALIZE,
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    } catch (error) {
      logger.error('❌ Authentication initialization failed:', error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      dispatch({
        type: AUTH_ACTIONS.INITIALIZE,
        payload: {
          isAuthenticated: false,
          user: null,
        },
      });
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      logger.info('🔐 Attempting login');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const result = await authService.login(credentials);
      
      if (result.success) {
        logger.info('✅ Login successful');
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: result.user },
        });
        
        return {
          success: true,
          user: result.user,
          redirectTo: result.redirectTo,
        };
      } else {
        logger.error('❌ Login failed:', result.error);
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: result.error });
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      logger.error('❌ Login error:', error);
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      logger.info('🚪 Attempting logout');
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await authService.logout();
      
      logger.info('✅ Logout successful');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      return { success: true };
    } catch (error) {
      logger.error('❌ Logout error:', error);
      // Even if logout fails, clear local state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: false, error: error.message };
    }
  }, []);

  // Update user data
  const updateUser = useCallback((userData) => {
    logger.info('👤 Updating user data');
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
    
    // Update stored user data
    const currentUser = authStorage.getUserData();
    if (currentUser) {
      authStorage.setUserData({ ...currentUser, ...userData });
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Check user role
  const hasRole = useCallback((role) => {
    return state.user?.role === role;
  }, [state.user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(state.user?.role);
  }, [state.user]);

  // Get redirect path for current user
  const getRedirectPath = useCallback(() => {
    if (!state.user?.role) return AUTH_CONFIG.LOGIN_REDIRECT;
    return authService.getRedirectPath(state.user.role);
  }, [state.user]);

  // Initialize on mount
  useEffect(() => {
    if (!state.isInitialized) {
      initializeAuth();
    }
  }, [initializeAuth, state.isInitialized]);

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    updateUser,
    clearError,
    initializeAuth,
    
    // Utilities
    hasRole,
    hasAnyRole,
    getRedirectPath,
    
    // Service access
    authService,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Higher-order component for authenticated routes
export function withAuth(Component, allowedRoles = []) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, user, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (!isAuthenticated) {
      return <div>Please log in to access this page.</div>;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
      return <div>You don't have permission to access this page.</div>;
    }
    
    return <Component {...props} />;
  };
}

// Export user roles for convenience
export { USER_ROLES };