// Organization API Service
// Comprehensive API service for organization management with Django REST framework integration

import apiClient from '@/utils/apiClient';
import { handleApiError, formatSuccessResponse, formatErrorResponse } from '@/utils/errorHandler';

/**
 * Organization API endpoints and methods
 * Following the same pattern as guardian and admin APIs
 */
export const organizationAPI = {
  // Dashboard and overview
  getDashboard: async () => {
    try {
      const response = await apiClient.get('/api/organizations/dashboard/');
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Organization management
  getProfile: async () => {
    try {
      const response = await apiClient.get('/api/organizations/profile/');
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/api/organizations/profile/', profileData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Registration (for new organizations)
  register: async (organizationData) => {
    try {
      const response = await apiClient.post('/api/organizations/register/', organizationData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Athletes management
  getAthletes: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/organizations/athletes/', { params });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  registerAthlete: async (athleteData) => {
    try {
      const response = await apiClient.post('/api/organizations/athletes/', athleteData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  updateAthlete: async (athleteId, athleteData) => {
    try {
      const response = await apiClient.put(`/api/organizations/athletes/${athleteId}/`, athleteData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  removeAthlete: async (athleteId) => {
    try {
      const response = await apiClient.delete(`/api/organizations/athletes/${athleteId}/`);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Athlete stats and performance
  getAthleteStats: async (athleteId) => {
    try {
      const response = await apiClient.get(`/api/organizations/athletes/${athleteId}/stats/`);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Tournaments management
  getTournaments: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/organizations/tournaments/', { params });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  createTournament: async (tournamentData) => {
    try {
      const response = await apiClient.post('/api/organizations/tournaments/', tournamentData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  updateTournament: async (tournamentId, tournamentData) => {
    try {
      const response = await apiClient.put(`/api/organizations/tournaments/${tournamentId}/`, tournamentData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  deleteTournament: async (tournamentId) => {
    try {
      const response = await apiClient.delete(`/api/organizations/tournaments/${tournamentId}/`);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // School partnerships
  getSchools: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/organizations/schools/', { params });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  addSchoolPartnership: async (partnershipData) => {
    try {
      const response = await apiClient.post('/api/organizations/schools/', partnershipData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  updateSchoolPartnership: async (partnershipId, partnershipData) => {
    try {
      const response = await apiClient.put(`/api/organizations/schools/${partnershipId}/`, partnershipData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  removeSchoolPartnership: async (partnershipId) => {
    try {
      const response = await apiClient.delete(`/api/organizations/schools/${partnershipId}/`);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Available schools for partnerships
  getAvailableSchools: async (search = '') => {
    try {
      const response = await apiClient.get(`/api/schools/${search ? `?search=${search}` : ''}`);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Statistics and analytics
  getStatistics: async () => {
    try {
      const response = await apiClient.get('/api/organizations/statistics/');
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Notifications
  getNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/organizations/notifications/', { params });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await apiClient.patch(`/api/organizations/notifications/${notificationId}/`, {
        is_read: true
      });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Document management
  uploadDocument: async (documentData) => {
    try {
      const formData = new FormData();
      Object.keys(documentData).forEach(key => {
        formData.append(key, documentData[key]);
      });
      
      const response = await apiClient.post('/api/organizations/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  getDocuments: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/organizations/documents/', { params });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  deleteDocument: async (documentId) => {
    try {
      const response = await apiClient.delete(`/api/organizations/documents/${documentId}/`);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Bulk operations
  bulkUploadAthletes: async (athletesData) => {
    try {
      const response = await apiClient.post('/api/organizations/athletes/bulk-upload/', athletesData);
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  exportAthletes: async (format = 'excel') => {
    try {
      const response = await apiClient.get(`/api/organizations/athletes/export/?format=${format}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  // Organization verification status
  getVerificationStatus: async () => {
    try {
      const response = await apiClient.get('/api/organizations/verification-status/');
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  },

  submitVerificationDocuments: async (documents) => {
    try {
      const formData = new FormData();
      documents.forEach((doc, index) => {
        formData.append(`documents[${index}]`, doc);
      });
      
      const response = await apiClient.post('/api/organizations/submit-verification/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return formatSuccessResponse(response.data);
    } catch (error) {
      return formatErrorResponse(handleApiError(error));
    }
  }
};

export default organizationAPI;