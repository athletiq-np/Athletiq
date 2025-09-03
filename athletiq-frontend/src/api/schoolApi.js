import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

// Using the centralized apiClient from utils/apiClient
// which already includes authentication, CSRF, and error handling

const schoolApi = {
  // Get all schools with pagination
  getSchools: async (page = 1, pageSize = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      const response = await apiClient.getJson(`${API_ENDPOINTS.SCHOOLS.BASE}?${params}`);
      return response;
    } catch (error) {
      console.error('Error fetching schools:', error);
      throw error;
    }
  },

  // Get a single school by ID
  getSchoolById: async (id) => {
    try {
      const response = await apiClient.getJson(`${API_ENDPOINTS.SCHOOLS.BASE}${id}/`);
      return response;
    } catch (error) {
      console.error(`Error fetching school with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new school
  createSchool: async (schoolData) => {
    try {
      console.log('Creating school with data:', schoolData);
      
      // Check if there's a logo file that needs uploading
      const hasLogo = schoolData.logo && schoolData.logo instanceof File;
      
      if (hasLogo) {
        // Use FormData for file upload
        const formData = new FormData();
        
        // Append all fields to formData, excluding unsupported fields
        Object.keys(schoolData).forEach(key => {
          if (key === 'logo' && schoolData[key]) {
            console.log('Adding logo to form data');
            formData.append('logo', schoolData[key]);
          } else if (key !== 'is_active' && schoolData[key] !== null && schoolData[key] !== undefined) {
            formData.append(key, schoolData[key]);
          }
        });

        console.log('Sending request with FormData to:', API_ENDPOINTS.SCHOOLS.REGISTER);
        const response = await apiClient.upload(API_ENDPOINTS.SCHOOLS.REGISTER, formData);
        const result = await apiClient.handleResponse(response);
        
        console.log('School created successfully:', result);
        return result;
      } else {
        // Use JSON for simple data without file upload
        const jsonData = { ...schoolData };
        
        // Remove fields not supported by the registration serializer
        delete jsonData.logo;
        delete jsonData.is_active;
        
        console.log('Sending request with JSON to:', API_ENDPOINTS.SCHOOLS.REGISTER);
        const result = await apiClient.postJson(API_ENDPOINTS.SCHOOLS.REGISTER, jsonData);
        
        console.log('School created successfully:', result);
        return result;
      }
      
    } catch (error) {
      console.error('Error creating school:', {
        message: error.message,
        response: error.response,
        status: error.status,
        responseText: error.responseText,
        fullError: error,
      });
      throw error;
    }
  },

  // Update an existing school
  updateSchool: async (id, schoolData) => {
    try {
      const formData = new FormData();
      
      // Append all fields to formData
      Object.keys(schoolData).forEach(key => {
        if (key === 'logo' && schoolData[key]) {
          // Only append logo if it's a new file
          if (schoolData[key] instanceof File) {
            formData.append('logo', schoolData[key]);
          }
        } else if (schoolData[key] !== null && schoolData[key] !== undefined) {
          formData.append(key, schoolData[key]);
        }
      });

      const response = await apiClient.upload(`${API_ENDPOINTS.SCHOOLS.BASE}${id}/`, formData, {
        method: 'PATCH'
      });
      return await apiClient.handleResponse(response);
    } catch (error) {
      console.error(`Error updating school with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a school
  deleteSchool: async (id) => {
    try {
      const response = await apiClient.deleteJson(`${API_ENDPOINTS.SCHOOLS.BASE}${id}/`);
      return response;
    } catch (error) {
      console.error(`Error deleting school with ID ${id}:`, error);
      throw error;
    }
  },

  // Search schools
  searchSchools: async (query, page = 1, pageSize = 10) => {
    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        page_size: pageSize.toString(),
      });
      const response = await apiClient.getJson(`${API_ENDPOINTS.SCHOOLS.BASE}?${params}`);
      return response;
    } catch (error) {
      console.error('Error searching schools:', error);
      throw error;
    }
  },
};

export default schoolApi;
