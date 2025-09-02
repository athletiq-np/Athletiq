import axios from 'axios';
import { mockGuardianAPI, DEMO_MODE } from './demoData';
import { TokenManager, ApiErrorHandler } from './tokenManager';
import { API_CONFIG, API_ENDPOINTS } from './apiEndpoints';
import logger from './logger';

// Create axios instance with base configuration
// Ensure baseURL includes '/api' to keep all endpoint paths consistent
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    // Use unified token manager
    const token = TokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log API request
    logger.apiRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url, 
      config.data ? { 
        hasData: true, 
        dataSize: JSON.stringify(config.data).length 
      } : null
    );
    
    return config;
  },
  (error) => {
  logger.apiError('REQUEST', 'setup', error);
  // Handle/log, but propagate the original axios error so callers can access error.response
  ApiErrorHandler.handle(error, 'Request setup');
  return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    // Log successful API response
    logger.apiResponse(
      response.config.method?.toUpperCase() || 'UNKNOWN',
      response.config.url,
      response.status,
      response.data ? { 
        hasData: true, 
        dataSize: JSON.stringify(response.data).length 
      } : null
    );
    return response;
  },
  (error) => {
    // Log API error
    logger.apiError(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'unknown',
      error
    );
    
    // Use centralized error handling
  ApiErrorHandler.handle(error, 'API response');
  // Propagate original axios error to preserve response/status for callers
  return Promise.reject(error);
  }
);

// Guardian API endpoints with fallback to demo mode - PHASE 2 CONSOLIDATION
export const guardianAPI = {
  // Authentication - Updated to use consolidated endpoints
  register: async (guardianData) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.register(guardianData);
    }
    try {
      // Use main guardian endpoint with full registration
      const response = await apiClient.post('/guardian/register', guardianData);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.register(guardianData);
    }
  },

  // Simplified registration (guardian only, child later)
  registerSimplified: async (guardianData) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.register(guardianData);
    }
    try {
      const response = await apiClient.post('/guardian/simplified-register', guardianData);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.register(guardianData);
    }
  },

  login: async (credentials) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.login(credentials);
    }
    try {
      const response = await apiClient.post('/guardian/login', credentials);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.login(credentials);
    }
  },

  getProfile: async () => {
    if (DEMO_MODE) {
      return mockGuardianAPI.getProfile();
    }
    try {
      const response = await apiClient.get('/guardian/profile');
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.getProfile();
    }
  },

  updateProfile: async (profileData) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.updateProfile(profileData);
    }
    try {
      const response = await apiClient.put('/guardian/profile', profileData);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.updateProfile(profileData);
    }
  },

  // Athletes management - Updated to use standardized endpoints and terminology
  getAthletes: async () => {
    if (DEMO_MODE) {
      return mockGuardianAPI.getChildren(); // Keep using mock for now
    }
    try {
      const response = await apiClient.get('/guardian/athletes');
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.getChildren();
    }
  },

  addAthlete: async (athleteData) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.addChild(athleteData); // Keep using mock for now
    }
    try {
      const response = await apiClient.post('/guardian/add-athlete', athleteData);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.addChild(athleteData);
    }
  },

  // Get athlete status (new consolidated endpoint)
  getAthleteStatus: async (athleteId) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.getChildStatus(athleteId); // Keep using mock for now
    }
    try {
      const response = await apiClient.get(`/guardian/athlete/${athleteId}/status`);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.getChildStatus(athleteId);
    }
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
    if (DEMO_MODE) {
      return mockGuardianAPI.updateChild(childId, childData);
    }
    try {
      const response = await apiClient.put(`/guardian/children/${childId}`, childData);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.updateChild(childId, childData);
    }
  },

  // Schools - Updated to use consolidated endpoint
  getSchools: async (search = '') => {
    if (DEMO_MODE) {
      return mockGuardianAPI.getSchools(search);
    }
    try {
      const response = await apiClient.get(`/guardian/schools${search ? `?search=${search}` : ''}`);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.getSchools(search);
    }
  },

  deleteChild: async (childId) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.deleteChild(childId);
    }
    try {
      const response = await apiClient.delete(`/guardian/children/${childId}`);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.deleteChild(childId);
    }
  },

  // Activities and matches - Updated endpoints for athlete terminology
  getAthleteMatches: async (athleteId) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.getChildMatches(athleteId);
    }
    try {
      const response = await apiClient.get(`/guardian/athletes/${athleteId}/matches`);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.getChildMatches(athleteId);
    }
  },

  getAthleteStats: async (athleteId) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.getChildStats(athleteId);
    }
    try {
      const response = await apiClient.get(`/guardian/athletes/${athleteId}/stats`);
      return response.data;
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.getChildStats(athleteId);
    }
  },
  // Enhanced athlete search (new modern endpoint)
  searchEnhancedAthletes: async (params = {}) => {
    try {
      const response = await apiClient.get('/enhanced-athletes/search', { params });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Placeholder athlete-match linkage via enhanced path (to be replaced with dedicated endpoint)
  getEnhancedAthleteMatches: async (athleteId) => {
    try {
      const response = await apiClient.get(`/enhanced-athletes/${athleteId}/matches`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  registerEnhancedGuardian: async (formData) => {
    try {
      const response = await apiClient.post('/enhanced-athletes/register/guardian', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  bulkEnhancedUpload: async (payload) => {
    try {
      const response = await apiClient.post('/enhanced-athletes/bulk-upload', payload);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
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

  // Documents and media - Updated endpoints
  uploadDocument: async (childId, formData) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.uploadDocument(childId, formData);
    }
    try {
      // Prefer new athletes path; fallback to legacy children path on 404
      try {
        const response = await apiClient.post(
          `/guardian/athletes/${childId}/documents`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
      } catch (err) {
        if (err.message?.includes('404')) {
          const response = await apiClient.post(
            `/guardian/children/${childId}/documents`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          return response.data;
        }
        throw err;
      }
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.uploadDocument(childId, formData);
    }
  },

  getDocuments: async (childId) => {
    if (DEMO_MODE) {
      return mockGuardianAPI.getDocuments(childId);
    }
    try {
      try {
        const response = await apiClient.get(`/guardian/athletes/${childId}/documents`);
        return response.data;
      } catch (err) {
        if (err.message?.includes('404')) {
          const response = await apiClient.get(`/guardian/children/${childId}/documents`);
          return response.data;
        }
        throw err;
      }
    } catch (error) {
      console.warn('Backend unavailable, falling back to demo mode:', error.message);
      return mockGuardianAPI.getDocuments(childId);
    }
  },
};

// Helper functions
export const handleApiError = (error) => {
  console.error('API Error:', error);
  return {
    success: false,
    message: error.message || 'An unexpected error occurred',
  };
};

export const formatSuccessResponse = (data, message = 'Operation successful') => {
  return {
    success: true,
    message,
    data,
  };
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

    // In demo mode, always consider token valid
    if (DEMO_MODE) {
      return true;
    }

    try {
      // Basic token validation (check if it's expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },
};

export default apiClient;

// Export API endpoints for easy access
export { API_ENDPOINTS, API_CONFIG } from './apiEndpoints';
