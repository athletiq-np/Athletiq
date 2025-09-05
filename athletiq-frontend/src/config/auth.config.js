/**
 * Unified Authentication Configuration
 * Single source of truth for all authentication-related settings
 */

// Authentication storage keys - SINGLE SOURCE OF TRUTH
export const AUTH_STORAGE = {
  TOKEN: 'athletiq_token',
  REFRESH_TOKEN: 'athletiq_refresh_token', 
  USER_DATA: 'athletiq_user',
  
  // Legacy keys for cleanup (used during migration)
  LEGACY_KEYS: [
    'auth_token',
    'auth_refresh_token', 
    'auth_user',
    'token',
    'refresh_token',
    'user',
    'guardian_token',
    'guardian_user'
  ]
};

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/unified/login',
  LOGOUT: '/auth/unified/logout', 
  REFRESH: '/auth/unified/token-refresh',
  VERIFY: '/auth/unified/verify',
  USER_TYPE: '/auth/unified/user-type',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  CSRF: '/auth/csrf'
};

// Authentication configuration
export const AUTH_CONFIG = {
  // Token settings
  TOKEN_TYPE: 'Bearer',
  TOKEN_EXPIRY_BUFFER: 300, // 5 minutes in seconds
  
  // Auto logout settings
  AUTO_LOGOUT_ON_TOKEN_EXPIRY: true,
  AUTO_REFRESH_TOKEN: true,
  
  // Session settings
  REMEMBER_USER: true,
  SESSION_CHECK_INTERVAL: 60000, // 1 minute
  
  // Redirect settings
  LOGIN_REDIRECT: '/dashboard',
  LOGOUT_REDIRECT: '/login',
  UNAUTHORIZED_REDIRECT: '/unauthorized',
  
  // Role-based redirects
  ROLE_REDIRECTS: {
    'super_admin': '/admin',
    'SuperAdmin': '/admin',
    'school_admin': '/school',
    'SchoolAdmin': '/school', 
    'athlete': '/athlete/dashboard',
    'Athlete': '/athlete/dashboard',
    'guardian': '/guardian/dashboard',
    'Guardian': '/guardian/dashboard',
    'viewer': '/viewer/dashboard',
    'Viewer': '/viewer/dashboard',
    'admin': '/admin',
    'Admin': '/admin',
    'organization': '/organization/dashboard',
    'Organization': '/organization/dashboard'
  }
};

// User roles and permissions
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  ATHLETE: 'athlete', 
  GUARDIAN: 'guardian',
  VIEWER: 'viewer',
  ORGANIZATION: 'organization'
};

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  [USER_ROLES.SUPER_ADMIN]: 5,
  [USER_ROLES.SCHOOL_ADMIN]: 4,
  [USER_ROLES.GUARDIAN]: 3,
  [USER_ROLES.ATHLETE]: 2,
  [USER_ROLES.VIEWER]: 1
};

// Permission helpers
export const hasPermission = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const isAuthorized = (userRole, allowedRoles = []) => {
  if (!allowedRoles.length) return true;
  return allowedRoles.includes(userRole);
};

// Storage utilities with cleanup
export const authStorage = {
  // Set token with cleanup of legacy keys
  setToken: (token) => {
    localStorage.setItem(AUTH_STORAGE.TOKEN, token);
    // Clean up legacy token keys
    AUTH_STORAGE.LEGACY_KEYS.forEach(key => {
      if (localStorage.getItem(key) && key !== AUTH_STORAGE.TOKEN) {
        localStorage.removeItem(key);
      }
    });
  },
  
  // Get token with fallback to legacy keys (for migration)
  getToken: () => {
    let token = localStorage.getItem(AUTH_STORAGE.TOKEN);
    if (!token) {
      // Check legacy keys for migration
      for (const key of AUTH_STORAGE.LEGACY_KEYS) {
        token = localStorage.getItem(key);
        if (token) {
          // Migrate to new key
          localStorage.setItem(AUTH_STORAGE.TOKEN, token);
          localStorage.removeItem(key);
          break;
        }
      }
    }
    return token;
  },
  
  // Set refresh token with cleanup
  setRefreshToken: (token) => {
    localStorage.setItem(AUTH_STORAGE.REFRESH_TOKEN, token);
  },
  
  // Get refresh token
  getRefreshToken: () => {
    return localStorage.getItem(AUTH_STORAGE.REFRESH_TOKEN);
  },
  
  // Set user data with cleanup
  setUserData: (userData) => {
    localStorage.setItem(AUTH_STORAGE.USER_DATA, JSON.stringify(userData));
  },
  
  // Get user data
  getUserData: () => {
    const userData = localStorage.getItem(AUTH_STORAGE.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  },
  
  // Clear all auth data
  clearAll: () => {
    // Clear main keys
    localStorage.removeItem(AUTH_STORAGE.TOKEN);
    localStorage.removeItem(AUTH_STORAGE.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_STORAGE.USER_DATA);
    
    // Clear legacy keys
    AUTH_STORAGE.LEGACY_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = authStorage.getToken();
    const userData = authStorage.getUserData();
    return !!(token && userData);
  }
};