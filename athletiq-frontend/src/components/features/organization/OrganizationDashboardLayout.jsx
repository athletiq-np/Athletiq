// src/components/features/organization/OrganizationDashboardLayout.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserGraduate, FaCheckCircle, FaExclamationCircle, FaPlus, FaSchool, FaTrophy,
  FaChartLine, FaCogs, FaUsers, FaGraduationCap, FaHome, FaBell, FaSearch,
  FaGlobe, FaPalette, FaCalendarAlt, FaFilter, FaDownload, FaEye, FaEdit, FaTrash,
  FaSort, FaArrowUp, FaArrowDown, FaExpand, FaMoon, FaSun, FaLanguage, FaSignOutAlt,
  FaBuilding, FaHandshake, FaFileAlt, FaCertificate
} from 'react-icons/fa';
import { HiOutlineCog, HiMenuAlt3, HiX } from 'react-icons/hi';
import { MdPending, MdDashboard, MdAnalytics, MdSettings, MdNotifications, MdVerified } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';
import organizationAPI from '@/api/organizationApi';

// Organization-specific sidebar component
import OrganizationSidebar from './OrganizationSidebar';

// Organization dashboard sections
import OrganizationOverview from './sections/OrganizationOverview';
import AthletesManagement from './sections/AthletesManagement';
import TournamentManagement from './sections/TournamentManagement';
import SchoolPartnerships from './sections/SchoolPartnerships';
import DocumentsManagement from './sections/DocumentsManagement';
import OrganizationProfile from './sections/OrganizationProfile';
import VerificationStatus from './sections/VerificationStatus';
import Analytics from './sections/Analytics';
import Settings from './sections/Settings';

/**
 * 🏢 ATHLETIQ - Organization Dashboard Layout
 * Premium, production-ready organization dashboard with:
 * - Unified design matching admin and school dashboards
 * - Comprehensive organization management features
 * - Athlete registration and management with school requirement
 * - Tournament creation and management
 * - School partnership management
 * - Verification workflow for organizations
 * - Document management system
 * - Analytics and reporting
 * - Internationalization (i18n) support
 * - Responsive design for all devices
 * - Modern sidebar with collapsible sections
 * - Real-time data and notifications
 * - Dark/Light mode toggle
 */
export default function OrganizationDashboardLayout({ organization, onRefresh }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedPreference = localStorage.getItem('athletiq-organization-sidebar-collapsed');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  const [activeSection, setActiveSection] = useState('overview');
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  
  // Data State
  const [organizationData, setOrganizationData] = useState({
    overview: {
      totalAthletes: 0,
      activeSchoolPartnerships: 0,
      activeTournaments: 0,
      upcomingTournaments: 0,
      pendingVerifications: 0,
      documentsUploaded: 0,
      verificationStatus: 'pending'
    },
    athletes: [],
    schools: [],
    tournaments: [],
    documents: [],
    notifications: [],
    recentActivities: [],
    profile: null,
    statistics: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch organization dashboard data
  const fetchOrganizationData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        dashboardRes,
        profileRes,
        athletesRes,
        schoolsRes,
        tournamentsRes,
        documentsRes,
        notificationsRes,
        statisticsRes,
        verificationRes
      ] = await Promise.all([
        organizationAPI.getDashboard(),
        organizationAPI.getProfile(),
        organizationAPI.getAthletes({ limit: 100, page: 1 }),
        organizationAPI.getSchools({ limit: 100, page: 1 }),
        organizationAPI.getTournaments({ limit: 100, page: 1 }),
        organizationAPI.getDocuments({ limit: 50, page: 1 }),
        organizationAPI.getNotifications({ limit: 20 }),
        organizationAPI.getStatistics(),
        organizationAPI.getVerificationStatus()
      ]);
      
      // Process dashboard data
      const dashboardData = dashboardRes.success ? dashboardRes.data : {};
      const profileData = profileRes.success ? profileRes.data : null;
      const statisticsData = statisticsRes.success ? statisticsRes.data : {};
      const verificationData = verificationRes.success ? verificationRes.data : { status: 'pending' };
      
      setOrganizationData({
        overview: {
          totalAthletes: dashboardData.total_athletes || 0,
          activeSchoolPartnerships: dashboardData.active_school_partnerships || 0,
          activeTournaments: dashboardData.active_tournaments || 0,
          upcomingTournaments: dashboardData.upcoming_tournaments || 0,
          pendingVerifications: dashboardData.pending_verifications || 0,
          documentsUploaded: dashboardData.documents_uploaded || 0,
          verificationStatus: verificationData.status || 'pending'
        },
        athletes: athletesRes.success ? athletesRes.data.results || athletesRes.data || [] : [],
        schools: schoolsRes.success ? schoolsRes.data.results || schoolsRes.data || [] : [],
        tournaments: tournamentsRes.success ? tournamentsRes.data.results || tournamentsRes.data || [] : [],
        documents: documentsRes.success ? documentsRes.data.results || documentsRes.data || [] : [],
        notifications: notificationsRes.success ? notificationsRes.data.results || notificationsRes.data || [] : [],
        recentActivities: dashboardData.recent_activities || [],
        profile: profileData,
        statistics: statisticsData
      });
      
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setError(error.message || 'Failed to load organization data');
      toast.error(t('organization.dashboard.error.loadFailed', 'Failed to load organization data'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Initialize data on mount
  useEffect(() => {
    fetchOrganizationData();
    
    // Set up real-time updates (every 5 minutes)
    const interval = setInterval(fetchOrganizationData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOrganizationData]);

  // Handle theme change
  useEffect(() => {
    if (theme?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Save sidebar preference
  useEffect(() => {
    localStorage.setItem('athletiq-organization-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Handle section change
  const handleSectionChange = useCallback((section) => {
    setActiveSection(section);
  }, []);

  // Handle data refresh
  const handleRefresh = useCallback(() => {
    fetchOrganizationData();
    if (onRefresh) {
      onRefresh();
    }
  }, [fetchOrganizationData, onRefresh]);

  // Render active section content
  const renderActiveSection = () => {
    const commonProps = {
      data: organizationData,
      loading,
      error,
      onRefresh: handleRefresh,
      onDataUpdate: setOrganizationData
    };

    switch (activeSection) {
      case 'overview':
        return <OrganizationOverview {...commonProps} />;
      case 'athletes':
        return <AthletesManagement {...commonProps} />;
      case 'tournaments':
        return <TournamentManagement {...commonProps} />;
      case 'schools':
        return <SchoolPartnerships {...commonProps} />;
      case 'documents':
        return <DocumentsManagement {...commonProps} />;
      case 'profile':
        return <OrganizationProfile {...commonProps} />;
      case 'verification':
        return <VerificationStatus {...commonProps} />;
      case 'analytics':
        return <Analytics {...commonProps} />;
      case 'settings':
        return <Settings {...commonProps} />;
      default:
        return <OrganizationOverview {...commonProps} />;
    }
  };

  if (loading && !organizationData.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-athletiq-orange mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t('organization.dashboard.loading', 'Loading Organization Dashboard...')}
          </h2>
          <p className="text-gray-500">
            {t('organization.dashboard.loadingDesc', 'Please wait while we fetch your organization data')}
          </p>
        </div>
      </div>
    );
  }

  if (error && !organizationData.profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationCircle className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            {t('organization.dashboard.error.title', 'Failed to Load Dashboard')}
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-athletiq-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            {t('common.tryAgain', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Organization Sidebar */}
      <OrganizationSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        organizationData={organizationData}
        notificationsCount={organizationData.notifications?.filter(n => !n.is_read)?.length || 0}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarCollapsed ? <HiMenuAlt3 className="h-6 w-6" /> : <HiX className="h-6 w-6" />}
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {organizationData.profile?.name || t('organization.dashboard.title', 'Organization Dashboard')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('organization.dashboard.welcome', 'Welcome back, manage your organization efficiently')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Verification Status Badge */}
              {organizationData.overview.verificationStatus && (
                <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                  organizationData.overview.verificationStatus === 'verified' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : organizationData.overview.verificationStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {organizationData.overview.verificationStatus === 'verified' && <MdVerified className="h-3 w-3" />}
                  {organizationData.overview.verificationStatus === 'pending' && <MdPending className="h-3 w-3" />}
                  {organizationData.overview.verificationStatus === 'rejected' && <FaExclamationCircle className="h-3 w-3" />}
                  <span className="capitalize">
                    {t(`organization.verification.status.${organizationData.overview.verificationStatus}`, 
                       organizationData.overview.verificationStatus)}
                  </span>
                </div>
              )}

              {/* Notifications */}
              <button
                onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FaBell className="h-5 w-5" />
                {organizationData.notifications?.filter(n => !n.is_read)?.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {organizationData.notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {theme?.darkMode ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.full_name || user?.username || 'Organization Admin'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <div className="h-8 w-8 bg-athletiq-orange rounded-full flex items-center justify-center text-white font-semibold">
                  {(user?.full_name || user?.username || 'O').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderActiveSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {notificationsPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-xl z-50 border-l border-gray-200 dark:border-gray-700"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('organization.notifications.title', 'Notifications')}
                </h3>
                <button
                  onClick={() => setNotificationsPanelOpen(false)}
                  className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <HiX className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto h-full">
              {organizationData.notifications?.length > 0 ? (
                <div className="space-y-3">
                  {organizationData.notifications.map((notification, index) => (
                    <div
                      key={notification.id || index}
                      className={`p-3 rounded-lg border ${
                        notification.is_read 
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                          : 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700'
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title || notification.message}
                      </p>
                      {notification.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {notification.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <FaBell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('organization.notifications.empty', 'No notifications yet')}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for notifications panel */}
      {notificationsPanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setNotificationsPanelOpen(false)}
        />
      )}
    </div>
  );
}