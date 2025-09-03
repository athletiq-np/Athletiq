import apiClient from '@/utils/apiClient';
import { AUTH_KEYS } from '@/utils/authKeys';
import { API_ENDPOINTS, AUTH_CONFIG } from '@/config/api.config';

class AuthService {
  // Login user with email and password using unified authentication
  async login(email, password) {
    try {
      console.debug('Attempting login for:', email);
      
      // Make the login request
      const response = await apiClient.post(AUTH_CONFIG.ENDPOINTS.LOGIN, {
        email,
        password,
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error(response.data?.message || 'Login failed');
      }

      const { token, refresh_token, user, user_type, role, redirect_path } = response.data.data;

      if (!token || !user) {
        throw new Error('Invalid login response: missing token or user data');
      }

      console.debug('Login response received:', { 
        token: !!token, 
        refresh_token: !!refresh_token, 
        user_type, 
        role 
      });

      // Normalize user data
      const normalizedUser = {
        ...user,
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
      'schooladmin': '/school',
      'coach': '/coach/dashboard',
      'organization': '/organization/dashboard'
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
      // Check multiple storage locations for user data
      const userData = localStorage.getItem('athletiq_user') || 
                      localStorage.getItem(AUTH_CONFIG.USER_DATA_KEY) ||
                      localStorage.getItem(AUTH_KEYS.USER);
      
      if (!userData) return null;
      
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    try {
      // Check for token in multiple possible locations
      const token = localStorage.getItem('athletiq_token') || 
                   localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || 
                   localStorage.getItem(AUTH_KEYS.TOKEN);
      
      if (!token) {
        console.debug('No authentication token found');
        return false;
      }
      
      // Verify token expiration
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        // If token is expired, check if we should attempt refresh
        if (payload.exp <= currentTime) {
          console.debug('Token expired at:', new Date(payload.exp * 1000));
          
          const refreshToken = localStorage.getItem('athletiq_refresh_token') ||
                             localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY) || 
                             localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
          
          if (refreshToken) {
            console.debug('Refresh token available, token can be refreshed');
            // Return true since we can potentially refresh
            return true;
          }
          
          console.debug('No refresh token available, token is expired');
          return false;
        }
        
        console.debug('Token is valid until:', new Date(payload.exp * 1000));
        return true;
      } catch (tokenError) {
        console.error('Error parsing token:', tokenError);
        return false;
      }
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

  // Set authentication data in storage
  setAuthData({ access, refresh, user }) {
    try {
      if (access) {
        // Use consistent token storage
        localStorage.setItem('athletiq_token', access);
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, access);
        // Set legacy key for backward compatibility
        if (AUTH_KEYS.TOKEN && AUTH_KEYS.TOKEN !== AUTH_CONFIG.TOKEN_KEY) {
          localStorage.setItem(AUTH_KEYS.TOKEN, access);
        }
      }
      if (refresh) {
        // Use consistent refresh token storage
        localStorage.setItem('athletiq_refresh_token', refresh);
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
        
        // Store user data in multiple locations for compatibility
        localStorage.setItem('athletiq_user', JSON.stringify(userData));
        localStorage.setItem(AUTH_CONFIG.USER_DATA_KEY, JSON.stringify(userData));
        if (AUTH_KEYS.USER && AUTH_KEYS.USER !== AUTH_CONFIG.USER_DATA_KEY) {
          localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(userData));
        }
        
        console.debug('Auth data stored successfully');
      }
    } catch (error) {
      console.error('Error setting auth data:', error);
    }
  }

  // Clear all authentication data
  clearAuthData() {
    try {
      // Clear all possible token storage locations
      const keysToRemove = [
        'athletiq_token',
        'athletiq_refresh_token', 
        'athletiq_user',
        AUTH_CONFIG.TOKEN_KEY,
        AUTH_CONFIG.REFRESH_TOKEN_KEY,
        AUTH_CONFIG.USER_DATA_KEY,
        AUTH_KEYS.TOKEN,
        AUTH_KEYS.REFRESH_TOKEN,
        AUTH_KEYS.USER
      ];
      
      keysToRemove.forEach(key => {
        if (key) localStorage.removeItem(key);
      });
      
      console.debug('All authentication data cleared from localStorage');
      
      // Clear session storage as well
      const sessionKeys = ['athletiq_token', 'athletiq_user', 'athletiq_refresh_token'];
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      // Clear cookies if they exist
      document.cookie.split(";").forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name.includes('athletiq') || name.includes('token') || name.includes('auth')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      
    } catch (error) {
      console.error('Error clearing auth data:', error);
      // Even if there's an error, we want to continue with the logout flow
    }
  }

  // Refresh access token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('athletiq_refresh_token') ||
                          localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY) ||
                          localStorage.getItem(AUTH_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        console.warn('No refresh token available in storage');
        this.clearAuthData();
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
        this.clearAuthData();
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
      
      if (error.response) {
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

// Create and export a singleton instance
const authService = new AuthService();
export default authService;