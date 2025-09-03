// src/components/features/admin/LoadingStates.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaUserGraduate, FaSchool, FaTrophy, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { MdAnalytics } from 'react-icons/md';

/**
 * 🔄 Enhanced Loading States Component
 * - Professional loading animations
 * - Context-aware loading skeletons
 * - Performance optimized
 * - Accessibility compliant
 * - Dark mode support
 */

// Main dashboard loading state
export function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-athletiq-green/20 border-t-athletiq-green rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-athletiq-green/80 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Loading Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we fetch your data...
        </p>
        <div className="mt-4 flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-athletiq-green rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Stats cards loading skeleton
export function StatsCardsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Table loading skeleton
export function TableLoading({ rows = 5, columns = 6 }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Card content loading
export function CardLoading({ title, rows = 3 }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          {title ? (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          ) : (
            <div className="w-32 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          )}
        </div>
        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab-specific loading states
export function TabLoading({ tabType }) {
  const getTabIcon = () => {
    switch (tabType) {
      case 'players': return FaUserGraduate;
      case 'schools': return FaSchool;
      case 'tournaments': return FaTrophy;
      case 'organizations': return FaUsers;
      case 'guardians': return FaUsers;
      case 'analytics': return MdAnalytics;
      default: return FaCalendarAlt;
    }
  };

  const Icon = getTabIcon();

  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Icon className="w-8 h-8 text-athletiq-green animate-pulse" />
          <div>
            <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex space-x-3">
          <div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Search and filter skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        <div className="w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
      </div>

      {/* Content skeleton */}
      <TableLoading />
    </div>
  );
}

// Inline loading spinner
export function InlineLoading({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <FaSpinner className={`${sizeClasses[size]} text-athletiq-green animate-spin`} />
    </div>
  );
}

// Pulse loading effect for buttons
export function ButtonLoading({ children, loading, ...props }) {
  return (
    <button {...props} disabled={loading}>
      <div className="flex items-center justify-center space-x-2">
        {loading && <FaSpinner className="w-4 h-4 animate-spin" />}
        <span>{children}</span>
      </div>
    </button>
  );
}

// Progress bar loading
export function ProgressLoading({ progress = 0, label = 'Loading...' }) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className="bg-athletiq-green h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

// Skeleton list component
export function SkeletonList({ items = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </motion.div>
      ))}
    </div>
  );
}

export default {
  DashboardLoading,
  StatsCardsLoading,
  TableLoading,
  CardLoading,
  TabLoading,
  InlineLoading,
  ButtonLoading,
  ProgressLoading,
  SkeletonList
};