/**
 * Unified Authentication Service
 * Single service for all authentication operations
 */

import { authStorage, AUTH_ENDPOINTS, AUTH_CONFIG, USER_ROLES } from '@/config/auth.config';
import { logger } from '@/utils/logger';

// Base URL for API requests
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api`
  : '/api';

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = authStorage.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { Authorization: `${AUTH_CONFIG.TOKEN_TYPE} ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        // Check if this is a verification request (auth check)
        const isVerificationRequest = endpoint === AUTH_ENDPOINTS.VERIFY;
        
        const refreshResult = await this.handleTokenRefresh();
        if (refreshResult.success) {
          // Retry request with new token
          config.headers.Authorization = `${AUTH_CONFIG.TOKEN_TYPE} ${authStorage.getToken()}`;
          return await fetch(url, config);
        } else {
          // Refresh failed
          if (isVerificationRequest) {
            // For verification requests, don't logout - just throw error
            throw new Error('Authentication failed');
          } else {
            // For other requests, logout user
            await this.logout();
            throw new Error('Authentication failed');
          }
        }
      }
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      logger.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Login user with credentials
   */
  async login(credentials) {
    try {
      logger.info('🔐 Starting login process');
      
      const response = await fetch(`${this.baseURL}${AUTH_ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Debug: Log the actual response structure
      logger.info('🔍 Login response data:', JSON.stringify(responseData, null, 2));
      
      // Handle nested response structure from Django unified auth
      const authData = responseData.data || responseData;
      const tokens = {
        access: authData.token || authData.access,
        refresh: authData.refresh_token || authData.refresh
      };
      const userData = authData.user || null;
      
      // Store authentication data
      if (tokens.access) {
        authStorage.setToken(tokens.access);
        logger.info('✅ Access token stored');
      }
      
      if (tokens.refresh) {
        authStorage.setRefreshToken(tokens.refresh);
        logger.info('✅ Refresh token stored');
      }
      
      if (userData) {
        // Normalize user data to match frontend expectations
        const normalizedUser = {
          ...userData,
          // Map API fields to expected frontend fields
          username: userData.full_name || userData.username || userData.email,
          id: userData.guardian_id || userData.user_id || userData.id,
          role: userData.role || authData.role,
          user_type: authData.user_type || userData.user_type,
          // Keep original fields as well for compatibility
          full_name: userData.full_name,
          email: userData.email,
          guardian_id: userData.guardian_id,
        };
        
        authStorage.setUserData(normalizedUser);
        logger.info('✅ User data stored:', {
          username: normalizedUser.username,
          role: normalizedUser.role,
          id: normalizedUser.id,
          user_type: normalizedUser.user_type
        });
      }

      logger.info('🎉 Login successful');
      
      // Handle missing user object gracefully
      if (!userData) {
        logger.warn('⚠️ No user object in login response, using default values');
        // Create a default user object if missing
        const defaultUser = {
          id: null,
          username: credentials.email,
          email: credentials.email,
          role: authData.role || 'user',
          user_type: authData.user_type || 'user'
        };
        authStorage.setUserData(defaultUser);
      }
      
      const finalUser = authStorage.getUserData();
      
      return {
        success: true,
        user: finalUser,
        redirectTo: this.getRedirectPath(finalUser?.role || authData.role || 'user')
      };

    } catch (error) {
      logger.error('❌ Login failed:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  /**
   * Logout user and clear all data
   */
  async logout() {
    try {
      logger.info('🚪 Starting logout process');
      
      // Attempt to notify server
      try {
        await fetch(`${this.baseURL}${AUTH_ENDPOINTS.LOGOUT}`, {
          method: 'POST',
          headers: {
            'Authorization': `${AUTH_CONFIG.TOKEN_TYPE} ${authStorage.getToken()}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      } catch (error) {
        // Server logout failed, but continue with local cleanup
        logger.warn('Server logout failed, continuing with local cleanup:', error);
      }
      
      // Clear all local authentication data
      authStorage.clearAll();
      
      logger.info('✅ Logout completed');
      return { success: true };
      
    } catch (error) {
      logger.error('❌ Logout error:', error);
      // Even if logout fails, clear local data
      authStorage.clearAll();
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh authentication token
   */
  async handleTokenRefresh() {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async performTokenRefresh() {
    try {
      const refreshToken = authStorage.getRefreshToken();
      
      if (!refreshToken) {
        logger.warn('⚠️ WARN: No refresh token available for refresh');
        return { success: false, error: 'No refresh token' };
      }

      logger.info('🔄 Refreshing authentication token');
      
      const response = await fetch(`${this.baseURL}${AUTH_ENDPOINTS.REFRESH}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token refresh failed: ${response.status} - ${errorData.detail || errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.access) {
        authStorage.setToken(data.access);
        logger.info('✅ Token refreshed successfully');
        return { success: true };
      } else {
        throw new Error('No access token in refresh response');
      }

    } catch (error) {
      logger.error('❌ Token refresh failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a JWT token is expired (basic check without verification)
   */
  isTokenExpired(token) {
    try {
      if (!token) return true;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Add 60 second buffer to account for clock skew
      return payload.exp < (currentTime + 60);
    } catch (error) {
      // If we can't parse the token, consider it expired
      return true;
    }
  }

  /**
   * Verify current authentication status
   */
  async verifyAuth() {
    try {
      const token = authStorage.getToken();
      const userData = authStorage.getUserData();
      
      if (!token || !userData) {
        return { isAuthenticated: false };
      }

      // Check if token is expired before making server request
      if (this.isTokenExpired(token)) {
        logger.info('Token is expired, attempting refresh');
        const refreshResult = await this.handleTokenRefresh();
        if (!refreshResult.success) {
          logger.warn('Token refresh failed during verification');
          return { isAuthenticated: false };
        }
      }

      // For page refresh scenarios, trust local storage if we have both token and user data
      // Only verify with server if absolutely necessary to avoid premature logout
      try {
        // Attempt server verification, but don't fail if it doesn't work
        const response = await this.makeRequest(AUTH_ENDPOINTS.VERIFY, {
          method: 'POST',
        });

        if (response.ok) {
          const data = await response.json();
          return {
            isAuthenticated: true,
            user: data.user || userData
          };
        } else {
          // Server verification failed, but we still have local data
          // Trust it for now - the next API call will handle token refresh if needed
          logger.warn('Server auth verification failed, trusting local storage');
          return {
            isAuthenticated: true,
            user: userData
          };
        }
      } catch (error) {
        // Network or other error during verification
        // Trust local storage to avoid logging out user unnecessarily
        logger.warn('Auth verification request failed, trusting local storage:', error.message);
        return {
          isAuthenticated: true,
          user: userData
        };
      }

    } catch (error) {
      logger.error('Auth verification failed:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Get redirect path based on user role
   */
  getRedirectPath(role) {
    return AUTH_CONFIG.ROLE_REDIRECTS[role] || AUTH_CONFIG.LOGIN_REDIRECT;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return authStorage.isAuthenticated();
  }

  /**
   * Get current user data
   */
  getCurrentUser() {
    return authStorage.getUserData();
  }

  /**
   * Get current user token
   */
  getToken() {
    return authStorage.getToken();
  }

  /**
   * Register new user
   */
  async register(userData) {
    try {
      logger.info('📝 Starting registration process');
      
      const response = await fetch(`${this.baseURL}${AUTH_ENDPOINTS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }

      const data = await response.json();
      logger.info('✅ Registration successful');
      
      return {
        success: true,
        message: data.message || 'Registration successful'
      };

    } catch (error) {
      logger.error('❌ Registration failed:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;