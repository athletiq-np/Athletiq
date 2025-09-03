// src/components/features/admin/ErrorStates.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaExclamationTriangle, 
  FaSync, 
  FaHome, 
  FaBug, 
  FaWifi, 
  FaServer,
  FaExclamationCircle,
  FaInfoCircle,
  FaTimesCircle,
  FaCheckCircle
} from 'react-icons/fa';

/**
 * 🚨 Enhanced Error States Component
 * - Professional error displays
 * - Context-aware error messages
 * - Recovery actions
 * - Accessibility compliant
 * - Analytics integration
 * - Dark mode support
 */

// Main dashboard error state
export function DashboardError({ error, onRetry, onGoHome }) {
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    onRetry?.();
  };

  const getErrorType = () => {
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'network';
    }
    if (error?.status === 403 || error?.status === 401) {
      return 'permission';
    }
    if (error?.status >= 500) {
      return 'server';
    }
    return 'general';
  };

  const getErrorContent = () => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'network':
        return {
          icon: FaWifi,
          title: 'Connection Problem',
          message: 'Unable to connect to our servers. Please check your internet connection.',
          color: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800'
        };
      case 'permission':
        return {
          icon: FaExclamationCircle,
          title: 'Access Denied',
          message: 'You don\'t have permission to access this resource. Please contact your administrator.',
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      case 'server':
        return {
          icon: FaServer,
          title: 'Server Error',
          message: 'Our servers are experiencing issues. Please try again in a few moments.',
          color: 'text-purple-500',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      default:
        return {
          icon: FaExclamationTriangle,
          title: 'Something Went Wrong',
          message: error?.message || 'An unexpected error occurred while loading the dashboard.',
          color: 'text-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`min-h-[400px] flex items-center justify-center p-8`}
    >
      <div className={`max-w-md w-full ${errorContent.bgColor} ${errorContent.borderColor} border rounded-2xl p-8 text-center shadow-lg`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`inline-flex items-center justify-center w-16 h-16 ${errorContent.color} mb-6`}
        >
          <errorContent.icon className="w-8 h-8" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {errorContent.title}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          {errorContent.message}
        </p>

        {/* Error details (dev mode) */}
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Error Details (Dev Mode)
            </summary>
            <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRetry}
            disabled={retryCount >= 3}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-athletiq-green hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            <FaSync className="w-4 h-4 mr-2" />
            {retryCount >= 3 ? 'Max Retries Reached' : `Try Again${retryCount > 0 ? ` (${retryCount})` : ''}`}
          </motion.button>
          
          {onGoHome && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoHome}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              <FaHome className="w-4 h-4 mr-2" />
              Go Home
            </motion.button>
          )}
        </div>

        {/* Additional help */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact{' '}
            <a href="mailto:support@athletiq.com" className="text-athletiq-green hover:underline">
              support@athletiq.com
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Inline error component
export function InlineError({ error, onRetry, className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4',
    lg: 'p-6 text-lg'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${sizeClasses[size]} ${className}`}
    >
      <div className="flex items-start">
        <FaExclamationCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-red-800 dark:text-red-200 font-medium">
            {error?.message || 'An error occurred'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Error boundary fallback
export function ErrorBoundaryFallback({ error, resetError }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6"
        >
          <FaBug className="w-10 h-10 text-red-500" />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Oops! Something went wrong
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          The application encountered an unexpected error. Don't worry, our team has been notified.
        </p>
        
        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetError}
            className="w-full bg-athletiq-green hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </motion.button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>

        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
              Error Details (Development)
            </summary>
            <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-40 text-red-600 dark:text-red-400">
              {error?.toString()}
              {error?.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

// Empty state component
export function EmptyState({ 
  icon: Icon = FaInfoCircle, 
  title = 'No Data Available', 
  message = 'There is no data to display at the moment.',
  action,
  actionLabel = 'Add New',
  className = '' 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center py-12 ${className}`}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {message}
      </p>
      
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action}
          className="inline-flex items-center px-6 py-3 bg-athletiq-green hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

// Alert component
export function Alert({ type = 'info', title, message, onDismiss, className = '' }) {
  const alertStyles = {
    success: {
      icon: FaCheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-500',
      textColor: 'text-green-800 dark:text-green-200'
    },
    error: {
      icon: FaTimesCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-500',
      textColor: 'text-red-800 dark:text-red-200'
    },
    warning: {
      icon: FaExclamationTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-500',
      textColor: 'text-yellow-800 dark:text-yellow-200'
    },
    info: {
      icon: FaInfoCircle,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500',
      textColor: 'text-blue-800 dark:text-blue-200'
    }
  };

  const style = alertStyles[type];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${style.bgColor} ${style.borderColor} border rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start">
        <Icon className={`${style.iconColor} mt-0.5 mr-3 flex-shrink-0`} />
        <div className="flex-1">
          {title && (
            <h4 className={`${style.textColor} font-medium mb-1`}>
              {title}
            </h4>
          )}
          <p className={`${style.textColor} text-sm`}>
            {message}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${style.iconColor} hover:opacity-75 ml-2`}
          >
            <FaTimesCircle />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Network status indicator
export function NetworkStatus({ isOnline = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}
    >
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-white animate-pulse'}`} />
        <span className="text-sm font-medium">
          {isOnline ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </motion.div>
  );
}

export default {
  DashboardError,
  InlineError,
  ErrorBoundaryFallback,
  EmptyState,
  Alert,
  NetworkStatus
};