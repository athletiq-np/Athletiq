/**
 * CSRF Token Manager for Django Integration
 * 
 * Handles CSRF token retrieval, validation, and refresh for Django backend
 */

import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api.config';
import { ApiError, ERROR_TYPES } from './errorHandler';

class CSRFManager {
  constructor() {
    this.token = null;
    this.refreshPromise = null;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * Get CSRF token from cookies
   */
  getTokenFromCookies() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Set CSRF token in cookies
   */
  setTokenInCookies(token) {
    if (token) {
      document.cookie = `csrftoken=${token}; Path=/; SameSite=Lax`;
      this.token = token;
    }
  }

  /**
   * Get current CSRF token (from memory or cookies)
   */
  getCurrentToken() {
    if (this.token) {
      return this.token;
    }
    
    const cookieToken = this.getTokenFromCookies();
    if (cookieToken) {
      this.token = cookieToken;
      return cookieToken;
    }
    
    return null;
  }

  /**
   * Fetch new CSRF token from Django backend
   */
  async fetchTokenFromServer() {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.CSRF}`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: 10000,
      });
      
      let token = null;
      
      // Handle different Django CSRF response formats
      if (response.data?.csrfToken) {
        token = response.data.csrfToken;
      } else if (response.data?.csrf_token) {
        token = response.data.csrf_token;
      } else if (response.data?.token) {
        token = response.data.token;
      }
      
      // Also check response headers for CSRF token
      if (!token) {
        token = response.headers['x-csrftoken'] || response.headers['X-CSRFToken'];
      }
      
      // Fallback: try to get from Set-Cookie header
      if (!token) {
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          const csrfMatch = setCookie.find(cookie => cookie.includes('csrftoken='));
          if (csrfMatch) {
            const match = csrfMatch.match(/csrftoken=([^;]+)/);
            if (match) {
              token = match[1];
            }
          }
        }
      }
      
      if (!token) {
        throw new ApiError('No CSRF token in server response', ERROR_TYPES.CSRF);
      }
      
      this.setTokenInCookies(token);
      this.retryCount = 0; // Reset retry count on success
      
      return token;
    } catch (error) {
      console.error('Failed to fetch CSRF token from server:', error);
      
      // If it's a network error or server error, we might want to retry
      if (this.retryCount < this.maxRetries && 
          (!error.response || error.response.status >= 500)) {
        this.retryCount++;
        console.warn(`Retrying CSRF token fetch (attempt ${this.retryCount}/${this.maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.fetchTokenFromServer();
      }
      
      throw new ApiError(
        'Failed to obtain security token from server',
        ERROR_TYPES.CSRF,
        error.response?.status,
        null,
        error
      );
    }
  }

  /**
   * Get CSRF token with automatic refresh if needed
   */
  async getToken(forceRefresh = false) {
    // If we're already refreshing, wait for that to complete
    if (this.refreshPromise) {
      try {
        return await this.refreshPromise;
      } catch (error) {
        // If refresh failed, continue to try again
        this.refreshPromise = null;
      }
    }

    // If force refresh or no current token, fetch from server
    if (forceRefresh || !this.getCurrentToken()) {
      this.refreshPromise = this.fetchTokenFromServer();
      
      try {
        const token = await this.refreshPromise;
        this.refreshPromise = null;
        return token;
      } catch (error) {
        this.refreshPromise = null;
        throw error;
      }
    }

    return this.getCurrentToken();
  }

  /**
   * Clear CSRF token (on logout or error)
   */
  clearToken() {
    this.token = null;
    this.refreshPromise = null;
    this.retryCount = 0;
    
    // Clear from cookies
    document.cookie = 'csrftoken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }

  /**
   * Validate if current token is likely valid
   */
  isTokenValid() {
    const token = this.getCurrentToken();
    return token && token.length > 10; // Basic validation
  }

  /**
   * Handle CSRF error and refresh token
   */
  async handleCSRFError(originalRequest) {
    console.warn('CSRF token validation failed, refreshing token...');
    
    try {
      // Clear the invalid token
      this.clearToken();
      
      // Get a new token
      const newToken = await this.getToken(true);
      
      if (newToken && originalRequest) {
        // Update the original request with new token
        if (originalRequest.headers) {
          originalRequest.headers['X-CSRFToken'] = newToken;
        }
        
        // If this is a FormData request, update the form data
        if (originalRequest.data instanceof FormData) {
          originalRequest.data.set('csrfmiddlewaretoken', newToken);
        }
        
        // If this is a JSON request with CSRF in body, update it
        if (originalRequest.data && typeof originalRequest.data === 'object' && 
            !originalRequest.data instanceof FormData) {
          originalRequest.data.csrfmiddlewaretoken = newToken;
        }
      }
      
      return newToken;
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
      throw new ApiError(
        'Security token refresh failed. Please refresh the page.',
        ERROR_TYPES.CSRF,
        null,
        null,
        error
      );
    }
  }

  /**
   * Add CSRF token to request headers
   */
  addTokenToRequest(config) {
    const token = this.getCurrentToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['X-CSRFToken'] = token;
    }
    return config;
  }

  /**
   * Add CSRF token to FormData
   */
  addTokenToFormData(formData) {
    const token = this.getCurrentToken();
    if (token && formData instanceof FormData) {
      formData.set('csrfmiddlewaretoken', token);
    }
    return formData;
  }

  /**
   * Initialize CSRF manager (get initial token)
   */
  async initialize() {
    try {
      // Try to get token from cookies first
      const cookieToken = this.getTokenFromCookies();
      if (cookieToken) {
        this.token = cookieToken;
        return cookieToken;
      }
      
      // If no cookie token, fetch from server
      return await this.getToken(true);
    } catch (error) {
      console.warn('Failed to initialize CSRF token:', error);
      // Don't throw error on initialization failure
      // The token will be fetched when needed
      return null;
    }
  }
}

// Create singleton instance
const csrfManager = new CSRFManager();

// Export both the class and the singleton instance
export { CSRFManager };
export default csrfManager;