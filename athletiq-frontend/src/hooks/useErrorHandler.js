/**
 * React Hook for Consistent Error Handling
 * 
 * Provides a standardized way to handle API errors in React components
 * with proper user feedback and state management.
 */

import { useState, useCallback } from 'react';
import { 
  handleApiError, 
  ApiError, 
  ERROR_TYPES, 
  extractFieldErrors,
  showErrorNotification,
  showSuccessNotification 
} from '@/utils/errorHandler';

/**
 * Custom hook for handling API errors in components
 */
export const useErrorHandler = (options = {}) => {
  const {
    showNotifications = true,
    logErrors = true,
    redirectOnAuth = true,
    defaultErrorMessage = 'An unexpected error occurred'
  } = options;

  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle API error with proper state updates and user feedback
   */
  const handleError = useCallback((error, customMessage = null) => {
    const apiError = handleApiError(error, {
      showNotification: showNotifications,
      logError: logErrors,
      redirectOnAuth,
      customMessage
    });

    // Update component state
    setError(apiError);
    
    // Extract field errors for form validation
    const validationErrors = extractFieldErrors(apiError);
    setFieldErrors(validationErrors);

    return apiError;
  }, [showNotifications, logErrors, redirectOnAuth]);

  /**
   * Clear all error states
   */
  const clearError = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  /**
   * Clear specific field error
   */
  const clearFieldError = useCallback((fieldName) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Execute async operation with error handling
   */
  const executeWithErrorHandling = useCallback(async (asyncFn, options = {}) => {
    const { 
      loadingState = true, 
      clearPreviousErrors = true,
      successMessage = null,
      errorMessage = null 
    } = options;

    if (clearPreviousErrors) {
      clearError();
    }

    if (loadingState) {
      setIsLoading(true);
    }

    try {
      const result = await asyncFn();
      
      if (successMessage) {
        showSuccessNotification(successMessage);
      }
      
      return result;
    } catch (error) {
      handleError(error, errorMessage);
      throw error; // Re-throw so caller can handle if needed
    } finally {
      if (loadingState) {
        setIsLoading(false);
      }
    }
  }, [handleError, clearError]);

  /**
   * Get error message for display
   */
  const getErrorMessage = useCallback(() => {
    if (!error) return null;
    return error.getUserMessage() || defaultErrorMessage;
  }, [error, defaultErrorMessage]);

  /**
   * Get field error message
   */
  const getFieldError = useCallback((fieldName) => {
    return fieldErrors[fieldName] || null;
  }, [fieldErrors]);

  /**
   * Check if there are any errors
   */
  const hasError = useCallback(() => {
    return error !== null;
  }, [error]);

  /**
   * Check if there are field errors
   */
  const hasFieldErrors = useCallback(() => {
    return Object.keys(fieldErrors).length > 0;
  }, [fieldErrors]);

  /**
   * Check if error is of specific type
   */
  const isErrorType = useCallback((errorType) => {
    return error && error.type === errorType;
  }, [error]);

  return {
    // State
    error,
    fieldErrors,
    isLoading,
    
    // Actions
    handleError,
    clearError,
    clearFieldError,
    executeWithErrorHandling,
    
    // Getters
    getErrorMessage,
    getFieldError,
    hasError,
    hasFieldErrors,
    isErrorType,
    
    // Convenience checks
    isNetworkError: () => isErrorType(ERROR_TYPES.NETWORK),
    isAuthError: () => isErrorType(ERROR_TYPES.AUTHENTICATION),
    isValidationError: () => isErrorType(ERROR_TYPES.VALIDATION),
    isCsrfError: () => isErrorType(ERROR_TYPES.CSRF),
    isServerError: () => isErrorType(ERROR_TYPES.SERVER)
  };
};

/**
 * Hook for form error handling with field-specific validation
 */
export const useFormErrorHandler = (options = {}) => {
  const errorHandler = useErrorHandler(options);
  
  /**
   * Handle form submission with error handling
   */
  const handleFormSubmit = useCallback(async (submitFn, options = {}) => {
    return errorHandler.executeWithErrorHandling(submitFn, {
      clearPreviousErrors: true,
      loadingState: true,
      ...options
    });
  }, [errorHandler]);

  /**
   * Get form field props for error display
   */
  const getFieldProps = useCallback((fieldName) => {
    const hasError = !!errorHandler.getFieldError(fieldName);
    const errorMessage = errorHandler.getFieldError(fieldName);
    
    return {
      error: hasError,
      helperText: errorMessage,
      onChange: (e) => {
        // Clear field error when user starts typing
        if (hasError) {
          errorHandler.clearFieldError(fieldName);
        }
      }
    };
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleFormSubmit,
    getFieldProps
  };
};

/**
 * Hook for API call error handling with retry functionality
 */
export const useApiErrorHandler = (options = {}) => {
  const errorHandler = useErrorHandler(options);
  const [retryCount, setRetryCount] = useState(0);
  
  /**
   * Execute API call with retry functionality
   */
  const executeApiCall = useCallback(async (apiCall, options = {}) => {
    const { 
      maxRetries = 3, 
      retryDelay = 1000,
      retryCondition = (error) => error.type === ERROR_TYPES.NETWORK || error.type === ERROR_TYPES.SERVER,
      ...executeOptions 
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        setRetryCount(attempt);
        return await errorHandler.executeWithErrorHandling(apiCall, executeOptions);
      } catch (error) {
        lastError = error;
        
        // Don't retry on last attempt or if retry condition not met
        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
    
    throw lastError;
  }, [errorHandler]);

  return {
    ...errorHandler,
    executeApiCall,
    retryCount
  };
};

export default useErrorHandler;