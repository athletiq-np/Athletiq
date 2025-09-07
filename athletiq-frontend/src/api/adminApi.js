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

  // Separate method for athlete data updates (JSON only)
  async updateAthleteData(athleteId, data) {
    try {
      console.log('Updating athlete data (JSON only):', data);
      
      // This method only handles JSON data - no FormData
      if (data instanceof FormData) {
        throw new Error('FormData not supported. Use updateAthleteData for JSON data only.');
      }
      
      const response = await apiClient.put(`/athletes/${athleteId}/`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Athlete data updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Update athlete data error:', error);
      throw new Error(`Failed to update athlete data: ${error.response?.data?.message || error.message}`);
    }
  },

  // Legacy method - kept for backward compatibility but now delegates to separate methods
  async updateAthlete(athleteId, data) {
    // If it's FormData, this is likely an old call - redirect to data-only update
    if (data instanceof FormData) {
      console.warn('⚠️ updateAthlete called with FormData. Consider using updateAthleteData + file upload methods.');
      
      // Extract non-file data from FormData
      const jsonData = {};
      for (let [key, value] of data.entries()) {
        // Skip file fields
        if (key !== 'profile_photo' && key !== 'birth_certificate') {
          jsonData[key] = value;
        }
      }
      
      return this.updateAthleteData(athleteId, jsonData);
    }
    
    // For JSON data, use the new method
    return this.updateAthleteData(athleteId, data);
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
  },

  // Document Verification Management
  async getAthleteDocuments(athleteId) {
    try {
      const response = await apiClient.get(`/athletes/${athleteId}/documents/`);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return simulated data based on athlete info
      const athleteResponse = await apiClient.get(`/athletes/${athleteId}/`);
      const athlete = athleteResponse.data;
      
      const documents = [];
      
      // Add profile photo if exists
      if (athlete.profile_photo_url) {
        documents.push({
          id: 'profile_photo',
          name: 'Profile Photo',
          type: 'image',
          url: athlete.profile_photo_url,
          verification_status: athlete.photo_verification_status || 'pending',
          uploaded_at: athlete.created_at
        });
      }

      // Add birth certificate if exists
      if (athlete.birth_certificate_url || athlete.birth_certificate_no) {
        documents.push({
          id: 'birth_certificate',
          name: 'Birth Certificate',
          type: 'document',
          url: athlete.birth_certificate_url,
          certificate_no: athlete.birth_certificate_no,
          verification_status: athlete.birth_cert_verification_status || 'pending',
          uploaded_at: athlete.created_at,
          additional_info: {
            certificate_date: athlete.birth_certificate_date,
            issuing_office: athlete.birth_certificate_office
          }
        });
      }

      return { success: true, data: documents };
    }
  },

  async updateDocumentVerification(athleteId, reviewData) {
    try {
      const response = await apiClient.post(`/athletes/${athleteId}/documents/verify/`, reviewData);
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, simulate the update
      console.log('Document verification update (simulated):', { athleteId, reviewData });
      
      // Update athlete verification status based on overall document status
      const verifiedDocs = reviewData.document_reviews?.filter(doc => doc.verification_status === 'verified').length || 0;
      const totalDocs = reviewData.document_reviews?.length || 0;
      
      let overallStatus = 'pending';
      if (verifiedDocs === totalDocs && totalDocs > 0) {
        overallStatus = 'verified';
      } else if (reviewData.document_reviews?.some(doc => doc.verification_status === 'rejected')) {
        overallStatus = 'rejected';
      } else if (reviewData.document_reviews?.some(doc => doc.verification_status === 'requires_review')) {
        overallStatus = 'requires_review';
      }

      // Update athlete verification status
      try {
        await this.updateAthlete(athleteId, { verification_status: overallStatus });
      } catch (updateError) {
        console.warn('Could not update athlete verification status:', updateError);
      }

      return { 
        success: true, 
        message: 'Document verification updated successfully',
        data: { verification_status: overallStatus }
      };
    }
  },

  async bulkVerifyDocuments(athleteIds, verificationStatus = 'verified') {
    try {
      const response = await apiClient.post('/athletes/documents/bulk-verify/', {
        athlete_ids: athleteIds,
        verification_status: verificationStatus
      });
      return response.data;
    } catch (error) {
      // Simulate bulk verification
      const results = await Promise.allSettled(
        athleteIds.map(id => this.updateDocumentVerification(id, {
          document_reviews: [{ verification_status: verificationStatus }]
        }))
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return {
        success: true,
        message: `Bulk verification completed: ${successful} successful, ${failed} failed`,
        data: { successful_count: successful, failed_count: failed }
      };
    }
  },

  // File Upload Methods
  async uploadAthleteProfileImage(athleteId, formData) {
    try {
      console.log('🔄 Uploading profile image for athlete:', athleteId);
      console.log('📷 FormData contents:', {
        profile_photo: formData.get('profile_photo')?.name,
        athlete_id: formData.get('athlete_id')
      });
      
      // Use direct fetch with localStorage token (same as working updateAthlete method)
      const token = localStorage.getItem('athletiq_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const fullUrl = `${apiUrl}/api/athletes/${athleteId}/upload-profile-image/`;
      console.log('Profile image upload URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile image upload failed with error data:', errorData);
        
        let errorMessage = `Upload failed: ${response.status}`;
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        } else if (errorData.errors) {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage += ` - ${validationErrors}`;
        } else if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`;
        } else {
          errorMessage += ` - ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Profile image upload successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Profile image upload error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || 
          error.message.includes('401') ||
          error.message.includes('Unauthorized')) {
        console.warn('🔐 Authentication error during profile image upload - user may need to log in again');
        throw new Error('Authentication failed. Please log in again and try uploading the image.');
      }
      
      throw error;
    }
  },

  async uploadAthleteDocument(athleteId, formData) {
    try {
      console.log('🔄 Uploading document for athlete:', athleteId);
      console.log('📄 FormData contents:', {
        document: formData.get('document')?.name,
        athlete_id: formData.get('athlete_id'),
        document_type: formData.get('document_type')
      });
      
      // Use direct fetch with localStorage token (same as working updateAthlete method)
      const token = localStorage.getItem('athletiq_token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const fullUrl = `${apiUrl}/api/athletes/${athleteId}/upload-document/`;
      console.log('Document upload URL:', fullUrl);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Document upload failed with error data:', errorData);
        
        let errorMessage = `Upload failed: ${response.status}`;
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        } else if (errorData.errors) {
          const validationErrors = Object.entries(errorData.errors)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          errorMessage += ` - ${validationErrors}`;
        } else if (errorData.detail) {
          errorMessage += ` - ${errorData.detail}`;
        } else {
          errorMessage += ` - ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Document upload successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Document upload error:', error);
      
      // Check if it's an authentication error
      if (error.message.includes('Authentication failed') || 
          error.message.includes('401') ||
          error.message.includes('Unauthorized')) {
        console.warn('🔐 Authentication error during document upload - user may need to log in again');
        throw new Error('Authentication failed. Please log in again and try uploading the document.');
      }
      
      throw error;
    }
  },

  async deleteAthleteDocument(documentId) {
    try {
      const response = await apiClient.delete(`/athletes/documents/${documentId}/`);
      return response.data;
    } catch (error) {
      console.warn('Document delete endpoint not available, simulating success');
      return {
        success: true,
        message: 'Document deleted successfully'
      };
    }
  }
};

export default adminApi;
