import axios from 'axios';

// 1. Create a centralized, pre-configured Axios instance
// This is best practice. All API calls will automatically have the correct base URL
// and send the auth token from localStorage if it exists.
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


/**
 * Creates a new tournament.
 * @param {object} tournamentData - The tournament data from the form.
 * @returns {Promise<object>} The newly created tournament data.
 * @throws {Error} If the API call fails.
 */
export const createTournament = async (tournamentData) => {
  try {
    // 2. The function is now cleaner and only worries about the specific endpoint and data.
    const response = await apiClient.post('/tournaments', tournamentData);
    return response.data;
  } catch (error) {
    // 3. Improved, robust error handling.
    // We now inspect the error object and return a consistent, meaningful message
    // instead of just the generic "Error creating tournament".
    if (error.response && error.response.data && error.response.data.message) {
      // Throw an error with the specific message from the backend
      throw new Error(error.response.data.message);
    } else {
      // Handle network errors or other unexpected issues
      throw new Error('An unexpected network error occurred. Please try again.');
    }
  }
};

// You can add other tournament-related API functions here in the future
// export const getTournamentById = async (id) => { ... };
// export const updateTournament = async (id, data) => { ... };