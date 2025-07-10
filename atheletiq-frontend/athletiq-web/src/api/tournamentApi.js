import apiClient from './apiClient';

// Use the centralized apiClient that's already configured with withCredentials: true
// This ensures cookie-based authentication works correctly with the backend

// ==========================================
// TOURNAMENT CRUD OPERATIONS
// ==========================================

/**
 * Creates a new tournament.
 * @param {object} tournamentData - The tournament data from the form.
 * @returns {Promise<object>} The newly created tournament data.
 * @throws {Error} If the API call fails.
 */
export const createTournament = async (tournamentData) => {
  try {
    // Check if we have a logo file to upload
    if (tournamentData.logo instanceof File) {
      // First upload the logo
      const formData = new FormData();
      formData.append('file', tournamentData.logo);
      
      const uploadResponse = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Replace the file with the uploaded URL
      tournamentData.logo_url = uploadResponse.data.url;
      delete tournamentData.logo;
    }
    
    // Create the tournament
    const response = await apiClient.post('/tournaments', tournamentData);
    return response.data;
  } catch (error) {
    console.error('API Error in createTournament:', error);
    throw handleApiError(error, 'Failed to create tournament');
  }
};

/**
 * Get all tournaments with pagination and filtering
 */
export const getTournaments = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.sport) queryParams.append('sport', params.sport);
    if (params.search) queryParams.append('search', params.search);
    
    const response = await apiClient.get(`/tournaments?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    throw handleApiError(error, 'Failed to fetch tournaments');
  }
};

/**
 * Get a specific tournament by ID
 */
export const getTournamentById = async (id) => {
  try {
    const response = await apiClient.get(`/tournaments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament:', error);
    throw handleApiError(error, 'Failed to fetch tournament details');
  }
};

/**
 * Update tournament information
 */
export const updateTournament = async (id, tournamentData) => {
  try {
    // Handle logo upload if present
    if (tournamentData.logo instanceof File) {
      const formData = new FormData();
      formData.append('file', tournamentData.logo);
      
      const uploadResponse = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      tournamentData.logo_url = uploadResponse.data.url;
      delete tournamentData.logo;
    }
    
    const response = await apiClient.put(`/tournaments/${id}`, tournamentData);
    return response.data;
  } catch (error) {
    console.error('Error updating tournament:', error);
    throw handleApiError(error, 'Failed to update tournament');
  }
};

/**
 * Delete a tournament
 */
export const deleteTournament = async (id) => {
  try {
    const response = await apiClient.delete(`/tournaments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting tournament:', error);
    throw handleApiError(error, 'Failed to delete tournament');
  }
};

// ==========================================
// TOURNAMENT STATUS & MANAGEMENT
// ==========================================

/**
 * Update tournament status
 */
export const updateTournamentStatus = async (id, status) => {
  try {
    const response = await apiClient.patch(`/tournaments/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating tournament status:', error);
    throw handleApiError(error, 'Failed to update tournament status');
  }
};

/**
 * Get tournament dashboard data
 */
export const getTournamentDashboard = async (id) => {
  try {
    const response = await apiClient.get(`/tournaments/${id}/dashboard`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament dashboard:', error);
    throw handleApiError(error, 'Failed to fetch tournament dashboard');
  }
};

// ==========================================
// TEAM REGISTRATION & MANAGEMENT
// ==========================================

/**
 * Register a team for a tournament
 */
export const registerTeamForTournament = async (tournamentId, teamData) => {
  try {
    const response = await apiClient.post(`/tournaments/${tournamentId}/teams/register`, teamData);
    return response.data;
  } catch (error) {
    console.error('Error registering team:', error);
    throw handleApiError(error, 'Failed to register team for tournament');
  }
};

/**
 * Get all teams registered for a tournament
 */
export const getTournamentTeams = async (tournamentId) => {
  try {
    const response = await apiClient.get(`/tournaments/${tournamentId}/teams`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament teams:', error);
    throw handleApiError(error, 'Failed to fetch tournament teams');
  }
};

/**
 * Update team registration status
 */
export const updateTeamRegistrationStatus = async (tournamentId, teamId, status) => {
  try {
    const response = await apiClient.patch(
      `/tournaments/${tournamentId}/teams/${teamId}/status`, 
      { status }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating team status:', error);
    throw handleApiError(error, 'Failed to update team registration status');
  }
};

/**
 * Bulk update team registrations
 */
export const bulkUpdateTeamRegistrations = async (tournamentId, updates) => {
  try {
    const response = await apiClient.patch(
      `/tournaments/${tournamentId}/teams/bulk-update`, 
      { updates }
    );
    return response.data;
  } catch (error) {
    console.error('Error bulk updating team registrations:', error);
    throw handleApiError(error, 'Failed to bulk update team registrations');
  }
};

// ==========================================
// BRACKET & MATCH MANAGEMENT
// ==========================================

/**
 * Generate tournament bracket
 */
export const generateTournamentBracket = async (tournamentId) => {
  try {
    const response = await apiClient.post(`/tournaments/${tournamentId}/bracket/generate`);
    return response.data;
  } catch (error) {
    console.error('Error generating bracket:', error);
    throw handleApiError(error, 'Failed to generate tournament bracket');
  }
};

/**
 * Get tournament bracket
 */
export const getTournamentBracket = async (tournamentId) => {
  try {
    const response = await apiClient.get(`/tournaments/${tournamentId}/bracket`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bracket:', error);
    throw handleApiError(error, 'Failed to fetch tournament bracket');
  }
};

/**
 * Update match result
 */
export const updateMatchResult = async (tournamentId, matchId, result) => {
  try {
    const response = await apiClient.patch(
      `/tournaments/${tournamentId}/matches/${matchId}/result`, 
      result
    );
    return response.data;
  } catch (error) {
    console.error('Error updating match result:', error);
    throw handleApiError(error, 'Failed to update match result');
  }
};

// ==========================================
// TOURNAMENT ANALYTICS
// ==========================================

/**
 * Get tournament statistics
 */
export const getTournamentStats = async (tournamentId) => {
  try {
    const response = await apiClient.get(`/tournaments/${tournamentId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament stats:', error);
    throw handleApiError(error, 'Failed to fetch tournament statistics');
  }
};

/**
 * Get tournament activity feed
 */
export const getTournamentActivity = async (tournamentId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.offset) queryParams.append('offset', params.offset);
    
    const response = await apiClient.get(
      `/tournaments/${tournamentId}/activity?${queryParams.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament activity:', error);
    throw handleApiError(error, 'Failed to fetch tournament activity');
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
  
  // Team Management
  registerTeamForTournament,
  getTournamentTeams,
  updateTeamRegistrationStatus,
  bulkUpdateTeamRegistrations,
  
  // Bracket & Matches
  generateTournamentBracket,
  getTournamentBracket,
  updateMatchResult,
  
  // Analytics
  getTournamentStats,
  getTournamentActivity
};