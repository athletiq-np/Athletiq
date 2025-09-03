// src/components/features/admin/EnhancedFeaturesDemo.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaCode, FaLightbulb, FaUsers, FaSchool, FaTrophy } from 'react-icons/fa';

// Enhanced Components
import { DashboardLoading, TableLoading, StatsCardsLoading } from './LoadingStates';
import { NetworkError, InlineError, EmptyState } from './ErrorStates';
import { AdvancedSearch, FilterOptions, DataViewControls, RealTimeStatus, UserPreferences } from './InteractiveFeatures';
import { NotificationToast, NotificationCenter } from './NotificationSystem';
import { DataExportModal, QuickExportButton } from './DataExportUtility';

const EnhancedFeaturesDemo = () => {
  const [activeDemo, setActiveDemo] = useState('loading');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Demo Notification',
      message: 'This is a sample notification to demonstrate the system',
      type: 'info',
      priority: 'medium',
      timestamp: new Date(),
      read: false
    }
  ]);

  // Demo data
  const sampleData = [
    { id: 1, name: 'John Doe', school: 'Springfield High', sport: 'Basketball' },
    { id: 2, name: 'Jane Smith', school: 'Riverside Academy', sport: 'Soccer' },
    { id: 3, name: 'Mike Johnson', school: 'Central High', sport: 'Tennis' }
  ];

  const demos = [
    {
      id: 'loading',
      title: 'Loading States',
      description: 'Professional loading indicators with skeleton screens',
      icon: FaPlay
    },
    {
      id: 'errors',
      title: 'Error Handling',
      description: 'Comprehensive error states with recovery options',
      icon: FaCode
    },
    {
      id: 'interactive',
      title: 'Interactive Features',
      description: 'Advanced search, filters, and user preferences',
      icon: FaLightbulb
    },
    {
      id: 'notifications',
      title: 'Notification System',
      description: 'Toast notifications and notification center',
      icon: FaBell
    },
    {
      id: 'export',
      title: 'Data Export',
      description: 'Multi-format data export with progress tracking',
      icon: FaUsers
    }
  ];

  const renderDemo = () => {
    switch (activeDemo) {
      case 'loading':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Dashboard Loading
              </h3>
              <DashboardLoading />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Table Loading
              </h3>
              <TableLoading rows={5} message="Loading players..." />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Stats Cards Loading
              </h3>
              <StatsCardsLoading count={4} />
            </div>
          </div>
        );

      case 'errors':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Network Error
              </h3>
              <NetworkError
                error={{
                  type: 'network',
                  message: 'Failed to connect to server',
                  details: 'Connection timeout after 30 seconds',
                  canRetry: true
                }}
                onRetry={() => console.log('Retrying...')}
                showDetails={true}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Inline Error
              </h3>
              <InlineError
                message="Unable to save changes"
                onRetry={() => console.log('Retrying save...')}
                canRetry={true}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Empty State
              </h3>
              <EmptyState
                title="No data available"
                description="Get started by adding some content"
                icon={FaUsers}
                actionLabel="Add Item"
                onAction={() => console.log('Add action triggered')}
                suggestions={[
                  "Import from CSV",
                  "Add manually",
                  "Connect data source"
                ]}
              />
            </div>
          </div>
        );

      case 'interactive':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Advanced Search
              </h3>
              <AdvancedSearch
                onSearch={(query, filters) => console.log('Search:', query, filters)}
                placeholder="Search with advanced filters..."
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Filter Options
              </h3>
              <FilterOptions
                filters={[
                  {
                    key: 'school',
                    label: 'School',
                    type: 'select',
                    options: [
                      { value: '', label: 'All Schools' },
                      { value: 'school1', label: 'Springfield High' },
                      { value: 'school2', label: 'Riverside Academy' }
                    ],
                    value: ''
                  },
                  {
                    key: 'sport',
                    label: 'Sport',
                    type: 'select',
                    options: [
                      { value: '', label: 'All Sports' },
                      { value: 'basketball', label: 'Basketball' },
                      { value: 'soccer', label: 'Soccer' },
                      { value: 'tennis', label: 'Tennis' }
                    ],
                    value: ''
                  },
                  {
                    key: 'active',
                    label: 'Active Players Only',
                    type: 'checkbox',
                    value: false
                  }
                ]}
                onFiltersChange={(filters) => console.log('Filters:', filters)}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Data View Controls
              </h3>
              <DataViewControls
                viewMode="table"
                onViewModeChange={(mode) => console.log('View mode:', mode)}
                sortOptions={[
                  { value: 'name', label: 'Name' },
                  { value: 'school', label: 'School' },
                  { value: 'sport', label: 'Sport' }
                ]}
                onSortChange={(sort) => console.log('Sort:', sort)}
                totalItems={sampleData.length}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Real-time Status & User Preferences
              </h3>
              <div className="flex items-center space-x-4">
                <RealTimeStatus />
                <UserPreferences
                  preferences={{}}
                  onPreferencesChange={(prefs) => console.log('Preferences:', prefs)}
                />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Notification Center
              </h3>
              <NotificationCenter
                notifications={notifications}
                onNotificationAction={(id, action) => {
                  console.log('Notification action:', id, action);
                  if (action === 'mark_read') {
                    setNotifications(prev => 
                      prev.map(n => n.id === id ? { ...n, read: true } : n)
                    );
                  }
                }}
                onClose={() => console.log('Notification center closed')}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Toast Notifications
              </h3>
              <div className="space-x-4">
                <button
                  onClick={() => {
                    // This would trigger a toast notification
                    console.log('Success toast triggered');
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Show Success Toast
                </button>
                <button
                  onClick={() => {
                    console.log('Error toast triggered');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Show Error Toast
                </button>
                <button
                  onClick={() => {
                    console.log('Info toast triggered');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Show Info Toast
                </button>
              </div>
            </div>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Data Export Utility
              </h3>
              <DataExportUtility
                onExport={async (format, options) => {
                  console.log('Exporting:', format, options);
                  return sampleData;
                }}
                filename="demo-export"
                data={sampleData}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Quick Export Button
              </h3>
              <QuickExportButton
                onExport={async () => {
                  console.log('Quick export triggered');
                  return sampleData;
                }}
                filename="quick-export"
                format="csv"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Sample Data Preview
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sport
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sampleData.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.school}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {item.sport}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Enhanced SuperAdmin Features Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore the comprehensive UI enhancement components for the SuperAdmin dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Feature Categories
              </h2>
              <nav className="space-y-2">
                {demos.map((demo) => {
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.id}
                      onClick={() => setActiveDemo(demo.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeDemo === demo.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{demo.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {demo.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Demo Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeDemo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {demos.find(d => d.id === activeDemo)?.title}
              </h2>
              {renderDemo()}
            </motion.div>
          </div>
        </div>

        {/* Toast Container */}
        <NotificationToast />
      </div>
    </div>
  );
};

export default EnhancedFeaturesDemo;