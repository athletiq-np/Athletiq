// src/components/features/admin/GlobalAdminDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserGraduate, FaCheckCircle, FaExclamationCircle, FaPlus, FaSchool, FaTrophy,
  FaChartLine, FaCogs, FaUsers, FaGraduationCap, FaHome, FaBell, FaSearch,
  FaGlobe, FaPalette, FaCalendarAlt, FaFilter, FaDownload, FaEye, FaEdit, FaTrash,
  FaSort, FaArrowUp, FaArrowDown, FaExpand, FaMoon, FaSun, FaLanguage
} from 'react-icons/fa';
import { HiOutlineCog, HiMenuAlt3, HiX } from 'react-icons/hi';
import { MdPending, MdDashboard, MdAnalytics, MdSettings, MdNotifications } from 'react-icons/md';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

// Enhanced sidebar component
import GlobalSidebar from './GlobalSidebar';
import PremiumStatsCards from './PremiumStatsCards';
import DataTable from './DataTable';
import FilterBar from './FilterBar';
import NotificationPanel from './NotificationPanel';
import DashboardSettings from './DashboardSettings';

// Import existing tab components
import PlayersTab from '@features/admin/PlayersTab';
import SchoolsTab from '@features/admin/SchoolsTab';
import TournamentsTab from '@features/admin/TournamentsTab';
import StatsTab from '@features/admin/StatsTab';

/**
 * 🌍 ATHLETIQ - Global Admin Dashboard
 * Premium, production-ready admin dashboard with:
 * - Internationalization (i18n) support
 * - Responsive design for all devices
 * - Modern sidebar with collapsible sections
 * - Real-time data and notifications
 * - Advanced filtering and search
 * - Dark/Light mode toggle
 * - Timezone-aware date formatting
 * - Accessibility features
 * - Premium animations and transitions
 */
export default function GlobalAdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useUserStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Start collapsed by default, but remember user preference
    const savedPreference = localStorage.getItem('athletiq-sidebar-collapsed');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  
  // Data State
  const [summary, setSummary] = useState({
    registeredPlayers: 0,
    schools: 0,
    pendingVerifications: 0,
    missingDocs: 0,
    tournaments: 0,
    activeTournaments: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
  });
  const [players, setPlayers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter and Search State
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateRange, setDateRange] = useState('30d');
  const [filters, setFilters] = useState({
    status: 'all',
    school: 'all',
    sport: 'all',
    region: 'all'
  });
  
  // Active tab
  const activeTab = searchParams.get('tab') || 'overview';

  // Fetch dashboard data with error handling and real-time updates
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        summaryRes, 
        playersRes, 
        schoolsRes, 
        tournamentsRes, 
        notificationsRes,
        activitiesRes
      ] = await Promise.all([
        apiClient.get('/admin/dashboard-stats'),
        apiClient.get('/admin/players?limit=100&page=1'),
        apiClient.get('/admin/schools?limit=100&page=1'),
        apiClient.get('/admin/tournaments?limit=100&page=1'),
        apiClient.get('/admin/notifications?limit=20').catch(() => ({ data: { data: [] } })),
        apiClient.get('/admin/activities?limit=50').catch(() => ({ data: { data: [] } })),
      ]);
      
      // Process summary data
      const stats = summaryRes.data.data || summaryRes.data;
      setSummary({
        registeredPlayers: stats.playerCount || stats.players?.length || 0,
        schools: stats.schoolCount || stats.schools?.length || 0,
        pendingVerifications: stats.pendingVerifications || 0,
        missingDocs: stats.missingDocs || 0,
        tournaments: stats.tournamentCount || tournamentsRes.data?.pagination?.totalCount || 0,
        activeTournaments: tournamentsRes.data?.data?.filter(t => t.status === 'active').length || 0,
        totalRevenue: stats.totalRevenue || 0,
        monthlyGrowth: stats.monthlyGrowth || 0,
      });
      
      setPlayers(playersRes.data?.data || stats.players || []);
      setSchools(schoolsRes.data?.data || stats.schools || []);
      setTournaments(tournamentsRes.data?.data || []);
      setNotifications(notificationsRes.data?.data || []);
      setRecentActivities(activitiesRes.data?.data || []);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error(t('dashboard.error.loadFailed'));
      
      // Set default values on error
      setSummary({
        registeredPlayers: 0,
        schools: 0,
        pendingVerifications: 0,
        missingDocs: 0,
        tournaments: 0,
        activeTournaments: 0,
        totalRevenue: 0,
        monthlyGrowth: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Initialize data on mount
  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates (every 5 minutes)
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Handle theme change
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('athletiq-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Tab definitions with i18n support
  const tabs = [
    { id: 'overview', label: t('dashboard.tabs.overview'), icon: MdDashboard },
    { id: 'players', label: t('dashboard.tabs.players'), icon: FaUserGraduate },
    { id: 'schools', label: t('dashboard.tabs.schools'), icon: FaSchool },
    { id: 'tournaments', label: t('dashboard.tabs.tournaments'), icon: FaTrophy },
    { id: 'analytics', label: t('dashboard.tabs.analytics'), icon: MdAnalytics },
    { id: 'settings', label: t('dashboard.tabs.settings'), icon: MdSettings },
  ];

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  // Language change handler
  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    toast.success(t('dashboard.language.changed'));
  };

  // Timezone-aware date formatter
  const formatDate = (date) => {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(new Date(date));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300 ${fullScreen ? 'fixed inset-0' : ''}`}>
      {/* Global Sidebar */}
      <GlobalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        user={user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLanguageChange={handleLanguageChange}
        currentLanguage={i18n.language}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        {/* Premium Header */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Sidebar Toggle Button */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 group"
                  title={sidebarCollapsed ? t('dashboard.sidebar.expand') : t('dashboard.sidebar.collapse')}
                >
                  {sidebarCollapsed ? (
                    <HiMenuAlt3 size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-athletiq-green" />
                  ) : (
                    <HiX size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-athletiq-green" />
                  )}
                </button>

                {/* Header title and breadcrumb */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t(`dashboard.tabs.${activeTab}`)}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('dashboard.welcome', { name: user?.name || user?.email })}
                  </p>
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center space-x-3">
                {/* Global search */}
                <div className="relative hidden md:block">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder={t('dashboard.search.placeholder')}
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                  />
                </div>

                {/* Language switcher */}
                <div className="relative">
                  <select
                    value={i18n.language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-athletiq-green focus:border-transparent"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="ne">🇳🇵 नेपाली</option>
                    <option value="hi">🇮🇳 हिंदी</option>
                    <option value="es">🇪🇸 Español</option>
                  </select>
                  <FaLanguage className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                </div>

                {/* Notifications */}
                <button
                  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaBell className="text-gray-600 dark:text-gray-400" size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <HiOutlineCog className="text-gray-600 dark:text-gray-400" size={20} />
                </button>

                {/* Full screen toggle */}
                <button
                  onClick={() => setFullScreen(!fullScreen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaExpand className="text-gray-600 dark:text-gray-400" size={16} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onRefresh={fetchDashboardData}
        />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center h-64"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-athletiq-green/20 border-t-athletiq-green rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-athletiq-green rounded-full animate-pulse"></div>
                  </div>
                </div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center"
              >
                <FaExclamationCircle className="mx-auto text-red-500 text-4xl mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  {t('dashboard.error.title')}
                </h3>
                <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {t('dashboard.error.retry')}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Premium Stats Cards */}
                    <PremiumStatsCards 
                      summary={summary} 
                      loading={loading}
                      formatDate={formatDate}
                    />

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <QuickActionCard
                        title={t('dashboard.quickActions.addPlayer')}
                        icon={<FaUserGraduate />}
                        onClick={() => setActiveTab('players')}
                        gradient="from-blue-500 to-cyan-500"
                      />
                      <QuickActionCard
                        title={t('dashboard.quickActions.addSchool')}
                        icon={<FaSchool />}
                        onClick={() => setActiveTab('schools')}
                        gradient="from-purple-500 to-pink-500"
                      />
                      <QuickActionCard
                        title={t('dashboard.quickActions.createTournament')}
                        icon={<FaTrophy />}
                        onClick={() => setActiveTab('tournaments')}
                        gradient="from-yellow-500 to-orange-500"
                      />
                      <QuickActionCard
                        title={t('dashboard.quickActions.viewAnalytics')}
                        icon={<FaChartLine />}
                        onClick={() => setActiveTab('analytics')}
                        gradient="from-green-500 to-emerald-500"
                      />
                    </div>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <RecentPlayersCard 
                        players={players} 
                        setActiveTab={setActiveTab}
                        formatDate={formatDate}
                      />
                      <RecentActivitiesCard 
                        activities={recentActivities}
                        formatDate={formatDate}
                      />
                    </div>
                  </div>
                )}

                {/* Players Tab */}
                {activeTab === 'players' && (
                  <PlayersTab 
                    players={players} 
                    schools={schools}
                    user={user}
                    refetchData={fetchDashboardData}
                  />
                )}

                {/* Schools Tab */}
                {activeTab === 'schools' && (
                  <SchoolsTab 
                    schools={schools} 
                    refetchData={fetchDashboardData}
                  />
                )}

                {/* Tournaments Tab */}
                {activeTab === 'tournaments' && (
                  <TournamentsTab 
                    tournaments={tournaments} 
                    refetchData={fetchDashboardData}
                  />
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <StatsTab 
                    summary={summary}
                    players={players}
                    schools={schools}
                    tournaments={tournaments}
                  />
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <DashboardSettings 
                    user={user}
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    onLanguageChange={handleLanguageChange}
                    currentLanguage={i18n.language}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationsPanelOpen}
        onClose={() => setNotificationsPanelOpen(false)}
        notifications={notifications}
        formatDate={formatDate}
      />

      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-20"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ title, icon, onClick, gradient }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`group relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative flex items-center space-x-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${gradient} text-white`}>
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click to navigate</p>
        </div>
      </div>
    </motion.button>
  );
}

// Recent Players Card Component
function RecentPlayersCard({ players, setActiveTab, formatDate }) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FaUsers className="mr-2 text-athletiq-green" />
          {t('dashboard.recentPlayers.title')}
        </h3>
        <button
          onClick={() => setActiveTab('players')}
          className="text-athletiq-green hover:text-athletiq-navy transition-colors text-sm font-medium"
        >
          {t('dashboard.recentPlayers.viewAll')}
        </button>
      </div>
      
      <div className="space-y-3">
        {players.slice(0, 5).map((player, index) => (
          <div key={player.id || index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-athletiq-green to-green-500 flex items-center justify-center">
              <FaUserGraduate className="text-white text-sm" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{player.full_name || player.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{player.school_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(player.created_at || new Date())}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Recent Activities Card Component
function RecentActivitiesCard({ activities, formatDate }) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <FaCalendarAlt className="mr-2 text-athletiq-green" />
          {t('dashboard.recentActivity.title')}
        </h3>
      </div>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            {t('dashboard.recentActivity.empty')}
          </p>
        ) : (
          activities.slice(0, 5).map((activity, index) => (
            <div key={activity.id || index} className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-athletiq-green/20 flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 bg-athletiq-green rounded-full"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDate(activity.created_at || new Date())}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
