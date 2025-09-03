// src/components/features/admin/SuperAdminDashboardEnhanced.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaUsers, FaSchool, FaTrophy, FaCog, FaBell } from 'react-icons/fa';

// Enhanced Components
import { DashboardLoading, StatsCardsLoading } from './LoadingStates';
import { NetworkError, EmptyState } from './ErrorStates';
import { AdvancedSearch, UserPreferences, DataViewControls, RealTimeStatus } from './InteractiveFeatures';
import { NotificationToast, NotificationCenter } from './NotificationSystem';
import { DataExportUtility } from './DataExportUtility';
import PremiumStatsCards from './PremiumStatsCards';

// Tab Components
import SchoolsTab from './SchoolsTab';
import PlayersTab from './PlayersTab';
import TournamentsTab from './TournamentsTab';

const SuperAdminDashboardEnhanced = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [preferences, setPreferences] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Simulated dashboard data
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalPlayers: 0,
    activeTournaments: 0,
    totalRevenue: 0,
    growth: {
      schools: 0,
      players: 0,
      tournaments: 0,
      revenue: 0
    }
  });

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulated data
        setStats({
          totalSchools: 125,
          totalPlayers: 3456,
          activeTournaments: 28,
          totalRevenue: 125000,
          growth: {
            schools: 12.5,
            players: 18.3,
            tournaments: 8.7,
            revenue: 23.2
          }
        });

        setDashboardData({
          schools: [],
          players: [],
          tournaments: [],
          analytics: {}
        });

        // Add welcome notification
        setNotifications(prev => [...prev, {
          id: Date.now(),
          title: 'Dashboard Loaded',
          message: 'Welcome to the enhanced SuperAdmin dashboard!',
          type: 'success',
          priority: 'medium',
          timestamp: new Date(),
          read: false
        }]);

      } catch (err) {
        setError({
          type: 'network',
          message: 'Failed to load dashboard data',
          details: err.message,
          canRetry: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Handle preferences update
  const handlePreferencesUpdate = (newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
    localStorage.setItem('superadmin_preferences', JSON.stringify({
      ...preferences,
      ...newPreferences
    }));
  };

  // Handle retry
  const handleRetry = () => {
    window.location.reload();
  };

  // Handle notification actions
  const handleNotificationAction = (notificationId, action) => {
    if (action === 'mark_read') {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } else if (action === 'dismiss') {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaHome },
    { id: 'schools', label: 'Schools', icon: FaSchool },
    { id: 'players', label: 'Players', icon: FaUsers },
    { id: 'tournaments', label: 'Tournaments', icon: FaTrophy },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  // Export data
  const handleDataExport = async (format, options) => {
    const exportData = {
      overview: stats,
      schools: dashboardData?.schools || [],
      players: dashboardData?.players || [],
      tournaments: dashboardData?.tournaments || [],
      analytics: dashboardData?.analytics || {}
    };

    return exportData;
  };

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <NetworkError
        error={error}
        onRetry={handleRetry}
        showDetails={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                SuperAdmin Dashboard
              </h1>
              <RealTimeStatus />
            </div>

            <div className="flex items-center space-x-4">
              {/* Advanced Search */}
              <AdvancedSearch
                onSearch={(query, filters) => {
                  console.log('Search:', query, filters);
                }}
                placeholder="Search across all data..."
              />

              {/* Data Export */}
              <DataExportUtility
                onExport={handleDataExport}
                filename="superadmin-dashboard"
                data={dashboardData}
              />

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                  className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <FaBell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotificationCenter && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-12 z-50"
                    >
                      <NotificationCenter
                        notifications={notifications}
                        onNotificationAction={handleNotificationAction}
                        onClose={() => setShowNotificationCenter(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Preferences */}
              <UserPreferences
                preferences={preferences}
                onPreferencesChange={handlePreferencesUpdate}
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 -mb-px">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <PremiumStatsCards 
                  stats={stats}
                  loading={false}
                  className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                />

                {/* Data View Controls */}
                <DataViewControls
                  viewMode="grid"
                  onViewModeChange={(mode) => console.log('View mode:', mode)}
                  sortOptions={[
                    { value: 'name', label: 'Name' },
                    { value: 'created', label: 'Created Date' },
                    { value: 'updated', label: 'Last Updated' }
                  ]}
                  onSortChange={(sort) => console.log('Sort:', sort)}
                />

                {/* Quick Actions Dashboard */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('schools')}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <FaSchool className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Manage Schools</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Add, edit, and manage schools</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('players')}
                      className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <FaUsers className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Manage Players</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">View and manage player profiles</p>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('tournaments')}
                      className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <FaTrophy className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                      <h4 className="font-medium text-gray-900 dark:text-white">Tournaments</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Create and manage tournaments</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schools' && (
              <SchoolsTab 
                schools={dashboardData?.schools || []}
                refetchData={() => {}}
                loading={false}
                error={null}
              />
            )}

            {activeTab === 'players' && (
              <PlayersTab
                players={dashboardData?.players || []}
                refetchData={() => {}}
                loading={false}
                error={null}
              />
            )}

            {activeTab === 'tournaments' && (
              <TournamentsTab
                tournaments={dashboardData?.tournaments || []}
                refetchData={() => {}}
                loading={false}
                error={null}
              />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Dashboard Settings
                </h3>
                <UserPreferences
                  preferences={preferences}
                  onPreferencesChange={handlePreferencesUpdate}
                  expanded={true}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Toast Notifications */}
      <NotificationToast />
    </div>
  );
};

export default SuperAdminDashboardEnhanced;