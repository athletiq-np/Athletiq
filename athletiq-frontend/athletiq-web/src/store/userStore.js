import { create } from 'zustand';

/**
 * Zustand store for managing the authenticated user's state.
 *
 * @property {object|null} user - The user object, or null if not logged in.
 * @property {boolean} isLoading - True while checking the auth status on app load.
 * @property {function} setUser - Sets the user object in the store.
 * @property {function} clearUser - Clears the user data (logs the user out).
 * @property {function} setLoading - Sets the loading state.
 */
const useUserStore = create((set) => ({
  user: null,
  isLoading: false, // Start with loading false - no auto-login check
  
  // Action to set the user in the store (e.g., after login)
  setUser: (user) => set({ user, isLoading: false }),

  // Action to clear the user from the store (e.g., after logout)
  clearUser: () => set({ user: null, isLoading: false }),

  // Action to manually control the loading state
  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useUserStore;