import apiClient from './apiClient';

// Use the centralized apiClient that's already configured with withCredentials: true
// This ensures cookie-based authentication works correctly with the backend


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
    // Enhanced error handling that preserves the original response for debugging
    console.error('API Error in createTournament:', error);
    console.error('Error response:', error.response);
    console.error('Error response data:', error.response?.data);
    console.error('Error response status:', error.response?.status);
    
    if (error.response && error.response.data && error.response.data.message) {
      // Create a new error but preserve the original response
      const newError = new Error(error.response.data.message);
      newError.response = error.response;
      throw newError;
    } else if (error.response && error.response.data) {
      // Handle cases where there's response data but no specific message
      const newError = new Error('Validation failed');
      newError.response = error.response;
      throw newError;
    } else {
      // Handle network errors or other unexpected issues
      const newError = new Error('An unexpected network error occurred. Please try again.');
      newError.response = error.response;
      throw newError;
    }
  }
};

// You can add other tournament-related API functions here in the future
// export const getTournamentById = async (id) => { ... };
// export const updateTournament = async (id, data) => { ... };