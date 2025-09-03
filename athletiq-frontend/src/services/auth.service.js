import apiClient from '@/utils/apiClient';
import { AUTH_KEYS } from '@/utils/authKeys';
import { API_ENDPOINTS, AUTH_CONFIG } from '@/config/api.config';
import { isTokenExpired, getTokenRemainingTime } from '@/utils/tokenUtils';

class AuthService {
  // Login user with email and password using unified authentication
  async login(email, password) {
    try {
      console.debug('Attempting login for:', email);
      
      // Make the login request
      const response = await apiClient.post(
        AUTH_CONFIG.ENDPOINTS.LOGIN, 
        { email, password },
        { skipAuthRefresh: true } // Don't trigger refresh for login
      );
      
      console.debug('Login response:', response.data);
      
      // Handle unified auth response structure
      if (!response.data?.success) {
        const errorMsg = response.data?.message || 'Login failed';
        console.error('Login failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const { token, refresh_token, user, user_type, role, redirect_path } = response.data.data || {};
      
      if (!token) {
        throw new Error('No access token received');
      }
      
      // Normalize user data for consistent handling
      const normalizedUser = {
        ...(user || {}),
        user_type: user_type || user?.user_type,
        role: role || user?.role,
        id: user?.id || user?.guardian_id || user?.user_id,
        name: user?.name || user?.full_name || '',
        email: user?.email || email,
        guardianId: user?.guardian_id,
        redirect_path: redirect_path || this.getDefaultRedirectPath(role || user?.role)
      };
      
      console.debug('Normalized user data:', normalizedUser);
      
      // Store tokens and user data
      this.setAuthData({ 
        access: token, 
        refresh: refresh_token, 
        user: normalizedUser 
      });
      
      return { 
        user: normalizedUser, 
        access: token,
        refresh_token,
        redirect_path: normalizedUser.redirect_path
      };
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  // Get default redirect path based on user role
  getDefaultRedirectPath(role) {
    if (!role) return '/dashboard';
    
    const roleLower = role.toLowerCase();
    
    // Define role-based redirect paths
    const rolePaths = {
      'superadmin': '/admin',
      'admin': '/admin/dashboard',
      'guardian': '/guardian/dashboard',
      'athlete': '/athlete/dashboard',
      'school_admin': '/school-admin/dashboard',
      'coach': '/coach/dashboard'
    };
    
    return rolePaths[roleLower] || '/dashboard';
  }
  
  // Register a new user
  async register(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      const { access, refresh, user } = response.data;
      
      // Store tokens and user data
      this.setAuthData({ access, refresh, user });
      
      return { user, access };
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  // Logout user
  logout() {
    // Call logout API if needed
    apiClient.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => {});
    
    // Clear all auth data
    this.clearAuthData();
  }

  // Get current user
  getCurrentUser() {
    try {
      // Try to get from current config key first, then fall back to legacy key
      let userJson = localStorage.getItem(AUTH_CONFIG.USER_DATA_KEY);
      
      if (!userJson) {
        userJson = localStorage.getItem(AUTH_KEYS.USER);
      }
      
      if (!userJson) return null;
      
      const user = JSON.parse(userJson);
      
      // Ensure required fields exist
      return {
        id: user.id || user.user_id || null,
        email: user.email || '',
        name: user.name || user.full_name || '',
        role: user.role || '',
        user_type: user.user_type || '',
        ...user // Spread the rest of the user object
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    try {
      // Check for token in current config key first, then fall back to legacy key
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || 
                   localStorage.getItem(AUTH_KEYS.TOKEN);
      
      if (!token) return false;
      
      // Check if token is expired using JWT validation
      if (isTokenExpired(token, AUTH_CONFIG.TOKEN_EXPIRY_BUFFER)) {
        console.debug('Token is expired');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    // Check both user.role (current) and user.roles (legacy) for backward compatibility
    return (user?.role?.toLowerCase() === role?.toLowerCase()) || 
           (Array.isArray(user?.roles) && user.roles.includes(role)) || 
           false;
  }

  // Initialize authentication - check token validity and refresh if needed
  async initializeAuth() {
    try {
      console.debug('Initializing authentication...');
      
      // Check if we have a current user and token
      const user = this.getCurrentUser();
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || 
                   localStorage.getItem(AUTH_KEYS.TOKEN);
      
      if (!user || !token) {
        console.debug('No user or token found, clearing auth data');
        this.clearAuthData();
        return { isAuthenticated: false, user: null };
      }
      
      // Check if token is expired
      if (isTokenExpired(token, AUTH_CONFIG.TOKEN_EXPIRY_BUFFER)) {
        console.debug('Token is expired, attempting refresh...');
        
        try {
          // Try to refresh the token
          await this.refreshToken();
          const refreshedUser = this.getCurrentUser();
          console.debug('Token refresh successful');
          return { isAuthenticated: true, user: refreshedUser };
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError.message);
          this.clearAuthData();
          return { isAuthenticated: false, user: null };
        }
      }
      
      // Token is valid, user is authenticated
      console.debug('User is authenticated with valid token');
      return { isAuthenticated: true, user };
      
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.clearAuthData();
      return { isAuthenticated: false, user: null };
    }
  }

  // Set authentication data in storage
  setAuthData({ access, refresh, user }) {
    try {
      if (access) {
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, access);
        // Set legacy key for backward compatibility
        if (AUTH_KEYS.TOKEN && AUTH_KEYS.TOKEN !== AUTH_CONFIG.TOKEN_KEY) {
          localStorage.setItem(AUTH_KEYS.TOKEN, access);
        }
      }
      if (refresh) {
        localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refresh);
        // Set legacy key for backward compatibility
        if (AUTH_KEYS.REFRESH_TOKEN && AUTH_KEYS.REFRESH_TOKEN !== AUTH_CONFIG.REFRESH_TOKEN_KEY) {
          localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refresh);
        }
      }
      if (user) {
        const userData = {
          ...user,
          // Ensure required fields
          id: user.id || user.user_id,
          email: user.email,
          role: user.role || '',
          user_type: user.user_type || ''
        };
        localStorage.setItem(AUTH_CONFIG.USER_DATA_KEY, JSON.stringify(userData));
        // Set legacy key for backward compatibility
        if (AUTH_KEYS.USER && AUTH_KEYS.USER !== AUTH_CONFIG.USER_DATA_KEY) {
          localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Error setting auth data:', error);
      throw new Error('Failed to save authentication data');
    }
  }

  // Clear all authentication data
  clearAuthData() {
    try {
      // Clear current auth data
      [
        // Current auth keys
        AUTH_CONFIG.TOKEN_KEY,
        AUTH_CONFIG.REFRESH_TOKEN_KEY,
        AUTH_CONFIG.USER_DATA_KEY,
        
        // Legacy auth keys
        AUTH_KEYS.TOKEN,
        AUTH_KEYS.REFRESH_TOKEN,
        AUTH_KEYS.USER,
        AUTH_KEYS.GUARDIAN_TOKEN_LEGACY,
        AUTH_KEYS.GUARDIAN_TOKEN_ALT_LEGACY,
        AUTH_KEYS.GUARDIAN_DATA_LEGACY,
        AUTH_KEYS.GUARDIAN_INFO_LEGACY
      ].filter(Boolean).forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove auth key ${key}:`, error);
        }
      });
      
      // Clear any session storage that might contain auth data
      sessionStorage.clear();
      
      // Clear all cookies (for domains we have access to)
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
    } catch (error) {
      console.error('Error clearing auth data:', error);
      // Even if there's an error, we want to continue with the logout flow
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY) || 
                          localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        console.warn('No refresh token available in storage');
        throw new Error('No refresh token available');
      }

      console.debug('Attempting to refresh access token...');
      
      // Use the unified login endpoint for token refresh
      const response = await apiClient.post(AUTH_CONFIG.ENDPOINTS.LOGIN, {
        refresh_token: refreshToken
      }, {
        skipAuthRefresh: true // Prevent infinite refresh loops
      });

      if (!response.data?.success || !response.data?.data?.token) {
        console.error('Invalid refresh response:', response.data);
        throw new Error('Invalid refresh response');
      }

      const { token, refresh_token, user } = response.data.data;
      
      // Update stored tokens and user data
      this.setAuthData({
        access: token,
        refresh: refresh_token,
        user: user
      });
      
      console.debug('Token refresh successful');
      return token;
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuthData();
      
      // Rethrow with a more specific error if needed
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { status, data } = error.response;
        console.error('Refresh error response:', { status, data });
        
        if (status === 400 || status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
      }
      
      throw new Error('Failed to refresh session. Please log in again.');
    }
  }
}

export default new AuthService();
