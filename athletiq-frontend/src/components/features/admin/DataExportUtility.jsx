// src/components/features/admin/DataExportUtility.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaDownload, 
  FaFileExcel, 
  FaFileCsv, 
  FaFilePdf, 
  FaFileAlt,
  FaFilter,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaCog,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * 📊 Enhanced Data Export Utility
 * - Multiple export formats (CSV, Excel, PDF, JSON)
 * - Advanced filtering options
 * - Date range selection
 * - Column selection
 * - Custom templates
 * - Progress tracking
 * - Scheduled exports
 */

export function DataExportModal({ 
  isOpen, 
  onClose, 
  data = [], 
  dataType = 'general',
  onExport,
  availableColumns = [] 
}) {
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    dateRange: 'all',
    customDateStart: '',
    customDateEnd: '',
    selectedColumns: availableColumns.slice(0, 5).map(col => typeof col === 'string' ? col : col.key), // Default to first 5 columns
    includeFilters: true,
    includeHeader: true,
    fileName: `${dataType}-export-${new Date().toISOString().split('T')[0]}`
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportFormats = [
    { id: 'csv', name: 'CSV', icon: FaFileCsv, description: 'Comma-separated values' },
    { id: 'excel', name: 'Excel', icon: FaFileExcel, description: 'Microsoft Excel format' },
    { id: 'pdf', name: 'PDF', icon: FaFilePdf, description: 'Portable Document Format' },
    { id: 'json', name: 'JSON', icon: FaFileAlt, description: 'JavaScript Object Notation' }
  ];

  const dateRangeOptions = [
    { id: 'all', name: 'All Time' },
    { id: 'today', name: 'Today' },
    { id: 'yesterday', name: 'Yesterday' },
    { id: 'last7days', name: 'Last 7 Days' },
    { id: 'last30days', name: 'Last 30 Days' },
    { id: 'thisMonth', name: 'This Month' },
    { id: 'lastMonth', name: 'Last Month' },
    { id: 'custom', name: 'Custom Range' }
  ];

  const handleColumnToggle = (column) => {
    setExportConfig(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(column)
        ? prev.selectedColumns.filter(col => col !== column)
        : [...prev.selectedColumns, column]
    }));
  };

  const handleExport = async () => {
    if (exportConfig.selectedColumns.length === 0) {
      toast.error('Please select at least one column to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Call the export function
      await onExport?.(exportConfig);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        toast.success(`Data exported successfully as ${exportConfig.format.toUpperCase()}`);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const getFilteredData = () => {
    let filtered = [...data];
    
    // Apply date filtering if needed
    if (exportConfig.dateRange !== 'all' && filtered.length > 0) {
      const now = new Date();
      let startDate, endDate;

      switch (exportConfig.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          break;
        case 'yesterday':
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'last7days':
          endDate = now;
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30days':
          endDate = now;
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (exportConfig.customDateStart && exportConfig.customDateEnd) {
            startDate = new Date(exportConfig.customDateStart);
            endDate = new Date(exportConfig.customDateEnd);
          }
          break;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.created_at || item.date || item.timestamp);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
    }

    return filtered;
  };

  const filteredData = getFilteredData();

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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaDownload className="w-6 h-6 text-athletiq-green" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Export Data
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {filteredData.length} records available for export
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Export Format */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Export Format
                  </h3>
                  <div className="space-y-3">
                    {exportFormats.map((format) => (
                      <label
                        key={format.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          exportConfig.format === format.id
                            ? 'border-athletiq-green bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.id}
                          checked={exportConfig.format === format.id}
                          onChange={(e) => setExportConfig(prev => ({ ...prev, format: e.target.value }))}
                          className="sr-only"
                        />
                        <format.icon className={`w-5 h-5 mr-3 ${
                          exportConfig.format === format.id ? 'text-athletiq-green' : 'text-gray-400'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {format.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {format.description}
                          </div>
                        </div>
                        {exportConfig.format === format.id && (
                          <FaCheck className="w-4 h-4 text-athletiq-green ml-auto" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Date Range
                  </h3>
                  <div className="space-y-3">
                    <select
                      value={exportConfig.dateRange}
                      onChange={(e) => setExportConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                    >
                      {dateRangeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>

                    {exportConfig.dateRange === 'custom' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={exportConfig.customDateStart}
                            onChange={(e) => setExportConfig(prev => ({ ...prev, customDateStart: e.target.value }))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={exportConfig.customDateEnd}
                            onChange={(e) => setExportConfig(prev => ({ ...prev, customDateEnd: e.target.value }))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column Selection */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Select Columns ({exportConfig.selectedColumns.length} selected)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableColumns.map((column) => {
                    const columnKey = typeof column === 'string' ? column : column.key;
                    const columnLabel = typeof column === 'string' ? column.replace(/_/g, ' ') : column.label;
                    
                    return (
                      <label
                        key={columnKey}
                        className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={exportConfig.selectedColumns.includes(columnKey)}
                          onChange={() => handleColumnToggle(columnKey)}
                          className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green mr-2"
                        />
                        <span className="text-sm text-gray-900 dark:text-white capitalize">
                          {columnLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex space-x-3 mt-4">
                  <button
                    onClick={() => setExportConfig(prev => ({ 
                      ...prev, 
                      selectedColumns: availableColumns.map(col => typeof col === 'string' ? col : col.key) 
                    }))}
                    className="text-sm text-athletiq-green hover:text-green-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setExportConfig(prev => ({ ...prev, selectedColumns: [] }))}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Select None
                  </button>
                </div>
              </div>

              {/* Export Options */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Export Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeHeader}
                      onChange={(e) => setExportConfig(prev => ({ ...prev, includeHeader: e.target.checked }))}
                      className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green mr-3"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Include column headers
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeFilters}
                      onChange={(e) => setExportConfig(prev => ({ ...prev, includeFilters: e.target.checked }))}
                      className="rounded border-gray-300 text-athletiq-green focus:ring-athletiq-green mr-3"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Include filter information
                    </span>
                  </label>
                </div>

                {/* File Name */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={exportConfig.fileName}
                    onChange={(e) => setExportConfig(prev => ({ ...prev, fileName: e.target.value }))}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                    placeholder="Enter file name"
                  />
                </div>
              </div>
            </div>

            {/* Export Progress */}
            {isExporting && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <FaSpinner className="w-5 h-5 text-athletiq-green animate-spin" />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Exporting data...</span>
                      <span className="text-gray-600 dark:text-gray-400">{exportProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <motion.div
                        className="bg-athletiq-green h-2 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${exportProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Ready to export {filteredData.length} records
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    disabled={isExporting}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleExport}
                    disabled={isExporting || exportConfig.selectedColumns.length === 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-athletiq-green hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <FaDownload className="w-4 h-4" />
                        <span>Export Data</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Quick export button component
export function QuickExportButton({ 
  data = [], 
  dataType = 'data',
  onExport,
  className = '',
  size = 'md',
  variant = 'primary'
}) {
  const [showModal, setShowModal] = useState(false);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-athletiq-green hover:bg-green-700 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    outline: 'border border-athletiq-green text-athletiq-green hover:bg-athletiq-green hover:text-white'
  };

  // Extract available columns from data
  const availableColumns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`inline-flex items-center space-x-2 rounded-lg transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        <FaDownload className="w-4 h-4" />
        <span>Export</span>
      </motion.button>

      <DataExportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        data={data}
        dataType={dataType}
        onExport={onExport}
        availableColumns={availableColumns}
      />
    </>
  );
}

// Default export for easier importing
export default DataExportModal;