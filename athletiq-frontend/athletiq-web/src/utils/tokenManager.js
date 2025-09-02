// Enhanced Token Manager for AthletiQ
// Provides secure, unified token management across all user types

import { AUTH_KEYS } from './authKeys';

/**
 * Centralized token management system
 * Handles authentication for all user types (admin, school, guardian, athlete)
 */
export class TokenManager {
  /**
   * Get the current authentication token
   * @returns {string|null} The JWT token or null if not found
   */
  static getToken() {
    return localStorage.getItem(AUTH_KEYS.TOKEN);
  }

  /**
   * Set the authentication token
   * @param {string} token - JWT token
   */
  static setToken(token) {
    if (token) {
      localStorage.setItem(AUTH_KEYS.TOKEN, token);
    }
  }

  /**
   * Get the current user data
   * @returns {object|null} User object or null if not found
   */
  static getUser() {
    try {
      const userData = localStorage.getItem(AUTH_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  /**
   * Set the user data
   * @param {object} user - User object
   */
  static setUser(user) {
    if (user) {
      localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
    }
  }

  /**
   * Clear all authentication data
   * Removes tokens and user data from storage
   */
  static clearAuth() {
    // Remove current tokens
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER);
    
    // Clean up legacy guardian tokens
    localStorage.removeItem(AUTH_KEYS.GUARDIAN_TOKEN_LEGACY);
    localStorage.removeItem(AUTH_KEYS.GUARDIAN_TOKEN_ALT_LEGACY);
    localStorage.removeItem(AUTH_KEYS.GUARDIAN_DATA_LEGACY);
    localStorage.removeItem(AUTH_KEYS.GUARDIAN_INFO_LEGACY);
    
    // Clean up any other legacy tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if token exists and user is authenticated
   */
  static isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * Get user role
   * @returns {string|null} User role (admin, school, guardian, athlete) or null
   */
  static getUserRole() {
    const user = this.getUser();
    return user?.role || null;
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has the specified role
   */
  static hasRole(role) {
    return this.getUserRole() === role;
  }

  /**
   * Migrate legacy guardian tokens to unified system
   * @returns {boolean} True if migration was performed
   */
  static migrateLegacyTokens() {
    // Check for legacy guardian token
    const legacyToken = localStorage.getItem(AUTH_KEYS.GUARDIAN_TOKEN_LEGACY) || 
                       localStorage.getItem(AUTH_KEYS.GUARDIAN_TOKEN_ALT_LEGACY);
    
    const legacyData = localStorage.getItem(AUTH_KEYS.GUARDIAN_DATA_LEGACY) || 
                      localStorage.getItem(AUTH_KEYS.GUARDIAN_INFO_LEGACY);

    if (legacyToken && !this.getToken()) {
      // Migrate token
      this.setToken(legacyToken);
      
      // Migrate user data if available
      if (legacyData) {
        try {
          const guardianData = JSON.parse(legacyData);
          const unifiedUser = {
            ...guardianData,
            role: 'guardian',
            id: guardianData.id || guardianData.guardian_id,
            name: guardianData.name || guardianData.full_name,
            email: guardianData.email,
            migratedFromLegacy: true
          };
          this.setUser(unifiedUser);
        } catch (error) {
          console.error('Error migrating legacy user data:', error);
        }
      }

      console.log('✅ Migrated legacy guardian tokens to unified system');
      return true;
    }

    return false;
  }

  /**
   * Initialize token manager
   * Performs any necessary migrations and setup
   */
  static initialize() {
    // Migrate legacy tokens if needed
    this.migrateLegacyTokens();
  }
}

/**
 * Standardized error handler for API responses
 */
export class ApiErrorHandler {
  /**
   * Handle API errors consistently across the application
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   * @returns {object} Formatted error object
   */
  static handle(error, context = 'API call') {
    const errorDetails = {
      message: this.extractMessage(error),
      status: error.response?.status,
      code: error.code,
      context,
      timestamp: new Date().toISOString()
    };

    // Log error for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`API Error in ${context}:`, errorDetails);
    }

    // Handle specific error types
    if (error.response?.status === 401) {
      this.handleAuthError();
    } else if (error.response?.status === 403) {
      this.handleForbiddenError();
    } else if (error.response?.status >= 500) {
      this.handleServerError();
    }

    return errorDetails;
  }

  /**
   * Extract user-friendly error message
   * @param {Error} error - The error object
   * @returns {string} User-friendly error message
   */
  static extractMessage(error) {
    return error.response?.data?.message || 
           error.response?.data?.error || 
           error.message || 
           'An unexpected error occurred';
  }

  /**
   * Handle authentication errors (401)
   */
  static handleAuthError() {
    TokenManager.clearAuth();
    // Could dispatch logout action here
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Handle forbidden errors (403)
   */
  static handleForbiddenError() {
    // Could show insufficient permissions message
    console.warn('User does not have permission for this action');
  }

  /**
   * Handle server errors (5xx)
   */
  static handleServerError() {
    // Could show server maintenance message
    console.error('Server error occurred');
  }
}

// Initialize token manager when module loads
TokenManager.initialize();

export default TokenManager;
