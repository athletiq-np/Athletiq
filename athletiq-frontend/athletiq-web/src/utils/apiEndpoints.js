// API Endpoints Registry
// Centralized endpoint definitions for better organization and maintenance

/**
 * Base API configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

/**
 * API Endpoints Registry
 * Organized by feature/module for easy maintenance
 */
export const API_ENDPOINTS = {
  // Authentication & User Management
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Health & System Status
  HEALTH: {
    STATUS: '/health',
    STATS: '/health/stats',
    DETAILED: '/health/detailed',
  },

  // Admin Dashboard Endpoints
  ADMIN: {
    // Core admin endpoints
    DASHBOARD: '/admin/dashboard',
    STATS: '/admin/stats',
    
    // User management
    USERS: '/admin/users',
    USER_BY_ID: (id) => `/admin/users/${id}`,
    
    // System management
    SYSTEM_HEALTH: '/admin/system/health',
    SYSTEM_METRICS: '/admin/system/metrics',
    SYSTEM_ALERTS: '/admin/system/alerts',
    
    // Data exports
    EXPORT_USERS: '/admin/export/users',
    EXPORT_SCHOOLS: '/admin/export/schools',
    EXPORT_TOURNAMENTS: '/admin/export/tournaments',
  },

  // School Management
  SCHOOLS: {
    // School profile
    LIST: '/schools',
    CREATE: '/schools',
    MY_PROFILE: '/schools/me',
    BY_ID: (id) => `/schools/${id}`,
    UPDATE: (id) => `/schools/${id}`,
    DELETE: (id) => `/schools/${id}`,
    
    // School dashboard
    DASHBOARD: '/schools/me/dashboard',
    STATS: '/schools/me/stats',
    TOURNAMENT_STATS: '/schools/me/tournament-stats',
    
    // Student/Athlete management
    ATHLETES: '/schools/me/athletes',
    ADD_ATHLETE: '/schools/me/athletes',
    ATHLETE_BY_ID: (id) => `/schools/me/athletes/${id}`,
    UPDATE_ATHLETE: (id) => `/schools/me/athletes/${id}`,
    DELETE_ATHLETE: (id) => `/schools/me/athletes/${id}`,
    
    // Team management
    TEAMS: '/schools/me/teams',
    CREATE_TEAM: '/schools/me/teams',
    TEAM_BY_ID: (id) => `/schools/me/teams/${id}`,
    TEAM_PLAYERS: (teamId) => `/schools/me/teams/${teamId}/players`,
    ADD_TEAM_PLAYER: (teamId) => `/schools/me/teams/${teamId}/players`,
    REMOVE_TEAM_PLAYER: (teamId, playerId) => `/schools/me/teams/${teamId}/players/${playerId}`,
    
    // House management
    HOUSES: '/schools/houses',
    CREATE_HOUSE: '/schools/houses',
    HOUSE_BY_ID: (id) => `/schools/houses/${id}`,
    
    // Staff management
    STAFF: '/schools/staff',
    ADD_STAFF: '/schools/staff',
    STAFF_BY_ID: (id) => `/schools/staff/${id}`,
    
    // School tournaments
    TOURNAMENTS: '/schools/me/tournaments',
    CREATE_TOURNAMENT: '/schools/me/tournaments',
    
    // Notifications & Activities
    NOTIFICATIONS: '/schools/notifications',
    ACTIVITIES: '/schools/activities',
    
    // Bulk operations
    BULK_IMPORT: '/schools/me/bulk-import',
    BULK_STUDENTS: '/schools/me/bulk-students',
  },

  // Athletes/Players Management
  ATHLETES: {
    LIST: '/athletes',
    CREATE: '/athletes',
    BY_ID: (id) => `/athletes/${id}`,
    UPDATE: (id) => `/athletes/${id}`,
    DELETE: (id) => `/athletes/${id}`,
    SEARCH: '/athletes/search',
    STATS: '/athletes/stats',
    EXPORT: '/athletes/export',
  },

  // Tournament Management
  TOURNAMENTS: {
    LIST: '/tournaments',
    CREATE: '/tournaments',
    BY_ID: (id) => `/tournaments/${id}`,
    UPDATE: (id) => `/tournaments/${id}`,
    DELETE: (id) => `/tournaments/${id}`,
    SEARCH: '/tournaments/search',
    STATS: '/tournaments/stats',
    
    // Tournament specific operations
    REGISTER: (id) => `/tournaments/${id}/register`,
    PARTICIPANTS: (id) => `/tournaments/${id}/participants`,
    BRACKETS: (id) => `/tournaments/${id}/brackets`,
    MATCHES: (id) => `/tournaments/${id}/matches`,
    RESULTS: (id) => `/tournaments/${id}/results`,
    
    // Certificates
    CERTIFICATES: (id) => `/tournaments/${id}/certificates`,
    CERTIFICATE_STATS: (id) => `/tournaments/${id}/certificates/stats`,
    GENERATE_CERTIFICATE: (id) => `/tournaments/${id}/certificates/generate`,
  },

  // Guardian Portal Endpoints
  GUARDIAN: {
    // Authentication
    LOGIN: '/guardian/login',
    REGISTER: '/guardian/register',
    SIMPLIFIED_REGISTER: '/guardian/simplified-register',
    PROFILE: '/guardian/profile',
    UPDATE_PROFILE: '/guardian/profile',
    
    // Athletes management (standardized naming)
    ATHLETES: '/guardian/athletes',
    ADD_ATHLETE: '/guardian/add-athlete',
    ATHLETE_STATUS: (id) => `/guardian/athlete/${id}/status`,
    ATHLETE_TIMELINE: (id) => `/guardian/athletes/${id}/timeline`,
    ATHLETE_ACTION: (id) => `/guardian/athletes/${id}/action`,
    
    // Legacy endpoints (for backward compatibility)
    CHILDREN: '/guardian/children',
    ADD_CHILD: '/guardian/add-child',
    CHILD_BY_ID: (id) => `/guardian/children/${id}`,
    UPDATE_CHILD: (id) => `/guardian/children/${id}`,
    
    // School search and management
    SCHOOLS: '/guardian/schools',
    SEARCH_SCHOOLS: '/guardian/schools/search',
    
    // Documents and OCR
    UPLOAD_DOCUMENT: '/guardian/documents/upload',
    UPLOAD_OCR: '/guardian/documents/upload-ocr',
    PROCESS_BIRTH_CERTIFICATE: '/guardian/process-birth-certificate',
    
    // Notifications
    NOTIFICATIONS: '/guardian/notifications',
    MARK_NOTIFICATION_READ: (id) => `/guardian/notifications/${id}/read`,
  },

  // Document Management
  DOCUMENTS: {
    UPLOAD: '/documents/upload',
    BY_ID: (id) => `/documents/${id}`,
    DELETE: (id) => `/documents/${id}`,
    PROCESS_OCR: '/documents/process-ocr',
    VERIFY: '/documents/verify',
  },

  // Certificate Management
  CERTIFICATES: {
    LIST: '/certificates',
    BY_ID: (id) => `/certificates/${id}`,
    GENERATE: '/certificates/generate',
    DOWNLOAD: (id) => `/certificates/${id}/download`,
    VERIFY: (code) => `/certificates/verify/${code}`,
    TEMPLATES: '/certificates/templates',
    CREATE_TEMPLATE: '/certificates/templates',
    UPDATE_TEMPLATE: (id) => `/certificates/templates/${id}`,
    DELETE_TEMPLATE: (id) => `/certificates/templates/${id}`,
  },

  // Analytics & Reporting
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    PERFORMANCE: '/analytics/performance',
    USAGE: '/analytics/usage',
    SEARCH: '/analytics/search',
    EXPORT: '/analytics/export',
  },

  // Enterprise Features
  ENTERPRISE: {
    DASHBOARD: '/enterprise/dashboard',
    HEALTH: '/enterprise/health',
    METRICS: '/enterprise/metrics',
    ALERTS: '/enterprise/alerts',
    SCHOOLS_ANALYTICS: '/enterprise/schools/analytics',
    PERFORMANCE: '/enterprise/performance',
  },

  // Monitoring & System
  MONITORING: {
    API_HEALTH: '/monitoring/api-health',
    PERFORMANCE: '/monitoring/performance',
    ERRORS: '/monitoring/errors',
    USAGE: '/monitoring/usage',
  },

  // Matches & Scoresheet
  MATCHES: {
    LIST: '/matches',
    BY_ID: (id) => `/matches/${id}`,
    BY_ATHLETE: (athleteId) => `/matches/by-athlete/${athleteId}`,
    BY_TOURNAMENT: (tournamentId) => `/matches/by-tournament/${tournamentId}`,
    CREATE: '/matches',
    UPDATE: (id) => `/matches/${id}`,
    SCORESHEET: (id) => `/matches/${id}/scoresheet`,
  },

  // PDF & Document Generation
  PDF: {
    GENERATE_SCORESHEET: '/pdf/scoresheet',
    GENERATE_CERTIFICATE: '/pdf/certificate',
    GENERATE_REPORT: '/pdf/report',
    TEMPLATES: '/pdf/templates',
  },

  // File Upload & OCR
  UPLOAD: {
    FILE: '/upload/file',
    IMAGE: '/upload/image',
    DOCUMENT: '/upload/document',
    BULK: '/upload/bulk',
    OCR_PROCESS: '/upload/ocr-process',
  },

  // Nepal Athlete Monitoring (Specialized)
  NEPAL_ATHLETE: {
    MONITOR: '/nepal-athlete/monitor',
    PERFORMANCE: '/nepal-athlete/performance',
    CAPACITY: '/nepal-athlete/capacity',
    QUALITY: '/nepal-athlete/quality',
    ANALYTICS: '/nepal-athlete/analytics',
    REAL_TIME: '/nepal-athlete/real-time',
  },
};

/**
 * Helper function to build endpoint with parameters
 * @param {string} endpoint - Endpoint template
 * @param {object} params - Parameters to replace in template
 * @returns {string} Complete endpoint URL
 */
export const buildEndpoint = (endpoint, params = {}) => {
  let builtEndpoint = endpoint;
  
  // Replace URL parameters
  Object.entries(params).forEach(([key, value]) => {
    builtEndpoint = builtEndpoint.replace(`:${key}`, value);
  });
  
  return builtEndpoint;
};

/**
 * Helper function to build query string
 * @param {object} params - Query parameters
 * @returns {string} Query string
 */
export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Complete endpoint with query parameters
 * @param {string} endpoint - Base endpoint
 * @param {object} queryParams - Query parameters
 * @returns {string} Complete endpoint with query string
 */
export const completeEndpoint = (endpoint, queryParams = {}) => {
  return `${endpoint}${buildQueryString(queryParams)}`;
};

export default API_ENDPOINTS;
