import axios from 'axios';
import axiosRetry from 'axios-retry';
import { API_CONFIG, AUTH_CONFIG, API_ENDPOINTS } from '@/config/api.config';
import { 
  handleApiError, 
  parseDjangoError, 
  ApiError, 
  ERROR_TYPES,
  clearAuthData,
  formatSuccessResponse,
  formatErrorResponse 
} from './errorHandler';
import csrfManager from './csrfManager';
import { isTokenExpired } from './tokenUtils';

// Configure axios-retry for the main axios instance
axiosRetry(axios, { 
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on network errors and 5xx responses
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           (error.response && error.response.status >= 500);
  }
});

// Create consolidated axios instance with Django-specific configuration
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true, // Required for Django CSRF cookies
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Required for Django CSRF
    'Accept': 'application/json',
  },
  xsrfCookieName: 'csrftoken', // Django CSRF cookie name
  xsrfHeaderName: 'X-CSRFToken', // Django CSRF header name
  timeout: API_CONFIG.TIMEOUT,
});

// Initialize CSRF manager
csrfManager.initialize().catch(error => {
  console.warn('Failed to initialize CSRF manager:', error);
});

// Request interceptor to add authentication token and handle CSRF
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Skip modification for external URLs
      if (config.url.startsWith('http') && !config.url.includes(process.env.REACT_APP_API_URL || 'http://localhost:8000')) {
        return config;
      }

      // Get the auth token from localStorage (unified token management)
      const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
      
      // If token exists, add it to the headers
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Handle CSRF token for Django requests
      try {
        const csrfToken = await csrfManager.getToken();
        if (csrfToken) {
          config.headers['X-CSRFToken'] = csrfToken;
          
          // Add CSRF token to FormData if present
          if (config.data instanceof FormData) {
            csrfManager.addTokenToFormData(config.data);
          }
        }
      } catch (error) {
        console.warn('Failed to get CSRF token for request:', error);
        // Don't fail the request if we can't get a CSRF token
        // The Django server will reject it if CSRF is required
      }

      // Ensure required headers are set for Django
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      config.headers['Accept'] = 'application/json';
      
      // For non-GET requests, ensure proper content type
      if (config.method !== 'get' && config.method !== 'head' && !config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      const apiError = new ApiError('Failed to process request', ERROR_TYPES.UNKNOWN, null, null, error);
      return Promise.reject(apiError);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    const apiError = new ApiError('Request setup error: ' + error.message, ERROR_TYPES.UNKNOWN, null, null, error);
    return Promise.reject(apiError);
  }
);

// Response interceptor to normalize API responses and handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Handle successful responses
    if (response.data?.success === false) {
      // If the API indicates an error in the response body
      const apiError = new ApiError(
        response.data.message || 'Request failed',
        ERROR_TYPES.SERVER,
        response.status,
        response.data.details || response.data.errors
      );
      return Promise.reject(apiError);
    }
    
    // For file downloads, return the response as is
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response;
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Parse the error using our centralized error handler
    const apiError = parseDjangoError(error);
    
    // Handle CSRF token errors
    if (apiError.isCsrfError()) {
      // If this is already a retry, don't try again to avoid infinite loops
      if (originalRequest._csrfRetry) {
        console.error('CSRF token refresh failed after retry');
        // Force page reload as last resort
        window.location.reload();
        return Promise.reject(apiError);
      }
      
      try {
        // Mark this request as a CSRF retry
        originalRequest._csrfRetry = true;
        
        // Use CSRF manager to handle the error and refresh token
        await csrfManager.handleCSRFError(originalRequest);
        
        // Retry the original request with the new CSRF token
        return apiClient(originalRequest);
      } catch (csrfError) {
        console.error('Failed to refresh CSRF token:', csrfError);
        // Force page reload as last resort
        window.location.reload();
        return Promise.reject(csrfError);
      }
    }
    
    // Handle authentication errors (token expired)
    // Skip token refresh for login/register endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/unified/login');
    
    if (apiError.requiresAuth() && !isAuthEndpoint) {
      // If we've already tried to refresh the token, don't try again
      if (originalRequest._authRetry) {
        // Clear auth data and redirect to login
        clearAuthData();
        if (!window.location.pathname.includes('login')) {
          window.location.href = '/login?error=session_expired';
        }
        return Promise.reject(apiError);
      }
      
      // Mark this request as an auth retry
      originalRequest._authRetry = true;
      
      try {
        // Try to refresh the token using the unified refresh endpoint
        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new ApiError('No refresh token available', ERROR_TYPES.AUTHENTICATION);
        }
        
        // Use the unified login endpoint with the refresh token
        const response = await axios({
          method: 'post',
          url: `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.UNIFIED_LOGIN}`,
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          data: { 
            refresh_token: refreshToken 
          },
          timeout: 10000,
          withCredentials: true
        });
          
        // Handle the unified auth response format
        if (response.data?.success && response.data?.data) {
          const { token, refresh_token, user, user_type, role, redirect_path } = response.data.data;
          
          // Store tokens and user data
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
          if (refresh_token) {
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refresh_token);
          }
          
          // Store user data with role information
          if (user) {
            const userWithRole = {
              ...user,
              role: role || user.role || '',
              user_type: user_type || user.user_type || ''
            };
            localStorage.setItem(AUTH_CONFIG.USER_DATA_KEY, JSON.stringify(userWithRole));
          }
          
          // Return the complete response data
          return {
            success: true,
            data: {
              ...response.data.data,
              user: {
                ...(user || {}),
                role: role || (user ? user.role : ''),
                user_type: user_type || (user ? user.user_type : '')
              }
            }
          };
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        clearAuthData();
        if (!window.location.pathname.includes('login')) {
          window.location.href = '/login?error=session_expired';
        }
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just return the parsed API error
    return Promise.reject(apiError);
  }
);

// Helper function to get error message from error object (legacy support)
export const getErrorMessage = (error) => {
  if (error instanceof ApiError) {
    return error.getUserMessage();
  }
  
  const apiError = parseDjangoError(error);
  return apiError.getUserMessage();
};

// Helper function to get cookie by name
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Unified Authentication API
export const unifiedAuthAPI = {
  login: async (credentials, retryCount = 0) => {
    const maxRetries = 2;
    
    try {
      // Clear any existing tokens to ensure clean state
      if (retryCount === 0) {
        localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        localStorage.removeItem(AUTH_CONFIG.USER_DATA_KEY);
      }
      // Ensure CSRF token is available with retry
      await csrfManager.getToken();
      
      // Add a small delay for the first retry to handle timing issues
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const response = await apiClient.post('/auth/unified/login', credentials);
      
      if (response.data && response.data.success && response.data.data) {
        const { token, refresh_token, user } = response.data.data;
        
        // Store tokens and user data
        if (token) {
          localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
        }
        if (refresh_token) {
          localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refresh_token);
        }
        if (user) {
          // Ensure user has role and user_type
          const userWithRole = {
            ...user,
            role: user.role || '',
            user_type: user.user_type || ''
          };
          localStorage.setItem(AUTH_CONFIG.USER_DATA_KEY, JSON.stringify(userWithRole));
        }
        
        return response.data;
      } else {
        throw new ApiError(
          response.data?.message || 'Login failed',
          ERROR_TYPES.AUTHENTICATION,
          response.status
        );
      }
    } catch (error) {
      // Retry on network errors
      if (error.type === ERROR_TYPES.NETWORK && retryCount < maxRetries) {
        console.log(`Login attempt ${retryCount + 1} failed, retrying...`);
        return unifiedAuthAPI.login(credentials, retryCount + 1);
      }
      
      throw handleApiError(error);
    }
  },

  logout: async (refreshToken) => {
    try {
      const response = await apiClient.post('/auth/unified/logout', {
        refresh_token: refreshToken
      });
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new ApiError(
          response.data?.message || 'Logout failed',
          ERROR_TYPES.AUTHENTICATION,
          response.status
        );
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  getUserType: async (email) => {
    try {
      const response = await apiClient.get(`/auth/unified/user-type?email=${encodeURIComponent(email)}`);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new ApiError(
          response.data?.message || 'Failed to get user type',
          ERROR_TYPES.VALIDATION,
          response.status
        );
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },

  verifyToken: async () => {
    try {
      const response = await apiClient.post('/auth/unified/verify');
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new ApiError(
          response.data?.message || 'Token verification failed',
          ERROR_TYPES.AUTHENTICATION,
          response.status
        );
      }
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// Guardian API endpoints - Consolidated Django integration
export const guardianAPI = {
  // Authentication - Django REST framework integration
  register: async (guardianData) => {
    const response = await apiClient.post(API_ENDPOINTS.GUARDIAN.AUTH_REGISTER, guardianData);
    return response.data;
  },

  // Simplified registration (guardian only, child later)
  registerSimplified: async (guardianData) => {
    const response = await apiClient.post(API_ENDPOINTS.GUARDIAN.AUTH_REGISTER, guardianData);
    return response.data;
  },

  login: async (credentials) => {
    // Use unified authentication endpoint
    const response = await apiClient.post('/auth/unified/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get(API_ENDPOINTS.GUARDIAN.PROFILE);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiClient.put(API_ENDPOINTS.GUARDIAN.PROFILE, profileData);
    return response.data;
  },

  // Athletes management - Django REST framework integration
  getAthletes: async () => {
    const response = await apiClient.get(API_ENDPOINTS.GUARDIAN.ATHLETES);
    return response.data;
  },

  addAthlete: async (athleteData) => {
    const response = await apiClient.post(API_ENDPOINTS.GUARDIAN.ATHLETES, athleteData);
    return response.data;
  },

  // Claim existing athlete
  claimAthlete: async (athleteData) => {
    const response = await apiClient.post(API_ENDPOINTS.GUARDIAN.CLAIM_ATHLETE, athleteData);
    return response.data;
  },

  // Get athlete status
  getAthleteStatus: async (athleteId) => {
    const response = await apiClient.get(`${API_ENDPOINTS.GUARDIAN.ATHLETES}/${athleteId}/status`);
    return response.data;
  },

  // BACKWARD COMPATIBILITY METHODS (deprecated - use athlete methods above)
  getChildren: async () => {
    console.warn('⚠️ getChildren() is deprecated. Use getAthletes() instead.');
    return await guardianAPI.getAthletes();
  },

  addChild: async (childData) => {
    console.warn('⚠️ addChild() is deprecated. Use addAthlete() instead.');
    return await guardianAPI.addAthlete(childData);
  },

  getChildStatus: async (childId) => {
    console.warn('⚠️ getChildStatus() is deprecated. Use getAthleteStatus() instead.');
    return await guardianAPI.getAthleteStatus(childId);
  },

  updateChild: async (childId, childData) => {
    const response = await apiClient.put(`${API_ENDPOINTS.GUARDIAN.ATHLETES}/${childId}`, childData);
    return response.data;
  },

  // Schools - Django REST framework integration
  getSchools: async (search = '') => {
    const response = await apiClient.get(`${API_ENDPOINTS.SCHOOLS.BASE}${search ? `?search=${search}` : ''}`);
    return response.data;
  },

  deleteChild: async (childId) => {
    const response = await apiClient.delete(`${API_ENDPOINTS.GUARDIAN.ATHLETES}/${childId}`);
    return response.data;
  },

  // Activities and matches - Django REST framework integration
  getAthleteMatches: async (athleteId) => {
    const response = await apiClient.get(`${API_ENDPOINTS.ATHLETES.BASE}/${athleteId}/matches`);
    return response.data;
  },

  getAthleteStats: async (athleteId) => {
    const response = await apiClient.get(API_ENDPOINTS.ATHLETES.STATS(athleteId));
    return response.data;
  },
  // Enhanced athlete search using Django endpoints
  searchAthletes: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ATHLETES.SEARCH, { params });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(error);
    }
  },

  // Bulk athlete operations using Django endpoints
  bulkUploadAthletes: async (payload) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ATHLETES.BULK_IMPORT, payload);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(error);
    }
  },

  // BACKWARD COMPATIBILITY METHODS (deprecated)
  getChildMatches: async (childId) => {
    console.warn('⚠️ getChildMatches() is deprecated. Use getAthleteMatches() instead.');
    return await guardianAPI.getAthleteMatches(childId);
  },

  getChildStats: async (childId) => {
    console.warn('⚠️ getChildStats() is deprecated. Use getAthleteStats() instead.');
    return await guardianAPI.getAthleteStats(childId);
  },

  // Documents and media - Django REST framework integration
  uploadDocument: async (athleteId, formData) => {
    const response = await apiClient.post(
      API_ENDPOINTS.ATHLETES.DOCUMENTS(athleteId),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  getDocuments: async (athleteId) => {
    const response = await apiClient.get(API_ENDPOINTS.ATHLETES.DOCUMENTS(athleteId));
    return response.data;
  },

  // Notifications - Django REST framework integration
  getNotifications: async () => {
    const response = await apiClient.get(API_ENDPOINTS.GUARDIAN.NOTIFICATIONS);
    return response.data;
  },
};

// Legacy helper functions (use errorHandler.js for new code)
export const handleApiErrorLegacy = (error, options = {}) => {
  return handleApiError(error, options);
};

// Token management
export const tokenManager = {
  set: (token) => {
    localStorage.setItem('guardian-token', token);
  },

  get: () => {
    return localStorage.getItem('guardian-token');
  },

  remove: () => {
    localStorage.removeItem('guardian-token');
    localStorage.removeItem('guardian-data');
  },

  isValid: () => {
    const token = tokenManager.get();
    if (!token) return false;

    // Use centralized token validation utility
    return !isTokenExpired(token);
  },
};

export default apiClient;
