// src/components/features/admin/InteractiveFeatures.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaSort, 
  FaDownload, 
  FaUpload, 
  FaSync,
  FaExpand,
  FaCompress,
  FaBell,
  FaBookmark,
  FaShareAlt,
  FaCog,
  FaEye,
  FaEyeSlash,
  FaThList,
  FaTh,
  FaChartBar,
  FaCalendarAlt,
  FaGlobe
} from 'react-icons/fa';
import { MdGridView, MdViewList } from 'react-icons/md';

/**
 * 🎯 Interactive Features Component
 * - Advanced search and filtering
 * - Data visualization toggles
 * - Export and import utilities
 * - Real-time updates
 * - User preferences
 * - Keyboard shortcuts
 * - Accessibility features
 */

// Advanced Search Component
export function AdvancedSearch({ 
  placeholder = "Search...", 
  onSearch, 
  suggestions = [], 
  recentSearches = [],
  className = "" 
}) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    onSearch?.(searchQuery);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            onSearch?.(e.target.value);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-athletiq-green focus:border-transparent
                   placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-athletiq-green"
        >
          <FaFilter />
        </button>
      </div>

      {/* Search Suggestions */}
      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 
                     border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          >
            {suggestions.length > 0 && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggestions</p>
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                             rounded text-sm text-gray-900 dark:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {recentSearches.length > 0 && (
              <div className="p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Recent</p>
                {recentSearches.slice(0, 3).map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(recent)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 
                             rounded text-sm text-gray-600 dark:text-gray-300"
                  >
                    {recent}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                  <option>Custom range</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <option>All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <option>All Categories</option>
                  <option>Players</option>
                  <option>Schools</option>
                  <option>Tournaments</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Filter Options Component
export function FilterOptions({ 
  filters = [], 
  onFiltersChange, 
  className = "" 
}) {
  const [activeFilters, setActiveFilters] = useState({});

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...activeFilters,
      [filterKey]: value
    };
    setActiveFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFiltersChange && onFiltersChange({});
  };

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filters.map(filter => {
          if (filter.visible === false) return null;

          return (
            <div key={filter.key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {filter.label}
              </label>
              
              {filter.type === 'select' && (
                <select
                  value={activeFilters[filter.key] || filter.value || ''}
                  onChange={(e) => {
                    handleFilterChange(filter.key, e.target.value);
                    filter.onChange && filter.onChange(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {filter.options?.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {filter.type === 'text' && (
                <input
                  type="text"
                  value={activeFilters[filter.key] || filter.value || ''}
                  onChange={(e) => {
                    handleFilterChange(filter.key, e.target.value);
                    filter.onChange && filter.onChange(e.target.value);
                  }}
                  placeholder={filter.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}

              {filter.type === 'date' && (
                <input
                  type="date"
                  value={activeFilters[filter.key] || filter.value || ''}
                  onChange={(e) => {
                    handleFilterChange(filter.key, e.target.value);
                    filter.onChange && filter.onChange(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}

              {filter.type === 'checkbox' && (
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={activeFilters[filter.key] || filter.value || false}
                    onChange={(e) => {
                      handleFilterChange(filter.key, e.target.checked);
                      filter.onChange && filter.onChange(e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {filter.checkboxLabel || filter.label}
                  </span>
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Data View Controls
export function DataViewControls({ 
  viewMode, 
  onViewModeChange, 
  sortBy, 
  onSortChange, 
  onRefresh,
  onExport,
  showFilters,
  onToggleFilters 
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {/* View Mode Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange?.('grid')}
            className={`p-2 rounded ${viewMode === 'grid' 
              ? 'bg-white dark:bg-gray-600 shadow-sm' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            <MdGridView className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange?.('list')}
            className={`p-2 rounded ${viewMode === 'list' 
              ? 'bg-white dark:bg-gray-600 shadow-sm' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            <MdViewList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Controls */}
      <div className="flex items-center space-x-4">
        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <FaSort className="text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="name">Name</option>
            <option value="date">Date</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilters}
          className={`p-2 rounded-lg transition-colors ${
            showFilters 
              ? 'bg-athletiq-green text-white' 
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FaFilter className="w-4 h-4" />
        </button>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2">
        <motion.button
          animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, ease: "linear" }}
          onClick={handleRefresh}
          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                   rounded-lg transition-colors"
          title="Refresh"
        >
          <FaSync className="w-4 h-4" />
        </motion.button>

        <button
          onClick={onExport}
          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                   rounded-lg transition-colors"
          title="Export Data"
        >
          <FaDownload className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Quick Actions Panel
export function QuickActionsPanel({ actions = [], className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {isExpanded ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        <motion.div
          initial={{ height: isExpanded ? 0 : 'auto' }}
          animate={{ height: isExpanded ? 'auto' : 'auto' }}
          exit={{ height: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 grid grid-cols-2 gap-3">
            {actions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`p-3 rounded-lg text-left transition-colors ${
                  action.disabled 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                    : `${action.color || 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'} text-gray-900 dark:text-white`
                }`}
              >
                <div className="flex items-center space-x-3">
                  {action.icon && <action.icon className="w-5 h-5" />}
                  <div>
                    <p className="font-medium text-sm">{action.title}</p>
                    {action.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {action.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Real-time Status Indicator
export function RealTimeStatus({ 
  lastUpdated, 
  isConnected = true, 
  updateInterval = 30000,
  onManualRefresh 
}) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdated) return;
      
      const now = new Date();
      const updated = new Date(lastUpdated);
      const diffMs = now - updated;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        setTimeAgo('Just now');
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} min${diffMins > 1 ? 's' : ''} ago`);
      } else {
        const diffHours = Math.floor(diffMins / 60);
        setTimeAgo(`${diffHours} hour${diffHours > 1 ? 's' : ''} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
      }`} />
      <span>
        {isConnected ? 'Live' : 'Offline'} • Last updated {timeAgo}
      </span>
      {onManualRefresh && (
        <button
          onClick={onManualRefresh}
          className="text-athletiq-green hover:text-green-700 ml-2"
        >
          <FaSync className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Keyboard Shortcuts Panel
export function KeyboardShortcuts({ shortcuts = [], isOpen, onClose }) {
  const defaultShortcuts = [
    { key: 'Ctrl + K', description: 'Quick search' },
    { key: 'Ctrl + R', description: 'Refresh data' },
    { key: 'Ctrl + E', description: 'Export data' },
    { key: 'Ctrl + N', description: 'Add new item' },
    { key: 'Esc', description: 'Close modals' },
    { key: '/', description: 'Focus search' },
    ...shortcuts
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {defaultShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">{shortcut.description}</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Preferences Panel
export function PreferencesPanel({ isOpen, onClose, preferences, onPreferenceChange }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Dashboard Preferences
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Appearance
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences?.darkMode || false}
                      onChange={(e) => onPreferenceChange?.('darkMode', e.target.checked)}
                      className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                    />
                    <span className="ml-2 text-gray-900 dark:text-white">Dark mode</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences?.compactMode || false}
                      onChange={(e) => onPreferenceChange?.('compactMode', e.target.checked)}
                      className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                    />
                    <span className="ml-2 text-gray-900 dark:text-white">Compact view</span>
                  </label>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences?.emailNotifications || false}
                      onChange={(e) => onPreferenceChange?.('emailNotifications', e.target.checked)}
                      className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                    />
                    <span className="ml-2 text-gray-900 dark:text-white">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences?.realTimeUpdates || true}
                      onChange={(e) => onPreferenceChange?.('realTimeUpdates', e.target.checked)}
                      className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green"
                    />
                    <span className="ml-2 text-gray-900 dark:text-white">Real-time updates</span>
                  </label>
                </div>
              </div>

              {/* Data Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Data & Performance
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Auto-refresh interval
                    </label>
                    <select
                      value={preferences?.refreshInterval || 30000}
                      onChange={(e) => onPreferenceChange?.('refreshInterval', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <option value={15000}>15 seconds</option>
                      <option value={30000}>30 seconds</option>
                      <option value={60000}>1 minute</option>
                      <option value={300000}>5 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Items per page
                    </label>
                    <select
                      value={preferences?.itemsPerPage || 10}
                      onChange={(e) => onPreferenceChange?.('itemsPerPage', parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-athletiq-green hover:bg-green-700 text-white rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}