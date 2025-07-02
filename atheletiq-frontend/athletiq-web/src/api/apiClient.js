import axios from 'axios';

// Create a pre-configured instance of Axios
const apiClient = axios.create({
  // Set the base URL for all API requests
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',

  // --- THIS IS THE KEY CHANGE ---
  // This tells Axios to include cookies on all cross-origin requests
  withCredentials: true,
});

export default apiClient;