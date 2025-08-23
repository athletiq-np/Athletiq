// Base URL for development - proxy will handle forwarding to Django
// In development, requests go to React dev server proxy at /api
// In production, this should be the full Django API URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api`
  : '/api'; // Use proxy in development

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    CSRF: '/auth/csrf',
    // Unified authentication endpoints
    UNIFIED_LOGIN: '/auth/unified/login',
    UNIFIED_LOGOUT: '/auth/unified/logout',
    UNIFIED_USER_TYPE: '/auth/unified/user-type',
    UNIFIED_VERIFY: '/auth/unified/verify',
  },
  ATHLETES: {
    BASE: '/athletes',
    SEARCH: '/athletes/search',
    REGISTER: '/athletes',
    STATS: (id) => `/athletes/${id}/stats`,
    DOCUMENTS: (id) => `/athletes/${id}/documents`,
    BULK_IMPORT: '/athletes/bulk-create',
  },
  TOURNAMENTS: {
    BASE: '/tournaments/',
    UPCOMING: '/tournaments/upcoming',
    FEATURED: '/tournaments/featured',
    MY_TOURNAMENTS: '/tournaments/my-tournaments',
    REGISTER: (id) => `/tournaments/${id}/register_team`,
    TEAMS: (id) => `/tournaments/${id}/teams`,
    DASHBOARD: (id) => `/tournaments/${id}/dashboard`,
    BRACKET: (id) => `/tournaments/${id}/bracket`,
    MATCHES: (id) => `/tournaments/${id}/matches`,
    STATS: (id) => `/tournaments/${id}/stats`,
    ACTIVITY: (id) => `/tournaments/${id}/activity`,
  },
  SCHOOLS: {
    BASE: '/schools/',
    REGISTER: '/schools/register/',
    ME: '/schools/me/',
    MY_TOURNAMENTS: '/schools/me/tournaments/',
    MY_ATHLETES: '/schools/me/athletes/',
    MY_TOURNAMENT_STATS: '/schools/me/tournament-stats/',
    HOUSES: '/schools/houses/',
    STAFF: '/schools/staff/',
    NOTIFICATIONS: '/schools/notifications/',
    ACTIVITIES: '/schools/activities/',
  },
  GUARDIAN: {
    AUTH_LOGIN: '/guardian/auth/login',
    AUTH_REGISTER: '/guardian/auth/register',
    PROFILE: '/guardian/profile',
    ATHLETES: '/guardian/athletes',
    CLAIM_ATHLETE: '/guardian/athletes/claim',
    NOTIFICATIONS: '/guardian/notifications',
  },
  DOCUMENTS: {
    UPLOAD: '/documents/upload',
    DOWNLOAD: (id) => `/documents/${id}/download`,
  },
};

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  WITH_CREDENTIALS: true,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const AUTH_CONFIG = {
  // Token storage keys
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_DATA_KEY: 'user_data',
  
  // Token expiration buffer in seconds
  TOKEN_EXPIRY_BUFFER: 300, // 5 minutes
  
  // Token types for API requests
  TOKEN_TYPE: 'Bearer',
  
  // Auth endpoints
  ENDPOINTS: {
    LOGIN: '/auth/unified/login',
    LOGOUT: '/auth/unified/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/unified/verify',
    USER_TYPE: '/auth/unified/user-type'
  }
};
