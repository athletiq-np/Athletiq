// src/components/features/school/SchoolDashboardLayout.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserGraduate, FaCheckCircle, FaExclamationCircle, FaPlus, FaSchool, FaTrophy,
  FaChartLine, FaCogs, FaUsers, FaGraduationCap, FaHome, FaBell, FaSearch,
  FaGlobe, FaPalette, FaCalendarAlt, FaFilter, FaDownload, FaEye, FaEdit, FaTrash,
  FaSort, FaArrowUp, FaArrowDown, FaExpand, FaMoon, FaSun, FaLanguage, FaSignOutAlt
} from 'react-icons/fa';
import { HiOutlineCog, HiMenuAlt3, HiX } from 'react-icons/hi';
import { MdPending, MdDashboard, MdAnalytics, MdSettings, MdNotifications } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '@/api/apiClient';
import useUserStore from '@/store/userStore';
import { useTheme } from '@/contexts/ThemeContext';
import athletiqLogo from '@/assets/logos/athletiq-logo.png';

// School-specific sidebar component
import SchoolSidebar from './SchoolSidebar';

// School dashboard sections
import SchoolOverview from './sections/SchoolOverview';
import PlayersManagement from './sections/PlayersManagement';
import HousesTeams from './sections/HousesTeams';
import TournamentManagement from './sections/TournamentManagement';
import StaffCoaches from './sections/StaffCoaches';
import FixturesMatches from './sections/FixturesMatches';
import CertificatesResults from './sections/CertificatesResults';
import SchoolProfile from './sections/SchoolProfile';
import NewsAnnouncements from './sections/NewsAnnouncements';
import Settings from './sections/Settings';
import Support from './sections/Support';
import Analytics from './sections/Analytics';

/**
 * 🏫 ATHLETIQ - School Dashboard Layout
 * Premium, production-ready school dashboard with:
 * - Unified design matching admin dashboard
 * - Comprehensive school management features
 * - Internationalization (i18n) support
 * - Responsive design for all devices
 * - Modern sidebar with collapsible sections
 * - Real-time data and notifications
 * - Advanced filtering and search
 * - Dark/Light mode toggle
 */
export default function SchoolDashboardLayout({ school, onRefresh }) {
  const { t, i18n } = useTranslation();
  const { user } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedPreference = localStorage.getItem('athletiq-school-sidebar-collapsed');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  const [activeSection, setActiveSection] = useState('overview');
  
  // Data State
  const [schoolData, setSchoolData] = useState({
    overview: {
      totalPlayers: 0,
      totalStaff: 0,
      activeHouses: 0,
      runningTournaments: 0,
      upcomingMatches: 0,
      recentAchievements: 0
    },
    players: [],
    staff: [],
    houses: [],
    tournaments: [],
    notifications: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch school dashboard data
  const fetchSchoolData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        overviewRes,
        playersRes,
        staffRes,
        housesRes,
        tournamentsRes,
        notificationsRes,
        activitiesRes
      ] = await Promise.all([
        apiClient.get('/schools/dashboard-stats'),
        apiClient.get('/schools/players?limit=100&page=1'),
        apiClient.get('/schools/staff?limit=100&page=1'),
        apiClient.get('/schools/houses?limit=100&page=1'),
        apiClient.get('/schools/tournaments?limit=100&page=1'),
        apiClient.get('/schools/notifications?limit=20').catch(() => ({ data: { data: [] } })),
        apiClient.get('/schools/activities?limit=50').catch(() => ({ data: { data: [] } })),
      ]);
      
      // Process overview data
      const stats = overviewRes.data.data || overviewRes.data;
      setSchoolData({
        overview: {
          totalPlayers: stats.playerCount || 0,
          totalStaff: stats.staffCount || 0,
          activeHouses: stats.houseCount || 0,
          runningTournaments: stats.activeTournaments || 0,
          upcomingMatches: stats.upcomingMatches || 0,
          recentAchievements: stats.achievements || 0,
        },
        players: playersRes.data?.data || [],
        staff: staffRes.data?.data || [],
        houses: housesRes.data?.data || [],
        tournaments: tournamentsRes.data?.data || [],
        notifications: notificationsRes.data?.data || [],
        recentActivities: activitiesRes.data?.data || []
      });
      
    } catch (error) {
      console.error('Error fetching school data:', error);
      setError(error.message || 'Failed to load school data');
      toast.error(t('school.dashboard.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Initialize data on mount
  useEffect(() => {
    fetchSchoolData();
    
    // Set up real-time updates (every 5 minutes)
    const interval = setInterval(fetchSchoolData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSchoolData]);

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
    localStorage.setItem('athletiq-school-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // School dashboard sections
  const sections = [
    { id: 'overview', label: t('school.dashboard.sections.overview'), icon: MdDashboard },
    { id: 'players', label: t('school.dashboard.sections.players'), icon: FaUserGraduate },
    { id: 'houses', label: t('school.dashboard.sections.houses'), icon: FaHome },
    { id: 'staff', label: t('school.dashboard.sections.staff'), icon: FaUsers },
    { id: 'tournaments', label: t('school.dashboard.sections.tournaments'), icon: FaTrophy },
    { id: 'fixtures', label: t('school.dashboard.sections.fixtures'), icon: FaCalendarAlt },
    { id: 'certificates', label: t('school.dashboard.sections.certificates'), icon: FaCheckCircle },
    { id: 'news', label: t('school.dashboard.sections.news'), icon: FaBell },
    { id: 'analytics', label: t('school.dashboard.sections.analytics'), icon: MdAnalytics },
    { id: 'profile', label: t('school.dashboard.sections.profile'), icon: FaSchool },
    { id: 'settings', label: t('school.dashboard.sections.settings'), icon: MdSettings },
    { id: 'support', label: t('school.dashboard.sections.support'), icon: FaGraduationCap },
  ];

  // Render active section
  const renderActiveSection = () => {
    const sectionProps = { 
      school, 
      schoolData, 
      onRefresh: fetchSchoolData,
      loading,
      error 
    };
    
    switch (activeSection) {
      case 'overview':
        return <SchoolOverview {...sectionProps} />;
      case 'players':
        return <PlayersManagement {...sectionProps} />;
      case 'houses':
        return <HousesTeams {...sectionProps} />;
      case 'staff':
        return <StaffCoaches {...sectionProps} />;
      case 'tournaments':
        return <TournamentManagement {...sectionProps} />;
      case 'fixtures':
        return <FixturesMatches {...sectionProps} />;
      case 'certificates':
        return <CertificatesResults {...sectionProps} />;
      case 'news':
        return <NewsAnnouncements {...sectionProps} />;
      case 'analytics':
        return <Analytics {...sectionProps} />;
      case 'profile':
        return <SchoolProfile {...sectionProps} />;
      case 'settings':
        return <Settings {...sectionProps} />;
      case 'support':
        return <Support {...sectionProps} />;
      default:
        return <SchoolOverview {...sectionProps} />;
    }
  };

  // Language change handler
  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    toast.success(t('school.dashboard.language.changed'));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300`}>
      {/* School Sidebar */}
      <SchoolSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sections={sections}
        school={school}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        onLanguageChange={handleLanguageChange}
        currentLanguage={i18n.language}
        schoolData={schoolData}
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
                  title={sidebarCollapsed ? t('school.dashboard.sidebar.expand') : t('school.dashboard.sidebar.collapse')}
                >
                  {sidebarCollapsed ? (
                    <HiMenuAlt3 size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
                  ) : (
                    <HiX size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-500" />
                  )}
                </button>

                {/* Header title */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t(`school.dashboard.sections.${activeSection}`)}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {school?.name || t('school.dashboard.title')}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center space-x-4">
                {/* Search */}
                <div className="hidden md:flex items-center space-x-2">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder={t('common.search')}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FaBell className="text-gray-600 dark:text-gray-400" size={18} />
                  {schoolData.notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {schoolData.notifications.length}
                    </span>
                  )}
                </button>

                {/* Refresh Button */}
                <button
                  onClick={fetchSchoolData}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t('common.refresh')}
                >
                  <FaArrowUp className="text-gray-600 dark:text-gray-400" size={16} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
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
    </div>
  );
}
