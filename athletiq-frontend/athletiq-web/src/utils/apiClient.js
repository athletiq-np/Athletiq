import axios from 'axios';
import { mockGuardianAPI, DEMO_MODE } from './demoData';
import { AUTH_KEYS } from '@/utils/authKeys';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
  // Prefer unified token, fall back to legacy guardian token for backward compatibility
  const token = localStorage.getItem(AUTH_KEYS.TOKEN) || localStorage.getItem('guardian-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
  // Do not aggressively clear unified token here; allow auth hook to manage logout
  localStorage.removeItem('guardian-token');
  localStorage.removeItem('guardian-data');
      // Redirect to login could be handled here
    }
    
    // Return a more user-friendly error message
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'Something went wrong';
    
    return Promise.reject(new Error(errorMessage));
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
      const response = await apiClient.get('/api/enhanced-athletes/search', { params });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Placeholder athlete-match linkage via enhanced path (to be replaced with dedicated endpoint)
  getEnhancedAthleteMatches: async (athleteId) => {
    try {
      const response = await apiClient.get(`/api/enhanced-athletes/${athleteId}/matches`);
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  registerEnhancedGuardian: async (formData) => {
    try {
      const response = await apiClient.post('/api/enhanced-athletes/register/guardian', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  bulkEnhancedUpload: async (payload) => {
    try {
      const response = await apiClient.post('/api/enhanced-athletes/bulk-upload', payload);
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
      const response = await apiClient.post(
        `/guardian/children/${childId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
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
      const response = await apiClient.get(`/guardian/children/${childId}/documents`);
      return response.data;
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
