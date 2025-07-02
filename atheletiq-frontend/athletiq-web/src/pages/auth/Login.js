//
// 🧠 ATHLETIQ - Login Page (Upgraded for Zustand & Secure Cookies)
//
// This component now uses the central 'useUserStore' to manage the user's
// state. It no longer saves the JWT or user data to localStorage, which is
// a major security and state management improvement.
//

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/apiClient'; // Use our pre-configured Axios instance
import useUserStore from '@/store/userStore'; // Import our new Zustand store

export default function Login() {
  // --- Component State ---
  const [identifier, setIdentifier] = useState(''); // Can be email or phone
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Hooks ---
  const navigate = useNavigate();
  // Get the 'setUser' action from our global user store
  const setUser = useUserStore((state) => state.setUser);

  /**
   * Handles the form submission for logging in a user.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Send login credentials to the backend.
      // Our apiClient is configured with `withCredentials: true`, so the browser
      // will handle the secure cookie automatically.
      const response = await apiClient.post('/auth/login', {
        email: identifier.trim(), // The backend expects an 'email' field for the identifier
        password,
      });

      const { user } = response.data;

      // 2. CRITICAL CHANGE: Instead of localStorage, update the global state.
      // This makes the user's data available to the entire application.
      setUser(user);

      // 3. Navigate to the correct dashboard based on the user's role.
      // This logic remains the same, but it's now based on a more secure flow.
      switch (user.role) {
        case 'SuperAdmin':
          navigate('/admin/dashboard');
          break;
        case 'SchoolAdmin':
          navigate('/school/dashboard');
          break;
        // Add cases for other roles as they are built
        // case 'Player':
        //   navigate('/player/dashboard');
        //   break;
        default:
          navigate('/'); // Default redirect for any other role
      }
    } catch (err) {
      // Set a user-friendly error message from the API response.
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-athletiq-navy">Welcome Back</h1>
          <p className="text-gray-500">Log in to your Athletiq account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="identifier">
              Email Address
            </label>
            <input
              id="identifier"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-green"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-athletiq-green"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 font-semibold text-white bg-athletiq-navy rounded-lg hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-athletiq-navy disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}