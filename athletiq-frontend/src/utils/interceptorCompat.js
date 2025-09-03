/**
 * Interceptor Compatibility Layer
 * Provides fallback for any legacy code that might try to access interceptors
 */

// If there's any global api object that legacy code expects
if (typeof window !== 'undefined') {
  // Check if there's any global API object that might need interceptor compatibility
  window.api = window.api || {};
  
  // Add a no-op interceptors object to prevent errors
  if (!window.api.interceptors) {
    window.api.interceptors = {
      request: {
        use: () => {},
        eject: () => {},
      },
      response: {
        use: () => {},
        eject: () => {},
      },
    };
  }
}

export const interceptorCompat = {
  // No-op interceptor methods for compatibility
  request: {
    use: () => {},
    eject: () => {},
  },
  response: {
    use: () => {},
    eject: () => {},
  },
};

export default interceptorCompat;