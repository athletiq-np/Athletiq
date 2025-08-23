/**
 * Error Notification Component
 * 
 * Displays error messages to users with appropriate styling and actions
 */

import React from 'react';
import { ERROR_TYPES } from '@/utils/errorHandler';

/**
 * Error notification component with different styles based on error type
 */
export const ErrorNotification = ({ 
  error, 
  onClose, 
  showRetry = false, 
  onRetry,
  className = '' 
}) => {
  if (!error) return null;

  const getErrorStyle = (errorType) => {
    const baseClasses = 'p-4 rounded-md border-l-4 mb-4';
    
    switch (errorType) {
      case ERROR_TYPES.NETWORK:
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-800`;
      case ERROR_TYPES.AUTHENTICATION:
        return `${baseClasses} bg-red-50 border-red-400 text-red-800`;
      case ERROR_TYPES.AUTHORIZATION:
        return `${baseClasses} bg-orange-50 border-orange-400 text-orange-800`;
      case ERROR_TYPES.VALIDATION:
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-800`;
      case ERROR_TYPES.CSRF:
        return `${baseClasses} bg-purple-50 border-purple-400 text-purple-800`;
      case ERROR_TYPES.SERVER:
        return `${baseClasses} bg-red-50 border-red-400 text-red-800`;
      case ERROR_TYPES.RATE_LIMIT:
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-400 text-gray-800`;
    }
  };

  const getErrorIcon = (errorType) => {
    switch (errorType) {
      case ERROR_TYPES.NETWORK:
        return '🌐';
      case ERROR_TYPES.AUTHENTICATION:
        return '🔒';
      case ERROR_TYPES.AUTHORIZATION:
        return '⛔';
      case ERROR_TYPES.VALIDATION:
        return '⚠️';
      case ERROR_TYPES.CSRF:
        return '🛡️';
      case ERROR_TYPES.SERVER:
        return '🔧';
      case ERROR_TYPES.RATE_LIMIT:
        return '⏱️';
      default:
        return '❌';
    }
  };

  const shouldShowRetry = (errorType) => {
    return showRetry && (
      errorType === ERROR_TYPES.NETWORK ||
      errorType === ERROR_TYPES.SERVER ||
      errorType === ERROR_TYPES.CSRF
    );
  };

  return (
    <div className={`${getErrorStyle(error.type)} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 text-lg">
          {getErrorIcon(error.type)}
        </div>
        <div className="flex-1">
          <h3 className="font-medium mb-1">
            {error.type === ERROR_TYPES.NETWORK && 'Connection Error'}
            {error.type === ERROR_TYPES.AUTHENTICATION && 'Authentication Required'}
            {error.type === ERROR_TYPES.AUTHORIZATION && 'Access Denied'}
            {error.type === ERROR_TYPES.VALIDATION && 'Validation Error'}
            {error.type === ERROR_TYPES.CSRF && 'Security Error'}
            {error.type === ERROR_TYPES.SERVER && 'Server Error'}
            {error.type === ERROR_TYPES.RATE_LIMIT && 'Rate Limited'}
            {!Object.values(ERROR_TYPES).includes(error.type) && 'Error'}
          </h3>
          <p className="text-sm">
            {error.getUserMessage()}
          </p>
          
          {/* Show validation details if available */}
          {error.type === ERROR_TYPES.VALIDATION && error.details && (
            <div className="mt-2">
              <ul className="text-sm list-disc list-inside">
                {Object.entries(error.details).map(([field, messages]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {Array.isArray(messages) ? messages.join(', ') : messages}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex-shrink-0 ml-3 flex space-x-2">
          {/* Retry button for retryable errors */}
          {shouldShowRetry(error.type) && onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium underline hover:no-underline focus:outline-none"
            >
              Retry
            </button>
          )}
          
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-sm font-medium underline hover:no-underline focus:outline-none"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Success notification component
 */
export const SuccessNotification = ({ 
  message, 
  onClose, 
  className = '' 
}) => {
  if (!message) return null;

  return (
    <div className={`p-4 rounded-md border-l-4 bg-green-50 border-green-400 text-green-800 mb-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 text-lg">
          ✅
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {message}
          </p>
        </div>
        {onClose && (
          <div className="flex-shrink-0 ml-3">
            <button
              onClick={onClose}
              className="text-sm font-medium underline hover:no-underline focus:outline-none"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Field error component for form inputs
 */
export const FieldError = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`text-red-600 text-sm mt-1 ${className}`}>
      {error}
    </div>
  );
};

/**
 * Loading state component with error handling
 */
export const LoadingWithError = ({ 
  isLoading, 
  error, 
  onRetry, 
  children, 
  loadingText = 'Loading...',
  className = '' 
}) => {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorNotification 
          error={error} 
          showRetry={true} 
          onRetry={onRetry}
        />
      </div>
    );
  }

  return children;
};

export default ErrorNotification;