import axios from 'axios';
import { API_ENDPOINTS, API_CONFIG } from '@/config/api.config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to include CSRF token
api.interceptors.request.use(
  async (config) => {
    // Get CSRF token from cookies
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - redirecting to login');
      // You might want to redirect to login or refresh token here
    }
    return Promise.reject(error);
  }
);

const schoolApi = {
  // Get all schools with pagination
  getSchools: async (page = 1, pageSize = 10) => {
    try {
      const response = await api.get(API_ENDPOINTS.SCHOOLS.BASE, {
        params: {
          page,
          page_size: pageSize,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching schools:', error);
      throw error;
    }
  },

  // Get a single school by ID
  getSchoolById: async (id) => {
    try {
      const response = await api.get(`${API_ENDPOINTS.SCHOOLS.BASE}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching school with ID ${id}:`, error);
      throw error;
    }
  },

  // Create a new school
  createSchool: async (schoolData) => {
    try {
      const formData = new FormData();
      
      // Append all fields to formData
      Object.keys(schoolData).forEach(key => {
        if (key === 'logo' && schoolData[key]) {
          formData.append('logo', schoolData[key]);
        } else if (schoolData[key] !== null && schoolData[key] !== undefined) {
          formData.append(key, schoolData[key]);
        }
      });

      const response = await api.post(API_ENDPOINTS.SCHOOLS.BASE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating school:', error);
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

      const response = await api.patch(`${API_ENDPOINTS.SCHOOLS.BASE}${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating school with ID ${id}:`, error);
      throw error;
    }
  },

  // Delete a school
  deleteSchool: async (id) => {
    try {
      const response = await api.delete(`${API_ENDPOINTS.SCHOOLS.BASE}${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting school with ID ${id}:`, error);
      throw error;
    }
  },

  // Search schools
  searchSchools: async (query, page = 1, pageSize = 10) => {
    try {
      const response = await api.get(API_ENDPOINTS.SCHOOLS.BASE, {
        params: {
          search: query,
          page,
          page_size: pageSize,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching schools:', error);
      throw error;
    }
  },
};

export default schoolApi;
