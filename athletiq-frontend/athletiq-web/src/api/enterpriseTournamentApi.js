// Enterprise Tournament Service
// Centralized tournament management with robust error handling and validation

import apiClient from './apiClient';

// Enhanced error handling utility
const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || defaultMessage;
    const status = error.response.status;
    return new Error(`${message} (Status: ${status})`);
  } else if (error.request) {
    // Network error
    return new Error('Network error - please check your connection');
  } else {
    // Something else happened
    return new Error(error.message || defaultMessage);
  }
};

// Validation utilities
const validateTournamentData = (data) => {
  const required = ['name', 'sport', 'start_date', 'tournament_type'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Date validation
  const startDate = new Date(data.start_date);
  const endDate = data.end_date ? new Date(data.end_date) : null;
  
  if (startDate < new Date()) {
    throw new Error('Tournament start date cannot be in the past');
  }
  
  if (endDate && endDate < startDate) {
    throw new Error('Tournament end date cannot be before start date');
  }
  
  return true;
};

// ===========================================
// TOURNAMENT CRUD OPERATIONS
// ===========================================

/**
 * Creates a new tournament with enterprise validation
 * @param {Object} tournamentData - Tournament form data
 * @returns {Promise<Object>} Created tournament data
 */
export const createTournament = async (tournamentData) => {
  try {
    // Client-side validation
    validateTournamentData(tournamentData);
    
    console.log('Creating tournament with data:', tournamentData);
    
    // Handle file upload if logo exists
    let finalData = { ...tournamentData };
    
    if (tournamentData.logo instanceof File) {
      console.log('Uploading tournament logo...');
      const formData = new FormData();
      formData.append('file', tournamentData.logo);
      
      const uploadResponse = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      finalData.logo_url = uploadResponse.data.data?.url || uploadResponse.data.url;
      delete finalData.logo;
      console.log('Logo uploaded successfully:', finalData.logo_url);
    }
    
    // Create tournament
    console.log('Sending tournament data to API...');
    const response = await apiClient.post('/tournaments', finalData);
    
    console.log('Tournament created successfully:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Tournament creation failed:', error);
    throw handleApiError(error, 'Failed to create tournament');
  }
};

/**
 * Get tournaments with enterprise filtering and pagination
 * @param {Object} filters - Query filters
 * @returns {Promise<Object>} Tournaments data with pagination
 */
export const getTournaments = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'published',
      sport,
      search,
      organizer_id,
      is_featured,
      tournament_type
    } = filters;
    
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    params.append('status', status);
    
    if (sport) params.append('sport', sport);
    if (search) params.append('search', search);
    if (organizer_id) params.append('organizer_id', organizer_id);
    if (is_featured) params.append('is_featured', is_featured);
    if (tournament_type) params.append('tournament_type', tournament_type);
    
    console.log('Fetching tournaments with filters:', Object.fromEntries(params));
    
    const response = await apiClient.get(`/tournaments?${params.toString()}`);
    
    console.log('Tournaments fetched successfully:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Failed to fetch tournaments:', error);
    throw handleApiError(error, 'Failed to fetch tournaments');
  }
};

/**
 * Get tournament by ID with full details
 * @param {string|number} id - Tournament ID
 * @returns {Promise<Object>} Tournament details
 */
export const getTournamentById = async (id) => {
  try {
    console.log('Fetching tournament details for ID:', id);
    
    const response = await apiClient.get(`/tournaments/${id}`);
    
    console.log('Tournament details fetched:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Failed to fetch tournament details:', error);
    throw handleApiError(error, 'Failed to fetch tournament details');
  }
};

/**
 * Update tournament with validation
 * @param {string|number} id - Tournament ID
 * @param {Object} updateData - Updated tournament data
 * @returns {Promise<Object>} Updated tournament data
 */
export const updateTournament = async (id, updateData) => {
  try {
    console.log('Updating tournament ID:', id, 'with data:', updateData);
    
    // Handle logo upload if present
    let finalData = { ...updateData };
    
    if (updateData.logo instanceof File) {
      console.log('Uploading new tournament logo...');
      const formData = new FormData();
      formData.append('file', updateData.logo);
      
      const uploadResponse = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      finalData.logo_url = uploadResponse.data.data?.url || uploadResponse.data.url;
      delete finalData.logo;
    }
    
    const response = await apiClient.put(`/tournaments/${id}`, finalData);
    
    console.log('Tournament updated successfully:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('Failed to update tournament:', error);
    throw handleApiError(error, 'Failed to update tournament');
  }
};

/**
 * Delete tournament (soft delete)
 * @param {string|number} id - Tournament ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteTournament = async (id) => {
  try {
    console.log('Deleting tournament ID:', id);
    
    const response = await apiClient.delete(`/tournaments/${id}`);
    
    console.log('Tournament deleted successfully');
    return response.data;
    
  } catch (error) {
    console.error('Failed to delete tournament:', error);
    throw handleApiError(error, 'Failed to delete tournament');
  }
};

// ===========================================
// TOURNAMENT MANAGEMENT OPERATIONS
// ===========================================

/**
 * Update tournament status (draft, published, active, completed, cancelled)
 * @param {string|number} id - Tournament ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated tournament
 */
export const updateTournamentStatus = async (id, status) => {
  try {
    console.log('Updating tournament status:', id, 'to', status);
    
    const response = await apiClient.patch(`/tournaments/${id}/status`, { status });
    
    console.log('Tournament status updated successfully');
    return response.data;
    
  } catch (error) {
    console.error('Failed to update tournament status:', error);
    throw handleApiError(error, 'Failed to update tournament status');
  }
};

/**
 * Get tournament analytics and statistics
 * @param {string|number} id - Tournament ID
 * @returns {Promise<Object>} Tournament analytics
 */
export const getTournamentAnalytics = async (id) => {
  try {
    console.log('Fetching tournament analytics for:', id);
    
    const response = await apiClient.get(`/tournaments/${id}/analytics`);
    
    return response.data;
    
  } catch (error) {
    console.error('Failed to fetch tournament analytics:', error);
    throw handleApiError(error, 'Failed to fetch tournament analytics');
  }
};

/**
 * Generate tournament brackets
 * @param {string|number} id - Tournament ID
 * @returns {Promise<Object>} Generated brackets
 */
export const generateTournamentBrackets = async (id) => {
  try {
    console.log('Generating brackets for tournament:', id);
    
    const response = await apiClient.post(`/tournaments/${id}/brackets`);
    
    console.log('Brackets generated successfully');
    return response.data;
    
  } catch (error) {
    console.error('Failed to generate brackets:', error);
    throw handleApiError(error, 'Failed to generate tournament brackets');
  }
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Validate tournament dates
 * @param {string} startDate - Start date
 * @param {string} endDate - End date (optional)
 * @returns {boolean} Validation result
 */
export const validateTournamentDates = (startDate, endDate = null) => {
  const start = new Date(startDate);
  const now = new Date();
  
  if (start < now) {
    throw new Error('Tournament start date cannot be in the past');
  }
  
  if (endDate) {
    const end = new Date(endDate);
    if (end < start) {
      throw new Error('Tournament end date cannot be before start date');
    }
  }
  
  return true;
};

/**
 * Check if user can edit tournament
 * @param {Object} tournament - Tournament object
 * @param {Object} user - Current user
 * @returns {boolean} Can edit
 */
export const canEditTournament = (tournament, user) => {
  if (!user || !tournament) return false;
  
  // SuperAdmin can edit any tournament
  if (user.role === 'SuperAdmin') return true;
  
  // Tournament organizer can edit their own tournaments
  if (tournament.organizer_id === user.school_id || tournament.organizer_id === user.id) {
    return true;
  }
  
  return false;
};

export default {
  createTournament,
  getTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  updateTournamentStatus,
  getTournamentAnalytics,
  generateTournamentBrackets,
  validateTournamentDates,
  canEditTournament
};
