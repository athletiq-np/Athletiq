// src/components/features/admin/FilterBar.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaFilter, FaCalendarAlt, FaDownload, FaSync, FaSearch,
  FaSchool, FaTrophy, FaMapMarkerAlt, FaChevronDown, FaTimes
} from 'react-icons/fa';
import { HiOutlineAdjustments } from 'react-icons/hi';

/**
 * 🎯 Filter Bar Component
 * - Advanced filtering options
 * - Date range picker
 * - Export functionality
 * - Search and filter presets
 * - Responsive design
 */
export default function FilterBar({ 
  filters, 
  setFilters, 
  dateRange, 
  setDateRange, 
  onRefresh,
  onExport 
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);

  // Calculate active filters count
  React.useEffect(() => {
    const count = Object.values(filters).filter(value => value !== 'all' && value !== '').length;
    setActiveFilters(count);
  }, [filters]);

  // Filter options
  const filterOptions = {
    status: [
      { value: 'all', label: t('filters.status.all') },
      { value: 'active', label: t('filters.status.active') },
      { value: 'pending', label: t('filters.status.pending') },
      { value: 'inactive', label: t('filters.status.inactive') },
      { value: 'suspended', label: t('filters.status.suspended') }
    ],
    school: [
      { value: 'all', label: t('filters.school.all') },
      { value: 'public', label: t('filters.school.public') },
      { value: 'private', label: t('filters.school.private') },
      { value: 'international', label: t('filters.school.international') }
    ],
    sport: [
      { value: 'all', label: t('filters.sport.all') },
      { value: 'football', label: t('filters.sport.football') },
      { value: 'basketball', label: t('filters.sport.basketball') },
      { value: 'volleyball', label: t('filters.sport.volleyball') },
      { value: 'athletics', label: t('filters.sport.athletics') },
      { value: 'swimming', label: t('filters.sport.swimming') }
    ],
    region: [
      { value: 'all', label: t('filters.region.all') },
      { value: 'kathmandu', label: t('filters.region.kathmandu') },
      { value: 'pokhara', label: t('filters.region.pokhara') },
      { value: 'biratnagar', label: t('filters.region.biratnagar') },
      { value: 'bharatpur', label: t('filters.region.bharatpur') },
      { value: 'birgunj', label: t('filters.region.birgunj') }
    ]
  };

  const dateRangeOptions = [
    { value: '7d', label: t('filters.dateRange.last7Days') },
    { value: '30d', label: t('filters.dateRange.last30Days') },
    { value: '90d', label: t('filters.dateRange.last90Days') },
    { value: '1y', label: t('filters.dateRange.lastYear') },
    { value: 'custom', label: t('filters.dateRange.custom') }
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      status: 'all',
      school: 'all',
      sport: 'all',
      region: 'all'
    });
    setDateRange('30d');
  };

  const exportData = () => {
    if (onExport) {
      onExport(filters, dateRange);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-16 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Main Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Toggle Filter Panel */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                isExpanded 
                  ? 'bg-athletiq-green text-white shadow-lg' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <HiOutlineAdjustments className="w-5 h-5" />
              <span className="text-sm font-medium">{t('filters.title')}</span>
              {activeFilters > 0 && (
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                  {activeFilters}
                </span>
              )}
              <FaChevronDown 
                className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Quick Date Range */}
            <div className="flex items-center space-x-2">
              <FaCalendarAlt className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none bg-transparent border-none text-sm text-gray-700 dark:text-gray-300 focus:ring-0 focus:outline-none cursor-pointer"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Clear Filters */}
            {activeFilters > 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <FaTimes className="w-3 h-3" />
                <span>{t('filters.clearAll')}</span>
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('filters.refresh')}
            >
              <FaSync className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Export */}
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-4 py-2 bg-athletiq-green text-white rounded-lg hover:bg-athletiq-green/90 transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              <span className="text-sm font-medium">{t('filters.export')}</span>
            </button>
          </div>
        </div>

        {/* Expanded Filter Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('filters.status.title')}
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                    >
                      {filterOptions.status.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* School Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaSchool className="inline w-4 h-4 mr-1" />
                      {t('filters.school.title')}
                    </label>
                    <select
                      value={filters.school}
                      onChange={(e) => handleFilterChange('school', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                    >
                      {filterOptions.school.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sport Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaTrophy className="inline w-4 h-4 mr-1" />
                      {t('filters.sport.title')}
                    </label>
                    <select
                      value={filters.sport}
                      onChange={(e) => handleFilterChange('sport', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                    >
                      {filterOptions.sport.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Region Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaMapMarkerAlt className="inline w-4 h-4 mr-1" />
                      {t('filters.region.title')}
                    </label>
                    <select
                      value={filters.region}
                      onChange={(e) => handleFilterChange('region', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                    >
                      {filterOptions.region.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Tags */}
                {activeFilters > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(filters).map(([key, value]) => {
                      if (value === 'all' || value === '') return null;
                      const option = filterOptions[key]?.find(opt => opt.value === value);
                      return (
                        <span
                          key={`${key}-${value}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-athletiq-green/20 text-athletiq-green border border-athletiq-green/30"
                        >
                          {option?.label || value}
                          <button
                            onClick={() => handleFilterChange(key, 'all')}
                            className="ml-2 hover:text-athletiq-green/80"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Filter preset buttons
export function FilterPresets({ onApplyPreset }) {
  const { t } = useTranslation();
  
  const presets = [
    {
      id: 'active-players',
      label: t('filters.presets.activePlayers'),
      icon: FaUserGraduate,
      filters: { status: 'active', school: 'all', sport: 'all', region: 'all' }
    },
    {
      id: 'pending-verification',
      label: t('filters.presets.pendingVerification'),
      icon: FaFilter,
      filters: { status: 'pending', school: 'all', sport: 'all', region: 'all' }
    },
    {
      id: 'private-schools',
      label: t('filters.presets.privateSchools'),
      icon: FaSchool,
      filters: { status: 'all', school: 'private', sport: 'all', region: 'all' }
    }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {presets.map(preset => (
        <button
          key={preset.id}
          onClick={() => onApplyPreset(preset.filters)}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          <preset.icon className="w-4 h-4" />
          <span>{preset.label}</span>
        </button>
      ))}
    </div>
  );
}
