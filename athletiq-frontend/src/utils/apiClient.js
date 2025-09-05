/**
 * Unified API Client
 * Handles all API requests with automatic authentication
 */

import { authStorage, AUTH_CONFIG } from '@/config/auth.config';
import { logger } from '@/utils/logger';
import './interceptorCompat'; // Import compatibility layer for legacy code

// Base URL for API requests
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api`
  : '/api'; // Use proxy in development

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.refreshPromise = null;
    this.requestQueue = [];
    
    // Add interceptors compatibility for legacy code
    this.interceptors = {
      request: {
        use: () => {},
        eject: () => {},
      },
      response: {
        use: () => {},
        eject: () => {},
      },
    };
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = authStorage.getToken();
    return token ? { Authorization: `${AUTH_CONFIG.TOKEN_TYPE} ${token}` } : {};
  }

  /**
   * Handle token refresh
   */
  async refreshToken() {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      
      // Process queued requests if refresh successful
      if (result.success) {
        this.processRequestQueue();
      } else {
        this.rejectRequestQueue(new Error('Token refresh failed'));
      }
      
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

      logger.info('🔄 Attempting to refresh token...');
      
      const response = await fetch(`${this.baseURL}/auth/unified/token-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
      // Clear invalid tokens on refresh failure
      authStorage.clearAll();
      return { success: false, error: error.message };
    }
  }

  /**
   * Add request to queue during token refresh
   */
  addToRequestQueue(request) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, request });
    });
  }

  /**
   * Process queued requests after successful token refresh
   */
  processRequestQueue() {
    this.requestQueue.forEach(({ resolve, request }) => {
      resolve(this.makeRequest(request.url, request.options));
    });
    this.requestQueue = [];
  }

  /**
   * Reject all queued requests
   */
  rejectRequestQueue(error) {
    this.requestQueue.forEach(({ reject }) => {
      reject(error);
    });
    this.requestQueue = [];
  }

  /**
   * Normalize endpoint URL to ensure proper handling of slashes
   */
  normalizeEndpoint(endpoint) {
    // If it's a full URL, return as is
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Ensure endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Add trailing slash if missing (except for URLs with query parameters)
    if (!normalizedEndpoint.includes('?') && !normalizedEndpoint.endsWith('/')) {
      return `${normalizedEndpoint}/`;
    }
    
    return normalizedEndpoint;
  }

  /**
   * Make authenticated HTTP request
   */
  async makeRequest(endpoint, options = {}) {
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = normalizedEndpoint.startsWith('http') ? normalizedEndpoint : `${this.baseURL}${normalizedEndpoint}`;
    
    // Check if body is FormData to avoid setting Content-Type
    const isFormData = options.body instanceof FormData;
    
    // Determine if this is an upload request
    const isUploadRequest = isFormData || endpoint.includes('upload');
    
    const config = {
      headers: {
        // Only set Content-Type if not FormData
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle authentication errors
      if (response.status === 401) {
        // If already refreshing, queue this request
        if (this.isRefreshing) {
          return this.addToRequestQueue({ url: endpoint, options });
        }

        // For upload requests, provide clearer error messaging
        if (isUploadRequest) {
          logger.warn('⚠️ WARN: No refresh token available for upload request');
        } else {
          logger.error('❌ ERROR: Authentication failed for non-upload request, redirecting to login');
        }

        // Attempt token refresh
        const refreshResult = await this.refreshToken();
        
        if (refreshResult.success) {
          // Retry request with new token
          config.headers = {
            ...config.headers,
            ...this.getAuthHeaders(),
          };
          return await fetch(url, config);
        } else {
          // Refresh failed, redirect to login for non-upload requests
          if (!isUploadRequest) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
          throw new Error('Authentication failed');
        }
      }

      return response;

    } catch (error) {
      logger.error('❌ ERROR: API request failed:', error);
      throw error;
    }
  }

  /**
   * HTTP Methods
   */
  async get(endpoint, options = {}) {
    const response = await this.makeRequest(endpoint, {
      method: 'GET',
      ...options,
    });
    
    // Parse response and return in axios-compatible format
    const data = await this.handleResponse(response);
    return { data };
  }

  async post(endpoint, data, options = {}) {
    // Handle FormData vs JSON data
    const isFormData = data instanceof FormData;
    const requestOptions = {
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    };

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (isFormData) {
      // Remove any Content-Type header for FormData to let browser set it automatically
      const { 'Content-Type': _, ...headersWithoutContentType } = options.headers || {};
      requestOptions.headers = headersWithoutContentType;
    }

    const response = await this.makeRequest(endpoint, requestOptions);
    
    // Parse response and return in axios-compatible format
    const responseData = await this.handleResponse(response);
    return { data: responseData };
  }

  async put(endpoint, data, options = {}) {
    // Handle FormData vs JSON data
    const isFormData = data instanceof FormData;
    const requestOptions = {
      method: 'PUT',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    };

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (isFormData) {
      // Remove any Content-Type header for FormData to let browser set it automatically
      const { 'Content-Type': _, ...headersWithoutContentType } = options.headers || {};
      requestOptions.headers = headersWithoutContentType;
    }

    const response = await this.makeRequest(endpoint, requestOptions);
    
    // Parse response and return in axios-compatible format
    const responseData = await this.handleResponse(response);
    return { data: responseData };
  }

  async patch(endpoint, data, options = {}) {
    // Handle FormData vs JSON data
    const isFormData = data instanceof FormData;
    const requestOptions = {
      method: 'PATCH',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    };

    // Don't set Content-Type for FormData - let browser set it with boundary
    if (isFormData) {
      // Remove any Content-Type header for FormData to let browser set it automatically
      const { 'Content-Type': _, ...headersWithoutContentType } = options.headers || {};
      requestOptions.headers = headersWithoutContentType;
    }

    const response = await this.makeRequest(endpoint, requestOptions);
    
    // Parse response and return in axios-compatible format
    const responseData = await this.handleResponse(response);
    return { data: responseData };
  }

  async delete(endpoint, options = {}) {
    const response = await this.makeRequest(endpoint, {
      method: 'DELETE',
      ...options,
    });
    
    // Parse response and return in axios-compatible format  
    const responseData = await this.handleResponse(response);
    return { 
      data: responseData,
      status: response.status,
      statusText: response.statusText
    };
  }

  /**
   * Upload file with authentication
   */
  async upload(endpoint, formData, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      body: formData,
      ...options,
    });
  }

  /**
   * Download file with authentication
   */
  async download(endpoint, options = {}) {
    const response = await this.makeRequest(endpoint, {
      method: 'GET',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    return response.blob();
  }

  /**
   * Handle response with error checking
   */
  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
      } catch {
        // Unable to parse error response
      }
      
      throw new Error(errorMessage);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    // Handle different content types
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    } else if (contentType?.includes('text/')) {
      return response.text();
    } else {
      return response.blob();
    }
  }

  /**
   * Convenient methods that handle response parsing
   */
  async getJson(endpoint, options = {}) {
    const response = await this.get(endpoint, options);
    return this.handleResponse(response);
  }

  async postJson(endpoint, data, options = {}) {
    const response = await this.post(endpoint, data, options);
    return this.handleResponse(response);
  }

  async putJson(endpoint, data, options = {}) {
    const response = await this.put(endpoint, data, options);
    return this.handleResponse(response);
  }

  async patchJson(endpoint, data, options = {}) {
    const response = await this.patch(endpoint, data, options);
    return this.handleResponse(response);
  }

  async deleteJson(endpoint, options = {}) {
    const response = await this.delete(endpoint, options);
    return this.handleResponse(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

// Guardian API compatibility layer
export const guardianAPI = {
  get: (endpoint) => apiClient.getJson(`/guardian${endpoint}`),
  post: (endpoint, data) => apiClient.postJson(`/guardian${endpoint}`, data),
  put: (endpoint, data) => apiClient.putJson(`/guardian${endpoint}`, data),
  delete: (endpoint) => apiClient.deleteJson(`/guardian${endpoint}`),
  getProfile: () => apiClient.getJson('/guardian/profile'),
};

// Token manager compatibility layer
export const tokenManager = {
  get: () => authStorage.getToken(),
  set: (token) => authStorage.setToken(token),
  remove: () => authStorage.clearAll(),
  isValid: () => !!authStorage.getToken(),
};