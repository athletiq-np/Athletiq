import { create } from 'zustand';
import { AUTH_KEYS } from '@/utils/authKeys';

/**
 * Zustand store for managing the authenticated user's state.
 *
 * @property {object|null} user - The user object, or null if not logged in.
 * @property {boolean} isLoading - True while checking the auth status on app load.
 * @property {function} setUser - Sets the user object in the store.
 * @property {function} clearUser - Clears the user data (logs the user out).
 * @property {function} setLoading - Sets the loading state.
 */

// Initialize user from localStorage if available
const getInitialUser = () => {
  try {
    const storedUser = localStorage.getItem(AUTH_KEYS.USER);
    const storedToken = localStorage.getItem(AUTH_KEYS.TOKEN);
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      return { user, isAuthenticated: true };
    }
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
  }
  return { user: null, isAuthenticated: false };
};

const initialState = getInitialUser();

const useUserStore = create((set, get) => ({
  user: initialState.user,
  isAuthenticated: initialState.isAuthenticated,
  isLoading: false, // Start with loading false - no auto-login check
  
  // Action to set the user in the store (e.g., after login)
  setUser: (user) => {
    const isAuthenticated = !!(user && localStorage.getItem(AUTH_KEYS.TOKEN));
    set({ user, isAuthenticated, isLoading: false });
  },

  // Action to clear the user from the store (e.g., after logout)
  clearUser: () => {
    localStorage.removeItem(AUTH_KEYS.USER);
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  // Action to manually control the loading state
  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useUserStore;