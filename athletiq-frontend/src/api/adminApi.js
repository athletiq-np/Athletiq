// src/api/adminApi.js

/**
 * SuperAdmin API client for enhanced dashboard functionality
 */

import apiClient from '@/utils/apiClient';

export const adminApi = {
  // Global Analytics
  async getGlobalAnalytics() {
    try {
      const response = await apiClient.get('/health/analytics/global/');
      return response.data;
    } catch (error) {
      console.warn('Global analytics not available:', error.message);
      return { success: false, data: null };
    }
  },

  async getSystemHealth() {
    try {
      const response = await apiClient.get('/health/analytics/health/');
      return response.data;
    } catch (error) {
      console.warn('System health not available:', error.message);
      return { success: false, data: null };
    }
  },

  // Athletes Management
  async getAthletes(params = {}) {
    try {
      const response = await apiClient.get('/athletes/admin/list/', { params });
      return response.data;
    } catch (error) {
      // Fallback to regular endpoint
      const fallbackResponse = await apiClient.get('/athletes/', { params });
      return fallbackResponse.data;
    }
  },

  async updateAthlete(athleteId, data) {
    try {
      const response = await apiClient.put(`/athletes/${athleteId}/`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update athlete: ${error.message}`);
    }
  },

  async deleteAthlete(athleteId) {
    try {
      console.log('Attempting to delete athlete with ID:', athleteId);
      const response = await apiClient.delete(`/athletes/${athleteId}/`);
      console.log('Delete response:', response);
      
      // Handle both 200 and 204 responses
      if (response.status === 204 || response.data === null) {
        return { success: true, message: 'Athlete deleted successfully.' };
      }
      
      return response.data || { success: true, message: 'Athlete deleted successfully.' };
    } catch (error) {
      console.error('Delete athlete error:', error);
      console.error('Error response:', error.response);
      
      throw new Error(`Failed to delete athlete: ${error.response?.data?.message || error.message}`);
    }
  },

  async bulkDeleteAthletes(athleteIds) {
    try {
      const response = await apiClient.post('/athletes/bulk-delete/', {
        athlete_ids: athleteIds
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to bulk delete athletes: ${error.message}`);
    }
  },

  async bulkUpdateAthletes(updates) {
    try {
      const response = await apiClient.post('/athletes/bulk-update/', updates);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to bulk update athletes: ${error.message}`);
    }
  },

  async bulkVerifyAthletes(athleteIds) {
    try {
      const response = await apiClient.post('/athletes/bulk-verify/', {
        athlete_ids: athleteIds,
        verification_status: 'verified'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to bulk verify athletes: ${error.message}`);
    }
  },

  async bulkUploadAthletes(athletesData) {
    try {
      console.log('Creating athletes in bulk...', athletesData);
      const response = await apiClient.post('/athletes/bulk-create/', {
        athletes: athletesData
      });
      console.log('Bulk create response:', response);
      return response.data;
    } catch (error) {
      console.error('Bulk create error:', error);
      console.error('Error response:', error.response);
      throw new Error(`Failed to create athletes: ${error.response?.data?.message || error.message}`);
    }
  },

  async updateAthleteStatus(athleteId, status) {
    try {
      console.log('Updating athlete status:', { athleteId, status });
      const response = await apiClient.patch(`/athletes/${athleteId}/`, {
        is_active: status === 'active'
      });
      console.log('Status update response:', response);
      return response.data;
    } catch (error) {
      console.error('Update athlete status error:', error);
      console.error('Error response:', error.response);
      throw new Error(`Failed to update athlete status: ${error.response?.data?.message || error.message}`);
    }
  },

  // Organizations Management
  async getOrganizations(params = {}) {
    try {
      const response = await apiClient.get('/organizations/admin/list/', { params });
      return response.data;
    } catch (error) {
      console.warn('Organizations endpoint not available:', error.message);
      return { success: false, data: [] };
    }
  },

  async verifyOrganization(organizationId) {
    try {
      const response = await apiClient.post(`/organizations/admin/${organizationId}/verify/`, {
        verification_status: 'verified'
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to verify organization: ${error.message}`);
    }
  },

  // Guardians Management
  async getGuardians(params = {}) {
    try {
      const response = await apiClient.get('/guardian/admin/list/', { params });
      return response.data;
    } catch (error) {
      console.warn('Guardians endpoint not available:', error.message);
      return { success: false, data: [] };
    }
  },

  // Schools Management
  async getSchools(params = {}) {
    try {
      const response = await apiClient.get('/schools/', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get schools: ${error.message}`);
    }
  },

  async updateSchoolStatus(schoolId, status) {
    try {
      const response = await apiClient.patch(`/schools/${schoolId}/`, {
        is_active: status
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update school status: ${error.message}`);
    }
  },

  // Tournaments Management
  async getTournaments(params = {}) {
    try {
      const response = await apiClient.get('/tournaments/', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get tournaments: ${error.message}`);
    }
  },

  async updateTournamentStatus(tournamentId, status) {
    try {
      const response = await apiClient.patch(`/tournaments/${tournamentId}/`, {
        status: status
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update tournament status: ${error.message}`);
    }
  },

  // Bulk Operations
  async bulkOperation(endpoint, operation, items) {
    try {
      const response = await apiClient.post(endpoint, {
        operation: operation,
        items: items
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to perform bulk operation: ${error.message}`);
    }
  },

  // Export Functions
  async exportData(dataType, format = 'csv', filters = {}) {
    try {
      const response = await apiClient.get(`/${dataType}/export/`, {
        params: { format, ...filters },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataType}_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      throw new Error(`Failed to export ${dataType}: ${error.message}`);
    }
  },

  // Dashboard Data
  async getDashboardData() {
    try {
      const [analytics, athletes, schools, organizations, guardians, tournaments] = await Promise.all([
        this.getGlobalAnalytics(),
        this.getAthletes({ limit: 100 }),
        this.getSchools({ limit: 100 }),
        this.getOrganizations({ limit: 100 }),
        this.getGuardians({ limit: 100 }),
        this.getTournaments({ limit: 100 })
      ]);

      return {
        analytics: analytics.data,
        athletes: athletes.data || athletes.results || [],
        schools: schools.data || schools.results || [],
        organizations: organizations.data || [],
        guardians: guardians.data || [],
        tournaments: tournaments.data || tournaments.results || []
      };
    } catch (error) {
      throw new Error(`Failed to load dashboard data: ${error.message}`);
    }
  }
};

export default adminApi;
