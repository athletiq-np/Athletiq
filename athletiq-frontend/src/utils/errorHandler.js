/**
 * Centralized Error Handling for Django REST Framework Responses
 * 
 * This module provides consistent error handling for all API responses
 * from the Django backend, including CSRF token management and user feedback.
 */

import { API_CONFIG, AUTH_CONFIG, API_ENDPOINTS } from '@/config/api.config';

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION', 
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  CSRF: 'CSRF',
  SERVER: 'SERVER',
  RATE_LIMIT: 'RATE_LIMIT',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN: 'UNKNOWN'
};

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Unable to connect to the server. Please check your internet connection.',
  [ERROR_TYPES.AUTHENTICATION]: 'Your session has expired. Please log in again.',
  [ERROR_TYPES.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
  [ERROR_TYPES.CSRF]: 'Security token expired. Please refresh the page.',
  [ERROR_TYPES.SERVER]: 'An unexpected server error occurred. Please try again later.',
  [ERROR_TYPES.RATE_LIMIT]: 'Too many requests. Please wait a moment and try again.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Standardized API Error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, status = null, details = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.details = details;
    this.originalError = originalError;
    this.isApiError = true;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    return this.message || ERROR_MESSAGES[this.type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  }

  /**
   * Get validation errors for forms
   */
  getValidationErrors() {
    if (this.type === ERROR_TYPES.VALIDATION && this.details) {
      return this.details;
    }
    return null;
  }

  /**
   * Check if error requires authentication
   */
  requiresAuth() {
    return this.type === ERROR_TYPES.AUTHENTICATION;
  }

  /**
   * Check if error is a CSRF token issue
   */
  isCsrfError() {
    return this.type === ERROR_TYPES.CSRF;
  }

  /**
   * Convert to plain object for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      status: this.status,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Parse Django REST Framework error response
 */
export const parseDjangoError = (error) => {
  // Network error (no response)
  if (!error.response) {
    return new ApiError(
      ERROR_MESSAGES[ERROR_TYPES.NETWORK],
      ERROR_TYPES.NETWORK,
      null,
      null,
      error
    );
  }

  const { status, data } = error.response;
  let errorType = ERROR_TYPES.UNKNOWN;
  let message = ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  let details = null;

  // Categorize error by status code
  switch (status) {
    case 400: // Bad Request
      errorType = ERROR_TYPES.VALIDATION;
      message = data?.detail || data?.message || 'Invalid request data';
      details = data?.errors || data?.non_field_errors || data;
      break;

    case 401: // Unauthorized
      errorType = ERROR_TYPES.AUTHENTICATION;
      message = data?.detail || data?.message || ERROR_MESSAGES[ERROR_TYPES.AUTHENTICATION];
      break;

    case 403: // Forbidden
      // Check if it's a CSRF error
      if (data?.detail?.includes('CSRF') || data?.message?.includes('CSRF') || 
          data?.code === 'csrf_failed' || error.config?.url?.includes('csrf')) {
        errorType = ERROR_TYPES.CSRF;
        message = ERROR_MESSAGES[ERROR_TYPES.CSRF];
      } else {
        errorType = ERROR_TYPES.AUTHORIZATION;
        message = data?.detail || data?.message || ERROR_MESSAGES[ERROR_TYPES.AUTHORIZATION];
      }
      break;

    case 404: // Not Found
      errorType = ERROR_TYPES.NOT_FOUND;
      message = data?.detail || data?.message || ERROR_MESSAGES[ERROR_TYPES.NOT_FOUND];
      break;

    case 429: // Too Many Requests
      errorType = ERROR_TYPES.RATE_LIMIT;
      message = data?.detail || data?.message || ERROR_MESSAGES[ERROR_TYPES.RATE_LIMIT];
      break;

    case 500: // Internal Server Error
    case 502: // Bad Gateway
    case 503: // Service Unavailable
    case 504: // Gateway Timeout
      errorType = ERROR_TYPES.SERVER;
      message = data?.detail || data?.message || ERROR_MESSAGES[ERROR_TYPES.SERVER];
      break;

    default:
      errorType = ERROR_TYPES.UNKNOWN;
      message = data?.detail || data?.message || `HTTP ${status} Error`;
  }

  return new ApiError(message, errorType, status, details, error);
};

/**
 * Handle API errors with appropriate user feedback and actions
 */
export const handleApiError = (error, options = {}) => {
  const {
    showNotification = true,
    logError = true,
    redirectOnAuth = true,
    customMessage = null
  } = options;

  // Parse the error
  const apiError = error instanceof ApiError ? error : parseDjangoError(error);

  // Log error for debugging
  if (logError) {
    console.error('API Error:', apiError.toJSON());
  }

  // Handle authentication errors
  if (apiError.requiresAuth() && redirectOnAuth) {
    clearAuthData();
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/login?error=session_expired';
    }
  }

  // Show user notification if requested
  if (showNotification) {
    const message = customMessage || apiError.getUserMessage();
    showErrorNotification(message, apiError.type);
  }

  return apiError;
};

/**
 * Show error notification to user
 * This can be customized based on your notification system
 */
export const showErrorNotification = (message, type = ERROR_TYPES.UNKNOWN) => {
  // Log to console for debugging
  console.error(`[${type}] ${message}`);
  
  // Create a simple toast notification
  createToastNotification(message, 'error', type);
  
  // You can integrate with libraries like react-toastify, antd notifications, etc.
  // Example with react-toastify:
  // import { toast } from 'react-toastify';
  // toast.error(message);
};

/**
 * Show success notification to user
 */
export const showSuccessNotification = (message) => {
  console.log(`[SUCCESS] ${message}`);
  
  // Create a simple toast notification
  createToastNotification(message, 'success');
  
  // Example with react-toastify:
  // import { toast } from 'react-toastify';
  // toast.success(message);
};

/**
 * Clear authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_DATA_KEY);
  // Clear any legacy auth data
  localStorage.removeItem('guardian-token');
  localStorage.removeItem('guardian-data');
  localStorage.removeItem('token'); // Legacy token key
};

/**
 * Format success response for consistency
 */
export const formatSuccessResponse = (data, message = 'Operation completed successfully') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Format error response for consistency
 */
export const formatErrorResponse = (error, customMessage = null) => {
  const apiError = error instanceof ApiError ? error : parseDjangoError(error);
  
  return {
    success: false,
    message: customMessage || apiError.getUserMessage(),
    error: apiError.type,
    details: apiError.details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Validate Django response format
 */
export const validateDjangoResponse = (response) => {
  // Check if response has expected Django REST framework structure
  if (!response || typeof response !== 'object') {
    throw new ApiError('Invalid response format', ERROR_TYPES.SERVER);
  }

  // Handle Django REST framework error responses
  if (response.success === false || response.error) {
    throw new ApiError(
      response.message || response.error || 'Request failed',
      ERROR_TYPES.SERVER,
      null,
      response.details || response.errors
    );
  }

  return response;
};

/**
 * Retry function for failed requests
 */
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      const apiError = error instanceof ApiError ? error : parseDjangoError(error);
      
      // Don't retry authentication or validation errors
      if (apiError.type === ERROR_TYPES.AUTHENTICATION || 
          apiError.type === ERROR_TYPES.VALIDATION ||
          apiError.type === ERROR_TYPES.AUTHORIZATION) {
        throw apiError;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw apiError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

/**
 * Extract field errors from Django validation response
 */
export const extractFieldErrors = (apiError) => {
  if (apiError.type !== ERROR_TYPES.VALIDATION || !apiError.details) {
    return {};
  }

  const fieldErrors = {};
  
  // Handle different Django error formats
  if (typeof apiError.details === 'object') {
    Object.keys(apiError.details).forEach(field => {
      const errors = apiError.details[field];
      if (Array.isArray(errors)) {
        fieldErrors[field] = errors.join(', ');
      } else if (typeof errors === 'string') {
        fieldErrors[field] = errors;
      }
    });
  }

  return fieldErrors;
};

/**
 * Simple toast notification system
 */
let toastContainer = null;

const createToastContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
};

const createToastNotification = (message, type = 'info', errorType = null) => {
  const container = createToastContainer();
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#dcfce7' : '#e0f2fe'};
    border: 1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : '#bae6fd'};
    border-left: 4px solid ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
    color: ${type === 'error' ? '#991b1b' : type === 'success' ? '#166534' : '#1e40af'};
    padding: 12px 16px;
    margin-bottom: 8px;
    border-radius: 6px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    word-wrap: break-word;
    pointer-events: auto;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateX(100%);
  `;
  
  toast.innerHTML = `
    <div style="display: flex; align-items: flex-start;">
      <span style="margin-right: 8px; font-size: 16px;">
        ${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}
      </span>
      <div style="flex: 1;">
        <div style="font-weight: 500; margin-bottom: 2px;">
          ${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}
        </div>
        <div style="font-size: 14px;">${message}</div>
      </div>
      <button style="margin-left: 8px; background: none; border: none; font-size: 18px; cursor: pointer; color: inherit; opacity: 0.7;" onclick="this.parentElement.parentElement.remove()">
        ×
      </button>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove after 5 seconds (longer for errors)
  const duration = type === 'error' ? 8000 : 5000;
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }
  }, duration);
  
  // Click to dismiss
  toast.addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  });
};

export default {
  ApiError,
  ERROR_TYPES,
  ERROR_MESSAGES,
  parseDjangoError,
  handleApiError,
  showErrorNotification,
  showSuccessNotification,
  clearAuthData,
  formatSuccessResponse,
  formatErrorResponse,
  validateDjangoResponse,
  retryRequest,
  extractFieldErrors
};