import apiClient from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

// ==========================================
// TOURNAMENT API - Standardized to match login API pattern
// ==========================================

/**
 * Standardized API response handler
 */
const handleResponse = (response) => {
  if (!response) {
    throw new Error('No response from server');
  }
  
  if (!response.data || response.data.success === false) {
    const error = new Error(response.data?.message || 'Request failed');
    error.response = response;
    throw error;
  }
  
  return response.data;
};

/**
 * Standardized error handler
 */
const handleError = (error, defaultMessage) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    const errorMessage = data?.message || `Request failed with status ${status}`;
    throw new Error(errorMessage);
  } else if (error.request) {
    // Request was made but no response received
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something else happened
    throw new Error(defaultMessage || 'An unexpected error occurred');
  }
};

// ==========================================
// TOURNAMENT CRUD OPERATIONS
// ==========================================

/**
 * Creates a new tournament.
 * @param {Object} tournamentData - The tournament data from the form.
 * @param {File} [tournamentData.logo] - Optional logo file to upload.
 * @returns {Promise<Object>} The newly created tournament data.
 * @throws {Error} If the API call fails.
 */
export const createTournament = async (tournamentData) => {
  try {
    const formData = new FormData();
    
    // Append all tournament data to formData
    Object.entries(tournamentData).forEach(([key, value]) => {
      if (key === 'logo' && value instanceof File) {
        formData.append('logo', value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });
    
    const response = await apiClient.post(API_ENDPOINTS.TOURNAMENTS.BASE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to create tournament');
  }
};

/**
 * Get all tournaments with pagination and filtering
 * @param {Object} params - Query parameters for filtering and pagination
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.limit] - Number of items per page
 * @param {string} [params.status] - Filter by tournament status
 * @param {string} [params.search] - Search term for tournament name
 * @returns {Promise<{data: Array, pagination: Object}>} Tournament list and pagination info
 */
export const getTournaments = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination and filter params
    const { page = 1, limit = 10, status, search, ...filters } = params;
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);
    
    // Add any additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const response = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS.BASE}?${queryParams.toString()}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to fetch tournaments');
  }
};

/**
 * Get a specific tournament by ID
 * @param {string|number} id - The ID of the tournament to fetch
 * @returns {Promise<Object>} The tournament data
 */
export const getTournamentById = async (id) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.TOURNAMENTS.BASE}/${id}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to fetch tournament details');
  }
};

/**
 * Update tournament information
 * @param {string|number} id - The ID of the tournament to update
 * @param {Object} tournamentData - The updated tournament data
 * @returns {Promise<Object>} The updated tournament data
 */
export const updateTournament = async (id, tournamentData) => {
  try {
    const formData = new FormData();
    
    // Append all tournament data to formData
    Object.entries(tournamentData).forEach(([key, value]) => {
      if (key === 'logo' && value instanceof File) {
        formData.append('logo', value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    });
    
    const response = await apiClient.put(`${API_ENDPOINTS.TOURNAMENTS.BASE}/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to update tournament');
  }
};

/**
 * Delete a tournament
 * @param {string|number} id - The ID of the tournament to delete
 * @returns {Promise<Object>} Confirmation of deletion
 */
export const deleteTournament = async (id) => {
  try {
    const response = await apiClient.delete(`${API_ENDPOINTS.TOURNAMENTS.BASE}/${id}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to delete tournament');
  }
};

// ==========================================
// TOURNAMENT STATUS & MANAGEMENT
// ==========================================

/**
 * Update tournament status
 * @param {string|number} id - The ID of the tournament
 * @param {string} status - The new status
 * @returns {Promise<Object>} The updated tournament data
 */
export const updateTournamentStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(
      `${API_ENDPOINTS.TOURNAMENTS.BASE}/${id}/status`, 
      { status }
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to update tournament status');
  }
};

/**
 * Get tournament dashboard data
 * @param {string|number} id - The ID of the tournament
 * @returns {Promise<Object>} Dashboard data and statistics
 */
export const getTournamentDashboard = async (id) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.TOURNAMENTS.DASHBOARD(id));
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to fetch tournament dashboard');
  }
};

// ==========================================
// TEAM REGISTRATION & MANAGEMENT
// ==========================================

/**
 * Register a team for a tournament
 * @param {string|number} tournamentId - The ID of the tournament
 * @param {Object} teamData - The team registration data
 * @returns {Promise<Object>} The registered team data
 */
export const registerTeamForTournament = async (tournamentId, teamData) => {
  try {
    const response = await apiClient.post(
      API_ENDPOINTS.TOURNAMENTS.REGISTER(tournamentId), 
      teamData
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to register team for tournament');
  }
};

/**
 * Get all teams registered for a tournament
 * @param {string|number} tournamentId - The ID of the tournament
 * @returns {Promise<Array>} List of registered teams
 */
export const getTournamentTeams = async (tournamentId) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.TOURNAMENTS.TEAMS(tournamentId));
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to fetch tournament teams');
  }
};

/**
 * Update team registration status
 * @param {string|number} tournamentId - The ID of the tournament
 * @param {string|number} teamId - The ID of the team
 * @param {string} status - The new status
 * @returns {Promise<Object>} The updated team registration data
 */
export const updateTeamRegistrationStatus = async (tournamentId, teamId, status) => {
  try {
    const response = await apiClient.patch(
      `${API_ENDPOINTS.TOURNAMENTS.TEAMS(tournamentId)}/${teamId}/status`, 
      { status }
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to update team registration status');
  }
};

/**
 * Bulk update team registrations
 * @param {string|number} tournamentId - The ID of the tournament
 * @param {Array<Object>} updates - Array of team updates
 * @returns {Promise<Object>} Result of the bulk update
 */
export const bulkUpdateTeamRegistrations = async (tournamentId, updates) => {
  try {
    const response = await apiClient.patch(
      `${API_ENDPOINTS.TOURNAMENTS.TEAMS(tournamentId)}/bulk-update`, 
      { updates }
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to bulk update team registrations');
  }
};

// ==========================================
// BRACKET & MATCH MANAGEMENT
// ==========================================

/**
 * Generate tournament bracket
 * @param {string|number} tournamentId - The ID of the tournament
 * @returns {Promise<Object>} The generated bracket data
 */
export const generateTournamentBracket = async (tournamentId) => {
  try {
    const response = await apiClient.post(
      `${API_ENDPOINTS.TOURNAMENTS.BRACKET(tournamentId)}/generate`
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to generate tournament bracket');
  }
};

/**
 * Get tournament bracket
 * @param {string|number} tournamentId - The ID of the tournament
 * @returns {Promise<Object>} The tournament bracket data
 */
export const getTournamentBracket = async (tournamentId) => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.TOURNAMENTS.BRACKET(tournamentId)
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to fetch tournament bracket');
  }
};

/**
 * Update match result
 * @param {string|number} tournamentId - The ID of the tournament
 * @param {string|number} matchId - The ID of the match
 * @param {Object} result - The match result data
 * @returns {Promise<Object>} The updated match data
 */
export const updateMatchResult = async (tournamentId, matchId, result) => {
  try {
    const response = await apiClient.patch(
      `${API_ENDPOINTS.TOURNAMENTS.MATCHES(tournamentId)}/${matchId}/result`, 
      result
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to update match result');
  }
};

// ==========================================
// TOURNAMENT ANALYTICS
// ==========================================

/**
 * Get tournament statistics
 * @param {string|number} tournamentId - The ID of the tournament
 * @returns {Promise<Object>} Tournament statistics
 */
export const getTournamentStats = async (tournamentId) => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.TOURNAMENTS.STATS(tournamentId));
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to fetch tournament statistics');
  }
};

/**
 * Get tournament activity feed
 * @param {string|number} tournamentId - The ID of the tournament
 * @param {Object} [params={}] - Query parameters
 * @param {number} [params.limit] - Number of items to return
 * @param {number} [params.offset] - Number of items to skip
 * @returns {Promise<Array>} List of activity items
 */
export const getTournamentActivity = async (tournamentId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    
    const response = await apiClient.get(
      `${API_ENDPOINTS.TOURNAMENTS.ACTIVITY(tournamentId)}?${queryParams.toString()}`
    );
    return handleResponse(response);
  } catch (error) {
    return handleError(error, 'Failed to fetch tournament activity');
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Handle API errors consistently
 */
const handleApiError = (error, defaultMessage) => {
  // Enhanced error handling that preserves the original response for debugging
  console.error('API Error response:', error.response);
  console.error('API Error response data:', error.response?.data);
  console.error('API Error response status:', error.response?.status);
  
  if (error.response && error.response.data && error.response.data.message) {
    // Create a new error but preserve the original response
    const newError = new Error(error.response.data.message);
    newError.response = error.response;
    throw newError;
  } else if (error.response && error.response.data) {
    // Handle cases where there's response data but no specific message
    const newError = new Error(defaultMessage);
    newError.response = error.response;
    throw newError;
  } else {
    // Handle network errors or other unexpected issues
    const newError = new Error(`${defaultMessage}. Please check your connection and try again.`);
    newError.response = error.response;
    throw newError;
  }
};

// Export all functions for easy importing
export default {
  // CRUD operations
  createTournament,
  getTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  
  // Status & Management
  updateTournamentStatus,
  getTournamentDashboard,
  
  // Team Registration & Management
  registerTeamForTournament,
  getTournamentTeams,
  updateTeamRegistrationStatus,
  bulkUpdateTeamRegistrations,
  
  // Bracket & Match Management
  generateTournamentBracket,
  getTournamentBracket,
  updateMatchResult,
  
  // Analytics
  getTournamentStats,
  getTournamentActivity,
  
  // Utility functions
  handleResponse,
  handleError
};